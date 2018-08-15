module.exports = function(config) {
  const serverConfigs = require('./server-configs');

  config.set({
    basePath: '',
    frameworks: ['mocha', 'requirejs', 'chai'],
    files: [
      { pattern: 'libs/main.js', included: true },
      { pattern: 'test-main.js', included: true },
      { pattern: 'libs/js/**/*.js', included: false },
      { pattern: 'libs/shared/**/*.js', included: false },
      { pattern: 'libs/store-libs.js', included: true },
      { pattern: 'src/**/*.@(js|map)', included: false },
      { pattern: 'test/**/*.js', included: false }
    ],
    exclude: [
    ],
    proxies: {
      '/' : `${serverConfigs.api.domain}:${serverConfigs.api.port}`
    },
    urlRoot: serverConfigs.karma.urlRoot,
    reporters: ['progress'],
    port: serverConfigs.karma.port,  // karma web server port
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['Chrome', 'CustomChromeHeadless'],
    customLaunchers: {
      CustomChromeHeadless: {
        base: 'ChromeHeadless',
        flags: ['--disable-translate', '--disable-extensions']
      }
    },
    autoWatch: true,
    singleRun: false,
    concurrency: Infinity
  })
}