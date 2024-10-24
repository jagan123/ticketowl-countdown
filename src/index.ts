import { App, AppInfo, AppSlide, SlideData, SlideMaker } from "tickerowl-app-base";

const CACHE_KEY = "cache";

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

          let weather: any = null;
          let lastWeather;
          let cachedWeather;


          let updatedAt;

          const cached = await store.read(CACHE_KEY);

          if (cached) {
            const cachedJson = JSON.parse(cached);
            lastWeather = cachedJson.lastWeather;
            cachedWeather = cachedJson.weather;
            updatedAt = cachedJson.updatedAt;
            if (
              cachedJson.city === city.value.value &&
              new Date(cachedJson.updatedAt) >
                new Date(
                  Date.now() - Number(cacheDuration?.value.value ?? 0) * 1000
                )
            ) {
              weather = cachedJson.weather;
            }
          }

          if (!weather) {
            const res = await this.getWeather(
              city.value.value.toString(),
              apiToken.value.value.toString()
            );
            weather = res;
            updatedAt = Date.now();
          }

          const currentWeather = weather;

          await store.write(
            CACHE_KEY,
            JSON.stringify({
              city: city.value.value.toString(),
              updatedAt,
              weather,
              lastWeather: cachedWeather !== currentWeather ? cachedWeather : lastWeather,
            })
          );

          const slides: SlideData[] = [];
          console.log(currentWeather);
          let infos: string[] = [];

          infos.push(currentWeather.main.temp);

          if (infos.length > 0) {
            slides.push(SlideMaker.text({ text: infos.join(" - ") }));
          }

          return {
            slides: [
              ...slides,
              SlideMaker.keyValue({
                key: "Temp",
                value: currentWeather.main.temp,
              }),
              SlideMaker.text({
                text: `Feels like: ${currentWeather.main.feels_like}`,
              }),
              SlideMaker.text({
                text: `Weather: ${currentWeather.weather[0].description}`,
              }),
            ],
          };
        },
      },
    };
  }

  async getWeather(
    city: string,
    apiToken: string
  ): Promise<{ weather: any }> {
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiToken}&units=metric`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const fullWeather = await weatherRes.json();
    return fullWeather;
  }
}
