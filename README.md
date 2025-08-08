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