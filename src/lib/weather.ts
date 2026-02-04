import { WeatherData, WeatherForecast } from "@/types";

const BASE_URL = "https://api.openweathermap.org/data/2.5";

export async function getCurrentWeather(
  city: string,
  apiKey: string
): Promise<WeatherData | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=pt_br`
    );

    if (!response.ok) {
      throw new Error("Weather request failed");
    }

    const data = await response.json();

    return {
      temp: Math.round(data.main.temp),
      tempMin: Math.round(data.main.temp_min),
      tempMax: Math.round(data.main.temp_max),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      city: data.name,
    };
  } catch (error) {
    console.error("Weather error:", error);
    return null;
  }
}

export async function getWeatherForecast(
  city: string,
  apiKey: string
): Promise<WeatherForecast[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=pt_br`
    );

    if (!response.ok) {
      throw new Error("Forecast request failed");
    }

    const data = await response.json();

    // Group by day and get daily min/max
    const dailyData: Record<string, { temps: number[]; icon: string; description: string }> = {};

    data.list.forEach((item: any) => {
      const date = item.dt_txt.split(" ")[0];
      if (!dailyData[date]) {
        dailyData[date] = {
          temps: [],
          icon: item.weather[0].icon,
          description: item.weather[0].description,
        };
      }
      dailyData[date].temps.push(item.main.temp);
    });

    return Object.entries(dailyData)
      .slice(0, 5)
      .map(([date, { temps, icon, description }]) => ({
        date,
        tempMin: Math.round(Math.min(...temps)),
        tempMax: Math.round(Math.max(...temps)),
        icon,
        description,
      }));
  } catch (error) {
    console.error("Forecast error:", error);
    return [];
  }
}

export function getWeatherIconUrl(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}
