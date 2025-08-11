export type CliConfig = {
  name: string;
  description?: string;
};

type PositionalArgDefinition<Name extends string> = {
  kind: 'positional';
  name: Name; // e.g. "file"
  description?: string;
};

type BooleanOptionDefinition<Flag extends string> = {
  kind: 'booleanOption';
  flag: Flag; // e.g. "--strict"
  description?: string;
  defaultValue?: boolean;
};

type ValueOptionDefinition<Flag extends string, ValueName extends string> = {
  kind: 'valueOption';
  flag: Flag; // e.g. "--level"
  valueName: ValueName; // e.g. "value"
  description?: string;
  defaultValue?: string;
};

type AnyOptionDefinition = BooleanOptionDefinition<string> | ValueOptionDefinition<string, string>;

type ExtractAngleName<T extends string> = T extends `<${infer Inner}>` ? Inner : never;

// Build the positional args object type incrementally
type PositionalArgsShape<Defs extends readonly PositionalArgDefinition<string>[]> = {
  [K in Defs[number] as K['name']]: string;
};

// Build the options object type incrementally
type OptionsShape<Defs extends readonly AnyOptionDefinition[]> = {
  [K in Defs[number] as NormalizeFlag<K['flag']>] : K extends BooleanOptionDefinition<string>
    ? boolean
    : K extends ValueOptionDefinition<string, string>
      ? string
      : never;
};

type NormalizeFlag<T extends string> = T extends `--${infer Name}` ? Name : T;

export type ActionHandler<Args, Opts> = (args: Args, options: Opts) => void | Promise<void>;

// Internals to hold definitions
class DefinitionState {
  public readonly positionals: PositionalArgDefinition<string>[] = [];
  public readonly options: AnyOptionDefinition[] = [];
  public readonly subcommands: { name: string; description?: string; state: DefinitionState; builder: any }[] = [];
  public handler?: ActionHandler<any, any>;

  constructor(
    public readonly config: CliConfig,
    public readonly commandPath: string[]
  ) {}
}

export type CliBuilder<PosDefs extends readonly PositionalArgDefinition<string>[], OptDefs extends readonly AnyOptionDefinition[]> = {
  command<Name extends string>(name: Name, description?: string): CliBuilder<[], []>;

  argument<NameSpec extends `<${string}>`>(name: NameSpec, description?: string): CliBuilder<
    [...PosDefs, PositionalArgDefinition<ExtractAngleName<NameSpec>>],
    OptDefs
  >;

  option<FlagSpec extends `--${string}`>(flag: FlagSpec, description?: string, config?: { defaultValue?: boolean }): CliBuilder<
    PosDefs,
    [...OptDefs, BooleanOptionDefinition<FlagSpec>]
  >;

  option<FlagSpec extends `--${string}`, ValueSpec extends `<${string}>`>(flag: FlagSpec, description: string, config: { defaultValue?: string } & { valueName?: ValueSpec }): CliBuilder<
    PosDefs,
    [...OptDefs, ValueOptionDefinition<FlagSpec, ExtractAngleName<ValueSpec>>]
  >;

  action(handler: ActionHandler<PositionalArgsShape<PosDefs>, OptionsShape<OptDefs>>): CliExecutor;
  parse(argv?: string[]): void | Promise<void>;
};

export type CliExecutor = {
  parse(argv?: string[]): void | Promise<void>;
};

export function cli(config: CliConfig): CliBuilder<[], []> {
  const state = new DefinitionState(config, [config.name]);

  const builder: any = {
    command(name: string, description?: string) {
      const childState = new DefinitionState(state.config, [...state.commandPath, name]);
      const childBuilder = createBuilder(childState);
      state.subcommands.push({ name, description, state: childState, builder: childBuilder });
      return childBuilder;
    },

    argument<NameSpec extends `<${string}>`>(name: NameSpec, description?: string) {
      const argName = name.slice(1, -1); // remove < >
      state.positionals.push({ kind: 'positional', name: argName, description });
      return builder as CliBuilder<any, any>;
    },

    option(flag: string, description?: string, config?: { defaultValue?: boolean | string; valueName?: `<${string}>` }) {
      if (config && typeof config.defaultValue === 'string') {
        const valueName = config.valueName ? config.valueName.slice(1, -1) : 'value';
        state.options.push({ kind: 'valueOption', flag, description, defaultValue: config.defaultValue, valueName });
      } else {
        state.options.push({ kind: 'booleanOption', flag, description, defaultValue: (config as any)?.defaultValue as boolean | undefined });
      }
      return builder as CliBuilder<any, any>;
    },

    action(handler: ActionHandler<any, any>) {
      state.handler = handler;
      const executor: CliExecutor = { parse: (argv?: string[]) => runParse(state, argv) };
      return executor;
    },

    parse(argv?: string[]) {
      return runParse(state, argv);
    }
  };

  return builder as CliBuilder<[], []>;
}

