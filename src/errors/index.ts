import type { Ui } from '../types'

export class ArgusError extends Error {
	public readonly code: string
	public readonly details?: string
	public readonly hint?: string

	constructor(code: string, message: string, details?: string, hint?: string) {
		super(message)
		this.name = 'ArgusError'
		this.code = code
		this.details = details
		this.hint = hint
	}

	format(ui?: Ui): string {
		const c = ui?.colors
		const codeStr = c ? c.red(this.code) : this.code
		const header = `${codeStr} ${this.message}`
		const lines = [header]
		if (this.details) lines.push(this.details)
		if (this.hint) lines.push((c ? c.blue('Hint: ') : 'Hint: ') + this.hint)
		return lines.join('\n')
	}

	print(ui?: Ui) {
		const c = ui?.colors
		const title = c ? c.bold('Error') : 'Error'
		const text = this.format(ui)
		if (ui) {
			ui.box(text, title)
		} else {
			// eslint-disable-next-line no-console
			console.error(`${title}:\n${text}`)
		}
	}

	static isArgusError(err: unknown): err is ArgusError {
		return (
			err instanceof ArgusError ||
			(!!err && typeof err === 'object' && 'code' in (err as any))
		)
	}
}

export class MissingArgumentError extends ArgusError {
	constructor(argName: string) {
		super(
			'E_MISSING_ARGUMENT',
			`Missing required argument <${argName}>.`,
			`The positional argument <${argName}> is required but was not provided.`,
			`Provide the <${argName}> value or run with --help to see usage.`
		)
		this.name = 'MissingArgumentError'
	}
}

export class UnknownOptionError extends ArgusError {
	constructor(flag: string) {
		super(
			'E_UNKNOWN_OPTION',
			`Unknown option ${flag}.`,
			`The option '${flag}' is not recognized for this command.`,
			`Remove the option or check the valid options with --help.`
		)
		this.name = 'UnknownOptionError'
	}
}

export class MissingOptionValueError extends ArgusError {
	constructor(flag: string, valueName: string) {
		super(
			'E_MISSING_OPTION_VALUE',
			`Missing value for option ${flag}.`,
			`Expected a value for '${flag}' in place of <${valueName}>.`,
			`Provide a value after ${flag}, e.g., "${flag} <${valueName}>".`
		)
		this.name = 'MissingOptionValueError'
	}
}

export class InvalidSubcommandError extends ArgusError {
	constructor(input: string, available: string[]) {
		const suggestions = available.length
			? `Available: ${available.join(', ')}`
			: 'No sub-commands available.'
		super(
			'E_INVALID_SUBCOMMAND',
			`Invalid sub-command '${input}'.`,
			suggestions,
			`Run with --help to list sub-commands.`
		)
		this.name = 'InvalidSubcommandError'
	}
}
