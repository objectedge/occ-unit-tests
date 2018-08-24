const bundle = require('../webpack/runner');
const api = require('../api');
const karma = require('../karma/runner');

class Run {
  constructor() {
    this.vorpal
        .command('run', 'Will run the dev-server')
        .action((args, callback) => {
          Promise.all([
            api(),
            bundle(true),
            karma(['CustomChromeHeadless'])
          ]).then(callback);
        });
  }
};

module.exports = Run;
