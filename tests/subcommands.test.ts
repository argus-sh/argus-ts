import { describe, expect, it, vi } from 'vitest'
import { cli } from '../src/index'

function withMockedIO<T>(fn: () => T) {
	const log = vi.spyOn(console, 'log').mockImplementation(() => {})
	const error = vi.spyOn(console, 'error').mockImplementation(() => {})
	const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
	try {
		return fn()
	} finally {
		log.mockRestore()
		error.mockRestore()
		write.mockRestore()
	}
}

describe('Subcommands', () => {
	it('creates basic subcommand', async () => {
		const outputs: string[] = []
		await withMockedIO(async () => {
			const app = cli({ name: 'app' })

			app
				.command('build', 'Build the project')
				.argument('<target>')
				.action((args) => {
					outputs.push(`build:${args.target}`)
				})

			await app.parse(['build', 'web'])
		})
		expect(outputs).toEqual(['build:web'])
	})

	it('creates subcommand with description', async () => {
		const logs: string[] = []
		vi.spyOn(console, 'log').mockImplementation((msg?: any) => {
			if (typeof msg === 'string') logs.push(msg)
		})

		const app = cli({ name: 'app' })
		app.command('build', 'Build the project').action(() => {})

		await app.parse(['--help'])
		const helpText = logs.join('\n')
		expect(helpText).toContain('build')
		expect(helpText).toContain('Build the project')
	})

	it('creates nested subcommands', async () => {
		const outputs: string[] = []
		await withMockedIO(async () => {
			const app = cli({ name: 'app' })

			const build = app.command('build', 'Build commands')
			build
				.command('web', 'Build web app')
				.argument('<target>')
				.action((args) => {
					outputs.push(`web:${args.target}`)
				})

			build
				.command('api', 'Build API')
				.argument('<version>')
				.action((args) => {
					outputs.push(`api:${args.version}`)
				})

			await app.parse(['build', 'web', 'frontend'])
			await app.parse(['build', 'api', 'v2'])
		})
		expect(outputs).toEqual(['web:frontend', 'api:v2'])
	})

	it('creates deeply nested subcommands', async () => {
		const outputs: string[] = []
		await withMockedIO(async () => {
			const app = cli({ name: 'app' })

			const build = app.command('build', 'Build commands')
			const web = build.command('web', 'Web build commands')
			web
				.command('frontend', 'Frontend build')
				.argument('<framework>')
				.action((args) => {
					outputs.push(`frontend:${args.framework}`)
				})

			await app.parse(['build', 'web', 'frontend', 'react'])
		})
		expect(outputs).toEqual(['frontend:react'])
	})

	it('handles subcommand with options', async () => {
		const outputs: string[] = []
		await withMockedIO(async () => {
			const app = cli({ name: 'app' })

			app
				.command('build', 'Build command')
				.argument('<target>')
				.option('--prod', 'Production build')
				.option('--config', 'Config file', { valueName: '<config>' })
				.action((args, options) => {
					outputs.push(`build:${args.target}:${options.prod}:${options.config}`)
				})

			await app.parse(['build', 'web', '--prod', '--config', 'prod.json'])
		})
		expect(outputs).toEqual(['build:web:true:prod.json'])
	})

	it('handles subcommand with multiple arguments', async () => {
		const outputs: string[] = []
		await withMockedIO(async () => {
			const app = cli({ name: 'app' })

			app
				.command('copy', 'Copy command')
				.argument('<source>')
				.argument('<destination>')
				.action((args) => {
					outputs.push(`copy:${args.source}:${args.destination}`)
				})

			await app.parse(['copy', 'src', 'dist'])
		})
		expect(outputs).toEqual(['copy:src:dist'])
	})

	it('handles subcommand with middleware', async () => {
		const outputs: string[] = []
		await withMockedIO(async () => {
			const app = cli({ name: 'app' })

			app
				.command('build', 'Build command')
				.argument('<target>')
				.use(async (context, next) => {
					outputs.push('build-middleware')
					await next()
				})
				.action((args) => {
					outputs.push(`build:${args.target}`)
				})

			await app.parse(['build', 'web'])
		})
		expect(outputs).toEqual(['build-middleware', 'build:web'])
	})

	it('handles subcommand with inherited middleware', async () => {
		const outputs: string[] = []
		await withMockedIO(async () => {
			const app = cli({ name: 'app' }).use(async (context, next) => {
				outputs.push('root-middleware')
				await next()
			})

			app
				.command('build', 'Build command')
				.argument('<target>')
				.action((args) => {
					outputs.push(`build:${args.target}`)
				})

			await app.parse(['build', 'web'])
		})
		expect(outputs).toEqual(['root-middleware', 'build:web'])
	})

	it('handles subcommand with both inherited and local middleware', async () => {
		const outputs: string[] = []
		await withMockedIO(async () => {
			const app = cli({ name: 'app' }).use(async (context, next) => {
				outputs.push('root-middleware')
				await next()
			})

			app
				.command('build', 'Build command')
				.argument('<target>')
				.use(async (context, next) => {
					outputs.push('build-middleware')
					await next()
				})
				.action((args) => {
					outputs.push(`build:${args.target}`)
				})

			await app.parse(['build', 'web'])
		})
		expect(outputs).toEqual([
			'root-middleware',
			'build-middleware',
			'build:web'
		])
	})

	it('shows help for subcommands', async () => {
		const logs: string[] = []
		vi.spyOn(console, 'log').mockImplementation((msg?: any) => {
			if (typeof msg === 'string') logs.push(msg)
		})

		const app = cli({ name: 'app', description: 'Main application' })
		app
			.command('build', 'Build the project')
			.argument('<target>')
			.option('--prod', 'Production build')
			.action(() => {})

		app
			.command('test', 'Run tests')
			.argument('<suite>')
			.action(() => {})

		await app.parse(['--help'])
		const helpText = logs.join('\n')
		expect(helpText).toContain('Commands:')
		expect(helpText).toContain('build')
		expect(helpText).toContain('test')
		expect(helpText).toContain('Build the project')
		expect(helpText).toContain('Run tests')
	})

	it('shows help for specific subcommand', async () => {
		const logs: string[] = []
		vi.spyOn(console, 'log').mockImplementation((msg?: any) => {
			if (typeof msg === 'string') {
				logs.push(msg)
			}
		})

		const app = cli({ name: 'app' })
		app
			.command('build', 'Build the project')
			.argument('<target>')
			.option('--prod', 'Production build')
			.action(() => {})

		await app.parse(['build', '--help'])
		const helpText = logs.join('\n')
		// Strip ANSI codes for the assertion to work properly
		const cleanText = helpText.replace(/\u001b\[[0-9;]*m/g, '')
		expect(cleanText).toContain('Usage:')
		expect(cleanText).toContain('app build <target>')
		expect(helpText).toContain('--prod')
	})

	it('handles subcommand without action', async () => {
		const logs: string[] = []
		vi.spyOn(console, 'log').mockImplementation((msg?: any) => {
			if (typeof msg === 'string') logs.push(msg)
		})

		const app = cli({ name: 'app' })
		app.command('build', 'Build command').argument('<target>')
		// No action defined

		await app.parse(['build', 'web'])
		// When no action is defined, the command should still work (no help shown)
		expect(logs.length).toBe(0)
	})

	it('handles subcommand with empty arguments', async () => {
		const logs: string[] = []
		vi.spyOn(console, 'log').mockImplementation((msg?: any) => {
			if (typeof msg === 'string') logs.push(msg)
		})

		const app = cli({ name: 'app' })
		app
			.command('build', 'Build command')
			.argument('<target>')
			.action(() => {})

		await app.parse(['build']) // Missing argument
		// Error should be handled internally, not shown as help
		expect(logs.length).toBeGreaterThan(0)
	})

	it('handles subcommand with invalid arguments', async () => {
		const logs: string[] = []
		vi.spyOn(console, 'log').mockImplementation((msg?: any) => {
			if (typeof msg === 'string') logs.push(msg)
		})

		const app = cli({ name: 'app' })
		app
			.command('build', 'Build command')
			.argument('<target>')
			.action(() => {})

		await app.parse(['build', 'arg1', 'arg2']) // Too many arguments
		const helpText = logs.join('\n')
		expect(helpText).toContain('Usage:')
	})

	it('handles subcommand with boolean options', async () => {
		const outputs: string[] = []
		await withMockedIO(async () => {
			const app = cli({ name: 'app' })

			app
				.command('build', 'Build command')
				.argument('<target>')
				.option('--prod', 'Production build')
				.option('--debug', 'Debug mode')
				.action((args, options) => {
					outputs.push(`build:${args.target}:${options.prod}:${options.debug}`)
				})

			await app.parse(['build', 'web', '--prod', '--debug'])
		})
		expect(outputs).toEqual(['build:web:true:true'])
	})

	it('handles subcommand with mixed option types', async () => {
		const outputs: string[] = []
		await withMockedIO(async () => {
			const app = cli({ name: 'app' })

			app
				.command('build', 'Build command')
				.argument('<target>')
				.option('--prod', 'Production build')
				.option('--config', 'Config file', { valueName: '<config>' })
				.option('--verbose', 'Verbose output')
				.action((args, options) => {
					outputs.push(
						`build:${args.target}:${options.prod}:${options.config}:${options.verbose}`
					)
				})

			await app.parse([
				'build',
				'web',
				'--prod',
				'--config',
				'prod.json',
				'--verbose'
			])
		})
		expect(outputs).toEqual(['build:web:true:prod.json:true'])
	})

	it('handles subcommand with default option values', async () => {
		const outputs: string[] = []
		await withMockedIO(async () => {
			const app = cli({ name: 'app' })

			app
				.command('build', 'Build command')
				.argument('<target>')
				.option('--prod', 'Production build', { defaultValue: false })
				.option('--config', 'Config file', {
					defaultValue: 'default.json',
					valueName: '<config>'
				})
				.action((args, options) => {
					outputs.push(`build:${args.target}:${options.prod}:${options.config}`)
				})

			await app.parse(['build', 'web'])
		})
		expect(outputs).toEqual(['build:web:false:default.json'])
	})

	it('handles subcommand with overridden default values', async () => {
		const outputs: string[] = []
		await withMockedIO(async () => {
			const app = cli({ name: 'app' })

			app
				.command('build', 'Build command')
				.argument('<target>')
				.option('--prod', 'Production build', { defaultValue: false })
				.option('--config', 'Config file', {
					defaultValue: 'default.json',
					valueName: '<config>'
				})
				.action((args, options) => {
					outputs.push(`build:${args.target}:${options.prod}:${options.config}`)
				})

			await app.parse(['build', 'web', '--prod', '--config', 'custom.json'])
		})
		expect(outputs).toEqual(['build:web:true:custom.json'])
	})

	it('handles subcommand with complex command path', async () => {
		const outputs: string[] = []
		await withMockedIO(async () => {
			const app = cli({ name: 'app' })

			const build = app.command('build', 'Build commands')
			const web = build.command('web', 'Web build commands')
			const frontend = web.command('frontend', 'Frontend build')

			frontend
				.command('react', 'React build')
				.argument('<version>')
				.action((args) => {
					outputs.push(`react:${args.version}`)
				})

			await app.parse(['build', 'web', 'frontend', 'react', '18'])
		})
		expect(outputs).toEqual(['react:18'])
	})

	it('handles subcommand with no description', async () => {
		const logs: string[] = []
		vi.spyOn(console, 'log').mockImplementation((msg?: any) => {
			if (typeof msg === 'string') logs.push(msg)
		})

		const app = cli({ name: 'app' })
		app
			.command('build') // No description
			.action(() => {})

		await app.parse(['--help'])
		const helpText = logs.join('\n')
		expect(helpText).toContain('build')
	})

	it('handles subcommand with empty description', async () => {
		const logs: string[] = []
		vi.spyOn(console, 'log').mockImplementation((msg?: any) => {
			if (typeof msg === 'string') logs.push(msg)
		})

		const app = cli({ name: 'app' })
		app
			.command('build', '') // Empty description
			.action(() => {})

		await app.parse(['--help'])
		const helpText = logs.join('\n')
		expect(helpText).toContain('build')
	})

	it('supports command aliases', async () => {
		const outputs: string[] = []
		await withMockedIO(async () => {
			const app = cli({ name: 'app' })

			app
				.command('install', 'Install packages', { aliases: ['i', 'add'] })
				.argument('<packageName>')
				.action((args) => {
					outputs.push(`install:${args.packageName}`)
				})

			await app.parse(['install', 'react'])
			await app.parse(['i', 'vue'])
			await app.parse(['add', 'angular'])
		})
		expect(outputs).toEqual(['install:react', 'install:vue', 'install:angular'])
	})

	it('displays aliases in help text', async () => {
		const logs: string[] = []
		vi.spyOn(console, 'log').mockImplementation((msg?: any) => {
			if (typeof msg === 'string') logs.push(msg)
		})

		const app = cli({ name: 'app' })
		app
			.command('install', 'Install packages', { aliases: ['i', 'add'] })
			.action(() => {})

		await app.parse(['--help'])
		const helpText = logs.join('\n')
		// Strip ANSI codes for the assertion to work properly
		const cleanText = helpText.replace(/\u001b\[[0-9;]*m/g, '')
		expect(cleanText).toContain('install, i, add')
		expect(cleanText).toContain('Install packages')
	})

	it('prevents alias conflicts with existing command names', async () => {
		const app = cli({ name: 'app' })

		app.command('build', 'Build command').action(() => {})

		expect(() => {
			app.command('install', 'Install command', { aliases: ['build'] })
		}).toThrow("Alias 'build' conflicts with existing command 'build'")
	})

	it('prevents alias conflicts with existing aliases', async () => {
		const app = cli({ name: 'app' })

		app
			.command('install', 'Install command', { aliases: ['i'] })
			.action(() => {})

		expect(() => {
			app.command('add', 'Add command', { aliases: ['i'] })
		}).toThrow("Alias 'i' conflicts with existing alias for command 'install'")
	})

	it('handles nested subcommands with aliases', async () => {
		const outputs: string[] = []
		await withMockedIO(async () => {
			const app = cli({ name: 'app' })

			const build = app.command('build', 'Build commands')
			build
				.command('web', 'Web build', { aliases: ['w'] })
				.argument('<target>')
				.action((args) => {
					outputs.push(`web:${args.target}`)
				})

			await app.parse(['build', 'web', 'frontend'])
			await app.parse(['build', 'w', 'backend'])
		})
		expect(outputs).toEqual(['web:frontend', 'web:backend'])
	})

	it('handles deeply nested subcommands with aliases', async () => {
		const outputs: string[] = []
		await withMockedIO(async () => {
			const app = cli({ name: 'app' })

			const build = app.command('build', 'Build commands')
			const web = build.command('web', 'Web build commands', { aliases: ['w'] })
			web
				.command('frontend', 'Frontend build', { aliases: ['f', 'ui'] })
				.argument('<framework>')
				.action((args) => {
					outputs.push(`frontend:${args.framework}`)
				})

			await app.parse(['build', 'web', 'frontend', 'react'])
			await app.parse(['build', 'w', 'f', 'vue'])
			await app.parse(['build', 'web', 'ui', 'angular'])
		})
		expect(outputs).toEqual([
			'frontend:react',
			'frontend:vue',
			'frontend:angular'
		])
	})

	it('handles subcommands with multiple aliases', async () => {
		const outputs: string[] = []
		await withMockedIO(async () => {
			const app = cli({ name: 'app' })

			app
				.command('deploy', 'Deploy application', {
					aliases: ['d', 'ship', 'push']
				})
				.argument('<environment>')
				.action((args) => {
					outputs.push(`deploy:${args.environment}`)
				})

			await app.parse(['deploy', 'production'])
			await app.parse(['d', 'staging'])
			await app.parse(['ship', 'development'])
			await app.parse(['push', 'test'])
		})
		expect(outputs).toEqual([
			'deploy:production',
			'deploy:staging',
			'deploy:development',
			'deploy:test'
		])
	})

	it('handles subcommands with aliases and options', async () => {
		const outputs: string[] = []
		await withMockedIO(async () => {
			const app = cli({ name: 'app' })

			app
				.command('test', 'Run tests', { aliases: ['t', 'check'] })
				.argument('<suite>')
				.option('--watch', 'Watch mode')
				.option('--coverage', 'Generate coverage report')
				.action((args, options) => {
					outputs.push(
						`test:${args.suite}:${options.watch}:${options.coverage}`
					)
				})

			await app.parse(['test', 'unit', '--watch'])
			await app.parse(['t', 'integration', '--coverage'])
			await app.parse(['check', 'e2e', '--watch', '--coverage'])
		})
		expect(outputs).toEqual([
			'test:unit:true:false',
			'test:integration:false:true',
			'test:e2e:true:true'
		])
	})

	it('handles subcommands with aliases and middleware', async () => {
		const outputs: string[] = []
		await withMockedIO(async () => {
			const app = cli({ name: 'app' })

			app
				.command('build', 'Build command', { aliases: ['b', 'compile'] })
				.argument('<target>')
				.use(async (context, next) => {
					outputs.push('build-middleware')
					await next()
				})
				.action((args) => {
					outputs.push(`build:${args.target}`)
				})

			await app.parse(['build', 'web'])
			await app.parse(['b', 'api'])
			await app.parse(['compile', 'mobile'])
		})
		expect(outputs).toEqual([
			'build-middleware',
			'build:web',
			'build-middleware',
			'build:api',
			'build-middleware',
			'build:mobile'
		])
	})

	it('handles subcommands with aliases and inherited middleware', async () => {
		const outputs: string[] = []
		await withMockedIO(async () => {
			const app = cli({ name: 'app' }).use(async (context, next) => {
				outputs.push('root-middleware')
				await next()
			})

			app
				.command('deploy', 'Deploy command', { aliases: ['d', 'ship'] })
				.argument('<target>')
				.action((args) => {
					outputs.push(`deploy:${args.target}`)
				})

			await app.parse(['deploy', 'web'])
			await app.parse(['d', 'api'])
			await app.parse(['ship', 'mobile'])
		})
		expect(outputs).toEqual([
			'root-middleware',
			'deploy:web',
			'root-middleware',
			'deploy:api',
			'root-middleware',
			'deploy:mobile'
		])
	})

	it('handles subcommands with aliases and complex command paths', async () => {
		const outputs: string[] = []
		await withMockedIO(async () => {
			const app = cli({ name: 'app' })

			const build = app.command('build', 'Build commands', { aliases: ['b'] })
			const web = build.command('web', 'Web build commands', { aliases: ['w'] })
			const frontend = web.command('frontend', 'Frontend build', {
				aliases: ['f', 'ui']
			})

			frontend
				.command('react', 'React build', { aliases: ['r'] })
				.argument('<version>')
				.action((args) => {
					outputs.push(`react:${args.version}`)
				})

			await app.parse(['build', 'web', 'frontend', 'react', '18'])
			await app.parse(['b', 'w', 'f', 'r', '17'])
			await app.parse(['build', 'web', 'ui', 'react', '16'])
		})
		expect(outputs).toEqual(['react:18', 'react:17', 'react:16'])
	})

	it('handles subcommands with aliases and no description', async () => {
		const logs: string[] = []
		vi.spyOn(console, 'log').mockImplementation((msg?: any) => {
			if (typeof msg === 'string') logs.push(msg)
		})

		const app = cli({ name: 'app' })
		app
			.command('build', undefined, { aliases: ['b'] }) // No description
			.action(() => {})

		await app.parse(['--help'])
		const helpText = logs.join('\n')
		// Strip ANSI codes for the assertion to work properly
		const cleanText = helpText.replace(/\u001b\[[0-9;]*m/g, '')
		expect(cleanText).toContain('build, b')
	})

	it('handles subcommands with aliases and empty description', async () => {
		const logs: string[] = []
		vi.spyOn(console, 'log').mockImplementation((msg?: any) => {
			if (typeof msg === 'string') logs.push(msg)
		})

		const app = cli({ name: 'app' })
		app
			.command('build', '', { aliases: ['b'] }) // Empty description
			.action(() => {})

		await app.parse(['--help'])
		const helpText = logs.join('\n')
		// Strip ANSI codes for the assertion to work properly
		const cleanText = helpText.replace(/\u001b\[[0-9;]*m/g, '')
		expect(cleanText).toContain('build, b')
	})

	it('handles subcommands with empty aliases array', async () => {
		const outputs: string[] = []
		await withMockedIO(async () => {
			const app = cli({ name: 'app' })

			app
				.command('build', 'Build command', { aliases: [] })
				.argument('<target>')
				.action((args) => {
					outputs.push(`build:${args.target}`)
				})

			await app.parse(['build', 'web'])
		})
		expect(outputs).toEqual(['build:web'])
	})

	it('handles subcommands with undefined aliases', async () => {
		const outputs: string[] = []
		await withMockedIO(async () => {
			const app = cli({ name: 'app' })

			app
				.command('build', 'Build command') // No aliases
				.argument('<target>')
				.action((args) => {
					outputs.push(`build:${args.target}`)
				})

			await app.parse(['build', 'web'])
		})
		expect(outputs).toEqual(['build:web'])
	})
})
