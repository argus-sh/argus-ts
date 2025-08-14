import { createUi } from '../src/ui/index'

async function main() {
	const ui = createUi()

	ui.box('UI Table Demo', 'Argus-TS')

	// Define typed row shapes to leverage Ui.table<T> generic typing
	type UserRow = { name: string; age: number; role: 'Engineer' | 'Designer' }
	type ItemRow = { id: number; title: string }

	// 1) Inferred headers from first object keys
	ui.table<UserRow>([
		{ name: 'Alice', age: 30, role: 'Engineer' },
		{ name: 'Bob', age: 25, role: 'Designer' }
	])

	// 2) Custom headers overriding inference with plain array labels
	ui.table<ItemRow>(
		[
			{ id: 1, title: 'Item 1' },
			{ id: 2, title: 'Item 2' }
		],
		{ head: ['ID', 'Title'] }
	)

	// 3) Example: the following would cause a type error if uncommented
	// ui.table<UserRow>([
	// 	{ name: 'Charlie', age: 28, role: 'QA' } // 'QA' is not assignable to 'Engineer' | 'Designer'
	// ])
}

main()
