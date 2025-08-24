import { cli } from '../src/index'

const app = cli({
	name: 'package-manager',
	description: 'A modern package manager with command aliases for better UX.'
})

// Install command with aliases: install, i, add
const install = app.command('install', 'Install packages', {
	aliases: ['i', 'add']
})
install
	.argument('<packageName>', 'The name of the package to install.')
	.action((args, _options, { ui }) => {
		const spinner = ui
			.spinner(`Installing ${ui.colors.green(args.packageName)}...`)
			.start()
		setTimeout(() => {
			spinner.succeed(`Installed: ${args.packageName}`)
			ui.box(
				`Package '${ui.colors.green(args.packageName)}' is ready.`,
				'Success'
			)
		}, 300)
	})

// Remove command with aliases: remove, r, uninstall
const remove = app.command('remove', 'Remove packages', {
	aliases: ['r', 'uninstall']
})
remove
	.argument('<packageName>', 'The name of the package to remove.')
	.action((args, _options, { ui }) => {
		const spinner = ui
			.spinner(`Removing ${ui.colors.red(args.packageName)}...`)
			.start()
		setTimeout(() => {
			spinner.succeed(`Removed: ${args.packageName}`)
			ui.box(
				`Package '${ui.colors.red(args.packageName)}' has been removed.`,
				'Removed'
			)
		}, 200)
	})

// Update command with aliases: update, u, upgrade
const update = app.command('update', 'Update packages', {
	aliases: ['u', 'upgrade']
})
update
	.argument('<packageName>', 'The name of the package to update.')
	.option('--force', 'Force update even if no newer version is available')
	.action((args, options, { ui }) => {
		const forceText = options.force ? ' (forced)' : ''
		const spinner = ui
			.spinner(`Updating ${ui.colors.yellow(args.packageName)}${forceText}...`)
			.start()
		setTimeout(() => {
			spinner.succeed(`Updated: ${args.packageName}`)
			ui.box(
				`Package '${ui.colors.yellow(args.packageName)}' has been updated.`,
				'Updated'
			)
		}, 400)
	})

// List command with aliases: list, l, ls
const list = app.command('list', 'List installed packages', {
	aliases: ['l', 'ls']
})
list
	.option('--outdated', 'Show only outdated packages')
	.option('--depth', 'Maximum dependency depth to show', {
		valueName: '<number>',
		valueType: 'number'
	})
	.action((_args, options, { ui }) => {
		const packages = [
			{ name: 'react', version: '18.2.0', latest: '18.2.0' },
			{ name: 'vue', version: '3.2.47', latest: '3.3.4' },
			{ name: 'angular', version: '15.2.0', latest: '16.1.0' }
		]

		if (options.outdated) {
			const outdated = packages.filter((pkg) => pkg.version !== pkg.latest)
			ui.table(outdated, { head: ['Package', 'Current', 'Latest'] })
		} else {
			ui.table(packages, { head: ['Package', 'Version', 'Latest'] })
		}
	})

// Build command with aliases: build, b, compile
const build = app.command('build', 'Build projects', {
	aliases: ['b', 'compile']
})
build
	.argument('<projectName>', 'The name of the project to build.')
	.option('--prod', 'Production build')
	.option('--config', 'Custom config file', { valueName: '<file>' })
	.action((args, options, { ui }) => {
		const env = options.prod ? 'production' : 'development'
		const config = options.config || 'default'

		const spinner = ui
			.spinner(`Building ${ui.colors.cyan(args.projectName)} in ${env} mode...`)
			.start()
		setTimeout(() => {
			spinner.succeed(`Built: ${args.projectName}`)
			ui.box(
				`Project '${ui.colors.cyan(args.projectName)}' built successfully in ${env} mode using config: ${config}`,
				'Build Complete'
			)
		}, 500)
	})

// Test command with aliases: test, t, check
const test = app.command('test', 'Run tests', { aliases: ['t', 'check'] })
test
	.argument('<suite>', 'The test suite to run.')
	.option('--watch', 'Watch mode for continuous testing')
	.option('--coverage', 'Generate coverage report')
	.option('--timeout', 'Test timeout in milliseconds', {
		valueName: '<ms>',
		valueType: 'number'
	})
	.action((args, options, { ui }) => {
		const watchText = options.watch ? ' (watching)' : ''
		const coverageText = options.coverage ? ' with coverage' : ''
		const timeoutText = options.timeout
			? ` (timeout: ${options.timeout}ms)`
			: ''

		const spinner = ui
			.spinner(
				`Running ${args.suite} tests${watchText}${coverageText}${timeoutText}...`
			)
			.start()
		setTimeout(() => {
			spinner.succeed(`Tests completed: ${args.suite}`)
			ui.box(
				`Test suite '${ui.colors.magenta(args.suite)}' completed successfully.`,
				'Tests Passed'
			)
		}, 600)
	})

// Deploy command with aliases: deploy, d, ship
const deploy = app.command('deploy', 'Deploy applications', {
	aliases: ['d', 'ship']
})
deploy
	.argument('<environment>', 'The deployment environment.')
	.option('--dryRun', 'Show what would be deployed without actually deploying')
	.option('--rollback', 'Rollback to previous deployment')
	.action((args, options, { ui }) => {
		const dryRunText = options.dryRun ? ' (dry run)' : ''
		const rollbackText = options.rollback ? ' (rollback)' : ''

		const spinner = ui
			.spinner(
				`Deploying to ${ui.colors.blue(args.environment)}${dryRunText}${rollbackText}...`
			)
			.start()
		setTimeout(() => {
			spinner.succeed(`Deployed to: ${args.environment}`)
			ui.box(
				`Application deployed successfully to '${ui.colors.blue(args.environment)}'.`,
				'Deployment Complete'
			)
		}, 800)
	})

// Show help by default
if (process.argv.length === 2) {
	app.parse(['--help'])
} else {
	app.parse(process.argv.slice(2))
}
