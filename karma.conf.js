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
      { pattern: 'src/widgets/**/*.template', included: false },
      { pattern: 'libs/occ/main.js', included: true },
      { pattern: 'test-main.js', included: true },
      { pattern: 'libs/occ/js/**/*.js', included: false },
      { pattern: 'libs/occ/shared/**/*.js', included: false },
      { pattern: 'libs/occ/store-libs.js', included: true },
      { pattern: 'libs/custom/**/*.js', included: false },
      { pattern: 'dist/**/*.@(js|map)', included: false },
      { pattern: 'test/**/*.js', included: false }
    ],
    exclude: excludeFiles,
    proxies: {
      '/': `${serverConfigs.api.domain}:${serverConfigs.api.port}`
    },
    customDebugFile: 'debug.html',
    urlRoot: serverConfigs.karma.urlRoot,
    reporters: ['mocha'],
    port: serverConfigs.karma.port,  // karma web server port
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['CustomChrome', 'CustomChromeHeadless'],
    customLaunchers: {
      CustomChromeHeadless: {
        base: 'ChromeHeadless',
        flags: ['--disable-translate', '--disable-extensions']
      },
      CustomChrome: {
        base: 'Chrome',
        flags: ['--disable-translate', '--auto-open-devtools-for-tabs', `http://localhost:${serverConfigs.karma.port}${serverConfigs.karma.urlRoot}/debug.html`]
      }
    },
    autoWatch: true,
    singleRun: false,
    concurrency: Infinity
  })
}