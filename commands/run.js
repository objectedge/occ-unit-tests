const bundle = require('../webpack/runner');
const api = require('../api');
const karma = require('../karma/runner');

class Run {
  constructor() {
    this.program
    .command('run', 'Will start the development server')
    .action((args, options, logger) => {
      return this.actions();
    });
  }

  actions() {
    return Promise.all([
      api(),
      bundle(true),
      karma(['CustomChromeHeadless'])
    ]);
  }
};

module.exports = Run;
