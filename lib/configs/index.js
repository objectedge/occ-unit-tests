const path = require('path');
const fs = require('fs-extra');
const devServerPath = path.join(process.env.HOME || process.env.HOMEPATH, 'occ-dev-server');
const configsPath = path.join(devServerPath, 'applications-configs.json');
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

async function applicationConfigsExist() {
  try {
    await fs.access(configsPath, fs.constants.F_OK);
    return Promise.resolve(true);
  } catch(error) {
    return Promise.reject(false);
  }
}

function getConfigsPath() {
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
      return await fs.writeJson(configsPath, configs, { spaces: 2 });
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
  getDevServerPath,
  create,
  get: getConfig,
  update: updateConfig,
  applicationConfigsExist
};
