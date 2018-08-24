const karma = require('karma');
const Server = karma.Server;
const runner = karma.runner;
const cfg = karma.config;
const path = require('path');

module.exports = function (browsers) {
  return new Promise(resolve => {
    const karmaConfig = cfg.parseConfig(path.join(__dirname, './karma.conf.js'), { browsers: browsers } );
    const server = new Server(karmaConfig, (code) => {
      console.log('Karma Server finished');
      resolve();
      process.exit(0);
    });

    server.on('browsers_ready', () => {
      runner.run(karmaConfig, () => {});
    });

    server.start();
  });
};
