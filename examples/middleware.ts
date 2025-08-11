import { cli } from '../src/index';

const app = cli({ name: 'mw-demo', description: 'Exemplo de middlewares.' });

// Root middleware: log
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.ui.box(`Tempo total: ${ms}ms`, 'Middleware Log');
});

// Root middleware: auth simulation
app.use(async (ctx, next) => {
  // Exemplo: bloquear se opção --no-auth
  if (ctx.options['no-auth'] === true) {
    ctx.ui.box(ctx.ui.colors.red('Não autorizado'), 'Auth');
    return; // não chama next()
  }
  await next();
});

const build = app.command('build', 'Compila o projeto.');

// Command-level middleware: annotate
build.use(async (ctx, next) => {
  ctx.ui.box(`Comando: ${ctx.commandPath.join(' ')}`, 'Contexto');
  await next();
});

build
  .option('--no-auth', 'Desativa auth (apenas exemplo).', { defaultValue: false })
  .argument('<target>', 'Alvo de build')
  .action((args, options, { ui }) => {
    const spinner = ui.spinner(`Compilando ${ui.colors.green(args.target)}...`).start();
    setTimeout(() => spinner.succeed('Build concluído.'), 200);
  })
  .parse(process.argv.slice(2));


