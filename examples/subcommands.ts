import { cli } from '../src/index';

const app = cli({ name: 'installer', description: 'Um gestor de pacotes moderno.' });

const install = app.command('install', 'Instala um pacote.');
install
  .argument('<packageName>', 'O nome do pacote a instalar.')
  .action((args, _options, { ui }) => {
    const spinner = ui.spinner(`A instalar ${ui.chalk.green(args.packageName)}...`).start();
    setTimeout(() => {
      spinner.succeed(`Instalado: ${args.packageName}`);
      ui.box(`O pacote '${ui.chalk.green(args.packageName)}' está pronto.`, 'Sucesso');
    }, 300);
  });

const create = app.command('create', 'Cria um novo projeto.');
create
  .argument('<projectName>', 'O nome do novo projeto.')
  .action(async (args, _options, { ui }) => {
    const template = await ui.prompt.select(
      'Escolha um template:',
      [
        { title: 'React', value: 'react' },
        { title: 'Vue', value: 'vue' }
      ],
      {
        highlight: (t) => ui.chalk.cyan(t),
        indicatorColor: (t) => ui.chalk.cyan(t),
      }
    );
    console.log(`Criando projeto: ${args.projectName} (template: ${template})`);
  });

app.parse(process.argv.slice(2));


