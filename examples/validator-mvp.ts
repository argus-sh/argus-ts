import { cli } from '../src/index'

cli({
	name: 'validator-mvp',
	description: 'Validação da arquitetura de inferência de tipos.'
})
	.argument('<file>', 'O ficheiro a ser processado.')
	.option('--strict <x>', 'Ativar o modo estrito.', { defaultValue: false })
	.option('--teste <num>', 'Valor numérico de teste', {
		valueType: 'number',
		defaultValue: 1
	})
	.action((args, options) => {
		// Type checkpoints: args.file -> string, options.strict -> boolean
		console.log(`Processando o ficheiro: ${args.file}`)
		console.log(`Modo Estrito: ${options.strict}`)
		console.log(`Teste (number): ${options.teste}`)
	})
	.parse(process.argv.slice(2))
