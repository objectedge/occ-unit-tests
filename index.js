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

  // console.log(abc);
  program.version(require('./package.json').version);

  commands.forEach(Command => {
    Command.prototype.program = program;
    new Command();
  });

  program.parse(process.argv);
})();
