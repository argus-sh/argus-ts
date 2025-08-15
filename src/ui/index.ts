import type { SelectChoice, Ui } from '../types'
import { drawBox } from './box'
import { createColors } from './colors'
import { promptInput, promptSelect } from './prompt'
import { createSpinner } from './spinner'
import { drawTable } from './table'

export function createUi(): Ui {
	const colors = createColors()
	return {
		colors,
		spinner: (textOrOptions?: string | import('../types').SpinnerOptions) =>
			createSpinner(textOrOptions as any, colors),
		prompt: {
			input: (message: string) => promptInput(message),
			select: (
				message: string,
				choices: SelectChoice[],
				options?: {
					highlight?: (text: string) => string
					indicatorColor?: (text: string) => string
				}
			) => promptSelect(message, choices, options)
		},
		box: (text: string, title?: string) => drawBox(text, { title, padding: 1 }),
		table: <T extends Record<string, unknown>>(
			data: ReadonlyArray<T>,
			options?: import('../types').TableOptions<T>
		) => drawTable<T>(data, options)
	}
}

// Types are re-exported from ../types
