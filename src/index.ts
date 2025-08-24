import {
	ArgusError,
	InvalidSubcommandError,
	MissingArgumentError,
	MissingOptionValueError,
	UnknownOptionError
} from './errors/index'
import type {
	ActionHandler,
	AnyOptionDefinition,
	BooleanOptionDefinition,
	CliBuilder,
	CliConfig,
	CliExecutor,
	Middleware,
	MiddlewareContext,
	PositionalArgDefinition,
	Ui,
	ValueOptionDefinition
} from './types'
import { createUi } from './ui/index'

// Internals to hold definitions
class DefinitionState {
	public readonly positionals: PositionalArgDefinition<string>[] = []
	public readonly options: AnyOptionDefinition[] = []
	public readonly subcommands: {
		name: string
		description?: string
		aliases?: string[]
		state: DefinitionState
		builder: any
	}[] = []
	public handler?: ActionHandler<any, any>
	public readonly middlewares: Middleware[] = []

	constructor(
		public readonly config: CliConfig,
		public readonly commandPath: string[],
		public readonly parent?: DefinitionState
	) {}
}

export type { CliBuilder, CliExecutor }

export function cli(config: CliConfig): CliBuilder<[], []> {
	const state = new DefinitionState(config, [config.name])

	const builder: any = {
		command(
			name: string,
			description?: string,
			options?: { aliases?: string[] }
		) {
			// Validate aliases don't conflict with existing commands
			if (options?.aliases) {
				for (const alias of options.aliases) {
					// Check if alias conflicts with existing command names
					const existingCommand = state.subcommands.find(
						(cmd) => cmd.name === alias
					)
					if (existingCommand) {
						throw new Error(
							`Alias '${alias}' conflicts with existing command '${existingCommand.name}'`
						)
					}
					// Check if alias conflicts with existing aliases
					const existingAlias = state.subcommands.find(
						(cmd) => cmd.aliases && cmd.aliases.includes(alias)
					)
					if (existingAlias) {
						throw new Error(
							`Alias '${alias}' conflicts with existing alias for command '${existingAlias.name}'`
						)
					}
				}
			}

			const childState = new DefinitionState(
				state.config,
				[...state.commandPath, name],
				state
			)
			const childBuilder = createBuilder(childState)
			state.subcommands.push({
				name,
				description,
				aliases: options?.aliases,
				state: childState,
				builder: childBuilder
			})
			return childBuilder
		},

		use(middleware: Middleware) {
			state.middlewares.push(middleware)
			return builder as CliBuilder<any, any>
		},

		argument<NameSpec extends `<${string}>`>(
			name: NameSpec,
			description?: string
		) {
			const argName = name.slice(1, -1) // remove < >
			state.positionals.push({ kind: 'positional', name: argName, description })
			return builder as CliBuilder<any, any>
		},

		option(
			flag: string,
			description?: string,
			config?: {
				defaultValue?: boolean | string | number
				valueName?: `<${string}>`
				valueType?: 'string' | 'number'
			}
		) {
			// Support composite flag declaration like "--config <file>"
			const composite = flag.match(/^(--[A-Za-z0-9_-]+)\s+<([^>]+)>$/)
			if (composite) {
				const baseFlag = composite[1] as string
				const valueName = composite[2] as string
				state.options.push({
					kind: 'valueOption',
					flag: baseFlag as string,
					description,
					defaultValue: (config as any)?.defaultValue as any,
					valueName: valueName as string,
					valueType: (config as any)?.valueType as any
				})
				return builder as CliBuilder<any, any>
			}
			if (config && config.valueName) {
				const valueName = config.valueName.slice(1, -1)
				state.options.push({
					kind: 'valueOption',
					flag,
					description,
					defaultValue: (config as any)?.defaultValue as any,
					valueName,
					valueType: (config as any)?.valueType as any
				})
			} else {
				state.options.push({
					kind: 'booleanOption',
					flag,
					description,
					defaultValue: (config as any)?.defaultValue as boolean | undefined
				})
			}
			return builder as CliBuilder<any, any>
		},

		action(handler: ActionHandler<any, any>) {
			state.handler = handler
			const executor: CliExecutor = {
				parse: (argv?: string[]) => runParse(state, argv)
			}
			return executor
		},

		parse(argv?: string[]) {
			return runParse(state, argv)
		}
	}

	return builder as CliBuilder<[], []>
}

