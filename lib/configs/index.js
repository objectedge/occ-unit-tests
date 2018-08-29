const path = require('path');
const fs = require('fs-extra');
const devServerPath = path.join(process.env.HOME || process.env.HOMEPATH, 'occ-dev-server');
const configsPath = path.join(devServerPath, 'application-configs.json');
const applicationConfigsSamplePath = path.join(__dirname, '..', 'templates', 'application-configs.json');

function ensureDevServerPath() {
  return new Promise((resolve, reject) => {
    fs.ensureDir(devServerPath, error => {
      if(error) {
        return reject(error);
      }
      resolve();
    });
  });
}

async function create(options = {}) {
  try {
    await ensureDevServerPath();
  } catch(error) {
    return Promise.reject(error);
  }

  let applicationConfigs = await fs.readJson(applicationConfigsSamplePath);

  if(!options.applicationPath) {
    return Promise.reject('Please provide the "applicationPath"');
  }

  for(const optionKey in options) {
    if(applicationConfigs.hasOwnProperty(optionKey)) {
      applicationConfigs[optionKey] = options[optionKey];
    }
  }

  applicationConfigs.devServerTempDataPath = applicationConfigs.devServerTempDataPath.replace(/\{\{devServerTempDataPath\}\}/g, devServerPath);

  for(const applicationConfigsKey in applicationConfigs) {
    const value = applicationConfigs[applicationConfigsKey];
    applicationConfigs[applicationConfigsKey] = value
                                                .replace(new RegExp(`\{\{applicationPath\}\}`, 'g'), applicationConfigs.applicationPath)
                                                .replace(new RegExp(`\{\{oracleResourcesDir\}\}`, 'g'), applicationConfigs.oracleResourcesDir);
  }

  try {
    await fs.writeJson(configsPath, applicationConfigs, { spaces: 2 });
  } catch(error) {
    return Promise.reject(error);
  }

  return Promise.resolve('done');
}

function getConfig() {

}

function updateConfig() {

}

module.exports = {
  configsPath,
  create,
  get: getConfig,
  update: updateConfig
};
