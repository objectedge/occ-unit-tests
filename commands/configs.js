const configsCore = require('../lib/configs');
const inquirer = require("inquirer");

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

  interactiveCommand() {
    const mainArguments = this.arguments.map(argument => {
      return argument[0].replace(/[\[\]\{\}]/g, '');
    });

    inquirer
    .prompt([
      {
        type: 'list',
        name: 'command',
        message: 'What do you want to do?',
        choices: mainArguments
      }
    ])
    .then(answers => {
      console.log(answers)
    });
  }

  actions(args, options, logger) {
    const withOptions = Object.values(options).some(optionValue => optionValue !== undefined);

    if(!args.length && !withOptions) {
      this.interactiveCommand();
    }
  }
};

module.exports = Configs;