function createBuilder(state: DefinitionState) {
	const b: any = {
		command(
			name: string,
			description?: string,
			options?: { aliases?: string[] }
		) {
			// Validate aliases don't conflict with existing commands
			if (options?.aliases) {
				for (const alias of options.aliases) {
					// Check if alias conflicts with existing command names
					const existingCommand = state.subcommands.find(
						(cmd) => cmd.name === alias
					)
					if (existingCommand) {
						throw new Error(
							`Alias '${alias}' conflicts with existing command '${existingCommand.name}'`
						)
					}
					// Check if alias conflicts with existing aliases
					const existingAlias = state.subcommands.find(
						(cmd) => cmd.aliases && cmd.aliases.includes(alias)
					)
					if (existingAlias) {
						throw new Error(
							`Alias '${alias}' conflicts with existing alias for command '${existingAlias.name}'`
						)
					}
				}
			}

			const childState = new DefinitionState(
				state.config,
				[...state.commandPath, name],
				state
			)
			const childBuilder = createBuilder(childState)
			state.subcommands.push({
				name,
				description,
				aliases: options?.aliases,
				state: childState,
				builder: childBuilder
			})
			return childBuilder
		},
		use(middleware: Middleware) {
			state.middlewares.push(middleware)
			return b
		},
		argument(name: string, description?: string) {
			const argName = name.slice(1, -1)
			state.positionals.push({ kind: 'positional', name: argName, description })
			return b
		},
		option(
			flag: string,
			description?: string,
			config?: {
				defaultValue?: boolean | string | number
				valueName?: `<${string}>`
				valueType?: 'string' | 'number'
			}
		) {
			const composite = flag.match(/^(--[A-Za-z0-9_-]+)\s+<([^>]+)>$/)
			if (composite) {
				const baseFlag = composite[1] as string
				const valueName = composite[2] as string
				state.options.push({
					kind: 'valueOption',
					flag: baseFlag as string,
					description,
					defaultValue: (config as any)?.defaultValue as any,
					valueName: valueName as string,
					valueType: (config as any)?.valueType as any
				})
				return b
			}
			if (config && config.valueName) {
				const valueName = config.valueName.slice(1, -1)
				state.options.push({
					kind: 'valueOption',
					flag,
					description,
					defaultValue: (config as any)?.defaultValue as any,
					valueName,
					valueType: (config as any)?.valueType as any
				})
			} else {
				state.options.push({
					kind: 'booleanOption',
					flag,
					description,
					defaultValue: (config as any)?.defaultValue as boolean | undefined
				})
			}
			return b
		},
		action(handler: ActionHandler<any, any>) {
			state.handler = handler
			return {
				parse: (argv?: string[]) => runParse(state, argv)
			} as CliExecutor
		},
		parse(argv?: string[]) {
			return runParse(state, argv)
		}
	}
	return b as CliBuilder<any, any>
}

