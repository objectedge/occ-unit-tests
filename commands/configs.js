const configsCore = require('../lib/configs');
const inquirer = require("inquirer");

class Configs {
  constructor() {
    this.arguments = [
      ['[create]', 'Creates a new config'],
      ['[get]', 'Get a config value by its key'],
      ['[update]', 'Update a config by key']
    ];

    this.command = this.program.command('configs', 'Set Configs')

    this.arguments.forEach(argument => {
      this.command.argument(argument[0], argument[1], argument[2]);
    });

    this.command.action((args, options, logger) => {
      return this.actions(args, options, logger);
    });
  }

  run(action) {
    const command = `${action}Command`;

    if(this[command]) {
      return this[command]();
    }
  }

  createCommand() {
    console.log(1);
    return Promise.resolve('test');
  }

  getCommand() {
    console.log('get');
  }

  updateCommand() {
    console.log('update');
  }

  interactiveCommand() {
    return new Promise((resolve, reject) => {
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
        return this.run(answers.command);
      })
      .then(resolve)
      .catch(reject);
    });
  }

  actions(args, options, logger) {
    const withOptions = Object.values(options).some(optionValue => optionValue !== undefined);

    if(!Object.keys(args).length && !withOptions) {
      return this.interactiveCommand();
    }

    console.log(args);
  }
};

module.exports = Configs;
