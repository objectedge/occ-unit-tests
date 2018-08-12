const fs = require('fs-extra');
const path = require('path');
const request = require('request');
const libsPath = path.join(__dirname, '..', 'libs');

const oracleRequireJSConfigs = require('../oracle-requirejs-configs');
const oracleRequireJSConfigsPaths = oracleRequireJSConfigs.paths;
const domain = 'https://admin:admin@ccstore-z1ma.oracleoutsourcing.com';

function ensureDirectoryExistence(filePath, isDir) {
  var dirname = isDir ? filePath : path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

const dynamicPaths = [
		'pageLayout.js', // equals to pageLayout folder
		'viewModels.js', // equals to viewModels folder
		'js.js' // equals to shared folder
];

const saveFile = (requestFile, destDir) => {
	if(dynamicPaths.includes(path.basename(requestFile))) {		
		ensureDirectoryExistence(destDir.replace('.js', ''), true);
		return;
	}

	request(requestFile, function (error, response, body) {
		if(error) {
			return console.log(requestFile);
		}

		if(/\<\!DOCTYPE html\>/.test(body)) {
			return;
		}

		console.log(`Downloading ${requestFile}... at ${destDir}`);
		ensureDirectoryExistence(destDir);
		
		fs.writeFile(destDir, body, { encoding: 'utf8' }, function(error) {
			if(error) {
				return console.log(error);
			}

			console.log(`File ${requestFile} saved successfully!`);
		});

		// console.log(`Trying to download the sourcemap of ${requestFile}...`);
		// saveFile(`${requestFile}.map`, `${destDir}.map`);
	});
};

fs.removeSync(libsPath);
fs.ensureDirSync(libsPath);

Object.keys(oracleRequireJSConfigsPaths).forEach(function (libPath) {
	const iterateThroughPaths = (libPath, isPath) => {
		libPath = !isPath ? oracleRequireJSConfigsPaths[libPath] : libPath;

		if(Array.isArray(libPath)) {
			libPath.forEach(requestFile => {
				iterateThroughPaths(requestFile, true);
			});
			return;
		}

		const requestFile = `${domain}${libPath}.js`;
		const destDir = path.join(libsPath, libPath + '.js');

		saveFile(requestFile, destDir);
	};

	iterateThroughPaths(libPath, false);
});