function printHelp(state: DefinitionState, ui?: Ui) {
	const colors = ui?.colors
	const colorize = {
		title: (s: string) => (colors ? colors.bold(s) : s),
		section: (s: string) => (colors ? colors.cyan(s) : s),
		usageLabel: (s: string) => (colors ? colors.blue(s) : s),
		cmd: (s: string) => (colors ? colors.green(s) : s),
		arg: (s: string) => (colors ? colors.yellow(s) : s),
		opt: (s: string) => (colors ? colors.cyan(s) : s),
		dim: (s: string) => s
	}

	const lines: string[] = []
	// Build the full command signature for the title
	const titleParts: string[] = [...state.commandPath]
	for (const p of state.positionals) {
		titleParts.push(colorize.arg(`<${p.name}>`))
	}
	lines.push(colorize.title(titleParts.join(' ')))
	if (state.config.description) lines.push(state.config.description)
	lines.push('')

	// Usage
	const usageParts: string[] = [...state.commandPath]
	if (state.subcommands.length) usageParts.push(colorize.arg('<command>'))
	for (const p of state.positionals)
		usageParts.push(colorize.arg(`<${p.name}>`))
	for (const o of state.options) {
		if (o.kind === 'booleanOption') usageParts.push(colorize.opt(`[${o.flag}]`))
		else usageParts.push(colorize.opt(`[${o.flag} <${o.valueName}>]`))
	}
	lines.push(`${colorize.usageLabel('Usage:')} ${usageParts.join(' ')}`)
	lines.push('')

	// Commands
	if (state.subcommands.length) {
		lines.push(colorize.section('Commands:'))
		const commandRows: { left: string; right: string }[] = []
		for (const c of state.subcommands) {
			let left = colorize.cmd(c.name)
			if (c.aliases && c.aliases.length > 0) {
				left += `, ${c.aliases.map((alias) => colorize.cmd(alias)).join(', ')}`
			}
			const right = c.description ?? ''
			commandRows.push({ left, right })
		}
		const leftWidth = Math.max(
			...commandRows.map((r) => stripAnsiLike(r.left).length)
		)
		for (const r of commandRows) {
			const paddedLeft = padAnsiLike(r.left, leftWidth)
			lines.push(`  ${paddedLeft}  ${r.right}`.trimEnd())
		}
		lines.push('')
	}

	// Arguments
	if (state.positionals.length) {
		lines.push(colorize.section('Arguments:'))
		const names = state.positionals.map((p) => `<${p.name}>`)
		const nameWidth = Math.max(...names.map((n) => n.length))
		for (const p of state.positionals) {
			const left = colorize.arg(`<${p.name}>`.padEnd(nameWidth))
			const right = p.description ?? ''
			lines.push(`  ${left}  ${right}`.trimEnd())
		}
		lines.push('')
	}

	// Options (include built-in --help)
	lines.push(colorize.section('Options:'))
	const optionRows: { left: string; right: string }[] = []
	for (const o of state.options) {
		if (o.kind === 'booleanOption') {
			const def =
				o.defaultValue !== undefined ? ` (default: ${o.defaultValue})` : ''
			optionRows.push({
				left: colorize.opt(o.flag),
				right: `${o.description ?? ''}${def}`.trim()
			})
		} else {
			const def =
				o.defaultValue !== undefined ? ` (default: ${o.defaultValue})` : ''
			optionRows.push({
				left: colorize.opt(`${o.flag} <${o.valueName}>`),
				right: `${o.description ?? ''}${def}`.trim()
			})
		}
	}
	optionRows.push({ left: colorize.opt('--help'), right: 'Show help' })
	const leftWidth = Math.max(
		...optionRows.map((r) => stripAnsiLike(r.left).length)
	)
	for (const r of optionRows) {
		const paddedLeft = padAnsiLike(r.left, leftWidth)
		lines.push(`  ${paddedLeft}  ${r.right}`.trimEnd())
	}

	console.log(lines.join('\n'))
}

