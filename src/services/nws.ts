/**
 * National Weather Service helper.
 * Uses global fetch (Node >=18). Adds required User-Agent header.
 */
 import { z } from 'zod';

 // forecast URL is top-level
 const pointsSchema = z.object({
   forecast: z.string().url()
 });
 
 // Keep the forecast schema but relax it so missing props won't crash
 const forecastSchema = z.object({
   properties: z.object({
     periods: z.array(z.object({
       name: z.string(),
       temperature: z.number(),
       temperatureUnit: z.string(),
       shortForecast: z.string()
     }))
   })
 });
 
 function userAgent(): string {
   const contact = process.env.CONTACT_EMAIL || 'contact@example.com';
   return `weather-service-ts/0.1 (+${contact})`;
 }
 export async function getForecastUrl(lat: number, lon: number): Promise<string> {
  const url = `https://api.weather.gov/points/${lat},${lon}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': userAgent(), // must have a valid CONTACT_EMAIL in .env
      'Accept': 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`NWS points lookup failed: ${res.status}`);
  }

  const data = await res.json();

  // Debug log to see the real shape
  console.log('NWS points API returned:', JSON.stringify(data, null, 2));

  // Try top-level forecast first, then properties.forecast
  const forecastUrl =
    (data && typeof data.forecast === 'string' && data.forecast) ||
    (data?.properties && typeof data.properties.forecast === 'string' && data.properties.forecast);

  if (!forecastUrl) {
    throw new Error('NWS points response missing forecast URL');
  }

  return forecastUrl;
}

 
 export async function getForecast(forecastUrl: string) {
   const res = await fetch(forecastUrl, {
     headers: { 'User-Agent': userAgent(), 'Accept': 'application/json' }
   });
   if (!res.ok) {
     throw new Error(`NWS forecast fetch failed: ${res.status}`);
   }
   const data = await res.json();
   if (!data?.properties?.periods) {
     console.error('Unexpected NWS forecast response:', data);
     throw new Error('NWS forecast response missing periods');
   }
   const parsed = forecastSchema.safeParse(data);
   if (!parsed.success) {
     console.error('NWS forecast schema mismatch:', parsed.error.format());
     throw new Error('NWS forecast response schema mismatch');
   }
   return parsed.data.properties.periods;
 }
 