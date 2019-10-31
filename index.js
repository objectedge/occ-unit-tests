#!/usr/bin/env node

const program = require('caporal');
const configsCore = require('./lib/configs');

(async () => {
  const commands = require('./commands');
  
  program.version(require('./package.json').version);
  commands.forEach(Command => {
    Command.prototype.program = program;
    new Command();
  });

  program.parse(process.argv);
})();
