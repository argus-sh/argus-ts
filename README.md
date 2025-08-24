<h1 align="center">Argus-TS (v1)</h1>

<p align="center">
<strong>A minimal, type-safe, and elegant CLI framework for TypeScript.</strong>
<br /><br />
<a href="https://opensource.org/licenses/MIT">
<img src="https://img.shields.io/badge/License-MIT-teal.svg" alt="License: MIT">
</a>
<a href="#">
<img src="https://img.shields.io/badge/Version-1.2.0%20(QoL%20%26%20Testability)-blueviolet.svg" alt="Version">
</a>
<a href="#">
<img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
</a>
</p>

Argus-TS is a framework to build CLIs in TypeScript with automatic, end‑to‑end type inference. Version 1.2.0 brings command aliases for improved UX, enhanced testing capabilities, and UI toolkit improvements while maintaining full backward compatibility.

This outputs the compiled JS and d.ts files to `dist/` and sets `exports`/`types` for Node ESM consumers.

## 🚀 Quick Start

```bash
npm install argus-ts
```

```ts
import { cli } from "argus-ts";

const app = cli({
  name: "my-cli",
  description: "A simple CLI tool.",
});

app.argument("<name>", "Your name");
app.action(({ name }) => {
  console.log(`Hello, ${name}!`);
});

app.parse();
```

## 🛠️ Development

### Building from Source

This project uses esbuild for fast bundling and proper module resolution. The build process:

1. **Bundles all source files** into single output files using esbuild
2. **Resolves all imports** correctly for distribution
3. **Generates TypeScript declarations** for type safety
4. **Creates source maps** for debugging

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Create a package
npm pack
```

### Build Scripts

- `npm run build` - Build using esbuild bundler
- `npm run build:tsc` - Build using TypeScript compiler (legacy)
- `npm run clean` - Clean build artifacts
- `npm run check` - Type check without building

## ✨ Core Features (v1)

- Fluent, chainable API
- Automatic type inference (args/options → action types)
- Sub‑commands with isolated types
- Command aliases for improved user experience
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

### Testing Utilities

To test your CLI without spawning a real process, use the in-memory test harness.

```ts
import { cli } from "argus-ts";
import { createTestHarness } from "argus-ts/testing";

const program = cli({ name: "greet" })
  .argument("<user>")
  .action((args) => {
    console.log(`Hello, ${args.user}!`);
  });

const h = createTestHarness(program);
const { stdout, stderr, exitCode } = await h.execute(["World"]);
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

### Command Aliases

Define short aliases for your commands to improve user experience and efficiency.

```ts
import { cli } from "argus-ts";

const app = cli({
  name: "package-manager",
  description: "A modern package manager with command aliases.",
});

// Install command with aliases: install, i, add
const install = app.command("install", "Install packages", { 
  aliases: ["i", "add"] 
});
install.argument("<packageName>");
install.action((args) => {
  console.log(`Installing ${args.packageName}...`);
});

// Remove command with aliases: remove, r, uninstall
const remove = app.command("remove", "Remove packages", { 
  aliases: ["r", "uninstall"] 
});
remove.argument("<packageName>");
remove.action((args) => {
  console.log(`Removing ${args.packageName}...`);
});

app.parse();
```

Now users can run commands using any of the defined aliases:

```bash
# These all execute the same command:
package-manager install react
package-manager i react
package-manager add react

# These all execute the same command:
package-manager remove vue
package-manager r vue
package-manager uninstall vue
```

The help text automatically displays aliases alongside command names:

```
Commands:
  install, i, add       Install packages
  remove, r, uninstall  Remove packages
```

**Note:** Aliases are validated to prevent conflicts with existing command names or other aliases. The system will throw an error if you try to use an alias that conflicts with an existing command or alias.

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

### UI Tables

Render ASCII tables without external dependencies via the built-in UI toolkit.

```ts
import { cli } from "argus-ts";

cli({ name: "table-demo" })
  .action((_args, _opts, { ui }) => {
    ui.box(ui.colors.bold("Users"), "Table Demo");

    // Inferred headers from object keys
    ui.table([
      { name: "Alice", age: 30, role: "Engineer" },
      { name: "Bob", age: 25, role: "Designer" }
    ]);

    // Custom headers
    ui.table(
      [
        { id: 1, title: "Item 1" },
        { id: 2, title: "Item 2" }
      ],
      { head: ["ID", "Title"] }
    );
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