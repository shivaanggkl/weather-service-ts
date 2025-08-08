import type { Request, Response } from 'express';
import { z } from 'zod';
import { getForecastUrl, getForecast } from '../services/nws.js';
import { categorizeTempF } from '../utils/temp.js';
import type { WeatherResponse } from '../types.js';

const querySchema = z.object({
  lat: z.string().transform(parseFloat).refine((v) => !Number.isNaN(v) && v >= -90 && v <= 90, 'lat must be a number between -90 and 90'),
  lon: z.string().transform(parseFloat).refine((v) => !Number.isNaN(v) && v >= -180 && v <= 180, 'lon must be a number between -180 and 180'),
});

export async function weatherHandler(req: Request, res: Response) {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid query', details: parsed.error.issues });
  }
  const { lat, lon } = parsed.data;

  try {
    const forecastUrl = await getForecastUrl(lat, lon);
    const periods = await getForecast(forecastUrl);

    // Find today's period. NWS returns day & night; prefer daytime "Today",
    // otherwise take the first period available.
    const today = periods.find(p => p.name.toLowerCase().includes('today')) ?? periods[0];
    if (!today) {
      return res.status(502).json({ error: 'No forecast periods returned from NWS' });
    }

    const temperatureF = today.temperatureUnit === 'F' ? today.temperature : (
      // If NWS ever returns C, convert to F.
      Math.round((today.temperature * 9/5) + 32)
    );

    const payload: WeatherResponse = {
      location: { lat, lon },
      today: {
        shortForecast: today.shortForecast,
        temperatureF,
        temperatureUnit: 'F',
        category: categorizeTempF(temperatureF),
      },
      source: 'api.weather.gov'
    };

    res.json(payload);
  } catch (err: any) {
    res.status(502).json({ error: 'Upstream error', message: err?.message ?? String(err) });
  }
}
