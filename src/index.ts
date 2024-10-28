import {
  App,
  AppInfo,
  AppSlide,
  SlideMaker,
  getCached,
} from "tickerowl-app-base";

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
};

export default class CountdownApp implements App {
  getInfo(): AppInfo {
    return {
      id: "countdown",
      name: "Countdown",
      description: "Show a countdown to a specific future date (Anniversary, Vacation, Bonus, etc.)",
      version: 1,
      author: "Jagan Ganti",
      authorXUrl: "https://twitter.com/@jagan123",
      authorGitHubUrl: "https://github.com/jagan123",
    };
  }

  getSlides(): Record<string, AppSlide> {
    return {
      "countdown-stats": {
        title: "Countdown",
        description: "Shows a countdown to a specific date",
        inputs: { 
          date: {
            type: "text",
            label: "Date (YYYY-MM-DD)",
            required: true,
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
          const cacheDuration = inputs["cacheDuration"];
          const countdown = await getCached({
            store,
            key: "countdown",
            asJson: true,
            duration: Number(cacheDuration.value.value),  
            fetch: async () => {
              return await this.getCountdown(inputs["date"].value.value as string);
            },
          });

          return {
            slides: [   
              SlideMaker.keyValue({ 
                key: "To Go",
                value: countdown.days + "d " + countdown.hours + "h ",
              }),
            ],
          };
        },
      },
    };
  }

  async getCountdown(date: string): Promise<Countdown> {
    const targetDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(targetDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      days: diffDays,
      hours: Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60)),
    };
  }
}
