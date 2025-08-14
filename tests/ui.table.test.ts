import { describe, expect, it, vi } from 'vitest'
import { createUi } from '../src/ui/index.js'

describe('UI Table', () => {
	it('prints table with inferred headers', () => {
		const ui = createUi()
		const log = vi.spyOn(console, 'log').mockImplementation(() => {})

		ui.table([
			{ name: 'Alice', age: 30 },
			{ name: 'Bob', age: 25 }
		])

		const output = log.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('| name ')
		expect(output).toContain('| age ')
		expect(output).toContain('Alice')
		expect(output).toContain('Bob')

		log.mockRestore()
	})

	it('overrides headers with options.head', () => {
		const ui = createUi()
		const log = vi.spyOn(console, 'log').mockImplementation(() => {})

		ui.table<{ id: number; title: string }>([{ id: 1, title: 'Item' }], {
			head: ['ID', 'Title']
		})

		const output = log.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('| ID ')
		expect(output).toContain('| Title ')
		expect(output).toContain('Item')

		log.mockRestore()
	})

	it('handles empty data with custom headers', () => {
		const ui = createUi()
		const log = vi.spyOn(console, 'log').mockImplementation(() => {})

		ui.table<{ colA: string; colB: string }>([], {
			head: ['Col A', 'Col B']
		})

		const output = log.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('| Col A ')
		expect(output).toContain('| Col B ')
		// No data rows beyond borders and header
		log.mockRestore()
	})

	it('prints nothing for empty data without headers', () => {
		const ui = createUi()
		const log = vi.spyOn(console, 'log').mockImplementation(() => {})

		ui.table([])

		expect(log).not.toHaveBeenCalled()
		log.mockRestore()
	})

	it('stringifies non-string values', () => {
		const ui = createUi()
		const log = vi.spyOn(console, 'log').mockImplementation(() => {})

		ui.table([{ a: 1, b: true, c: { x: 1 } }])

		const output = log.mock.calls.map((c) => c[0]).join('\n')
		expect(output).toContain('1')
		expect(output).toContain('true')
		expect(output).toContain('{"x":1}')
		log.mockRestore()
	})
})
