# weather-service-ts (TypeScript + Express)
HTTP server that serves the forecasted weather. It returns the short forecast and a simple "hot/cold/moderate" temperature category for a given latitude/longitude, using the National Weather Service API.

## Endpoints

```
GET /weather?lat=<number>&lon=<number>
```

### Example Response

```json
{
  "location": { "lat": 32.8, "lon": -96.8 },
  "today": {
    "shortForecast": "Partly Cloudy",
    "temperatureF": 88,
    "temperatureUnit": "F",
    "category": "hot"
  },
  "source": "api.weather.gov"
}
```

### Testing

weather.test.ts covers:

400 error for invalid lat/lon

Happy path with mocked NWS data (schema, temp mapping, category)

Fallback when "Today" is missing

Celsius → Fahrenheit conversion

Run with:
npm test