Argus-TS v1.0 Roadmap (from PRD)

- [x] F.5 Sub-commands support

  - `.command(name, description)` returns a new builder with its own arguments, options, and action
  - Parser dispatches to the selected sub-command; isolated type inference per sub-command
  - Help lists sub-commands

- [x] F.6 Integrated UI Toolkit

  - Provide `ui` in action context with: `chalk`, `spinner(text)`, `prompt(config)`, `box(text)`
  - Add minimal wrappers, wire as optional dependencies

- [x] F.7 Middleware system

  - `.use(middlewareFn)` with signature `async (context, next) => {}`
  - Compose middleware chain before final action

- [x] F.8 Advanced help generation

  - Styled output using `ui.chalk`, list sub-commands, aligned formatting

- [ ] Documentation & Examples

  - Comprehensive docs and examples for each feature

- [ ] Tests & CI
  - > 90% coverage focusing on sub-commands and middleware
