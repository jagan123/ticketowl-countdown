# Sample TickerOwl App

This is a sample TickerOwl app built using the TickerOwl App Base.

### Building blocks

- The information that is displayed on the device is called **Slide**.
- An **App** can take user inputs, do some processing (async) and return slides to be displayed.
- Each **Slide** has a **type** and the information to be displayed.

### How to make your own app

1. Clone this repo
2. Update the `package.json` file to update the app version. Make sure the name starts with `tickerowl-`
3. Update the `src/index.ts` file to add your own app logic
4. Run `npm run build` to build the app
5. Update the `run-test.sh` file to with test inputs
6. Run `npm run test-run` to test the app
7. If everything looks good, push the package to NPM by running `npm publish`
8. Let [@pramodk73](https://twitter.com/pramodk73) know and he will review and add it to the list of available apps
