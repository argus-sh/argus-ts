<h1 align="center">Argus-TS</h1>

<p align="center">
<strong>A minimal, type-safe, and elegant CLI framework for TypeScript.</strong>
<br /><br />
<a href="https://opensource.org/licenses/MIT">
<img src="https://img.shields.io/badge/License-MIT-teal.svg" alt="License: MIT">
</a>
<a href="#">
<img src="https://img.shields.io/badge/Version-0.1.0 (MVP)-blueviolet.svg" alt="Version">
</a>
<a href="#">
<img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
</a>
</p>

Argus-TS is a new framework designed to make building command-line interfaces (CLIs) in TypeScript a breeze, with a primary focus on automatic type inference. This MVP (Minimum Viable Product) proves the core concept: defining commands and accessing their arguments and options with guaranteed type safety, right out of the box.

✨ Core Features (MVP)
Fluent API: Define your CLI structure in a clear, chainable, and intuitive way.

Automatic Type Inference: Enjoy fully typed args and options in your action handlers without any manual type annotations.

Zero Dependencies: The core library has no production dependencies, keeping it fast and lightweight.

Simple Help Generation: Automatically generates basic help text when the --help flag is used.

🚀 Installation
As this is an early stage MVP, the primary way to use it is by cloning the repository.

Clone the repository:
```sh
git clone https://github.com/argus-cli/argus-ts.git
cd argus-ts
```
Install development dependencies:
```sh
npm install
```

⚡ Quick Start
Here's how simple it is to create a powerful, type-safe CLI with Argus-TS.

```ts
// examples/basic-cli.ts
import { cli } from './src/index';

cli({
  name: 'greet-cli',
  description: 'A simple demonstration of the Argus-TS MVP.',
})
  .argument('<user>', 'The username to greet.')
  .option('--greeting <word>', 'The word to use for the greeting.', { defaultValue: 'Hello' })
  .option('--loud', 'Should the greeting be loud?', { defaultValue: false })
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
Running the Example
To run the example script using tsx (a tool for direct TypeScript execution):
```sh
npx tsx examples/basic-cli.ts World --greeting "Howdy" --loud

Output:

HOWDY, WORLD!
```
🤝 Contributing
This is an early-stage project, and we welcome all forms of contribution! The best way to help right now is by:

Trying out the MVP and providing feedback.

Reporting bugs or suggesting new features by opening an issue.

Improving the documentation.

📄 License
This project is licensed under the MIT License. See the LICENSE file for details.
