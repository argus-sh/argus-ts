import type { Colors, Spinner, SpinnerOptions } from '../types.js'

const PRESETS: Record<
	NonNullable<Exclude<SpinnerOptions['frames'], string[]>>,
	string[]
> = {
	dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
	dots2: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'],
	line: ['-', '\\', '|', '/'],
	pipe: ['┤', '┘', '┴', '└', '├', '┌', '┬', '┐'],
	arrow: ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗'],
	star: ['✶', '✸', '✹', '✺', '✹', '✷'],
	earth: ['🌍', '🌎', '🌏'],
	clock: [
		'🕛',
		'🕐',
		'🕑',
		'🕒',
		'🕓',
		'🕔',
		'🕕',
		'🕖',
		'🕗',
		'🕘',
		'🕙',
		'🕚'
	]
}

export function createSpinner(
	textOrOptions?: string | SpinnerOptions,
	colors?: Colors
): Spinner {
	let interval: NodeJS.Timeout | null = null
	let frame = 0

	let options: SpinnerOptions =
		typeof textOrOptions === 'string'
			? { text: textOrOptions }
			: (textOrOptions ?? {})
	function resolveFrames(f: SpinnerOptions['frames']): string[] {
		if (Array.isArray(f)) return f
		if (!f) return PRESETS.dots
		const preset = PRESETS[f as keyof typeof PRESETS]
		return preset ?? PRESETS.dots
	}
	let frames: string[] = resolveFrames(options.frames)
	let intervalMs = options.intervalMs ?? 80

	function asColor(fn?: (t: string) => string) {
		return fn ?? ((s: string) => s)
	}

	function render() {
		const raw: string = (frames[frame % frames.length] ??
			frames[0] ??
			'') as string
		const color = options.color ?? (colors ? colors.cyan : (s: string) => s)
		const f = asColor(color)(raw)
		const prefix = options.prefix ?? ''
		const suffix = options.suffix ?? ''
		const label = options.text ?? ''
		process.stdout.write(`\r${prefix}${f} ${label}${suffix}   `)
		frame += 1
	}

	const api: Spinner = {
		start() {
			if (interval) return this
			render()
			interval = setInterval(render, intervalMs)
			return this
		},
		succeed(msg?: string) {
			if (interval) {
				clearInterval(interval)
				interval = null
			}
			const iconColor =
				options.succeedColor ?? (colors ? colors.green : undefined)
			const icon = asColor(iconColor)(options.succeedIcon ?? '✔')
			const message = msg ?? options.text ?? ''
			const bold = colors?.bold ?? ((s: string) => s)
			process.stdout.write(`\r${icon} ${bold(message)}\n`)
		},
		fail(msg?: string) {
			if (interval) {
				clearInterval(interval)
				interval = null
			}
			const iconColor = options.failColor ?? (colors ? colors.red : undefined)
			const icon = asColor(iconColor)(options.failIcon ?? '✖')
			const message = msg ?? options.text ?? ''
			const bold = colors?.bold ?? ((s: string) => s)
			process.stdout.write(`\r${icon} ${bold(message)}\n`)
		},
		stop() {
			if (interval) {
				clearInterval(interval)
				interval = null
			}
			process.stdout.write('\r   \r')
		},
		setText(text: string) {
			options.text = text
			return this
		},
		setColor(color?: (text: string) => string) {
			options.color = color
			return this
		},
		setFrames(newFrames: SpinnerOptions['frames']) {
			frames = resolveFrames(newFrames)
			return this
		},
		setInterval(ms: number) {
			intervalMs = ms
			if (interval) {
				clearInterval(interval)
				interval = setInterval(render, intervalMs)
			}
			return this
		},
		setPrefix(prefix?: string) {
			options.prefix = prefix
			return this
		},
		setSuffix(suffix?: string) {
			options.suffix = suffix
			return this
		},
		update(partial: Partial<SpinnerOptions>) {
			options = { ...options, ...partial }
			return this
		}
	}

	return api
}
