const fs = require('fs-extra');
const path = require('path');
const request = require('request');
const sourceMap = require('source-map');

const libsPath = path.join(__dirname, '..', 'libs');
const sharedLibsPath = path.join(libsPath, 'shared');

const url = 'https://ccstore-z1ma.oracleoutsourcing.com';
const httpAuthCredentials = {
  username: 'admin',
  password:  'admin'
};
const httpAuth = "Basic " + new Buffer(httpAuthCredentials.username + ":" + httpAuthCredentials.password).toString("base64");

fs.removeSync(sharedLibsPath);
fs.ensureDirSync(sharedLibsPath);

const makeRequest = (url, callback) => {
  const requestConfigs = {
    url : url,
    headers : {
      "Authorization" : httpAuth
    }
  };
  
  request(requestConfigs, callback);
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
      extractFilesFromSourceMap(sourceMapContent);
    } catch(error) {
      console.log(error);
    }
  });
});

function saveFile(fileContent, destDir) {
  fs.writeFile(destDir, fileContent, { encoding: 'utf8' }, function(error) {
    if(error) {
      return console.log(error);
    }

    console.log(`File ${destDir} saved successfully!`);
  });
}

function extractFilesFromSourceMap(sourceMapContent) {
  sourceMap.SourceMapConsumer.with(sourceMapContent, null, consumer => {
    const sources = consumer.sources;
    sources.forEach(sourcePath => {
      const destDir = path.join(libsPath, sourcePath.replace('../', ''));
      const fileName = path.basename(sourcePath);
      const baseDirName = path.dirname(destDir);
      
      if(fileName !== 'main.js' && baseDirName.indexOf('shared') < 0) {
        return;
      }
      
      if(fileName !== 'main.js') {
        fs.ensureDirSync(baseDirName);
      } 

      saveFile(consumer.sourceContentFor(sourcePath), destDir);
    });
  });
};