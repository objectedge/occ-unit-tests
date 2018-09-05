const prompt = require('prompt');
const configsCore = require('../lib/configs');

class Configs {
  constructor() {
    this.arguments = [
      ['[create]', 'Creates a new config'],
      ['[get]', 'Get a config value by its key'],
      ['[update]', 'Update a config by key'],
    ];

    this.command = this.program.command('configs', 'Set Configs')

    this.arguments.forEach(argument => {
      this.command.argument(argument[0], argument[1], argument[2]);
    });

    this.command.action((args, options, logger) => {
      return this.actions(args, options, logger);
    });
  }

  actions(args, options, logger) {
    const withOptions = Object.values(options).some(optionValue => optionValue !== undefined);

    if(!args.length && !withOptions) {
      console.log(withOptions);
    }
  }
};

module.exports = Configs;
