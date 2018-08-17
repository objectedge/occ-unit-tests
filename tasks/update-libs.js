const fs = require('fs-extra');
const path = require('path');
const request = require('request');
const sourceMap = require('source-map');
const updateOracleJet = require('./update-oracle-jet');

let oracleJetVersionDefault = '2.0.2'; //Defaults to 2.0.2, we will double check this inside the extractMainFilesFromSourceMap function
let oracleJetVersion = null;

const libsPath = path.join(__dirname, '..', 'libs', 'occ');
const url = 'https://ccstore-z1ma.oracleoutsourcing.com';
const httpAuthCredentials = {
  username: 'admin',
  password:  'admin'
};
const httpAuth = "Basic " + new Buffer(httpAuthCredentials.username + ":" + httpAuthCredentials.password).toString("base64");
const allDependencies = [];

fs.removeSync(libsPath);
fs.ensureDirSync(libsPath);

const makeRequest = (url, callback) => {
  const requestConfigs = {
    url : url,
    headers : {
      "Authorization" : httpAuth
    }
  };
  
  return new Promise((resolve, reject) => {
    request(requestConfigs, (error, response, body) => {
      if(error) {
        callback(error, response, body);
        return reject(reject);
      }

      resolve({ response: response, body: body });
      callback(error, response, body);
    });
  });
};

console.log('Requesting the main page to get the main.js.map file...');

makeRequest(url, (error, response, body) => {
  if(error) {
    return console.log(error);
  }
  let regexPattern = new RegExp(`${url}.*main\.js`, 'g');
  let mainJSFilePath = body.match(regexPattern);

  if(!mainJSFilePath) {
    console.log(`Error on trying to find the main.js file in the main html using the following Regex: ${regexPattern}`);
    return;
  }

  const mainJSFileMapPath = `${mainJSFilePath[0]}.map`;

  console.log('Requesting the main.js.map file...');
  makeRequest(mainJSFileMapPath, (error, response, body) => {
    try {
      const sourceMapContent = JSON.parse(body);
      extractMainFilesFromSourceMap(sourceMapContent);
    } catch(error) {
      console.log(error);
    }
  });
});

function saveFile(fileContent, destDir) {
  return new Promise((resolve, reject) => {
    fs.writeFile(destDir, fileContent, { encoding: 'utf8' }, function(error) {
      if(error) {
        reject(error);
        return console.log(error);
      }

      console.log(`File ${destDir} saved successfully!`);
      allDependencies.push(destDir);
      resolve(destDir);
    });
  });
}

function grabMissingDependencies() {
  const missingDependenciesPromises = [];

  console.log('');
  console.log('Grabbing missing dependencies from the RequireJS configs...');

  let mainJSFile;
  try {
    mainJSFile = fs.readFileSync(path.join(libsPath, 'main.js'), 'utf8');
  } catch(error) {
    console.log(`Error on trying the read the main.js file, please, run the command "yarn update-shared-libs" in order to get the ${path.join(libsPath, 'main.js')}`);
    process.exit(0);
  }

  const requireJSConfigRegex = /(?:require\.config\()(\{[\s\S]+?\})\);/g;
  const requireJSConfigsString = mainJSFile.split(requireJSConfigRegex)[1];
  const requireJSConfigs = eval(`module.exports = ${requireJSConfigsString}`);
  const requireJSPaths = requireJSConfigs.paths;
  
  if(!Object.keys(requireJSPaths).length) {
    console.log(`No Oracle Paths found in ${path.join(libsPath, 'main.js')}`);
    return;
  }

  const missingDependencies = Object.values(requireJSPaths).filter(function iterateOverPaths(requirePath) {
    if(Array.isArray(requirePath)) {
      return requirePath.every(iterateOverPaths);
    }

    return allDependencies.every(item => path.basename(requirePath) !== path.basename(item, '.js'));
  });

  const filesRequestsPromises = [];

  missingDependencies.forEach(function iterateOverPaths(missingDependencyPath) {
    if(Array.isArray(missingDependencyPath)) {
      return missingDependencyPath.forEach(iterateOverPaths);
    }

    // Don't save the facebook SDK
    if(/connect\.facebook\.net/.test(missingDependencyPath)) {
      return;
    }

    const missingFileURL = `${url}${missingDependencyPath}.js`;
    filesRequestsPromises.push(
      makeRequest(missingFileURL, (error, response, body) => {
        if(error) {
          return console.log(error);
        }

        // File Doesn't exist
        if(/\<\!DOCTYPE html\>/.test(body)) {
          console.log(`The file ${missingFileURL} doesn't exist.`);
          return;
        }

        const destDir = path.join(libsPath, `${missingDependencyPath}.js`);
        
        try {
          fs.ensureDirSync(path.dirname(destDir));
        } catch(error) {
          console.log(error);
        }

        missingDependenciesPromises.push(saveFile(body, destDir));
      })
    );
  });
  
  Promise.all(filesRequestsPromises).then(() => {
    Promise.all(missingDependenciesPromises).then(() => {
      updateOracleJet(oracleJetVersion || oracleJetVersionDefault, function (error) {
        if(error) {
          return console.log(error);
        }

        console.log('Update done!');
      });
    });
  });
}

