const configsCore = require('../lib/configs');
const inquirer = require("inquirer");

class Configs {
  constructor() {
    this.arguments = [
      {
        argument: "create",
        message: "Create new configuration from scratch",
        processor: this.create
      },
      {
        argument: "get-all",
        message: "Get all configs",
        processor: this.getAllConfigs
      },
      {
        argument: "get",
        message: "Get a config value by its key",
        processor: this.getConfig
      },
      {
        argument: "get-path",
        message: "Get the configs file path",
        processor: this.getConfigsPath
      },
      {
        argument: "update",
        message: "Update Configs",
        processor: this.updateConfigs
      }
    ];

    this.command = this.program.command('configs', 'Set Configs');
    this.arguments.forEach(argument => this.command.argument(`[${argument.argument}]`, argument.message));
    this.command.action(this.actions.bind(this));
  }

  create() {
    return new Promise((resolve, reject) => {
      const configurationSuccess = () => {
        configsCore.getConfigsPath().then(configsPath => {
          console.log(`Configuration created with success at: ${configsPath}`);
          resolve();
        });
      };

      inquirer
      .prompt([
        {
          type: 'input',
          name: 'applicationBasePath',
          message: "Application Base Path"
        },
        {
          type: 'input',
          name: 'occInstanceName',
          message: "OCC Instance Name(eg: uat-zd8a)"
        },
        {
          type: 'confirm',
          name: 'HTTPAuth',
          message: "The OCC Instance Store requires HTTP Auth",
          default: false
        }
      ])
      .then(answers => {
        if(answers.HTTPAuth) {
          return inquirer
                .prompt([
                  {
                    type: 'input',
                    name: 'user',
                    message: "User"
                  },
                  {
                    type: 'input',
                    name: 'password',
                    message: "password"
                  }
                ])
                .then(HTTPAuthAnswers => {
                  answers.HTTPAuthCredentials = HTTPAuthAnswers
                  return configsCore.create(answers);
                })
        }

        return configsCore.create(answers);
      })
      .then(configurationSuccess)
      .catch(reject);
    });
  }

  getAllConfigs() {
    return configsCore.getAllConfigs().then(configs => {
      console.log(configs);
    });
  }

  getConfig(options) {
    return new Promise((resolve, reject) => {
      inquirer
      .prompt([
        {
          type: 'input',
          name: 'key',
          message: "Config Key"
        }
      ])
      .then(answers => {
        return configsCore.getConfig(answers.key);
      })
      .then(configValue => {
        console.log(configValue);
        resolve();
      })
      .catch(reject);
    });
  }

  getConfigsPath(options) {
    return configsCore.getConfigsPath().then(configsPath => {
      console.log(configsPath);
    });
  }

  updateConfigs(options) {
    return new Promise((resolve, reject) => {
      inquirer
      .prompt([
        {
          type: 'input',
          name: 'configName',
          message: "Config Name"
        },
        {
          type: 'input',
          name: 'configValue',
          message: "Config Value"
        }
      ])
      .then(answers => {
        return configsCore.updateConfig(answers.configName, answers.configValue);
      })
      .then(configValue => {
        console.log(`The configuration has been updated with success!`)
        console.log(configValue);
        resolve();
      })
      .catch(reject);
    });
  }

  interactiveCommand() {
    return new Promise((resolve, reject) => {
      inquirer
      .prompt([
        {
          type: 'list',
          name: 'option',
          choices: this.arguments.map(argumentsOptions => { 
            return { name: argumentsOptions.message, value: argumentsOptions.argument };
          })
        }
      ])
      .then(answers => this.arguments.find(argumentsOptions => argumentsOptions.argument === answers.option).processor())
      .then(resolve)
      .catch(reject);
    });
  }

  actions(args, options, logger) {
    const withOptions = Object.values(options).some(optionValue => optionValue !== undefined);
    if(!Object.keys(args).length && !withOptions) {
      return this.interactiveCommand();
    }

    // TODO:
    // Not Interactive
  }
};

module.exports = Configs;
