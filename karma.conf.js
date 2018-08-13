module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['mocha', 'requirejs', 'chai'],
    files: [
      { pattern: 'oracle-requirejs-configs.js', included: true },
      { pattern: 'test-main.js', included: true },
      { pattern: 'libs/loaders/main.@(js|js.map)', included: false },
      { pattern: 'libs/js/**/*.@(js|map)', included: false },
      { pattern: 'libs/shared/**/*.@(js|map)', included: false },
      { pattern: 'src/**/*.@(js|map)', included: false },
      { pattern: 'test/**/*.js', included: false }
    ],
    exclude: [
    ],
    proxies: {
      '/' : 'http://localhost:3000'
    },
    reporters: ['progress'],
    port: 9876,  // karma web server port
    colors: true,
    logLevel: config.LOG_DEBUG,
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