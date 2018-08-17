const path = require('path');
const fs = require('fs-extra');
const glob = require('glob');

module.exports = function(config) {
  const serverConfigs = require('./server-configs');
  const customFilesPaths = path.join(__dirname, 'libs', 'custom');
  let excludeFiles = glob.sync(path.join(customFilesPaths, '**'))
                      .filter(filePath => fs.lstatSync(filePath).isFile())
                      .map(filePath => {
                        console.log(`Using custom library ${filePath}...`);
                        return filePath.replace('custom', 'occ');
                      });
  
  config.set({
    basePath: '',
    frameworks: ['mocha', 'requirejs', 'chai'],
    files: [
      { pattern: 'libs/occ/main.js', included: true },
      { pattern: 'test-main.js', included: true },
      { pattern: 'libs/occ/js/**/*.js', included: false },
      { pattern: 'libs/occ/shared/**/*.js', included: false },
      { pattern: 'libs/occ/store-libs.js', included: true },
      { pattern: 'libs/custom/**/*.js', included: false },
      { pattern: 'src/**/*.@(js|map)', included: false },
      { pattern: 'test/**/*.js', included: false }
    ],
    exclude: excludeFiles,
    proxies: {
      '/': `${serverConfigs.api.domain}:${serverConfigs.api.port}`
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