#!/usr/bin/env node

const program = require('caporal');
const configsCore = require('./lib/configs');

(async () => {
  const commands = require('./commands');

  // try {
  //   await configsCore.applicationConfigsExist()
  // } catch(error) {
  //   console.log('error');
  // }

  // program.version(require('./package.json').version);

  // commands.forEach(Command => {
  //   Command.prototype.program = program;
  //   new Command();
  // });

  // program.parse(process.argv);

  program
  .version('1.0.0')
  // you specify arguments using .argument()
  // 'app' is required, 'env' is optional
  .command('deploy', 'Deploy an application')
  .argument('<app>', 'App to deploy', /^myapp|their-app$/)
  .argument('[env]', 'Environment to deploy on', /^dev|staging|production$/, 'local')
  // you specify options using .option()
  // if --tail is passed, its value is required
  .option('--tail <lines>', 'Tail <lines> lines of logs after deploy', program.INT)
  .action(function(args, options, logger) {
    console.log(args)
  });

  program.parse(process.argv);
})();
