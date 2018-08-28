const path = require('path');
const fs = require('fs-extra');
const configsPath = path.join(process.env.HOME || process.env.HOMEPATH, 'occ-dev-server', 'configs.json');
const configsSample = path.join(__dirname, '..', 'templates', 'config.json');
const baseConfigs = path.join(__dirname, 'configs.js');

function ensureConfigs() {
  return new Promise((resolve, reject) => {
    fs.ensureDir(configsPath, error => {
      if(error) {
        return reject(error);
      }
      resolve();
    });
  });
}

async function create(options) {
  try {
    await ensureConfigs();
  } catch(error) {
    return Promise.reject(error);
  }


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
