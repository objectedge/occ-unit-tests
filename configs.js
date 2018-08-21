const path = require('path');

const applicationPath = '/Users/douglashipolito/Sites/occ/occ-trainning/storefront';
const devServerTempDataPath = path.join(process.env.HOME || process.env.HOMEPATH, 'occ-dev-server');
const oracleResourcesDir = path.join(applicationPath, 'oracle-resources');
const librariesDir = path.join(oracleResourcesDir, 'libraries');
const apiDir = path.join(oracleResourcesDir, 'api');

const oracleDirName = 'default';
const customDirName = 'custom';

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
    customLibsDir: path.join(librariesDir, customDirName)
  },

  // Server Definitions
  devServerTempDataPath: devServerTempDataPath,
  chromeDataDir: path.join(devServerTempDataPath, 'chrome'),
  webpackDataDir: path.join(devServerTempDataPath, 'webpack'),
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

  page: 'douglas-tests',
  // Directories relative to the applicationPath
  src: [
    'widgets/objectedge/oeDouglasUnitTests'
  ],
  tests: [
    'tests/unit/widgets/oeDouglasUnitTests'
  ],
};