// Minimal ANSI-aware padding for our color codes
function stripAnsiLike(input: string): string {
	return input.replace(/\u001b\[[0-9;]*m/g, '')
}
function padAnsiLike(input: string, targetWidth: number): string {
	const visible = stripAnsiLike(input)
	const pad = Math.max(0, targetWidth - visible.length)
	return input + ' '.repeat(pad)
}

async function runParse(
	state: DefinitionState,
	argv?: string[],
	isDelegated: boolean = false
) {
	const argsv = argv ?? process.argv.slice(2)

	// If only options are provided (no subcommand tokens) and --help is present,
	// always show the root command help regardless of which builder/executor
	// parse() was called on.
	const hasNonOptionToken = argsv.some(
		(t) => typeof t === 'string' && !t.startsWith('--')
	)
	if (argsv.includes('--help') && !hasNonOptionToken) {
		const ui = createUi()
		if (isDelegated) {
			// We arrived here after explicit subcommand token, show subcommand help
			printHelp(state, ui)
		} else {
			// No explicit subcommand token in argv for this parse call → show root help
			let rootState: DefinitionState = state
			while (rootState.parent) rootState = rootState.parent
			printHelp(rootState, ui)
		}
		return
	}

	// Sub-command dispatch: if first token matches a sub-command, delegate
	if (argsv[0] && !String(argsv[0]).startsWith('--')) {
		const commandToken = argsv[0]
		const sub = state.subcommands.find(
			(s) =>
				s.name === commandToken ||
				(s.aliases && s.aliases.includes(commandToken))
		)
		if (sub) {
			return runParse(sub.state, argsv.slice(1), true)
		} else if (state.subcommands.length) {
			// invalid sub-command entered
			const ui = createUi()
			new InvalidSubcommandError(
				String(commandToken),
				state.subcommands.map((s) => s.name)
			).print(ui)
			return
		}
	}

	// Check for help after subcommand delegation
	if (argsv.includes('--help')) {
		const ui = createUi()
		printHelp(state, ui)
		return
	}

	// If there are sub-commands but none selected and no handler, show help
	if (
		state.subcommands.length > 0 &&
		!state.handler &&
		(!argsv.length ||
			(typeof argsv[0] === 'string' && argsv[0].startsWith('--')))
	) {
		const ui = createUi()
		printHelp(state, ui)
		return
	}

	try {
		const { positionals, options } = parseArgs(argsv, state)
		if (state.handler) {
			const ui = createUi()
			const chain = collectMiddlewares(state)
			const context: MiddlewareContext = {
				args: positionals,
				options,
				ui,
				commandPath: state.commandPath
			}
			await runMiddlewares(chain, context, async () => {
				await state.handler!(positionals, options, { ui })
			})
		}
	} catch (err) {
		const ui = createUi()
		if (ArgusError.isArgusError(err)) {
			;(err as ArgusError).print(ui)
			return
		}
		// For argument validation errors, show help
		if (
			err instanceof Error &&
			(err.message.includes('Too many arguments') ||
				err.message.includes('Missing argument'))
		) {
			printHelp(state, ui)
			return
		}
		throw err
	}
}

function parseArgs(argv: string[], state: DefinitionState) {
	const positionalsResult: Record<string, string> = {}
	const optionsResult: Record<string, boolean | string | number> = {}

	// Initialize defaults
	for (const o of state.options) {
		const key = normalizeFlag(o.flag)
		if (o.kind === 'booleanOption') {
			optionsResult[key] = o.defaultValue ?? false
		} else {
			if (o.defaultValue !== undefined) optionsResult[key] = o.defaultValue
		}
	}

	const positionalQueue = [...state.positionals]
	const remainingTokens: string[] = []

	for (let i = 0; i < argv.length; i += 1) {
		const token = argv[i]
		if (typeof token === 'string' && token.startsWith('--')) {
			const matching = state.options.find((o) => o.flag === token)
			if (!matching) {
				throw new UnknownOptionError(token)
			}
			const key = normalizeFlag(matching.flag)
			if (matching.kind === 'booleanOption') {
				// Check if next token is a boolean value
				const nextToken = argv[i + 1]
				if (nextToken === 'true' || nextToken === 'false') {
					optionsResult[key] = nextToken === 'true'
					i += 1
				} else {
					optionsResult[key] = true
				}
			} else {
				const value = argv[i + 1]
				if (value && !value.startsWith('--')) {
					// Coerce based on valueType if declared
					if ((matching as any).valueType === 'number') {
						const coerced = Number(value)
						if (Number.isNaN(coerced)) {
							throw new MissingOptionValueError(
								matching.flag,
								matching.valueName
							)
						}
						optionsResult[key] = coerced
					} else {
						optionsResult[key] = value
					}
					i += 1
				} else {
					throw new MissingOptionValueError(matching.flag, matching.valueName)
				}
			}
		} else if (typeof token === 'string') {
			const nextPos = positionalQueue.shift()
			if (nextPos) {
				positionalsResult[nextPos.name] = token
			} else {
				// This is an extra argument
				remainingTokens.push(token)
			}
		}
	}

	// Minimal validation: ensure all required positionals are present
	for (const p of state.positionals) {
		if (!(p.name in positionalsResult)) {
			throw new MissingArgumentError(p.name)
		}
	}

	// Check for too many arguments
	if (remainingTokens.length > 0) {
		throw new Error(
			`Too many arguments provided. Expected ${state.positionals.length}, got ${state.positionals.length + remainingTokens.length}`
		)
	}

	return { positionals: positionalsResult, options: optionsResult }
}

function normalizeFlag(flag: string): string {
	return flag.startsWith('--') ? flag.slice(2) : flag
}

function collectMiddlewares(state: DefinitionState): Middleware[] {
	const list: Middleware[] = []
	// collect from root to current for intuitive order (root first, leaf last)
	const stack: DefinitionState[] = []
	let cur: DefinitionState | undefined = state
	while (cur) {
		stack.push(cur)
		cur = cur.parent
	}
	stack.reverse().forEach((s) => {
		list.push(...s.middlewares)
	})
	return list
}

async function runMiddlewares(
	middlewares: Middleware[],
	context: MiddlewareContext,
	finalNext: () => Promise<void>
): Promise<void> {
	let index = -1
	async function dispatch(i: number): Promise<void> {
		if (i <= index) throw new Error('next() called multiple times')
		index = i
		const fn = middlewares[i]
		if (!fn) {
			return finalNext()
		}
		await fn(context, () => dispatch(i + 1))
	}
	await dispatch(0)
}
