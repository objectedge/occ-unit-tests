const path = require('path');
const fs = require('fs-extra');
const configsCore = require('./lib/configs');

const applicationConfigs = fs.readJsonSync(configsCore.getConfigsPath());
const applicationPath = applicationConfigs.applicationPath;
const oracleResourcesDir = applicationConfigs.oracleResourcesDir;
const librariesDir = applicationConfigs.librariesDir;
const apiDir = applicationConfigs.apiDir;
const oracleDirName = applicationConfigs.oracleDirName;
const customDirName = applicationConfigs.customDirName;

module.exports = {
  // Application definitions
  application: {
    basePath: applicationPath,
    oracleResourcesDir: oracleResourcesDir,

    apiDir: apiDir,
    oracleApiDirName: oracleDirName,
    customApiDirName: customDirName,
    oracleApiDir: path.join(apiDir, oracleDirName),
    customApiDir: path.join(apiDir, customDirName),

    libsDir: librariesDir,
    oracleLibsDirName: oracleDirName,
    customLibsDirName: customDirName,
    oracleLibsDir: path.join(librariesDir, oracleDirName),
    customLibsDir: path.join(librariesDir, customDirName),

    mocksPath: applicationConfigs.mocksPath
  },

  // Server Definitions
  devServerTempDataPath: applicationConfigs.devServerTempDataPath,
  chromeDataDir: path.join(applicationConfigs.devServerTempDataPath, 'chrome'),
  webpackDataDir: path.join(applicationConfigs.devServerTempDataPath, 'webpack'),
  server: {
    api: {
      port: 3000,
      domain: 'http://localhost'
    },
    karma: {
      port: 9876,
      urlRoot: '/app'
    }
  },

  page: 'oe-hero-banner',
  // Directories relative to the applicationPath
  src: [
    'widgets/objectedge/oeHeroBanner'
  ],
  tests: [
    'tests/unit/widgets/oeHeroBanner'
  ]
};
