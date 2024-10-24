import {
  App,
  AppInfo,
  AppSlide,
  SlideMaker,
  getCached,
} from "tickerowl-app-base";

type Weather = {
  coord: {
    lon: number;
    lat: number;
  };
  weather: [
    {
      id: number;
      main: string;
      description: string;
      icon: string;
    }
  ];
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level: number;
    grnd_level: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type: number;
    id: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
};

export default class WeatherApp implements App {
  getInfo(): AppInfo {
    return {
      id: "weather",
      name: "City Weather",
      description: "Show your city's weather",
      version: 1,
      author: "Jagan Ganti",
      authorXUrl: "https://twitter.com/@jagan123",
      authorGitHubUrl: "https://github.com/jagan123",
    };
  }

  getSlides(): Record<string, AppSlide> {
    return {
      "weather-stats": {
        title: "City Weather",
        description: "Shows your city's weather",
        inputs: {
          "api-token": {
            type: "text",
            label: "API Token",
            required: true,
            placeholder: "Enter your OpenWeatherMap API token",
          },
          city: {
            type: "text",
            label: "City",
            required: true,
            placeholder: "Enter the city",
          },
          cacheDuration: {
            type: "select",
            label: "Cache Duration",
            required: true,
            options: [
              { label: "Disable", value: "0" },
              { label: "5 minutes", value: (60 * 5).toString() },
            ],
          },
        },
        getData: async ({ inputs, store }) => {
          const apiToken = inputs["api-token"];
          const city = inputs["city"];
          const cacheDuration = inputs["cacheDuration"];

          if (!apiToken.value.value || !city.value.value) {
            return {
              slides: [],
            };
          }

          const weather = await getCached({
            store,
            key: "weather",
            asJson: true,
            duration: cacheDuration.value.value
              ? Number(cacheDuration.value.value)
              : undefined,
            fetch: async () => {
              return await this.getWeather(
                city.value.value!.toString(),
                apiToken.value.value!.toString()
              );
            },
          });

          return {
            slides: [
              SlideMaker.keyValue({
                key: "Temp",
                value: weather.main.temp + "'C",
              }),
              SlideMaker.text({
                text: `Weather: ${weather.weather[0].description}`,
              }),
            ],
          };
        },
      },
    };
  }

  async getWeather(city: string, apiToken: string): Promise<Weather> {
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiToken}&units=metric`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return await weatherRes.json();
  }
}
