// Global types for Argus-TS

// CLI core
export type CliConfig = {
  name: string;
  description?: string;
};

// Utility type helpers
export type ExtractAngleName<T extends string> = T extends `<${infer Inner}>` ? Inner : never;
export type NormalizeFlag<T extends string> = T extends `--${infer Name}` ? Name : T;

// Argument/Option definitions
export type PositionalArgDefinition<Name extends string> = {
  kind: 'positional';
  name: Name;
  description?: string;
};

export type BooleanOptionDefinition<Flag extends string> = {
  kind: 'booleanOption';
  flag: Flag;
  description?: string;
  defaultValue?: boolean;
};

export type ValueOptionDefinition<Flag extends string, ValueName extends string> = {
  kind: 'valueOption';
  flag: Flag;
  valueName: ValueName;
  description?: string;
  defaultValue?: string;
};

export type AnyOptionDefinition = BooleanOptionDefinition<string> | ValueOptionDefinition<string, string>;

export type PositionalArgsShape<Defs extends readonly PositionalArgDefinition<string>[]> = {
  [K in Defs[number] as K['name']]: string;
};

export type OptionsShape<Defs extends readonly AnyOptionDefinition[]> = {
  [K in Defs[number] as NormalizeFlag<K['flag']>] : K extends BooleanOptionDefinition<string>
    ? boolean
    : K extends ValueOptionDefinition<string, string>
      ? string
      : never;
};

// UI types
export type Colors = {
  bold: (text: string) => string;
  green: (text: string) => string;
  red: (text: string) => string;
  yellow: (text: string) => string;
  blue: (text: string) => string;
  magenta: (text: string) => string;
  cyan: (text: string) => string;
};

export type Spinner = {
  start: () => Spinner;
  succeed: (text?: string) => void;
  fail: (text?: string) => void;
  stop: () => void;
};

export type SelectChoice = { title: string; value: string };
export type SelectOptions = {
  highlight?: (text: string) => string;
  indicatorColor?: (text: string) => string;
};

export type Ui = {
  colors: Colors;
  spinner: (text?: string) => Spinner;
  prompt: {
    input: (message: string) => Promise<string>;
    select: (message: string, choices: SelectChoice[], options?: SelectOptions) => Promise<string>;
  };
  box: (text: string, title?: string) => void;
};

// Action and middleware
export type ActionContext = { ui: Ui };
export type ActionHandler<Args, Opts> = (args: Args, options: Opts, context: ActionContext) => void | Promise<void>;

export type MiddlewareContext = {
  args: any;
  options: any;
  ui: Ui;
  commandPath: string[];
};
export type Middleware = (context: MiddlewareContext, next: () => Promise<void>) => void | Promise<void>;

// Public builder types
export type CliBuilder<PosDefs extends readonly PositionalArgDefinition<string>[], OptDefs extends readonly AnyOptionDefinition[]> = {
  command<Name extends string>(name: Name, description?: string): CliBuilder<[], []>;
  use(middleware: Middleware): CliBuilder<PosDefs, OptDefs>;

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


