import type { SelectChoice, Ui } from '../types.js'
import { drawBox } from './box.js'
import { createColors } from './colors.js'
import { promptInput, promptSelect } from './prompt.js'
import { createSpinner } from './spinner.js'

export function createUi(): Ui {
	const colors = createColors()
	return {
		colors,
		spinner: (textOrOptions?: string | import('../types.js').SpinnerOptions) =>
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
		box: (text: string, title?: string) => drawBox(text, { title, padding: 1 })
	}
}

// Types are re-exported from ../types
