// TableOptions is defined in ../types to keep public API centralized
import { ArgusError } from '../errors/index'

function stringifyValue(value: unknown): string {
	if (value === null || value === undefined) return ''
	if (typeof value === 'string') return value
	try {
		if (typeof value === 'object') return JSON.stringify(value)
		return String(value)
	} catch {
		return String(value)
	}
}

export function drawTable<T extends Record<string, unknown>>(
	data: ReadonlyArray<T>,
	options?: import('../types').TableOptions<T>
): void {
	const hasData = Array.isArray(data) && data.length > 0
	let inferredKeys: (keyof T)[] = []
	if (hasData) {
		inferredKeys = Object.keys(data[0] as object) as (keyof T)[]
	}

	// Determine columns and header titles
	const columnKeys: (keyof T)[] = inferredKeys
	let headerTitles: string[] = inferredKeys.map((k) => String(k))

	// Use provided head as titles; we will validate length vs columns at runtime
	if (options?.head && options.head.length > 0) {
		headerTitles = [...options.head]
	}

	// Runtime validation: header length must equal number of columns if both are known
	if (
		headerTitles.length > 0 &&
		columnKeys.length > 0 &&
		headerTitles.length !== columnKeys.length
	) {
		throw new ArgusError(
			'E_TABLE_HEADER_MISMATCH',
			'Header count does not match number of columns.',
			`Received ${headerTitles.length} header title(s), but inferred ${columnKeys.length} column(s) from data.`,
			'Ensure head contains exactly one label for each column in the first data row.'
		)
	}

	// If there are no columns and no headers to show, do nothing
	if (headerTitles.length === 0) {
		return
	}

	// Compute column widths based on header titles and data values
	const columnWidths: number[] = headerTitles.map((title) => title.length)
	if (hasData && columnKeys.length > 0) {
		for (const row of data) {
			columnKeys.forEach((key, idx) => {
				const cell = stringifyValue((row as any)[key as string])
				const current = columnWidths[idx] ?? 0
				columnWidths[idx] = Math.max(current, cell.length)
			})
		}
	}

	// Helper to build a horizontal border
	const horizontal = () =>
		'+' +
		columnWidths.map((w) => '-'.repeat(((w ?? 0) as number) + 2)).join('+') +
		'+'

	// Helper to build a row
	const rowLine = (cells: string[]) =>
		'|' +
		cells
			.map((c, i) => ` ${c.padEnd((columnWidths[i] ?? 0) as number)} `)
			.join('|') +
		'|'

	const lines: string[] = []
	lines.push(horizontal())
	lines.push(rowLine(headerTitles))
	lines.push(horizontal())

	if (hasData && columnKeys.length > 0) {
		for (const row of data) {
			const cells = columnKeys.map((key) =>
				stringifyValue((row as any)[key as string])
			)
			lines.push(rowLine(cells))
		}
		lines.push(horizontal())
	} else {
		// No data rows; close the table
		lines.push(horizontal())
	}

	// eslint-disable-next-line no-console
	console.log(lines.join('\n'))
}
