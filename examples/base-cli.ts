import { cli } from "../src/index";

cli({
  name: "greet-cli",
  description: "A simple demonstration of the Argus-TS MVP.",
})
  .argument("<user>", "The username to greet.")
  .option("--greeting <word>", "The word to use for the greeting.", {
    defaultValue: "Hello",
  })
  .option("--loud", "Should the greeting be loud?", { defaultValue: false })
  .action((args, options) => {
    // `args.user` is automatically typed as `string`
    // `options.greeting` is automatically typed as `string`
    // `options.loud` is automatically typed as `boolean`

    let message = `${options.greeting}, ${args.user}!`;
    if (options.loud) {
      message = message.toUpperCase();
    }
    console.log(message);
  })
  .parse();