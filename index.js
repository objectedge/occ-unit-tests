#!/usr/bin/env node

const program = require('caporal');
const commands = require('./commands');
const configs = require('./lib/configs');

(async () => {
  const abc = await configs.create();
  console.log(abc);
})();

// program.version(require('./package.json').version);

// commands.forEach(Command => {
//   Command.prototype.program = program;
//   new Command();
// });

// program.parse(process.argv);
