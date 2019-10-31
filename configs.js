const path = require('path');
const fs = require('fs-extra');
const configsCore = require('./lib/configs');

const applicationConfigs = fs.readJsonSync(configsCore.getConfigsPathSync());
const applicationBasePath = applicationConfigs.applicationBasePath;
const applicationPath = applicationConfigs.storefrontPath;
const oracleResourcesDir = applicationConfigs.oracleResourcesDir;
const librariesDir = applicationConfigs.librariesDir;
const apiDir = applicationConfigs.apiDir;
const oracleDirName = applicationConfigs.oracleDirName;
const customDirName = applicationConfigs.customDirName;

module.exports = {
  // Application definitions
  application: {
    applicationBasePath,
    basePath: applicationPath,
    oracleResourcesDir: oracleResourcesDir,
    occInstanceName: applicationConfigs.occInstanceName,
    occStoreUrl: applicationConfigs.occStoreUrl,
    occAdminUrl: applicationConfigs.occAdminUrl,
    HTTPAuth: applicationConfigs.HTTPAuth,
    HTTPAuthCredentials: applicationConfigs,

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
