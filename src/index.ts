import {
  App,
  AppInfo,
  AppSlide,
  SlideMaker,
  getCached,
} from "tickerowl-app-base";

type Currency = {
  usd: {
    inr: number;
  };
};

export default class CurrencyApp implements App {
  getInfo(): AppInfo {
    return {
      id: "usdinr",
      name: "USD to INR",
      description: "Show the current US Dollar to INR exchange rate. No API key needed",
      version: 1,
      author: "Jagan Ganti",
      authorXUrl: "https://twitter.com/@jagan123",
      authorGitHubUrl: "https://github.com/jagan123",
    };
  }

  getSlides(): Record<string, AppSlide> {
    return {
      "usdinr-stats": {
        title: "US Dollar to INR",
        description: "Shows the current US Dollar to INR exchange rate",
        inputs: { 
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
          const currency = await getCached({
            store,
            key: "usdinr",
            asJson: true,
            duration: Number(cacheDuration.value.value),  
            fetch: async () => {
              return await this.getCurrency();
            },
          });

          return {
            slides: [   
              SlideMaker.keyValue({ 
                key: "1 USD",
                value: " Rs " + (currency.usd.inr.toFixed(2)).toString(),
              }),
            ],
          };
        },
      },
    };
  }

  async getCurrency(): Promise<Currency> {
    const currencyRes = await fetch(
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return await currencyRes.json();
  }
}