function createBuilder(state: DefinitionState) {
  const b: any = {
    command(name: string, description?: string) {
      const childState = new DefinitionState(state.config, [...state.commandPath, name]);
      const childBuilder = createBuilder(childState);
      state.subcommands.push({ name, description, state: childState, builder: childBuilder });
      return childBuilder;
    },
    argument(name: string, description?: string) {
      const argName = name.slice(1, -1);
      state.positionals.push({ kind: 'positional', name: argName, description });
      return b;
    },
    option(flag: string, description?: string, config?: { defaultValue?: boolean | string; valueName?: `<${string}>` }) {
      if (config && typeof config.defaultValue === 'string') {
        const valueName = config.valueName ? config.valueName.slice(1, -1) : 'value';
        state.options.push({ kind: 'valueOption', flag, description, defaultValue: config.defaultValue, valueName });
      } else {
        state.options.push({ kind: 'booleanOption', flag, description, defaultValue: (config as any)?.defaultValue as boolean | undefined });
      }
      return b;
    },
    action(handler: ActionHandler<any, any>) {
      state.handler = handler;
      return { parse: (argv?: string[]) => runParse(state, argv) } as CliExecutor;
    },
    parse(argv?: string[]) {
      return runParse(state, argv);
    }
  };
  return b as CliBuilder<any, any>;
}

function printHelp(state: DefinitionState) {
  const lines: string[] = [];
  lines.push(`${state.commandPath.join(' ')}`);
  if (state.config.description) lines.push(state.config.description);
  lines.push('');
  const usageParts: string[] = [...state.commandPath];
  if (state.subcommands.length) usageParts.push('<command>');
  for (const p of state.positionals) usageParts.push(`<${p.name}>`);
  for (const o of state.options) {
    if (o.kind === 'booleanOption') usageParts.push(`[${o.flag}]`);
    if (o.kind === 'valueOption') usageParts.push(`[${o.flag} <${o.valueName}>]`);
  }
  lines.push(`Usage: ${usageParts.join(' ')}`);
  lines.push('');
  if (state.subcommands.length) {
    lines.push('Commands:');
    for (const c of state.subcommands) {
      lines.push(`  ${c.name}  ${c.description ?? ''}`.trimEnd());
    }
    lines.push('');
  }
  if (state.positionals.length) {
    lines.push('Arguments:');
    for (const p of state.positionals) {
      lines.push(`  <${p.name}>  ${p.description ?? ''}`.trimEnd());
    }
    lines.push('');
  }
  if (state.options.length) {
    lines.push('Options:');
    for (const o of state.options) {
      if (o.kind === 'booleanOption') {
        const def = o.defaultValue !== undefined ? ` (default: ${o.defaultValue})` : '';
        lines.push(`  ${o.flag}  ${o.description ?? ''}${def}`.trimEnd());
      } else {
        const def = o.defaultValue !== undefined ? ` (default: ${o.defaultValue})` : '';
        lines.push(`  ${o.flag} <${o.valueName}>  ${o.description ?? ''}${def}`.trimEnd());
      }
    }
  }
  console.log(lines.join('\n'));
}

async function runParse(state: DefinitionState, argv?: string[]) {
  const argsv = argv ?? process.argv.slice(2);

  // Sub-command dispatch: if first token matches a sub-command, delegate
  if (argsv[0] && !String(argsv[0]).startsWith('--')) {
    const sub = state.subcommands.find(s => s.name === argsv[0]);
    if (sub) {
      return runParse(sub.state, argsv.slice(1));
    }
  }

  if (argsv.includes('--help')) {
    printHelp(state);
    return;
  }

  // If there are sub-commands but none selected and no handler, show help
  if (state.subcommands.length > 0 && !state.handler && (!argsv.length || (typeof argsv[0] === 'string' && argsv[0].startsWith('--')))) {
    printHelp(state);
    return;
  }

  const { positionals, options } = parseArgs(argsv, state);
  if (state.handler) {
    await state.handler(positionals, options);
  }
}

function parseArgs(argv: string[], state: DefinitionState) {
  const positionalsResult: Record<string, string> = {};
  const optionsResult: Record<string, boolean | string> = {};

  // Initialize defaults
  for (const o of state.options) {
    const key = normalizeFlag(o.flag);
    if (o.kind === 'booleanOption') {
      optionsResult[key] = o.defaultValue ?? false;
    } else {
      if (o.defaultValue !== undefined) optionsResult[key] = o.defaultValue;
    }
  }

  const positionalQueue = [...state.positionals];

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (typeof token === 'string' && token.startsWith('--')) {
      const matching = state.options.find(o => o.flag === token);
      if (!matching) {
        continue; // unknown flags are ignored in MVP
      }
      const key = normalizeFlag(matching.flag);
      if (matching.kind === 'booleanOption') {
        optionsResult[key] = true;
      } else {
        const value = argv[i + 1];
        if (value && !value.startsWith('--')) {
          optionsResult[key] = value;
          i += 1;
        }
      }
    } else if (typeof token === 'string') {
      const nextPos = positionalQueue.shift();
      if (nextPos) {
        positionalsResult[nextPos.name] = token;
      }
    }
  }

  // Minimal validation: ensure all required positionals are present
  for (const p of state.positionals) {
    if (!(p.name in positionalsResult)) {
      throw new Error(`Missing required argument: <${p.name}>`);
    }
  }

  return { positionals: positionalsResult, options: optionsResult };
}

function normalizeFlag(flag: string): string {
  return flag.startsWith('--') ? flag.slice(2) : flag;
}


