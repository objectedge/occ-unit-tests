const octokit = require('@octokit/rest')();
const request = require('request');
const unzip = require('unzip');
const util = require('util');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const oracleZipPath = path.join(os.tmpdir(), 'oraclejet.zip');
const unzippedPath = path.join(os.tmpdir(), 'oraclejet');
const libsOracleJetPath = path.join(__dirname, '..', 'libs', 'js', 'oraclejet', 'js', 'libs', 'oj', '%s'); 

function getReleaseIdByTagName(tagName) {
  console.log(`Fetching Oracle Jet Release ${tagName}...`);

  return new Promise((resolve, reject) => {
    const findRelease = (page = 1) => {
      return octokit.repos.getReleases({
        owner: 'oracle', 
        repo: 'oraclejet',
        page,
        per_page: 30
      }).then(result => {
        if(!result.data.length) {
          return reject('No release found');
        }

        const data = result.data;
        const release = result.data.filter(item => item.tag_name === tagName);

        if(!release.length) {
          return findRelease(page+1);
        }

        resolve(release[0]);
      }).catch(reject);
    };

    findRelease();
  });
}

function copyOracleJet(tagName, callback) {
  const destDir = util.format(libsOracleJetPath, `v${tagName}`);

  console.log(`Copying files to ${destDir} ...`);

  fs.readdir(unzippedPath, (error, files) => {
    const rootFolder = files[0];
    const oracleJetPath = path.join(unzippedPath, rootFolder, 'dist', 'js', 'libs', 'oj');
    
    fs.ensureDirSync(destDir);
    fs.copy(oracleJetPath, destDir)
      .then(() => {
        fs.remove(unzippedPath);
        fs.remove(oracleZipPath);
        callback(null);
      })
      .catch(callback);
  });
}

function extractZip(tagName, callback) {
  const extract = unzip.Extract({ path: unzippedPath });
  
  console.log(`Extracting Oracle Jet Zip file...`);

  extract.on('finish', copyOracleJet.bind(this, tagName, callback));
  extract.on('error', error => {
    console.log(error);
  });

  fs.createReadStream(oracleZipPath).pipe(extract);
}

module.exports = function(tagName, callback) {
  getReleaseIdByTagName(tagName)
  .then(release => {
    const downloadUrl = release.zipball_url;
    console.log(`Downloading release ${tagName}...`);

    request.get({
      headers: {
        'user-agent': 'octokit/rest.js v1.2.3'
      },
      url: downloadUrl
    }).on('response', (response) => {
      var fws = fs.createWriteStream(oracleZipPath);
      response.pipe(fws);
      response.on('end', extractZip.bind(this, tagName, callback));
    }).on('error', callback);
  })
  .catch(callback);
};
