// Global types for Argus-TS

// CLI core
export type CliConfig = {
	name: string
	description?: string
}

// Utility type helpers
export type ExtractAngleName<T extends string> = T extends `<${infer Inner}>`
	? Inner
	: never
// Normalize a flag to the bare name without leading dashes and any trailing
// value placeholder (e.g., "--config <file>" -> "config")
export type NormalizeFlag<T extends string> = T extends `--${infer Rest}`
	? Rest extends `${infer Name} ${string}`
		? Name
		: Rest
	: T

// Extract the value placeholder name from a composite flag string
// e.g., "--config <file>" -> "file"
export type ExtractFlagValueName<T extends string> =
	T extends `${string} <${infer Inner}>` ? Inner : never

// Extract the base flag from a composite flag string
// e.g., "--config <file>" -> "--config"
export type ExtractFlagBase<T extends string> =
	T extends `${infer Base} <${string}>` ? Base : T

// Argument/Option definitions
export type PositionalArgDefinition<Name extends string> = {
	kind: 'positional'
	name: Name
	description?: string
}

export type BooleanOptionDefinition<Flag extends string> = {
	kind: 'booleanOption'
	flag: Flag
	description?: string
	defaultValue?: boolean
}

export type ValueOptionDefinition<
	Flag extends string,
	ValueName extends string,
	ValueType extends 'string' | 'number' = 'string'
> = {
	kind: 'valueOption'
	flag: Flag
	valueName: ValueName
	description?: string
	// defaultValue aligns with the selected valueType; kept generic to support inference
	defaultValue?: ValueType extends 'number' ? number : string
	// valueType indicates how the parser should coerce the string input
	valueType?: ValueType
}

export type AnyOptionDefinition =
	| BooleanOptionDefinition<string>
	| ValueOptionDefinition<string, string, 'string' | 'number'>

export type PositionalArgsShape<
	Defs extends readonly PositionalArgDefinition<string>[]
> = {
	[K in Defs[number] as K['name']]: string
}

export type OptionsShape<Defs extends readonly AnyOptionDefinition[]> = {
	[K in Defs[number] as NormalizeFlag<
		K['flag']
	>]: K extends BooleanOptionDefinition<string>
		? boolean
		: K extends ValueOptionDefinition<string, string, infer VT>
			? VT extends 'number'
				? number
				: string
			: never
}

// UI types
export type Colors = {
	bold: (text: string) => string
	green: (text: string) => string
	red: (text: string) => string
	yellow: (text: string) => string
	blue: (text: string) => string
	magenta: (text: string) => string
	cyan: (text: string) => string
}

export type SpinnerOptions = {
	text?: string
	color?: (text: string) => string
	frames?:
		| string[]
		| 'dots'
		| 'dots2'
		| 'line'
		| 'pipe'
		| 'arrow'
		| 'star'
		| 'earth'
		| 'clock'
	intervalMs?: number
	prefix?: string
	suffix?: string
	succeedIcon?: string
	succeedColor?: (text: string) => string
	failIcon?: string
	failColor?: (text: string) => string
}

export type Spinner = {
	start: () => Spinner
	succeed: (text?: string) => void
	fail: (text?: string) => void
	stop: () => void
	setText: (text: string) => Spinner
	setColor: (color?: (text: string) => string) => Spinner
	setFrames: (frames: SpinnerOptions['frames']) => Spinner
	setInterval: (intervalMs: number) => Spinner
	setPrefix: (prefix?: string) => Spinner
	setSuffix: (suffix?: string) => Spinner
	update: (options: Partial<SpinnerOptions>) => Spinner
}

export type SelectChoice = { title: string; value: string }
export type SelectOptions = {
	highlight?: (text: string) => string
	indicatorColor?: (text: string) => string
}

export type Ui = {
	colors: Colors
	spinner: (textOrOptions?: string | SpinnerOptions) => Spinner
	prompt: {
		input: (message: string) => Promise<string>
		select: (
			message: string,
			choices: SelectChoice[],
			options?: SelectOptions
		) => Promise<string>
	}
	box: (text: string, title?: string) => void
	/**
	 * Render an ASCII table from an array of objects. The generic parameter T
	 * captures the shape of each row so downstream code can benefit from key
	 * inference when preparing data. The headers can still be customized via
	 * options.head which remains free-form labels.
	 */
	table: <T extends Record<string, unknown>>(
		data: ReadonlyArray<T>,
		options?: TableOptions<T>
	) => void
}

// Action and middleware
export type ActionContext = { ui: Ui }
export type ActionHandler<Args, Opts> = (
	args: Args,
	options: Opts,
	context: ActionContext
) => void | Promise<void>

export type MiddlewareContext = {
	args: any
	options: any
	ui: Ui
	commandPath: string[]
}
export type Middleware = (
	context: MiddlewareContext,
	next: () => Promise<void>
) => void | Promise<void>

// Public builder types
export type CliBuilder<
	PosDefs extends readonly PositionalArgDefinition<string>[],
	OptDefs extends readonly AnyOptionDefinition[]
> = {
	command<Name extends string>(
		name: Name,
		description?: string,
		options?: { aliases?: string[] }
	): CliBuilder<[], []>
	use(middleware: Middleware): CliBuilder<PosDefs, OptDefs>

	argument<NameSpec extends `<${string}>`>(
		name: NameSpec,
		description?: string
	): CliBuilder<
		[...PosDefs, PositionalArgDefinition<ExtractAngleName<NameSpec>>],
		OptDefs
	>

	option<FlagSpec extends `--${string}`>(
		flag: FlagSpec,
		description?: string,
		config?: { defaultValue?: boolean }
	): CliBuilder<PosDefs, [...OptDefs, BooleanOptionDefinition<FlagSpec>]>

	// Value option provided as composite flag string, e.g. "--config <file>"
	option<FlagSpec extends `--${string} <${string}>`>(
		flag: FlagSpec,
		description?: string,
		config?: { defaultValue?: string }
	): CliBuilder<
		PosDefs,
		[
			...OptDefs,
			ValueOptionDefinition<
				ExtractFlagBase<FlagSpec>,
				ExtractFlagValueName<FlagSpec>
			>
		]
	>

	// Value option with explicit valueName in config
	option<FlagSpec extends `--${string}`, ValueSpec extends `<${string}>`>(
		flag: FlagSpec,
		description: string,
		config: { defaultValue?: string } & { valueName?: ValueSpec }
	): CliBuilder<
		PosDefs,
		[
			...OptDefs,
			ValueOptionDefinition<FlagSpec, ExtractAngleName<ValueSpec>, 'string'>
		]
	>

	// Numeric value option (typed number)
	option<FlagSpec extends `--${string}`, ValueSpec extends `<${string}>`>(
		flag: FlagSpec,
		description: string,
		config: { defaultValue?: number } & { valueName?: ValueSpec } & {
			valueType: 'number'
		}
	): CliBuilder<
		PosDefs,
		[
			...OptDefs,
			ValueOptionDefinition<FlagSpec, ExtractAngleName<ValueSpec>, 'number'>
		]
	>

	action(
		handler: ActionHandler<PositionalArgsShape<PosDefs>, OptionsShape<OptDefs>>
	): CliExecutor
	parse(argv?: string[]): void | Promise<void>
}

export type CliExecutor = {
	parse(argv?: string[]): void | Promise<void>
}

// Table types
export type TableOptions<_T extends Record<string, unknown>> = {
	/**
	 * Header labels as an array. At runtime, must match the number of columns
	 * inferred from the first row (or define the number of columns when data is empty).
	 */
	head?: ReadonlyArray<string>
}
