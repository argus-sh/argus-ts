import { cli } from '../src/index';

const app = cli({ name: 'installer', description: 'Um gestor de pacotes moderno.' });

const install = app.command('install', 'Instala um pacote.');
install
  .argument('<packageName>', 'O nome do pacote a instalar.')
  .action((args) => {
    console.log(`Instalando pacote: ${args.packageName}`);
  });

const create = app.command('create', 'Cria um novo projeto.');
create
  .argument('<projectName>', 'O nome do novo projeto.')
  .action((args) => {
    console.log(`Criando projeto: ${args.projectName}`);
  });

app.parse(process.argv.slice(2));


