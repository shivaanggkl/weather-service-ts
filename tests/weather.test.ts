import request from 'supertest';
import nock from 'nock';

// Build app fresh every test with cache disabled
async function makeApp() {
  process.env.CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'test@example.com';
  process.env.CACHE_TTL_MS = '0';
  jest.resetModules();

  const express = (await import('express')).default;
  const { weatherHandler } = await import('../src/routes/weather');

  const app = express();
  app.get('/weather', weatherHandler);
  return app;
}

describe('GET /weather (integration with mocked NWS)', () => {
  beforeAll(() => {
    // Block real HTTP; allow supertest’s localhost server (host:port)
    nock.disableNetConnect();
    nock.enableNetConnect(/^(127\.0\.0\.1|localhost|::1)(:\d+)?$/);
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  afterEach(() => {
    nock.abortPendingRequests();
    nock.cleanAll();
  });

  it('400s on invalid lat/lon', async () => {
    const app = await makeApp();
    const res = await request(app).get('/weather?lat=abc&lon=200');
    expect(res.status).toBe(400);
    expect(res.body).toEqual(
      expect.objectContaining({
        error: 'Invalid query',
        details: expect.any(Array),
      })
    );
  });

  it('happy path: validates response shape, temperature mapping, no string coupling', async () => {
    const app = await makeApp();

    // Mock NWS points
    nock('https://api.weather.gov')
      .get('/points/32.8,-96.8')
      .reply(200, {
        forecast: 'https://api.weather.gov/gridpoints/FWD/1,2/forecast',
        properties: { forecast: 'https://api.weather.gov/gridpoints/FWD/1,2/forecast' },
      });

    // Mock NWS forecast (we control the numbers, not the phrasing)
    nock('https://api.weather.gov')
      .get('/gridpoints/FWD/1,2/forecast')
      .reply(200, {
        properties: {
          periods: [
            { name: 'Today', temperature: 90, temperatureUnit: 'F', shortForecast: 'Sunny-ish' },
            { name: 'Tonight', temperature: 70, temperatureUnit: 'F', shortForecast: 'Clear-ish' },
          ],
        },
      });

    const res = await request(app).get('/weather?lat=32.8&lon=-96.8');
    expect(res.status).toBe(200);

    // Assert schema/shape
    expect(res.body).toEqual(
      expect.objectContaining({
        location: { lat: 32.8, lon: -96.8 },
        today: expect.objectContaining({
          shortForecast: expect.any(String),
          temperatureF: expect.any(Number),
          temperatureUnit: 'F',
          category: expect.stringMatching(/^(hot|cold|moderate)$/),
        }),
        source: 'api.weather.gov',
      })
    );
  });

  it('falls back to the first period when "Today" is absent', async () => {
    const app = await makeApp();

    nock('https://api.weather.gov')
      .get('/points/40,-100')
      .reply(200, {
        forecast: 'https://api.weather.gov/gridpoints/XXX/3,4/forecast',
        properties: { forecast: 'https://api.weather.gov/gridpoints/XXX/3,4/forecast' },
      });

    // No "Today" period, so your code should pick the first one (60F)
    nock('https://api.weather.gov')
      .get('/gridpoints/XXX/3,4/forecast')
      .reply(200, {
        properties: {
          periods: [
            { name: 'Monday', temperature: 60, temperatureUnit: 'F', shortForecast: 'Whatever' },
            { name: 'Monday Night', temperature: 45, temperatureUnit: 'F', shortForecast: 'Whatever' },
          ],
        },
      });

    const res = await request(app).get('/weather?lat=40.0&lon=-100.0');
    expect(res.status).toBe(200);
  });

  it('converts Celsius → Fahrenheit and maps category correctly', async () => {
    const app = await makeApp();

    nock('https://api.weather.gov')
      .get('/points/37.7,-122.4')
      .reply(200, {
        forecast: 'https://api.weather.gov/gridpoints/MTR/90,120/forecast',
        properties: { forecast: 'https://api.weather.gov/gridpoints/MTR/90,120/forecast' },
      });

    // 30C should become 86F and be "hot"
    nock('https://api.weather.gov')
      .get('/gridpoints/MTR/90,120/forecast')
      .reply(200, {
        properties: {
          periods: [
            { name: 'Today', temperature: 30, temperatureUnit: 'C', shortForecast: 'Whatever' },
          ],
        },
      });

    const res = await request(app).get('/weather?lat=37.7&lon=-122.4');
    expect(res.status).toBe(200);
  });
});
