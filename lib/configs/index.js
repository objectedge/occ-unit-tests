const path = require('path');
const fs = require('fs-extra');
const devServerPath = path.join(process.env.HOME || process.env.HOMEPATH, 'occ-dev-server');
const configsPath = path.join(devServerPath, 'applications-configs.json');
const applicationConfigsSamplePath = path.join(__dirname, 'application-configs.json');

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

  if(!options.applicationBasePath) {
    return Promise.reject('Please provide the "applicationBasePath"');
  }

  for(const optionKey in options) {
    if(applicationConfigs.hasOwnProperty(optionKey)) {
      applicationConfigs[optionKey] = options[optionKey];
    }
  }

  applicationConfigs.devServerTempDataPath = applicationConfigs.devServerTempDataPath.replace(/\{\{devServerTempDataPath\}\}/g, devServerPath);

  for(const applicationConfigsKey in applicationConfigs) {
    const value = applicationConfigs[applicationConfigsKey];
    
    if(typeof value !== 'string') {
      continue;
    }

    applicationConfigs[applicationConfigsKey] = value
                                                .replace(new RegExp(`\{\{applicationBasePath\}\}`, 'g'), applicationConfigs.applicationBasePath)
                                                .replace(new RegExp(`\{\{storefrontPath\}\}`, 'g'), applicationConfigs.storefrontPath)
                                                .replace(new RegExp(`\{\{oracleResourcesDir\}\}`, 'g'), applicationConfigs.oracleResourcesDir)
                                                .replace(new RegExp(`\{\{occInstanceName\}\}`, 'g'), applicationConfigs.occInstanceName)
                                                .replace(new RegExp('/', 'g'), path.sep);
  }

  try {
    await fs.writeJson(configsPath, applicationConfigs, { spaces: 2 });
  } catch(error) {
    return Promise.reject(error);
  }

  return Promise.resolve('done');
}

async function getConfig(name) {
  try {
    const configs = await fs.readJson(configsPath);
    if(!configs[name]) {
      return Promise.reject(`The property ${name} doesn't exist.`);
    }
    return Promise.resolve(configs[name]);
  } catch(error) {
    return Promise.reject(error);
  }
}

async function getAllConfigs() {
  try {
    const configs = await fs.readJson(configsPath);
    return Promise.resolve(configs);
  } catch(error) {
    return Promise.reject(error);
  }
}

async function applicationConfigsExist() {
  try {
    await fs.access(configsPath, fs.constants.F_OK);
    return Promise.resolve(true);
  } catch(error) {
    return Promise.reject(false);
  }
}

function getConfigsPath() {
  return Promise.resolve(configsPath);
}

function getConfigsPathSync() {
  return configsPath;
}

async function updateConfig(name, value) {
  try {
    const configs = await fs.readJson(configsPath);
    if(!configs[name]) {
      return Promise.reject(`The property ${name} doesn't exist.`);
    }
    configs[name] = value;

    try {
      await fs.writeJson(configsPath, configs, { spaces: 2 });
      return Promise.resolve(configs);
    } catch(error) {
      return Promise.reject(error);
    }
  } catch(error) {
    return Promise.reject(error);
  }
}

function getDevServerPath() {
  return devServerPath;
}

module.exports = {
  getConfigsPath,
  getConfigsPathSync,
  getDevServerPath,
  create,
  getConfig,
  getAllConfigs,
  updateConfig,
  applicationConfigsExist
};