function getStoreLibs() {
  makeRequest(url, (error, response, body) => {
    if(error) {
      return console.log(error);
    }
    let regexPattern = new RegExp(`${url}.*store-libs\.js`, 'g');
    let mainJSFilePath = body.match(regexPattern);

    if(!mainJSFilePath) {
      console.log(`Error on trying to find the store-libs.js file in the main html using the following Regex: ${regexPattern}`);
      return;
    }

    const mainJSFileMapPath = `${mainJSFilePath[0]}.map`;

    console.log('Requesting the store-libs.js.map file...');
    makeRequest(mainJSFileMapPath, (error, response, body) => {
      try {
        const sourceMapContent = JSON.parse(body);
        extractStoreFilesFromSourceMap(sourceMapContent);
      } catch(error) {
        console.log(error);
      }
    });
  });
}

function extractStoreFilesFromSourceMap(sourceMapContent) {
  const saveFilePromises = [];

  sourceMap.SourceMapConsumer.with(sourceMapContent, null, consumer => {
    const sources = consumer.sources;
    sources.forEach(sourcePath => {
      let basePath = path.join(libsPath, 'shared', 'js');
      
      if(sourcePath.includes('oraclejet')) {
        basePath = path.join(libsPath);
      }

      let destDir = path.join(basePath, sourcePath.replace(/\.\.\//g, ''));

      const baseDirName = path.dirname(destDir);
      fs.ensureDirSync(baseDirName);
      saveFilePromises.push(saveFile(consumer.sourceContentFor(sourcePath), destDir));
    });
  }).then(() => {
    Promise.all(saveFilePromises).then(grabMissingDependencies);
  });
}

function extractMainFilesFromSourceMap(sourceMapContent) {
  const saveFilePromises = [];

  sourceMap.SourceMapConsumer.with(sourceMapContent, null, consumer => {
    const sources = consumer.sources;
    sources.forEach(sourcePath => {
      const fileName = path.basename(sourcePath);
      let normalizedSourcePath = sourcePath.replace(/\.\.\//g, '');

      let destDir = path.join(libsPath, normalizedSourcePath);
      
      if(fileName !== 'main.js' && !sourcePath.includes('shared')) {
        if(sourcePath.includes('oraclejet')) {
          destDir = path.join(libsPath, 'js', normalizedSourcePath);

          // Setting Oracle Jet Version
          if(!oracleJetVersion && sourcePath.includes('libs/oj/')) {
            oracleJetVersion = sourcePath.match(/v(.+?)\//)[1];
          }
        }
      }
      
      const baseDirName = path.dirname(destDir);

      if(fileName !== 'main.js') {
        try {
          fs.ensureDirSync(baseDirName);
        } catch(error) {
          console.log(error);
        }
      } 

      saveFilePromises.push(saveFile(consumer.sourceContentFor(sourcePath), destDir));
    });
  }).then(() => {
    Promise.all(saveFilePromises).then(getStoreLibs);
  });
};
