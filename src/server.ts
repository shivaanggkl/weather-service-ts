import express from 'express';
import dotenv from 'dotenv';
import { weatherHandler } from './routes/weather.js';

dotenv.config();

const app = express();

app.get('/', (_req, res) => {
  res.send(`
    <h1>Weather Service API</h1>
    <p>Use <code>/weather?lat=&lt;number&gt;&lon=&lt;number&gt;</code> to get today's forecast.</p>
    <p>Example: <a href="/weather?lat=32.7767&lon=-96.7970">Dallas, TX</a></p>
  `);
});

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/weather', weatherHandler);

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Weather service listening on http://localhost:${port}`);
});
