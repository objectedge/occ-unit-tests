const prompt = require('prompt');
const configsCore = require('../lib/configs');

class Configs {
  constructor() {
    this.program
    .command('configs', 'Set Configs')
    .option('-i, --interactive', 'Run the interactive prompt')
    .action((args, options, logger) => {
      const withOptions = Object.values(options).some(optionValue => optionValue !== undefined);

      if(!args.length && !withOptions) {
        console.log(withOptions);
      }

      return this.actions();
    });
  }

  actions() {

  }
};

module.exports = Configs;
