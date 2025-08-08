export type TempCategory = 'hot' | 'cold' | 'moderate';

export interface WeatherResponse {
  location: { lat: number; lon: number };
  today: {
    shortForecast: string;
    temperatureF: number;
    temperatureUnit: 'F';
    category: TempCategory;
  };
  source: 'api.weather.gov';
}
