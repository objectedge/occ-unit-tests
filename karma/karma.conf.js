const path = require('path');
const fs = require('fs-extra');
const glob = require('glob');
const configs = require('../configs');
const rootPath = path.join(__dirname, '..');

module.exports = function(config) {
  const chromeProfilePath = configs.chromeDataDir;
  const applicationBasePath = configs.application.basePath;
  const destDir = configs.webpackDataDir;
  const occLibsPath = configs.application.oracleLibsDir;
  const customLibsPath = configs.application.customLibsDir;

  fs.ensureDirSync(chromeProfilePath);

  let excludeFiles = glob.sync(path.join(customLibsPath, '**'))
                      .filter(filePath => fs.lstatSync(filePath).isFile())
                      .map(filePath => {
                        console.log(`Using custom library ${filePath}...`);
                        return filePath.replace('custom', 'occ');
                      });

  const files = [
    { pattern: path.join(destDir, 'widget-core', '*.js'), included: false },
    { pattern: path.join(rootPath, 'static', '**', '*.css'), included: true },
    { pattern: path.join(occLibsPath, 'main.js'), included: true },
    { pattern: path.join(rootPath, 'karma', 'test-main.js'), included: true },
    { pattern: path.join(occLibsPath, 'js', '**', '*.js'), included: false },
    { pattern: path.join(occLibsPath, 'shared', '**', '*.js'), included: false },
    { pattern: path.join(customLibsPath, '**', '*.js'), included: false }
  ];

  // Including the source
  for(contentRelativePath of configs.src) {
    if(/widget/.test(contentRelativePath)) {
      // Including the template files
      files.push({
        pattern: path.join(applicationBasePath, contentRelativePath, '**', '*.@(template|txt)'),
        included: false
      });

      // Including css
      files.push({
        pattern: path.join(destDir, contentRelativePath, '**', '*.css'),
        included: true
      });
    }

    // Including JS Source
    files.push({
      pattern: path.join(destDir, contentRelativePath, '**', '*.js'),
      included: false
    });

    files.push({
      pattern: path.join(destDir, contentRelativePath, '**', '*.map'),
      included: false,
      served: true
    });
  }

  for(contentRelativePath of configs.tests) {
    // Including Source and tests
    files.push({
      pattern: path.join(applicationBasePath, contentRelativePath, '**', '*.js'),
      included: false
    });
  }

  config.set({
    basePath: '',
    frameworks: ['mocha', 'requirejs', 'chai'],
    files: files,
    exclude: excludeFiles,
    proxies: {
      '/': `${configs.server.api.domain}:${configs.server.api.port}`
    },
    customDebugFile: path.join(__dirname, 'templates/debug.html'),
    urlRoot: configs.server.karma.urlRoot,
    reporters: ['mocha'],
    port: configs.server.karma.port,  // karma web server port
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['CustomChrome', 'CustomChromeHeadless'],
    customLaunchers: {
      CustomChromeHeadless: {
        base: 'ChromeHeadless',
        flags: [
          '--disable-translate',
          '--ignore-certificate-errors',
          '--allow-insecure-localhost',
          '--disable-blink-features=BlockCredentialedSubresources',
          '--test-type'
        ]
      },
      CustomChrome: {
        base: 'Chrome',
        flags: [
          '--disable-translate',
          '--ignore-certificate-errors',
          '--allow-insecure-localhost',
          '--disable-blink-features=BlockCredentialedSubresources',
          '--test-type',
          '--auto-open-devtools-for-tabs'
        ],
        chromeDataDir: chromeProfilePath
      }
    },
    autoWatch: true,
    singleRun: false,
    concurrency: Infinity,
    client: {
      args: [
        configs
      ]
    }
  })
}
