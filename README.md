<h1 align="center">Argus-TS (v1)</h1>

<p align="center">
<strong>A minimal, type-safe, and elegant CLI framework for TypeScript.</strong>
<br /><br />
<a href="https://opensource.org/licenses/MIT">
<img src="https://img.shields.io/badge/License-MIT-teal.svg" alt="License: MIT">
</a>
<a href="#">
<img src="https://img.shields.io/badge/Version-1.1.0%20(Stable)-blueviolet.svg" alt="Version">
\</a>
<a href="#">
<img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
</a>
</p>

Argus-TS is a framework to build CLIs in TypeScript with automatic, end‑to‑end type inference. Version 1.0 brings sub‑commands, middleware, an internal UI toolkit (colors, spinners, prompts, boxes), advanced help, and first‑class error handling.

This outputs the compiled JS and d.ts files to `dist/` and sets `exports`/`types` for Node ESM consumers.

### ✨ Core Features (v1)

- Fluent, chainable API
- Automatic type inference (args/options → action types)
- Sub‑commands with isolated types
- Middleware pipeline (`.use()`) with `ctx` and `next()`
- Built‑in UI toolkit (colors, spinners, prompts, boxes) without external deps
- Advanced `--help` output (sections, colors, aligned)
- Rich, colored Argus errors with codes and hints

### 🚀 Installation

Use as a library (after publish):

```sh
npm install argus-ts
```

Local (from source):

Clone the repository:

```sh
git clone https://github.com/argus-sh/argus-ts.git
cd argus-ts
```

Install development dependencies:

```sh
npm install
```

### ⚡ Quick Start

Create a powerful, type‑safe CLI in a few lines.

```ts
// examples/basic-cli.ts
import { cli } from "argus-ts";

cli({
  name: "greet-cli",
  description: "A simple demonstration of the Argus-TS.",
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
```

### Running the Example

To run the example script using tsx (a tool for direct TypeScript execution):

```sh
npx tsx examples/basic-cli.ts World --greeting "Howdy" --loud

Output:

HOWDY, WORLD!
```

### Sub‑commands

```ts
import { cli } from "argus-ts";

const app = cli({
  name: "installer",
  description: "A modern package manager.",
});

const install = app.command("install", "Install a package");
install.argument("<pkg>", "Package name");
install.action(({ pkg }) => {
  console.log(`Installing ${pkg}...`);
});

const create = app.command("create", "Scaffold a project");
create.argument("<name>");
create.action(({ name }) => console.log(`Creating ${name}...`));

app.parse();
```

### Typed Options (string and number)

By default, value options are typed as strings. You can also declare a numeric option and the parser will coerce the provided value to a number.

```ts
import { cli } from "argus-ts";

cli({ name: "numbers" })
  // Composite flag syntax is supported:
  // `--count <n>` in the flag string renders correctly in help and usage
  .option("--count <n>", "How many times?", {
    valueType: "number",
    defaultValue: 0,
  })
  // You can also use explicit valueName in config (equivalent typing):
  // .option("--count", "How many times?", { valueName: '<n>', valueType: 'number', defaultValue: 0 })
  .action((_args, options) => {
    // options.count is inferred as number
    console.log(options.count + 1);
  })
  .parse();
```

Usage examples:

```bash
# Pass numeric value; options.count will be a number
node index.js --count 7

# Help shows placeholders
node index.js --help
# ...
# Usage: numbers [--count <n>]
# Options:
#   --count <n>  How many times? (default: 0)
```

### Middleware

```ts
import { cli } from "argus-ts";

const app = cli({ name: "secure" });

app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  console.log(`Done in ${Date.now() - start}ms`);
});

app
  .argument("<file>")
  .action(async (args, _options, { ui }) => {
    const sp = ui
      .spinner({
        text: `Processing ${ui.colors.green(args.file)}`,
        frames: "dots2",
      })
      .start();
    await new Promise((r) => setTimeout(r, 300));
    sp.succeed("Processed");
  })
  .parse();
```

### UI Toolkit (Spinners, Prompts, Boxes, Colors)

```ts
import { cli } from "argus-ts";

cli({ name: "ui-demo" })
  .action(async (_args, _opts, { ui }) => {
    ui.box(ui.colors.bold("Welcome to Argus-TS"), "Hello");

    const sp = ui
      .spinner({ text: "Working", frames: "arrow", color: ui.colors.cyan })
      .start();
    await new Promise((r) => setTimeout(r, 250));
    sp.setFrames("pipe").setText("Almost there");
    await new Promise((r) => setTimeout(r, 250));
    sp.succeed("Done");

    const choice = await ui.prompt.select(
      "Pick one:",
      [
        { title: "React", value: "react" },
        { title: "Vue", value: "vue" },
      ],
      {
        highlight: ui.colors.cyan,
        indicatorColor: ui.colors.cyan,
      }
    );
    console.log(`You chose ${choice}`);
  })
  .parse();
```

### Advanced Help & Errors

- `--help` prints colored, aligned sections (Commands, Arguments, Options)
- Friendly, colored errors with codes (e.g. `E_UNKNOWN_OPTION`, `E_MISSING_ARGUMENT`) and hints

### 🤝 Contributing

We welcome all contributions! Great ways to help:

- Try the v1 and provide feedback
- Report bugs or open feature requests
- Improve docs and examples

📄 License
This project is licensed under the MIT License. See the LICENSE file for details.
