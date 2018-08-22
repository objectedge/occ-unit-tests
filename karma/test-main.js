var allTestFiles = []
var TEST_REGEXP = /(spec|test)\.js$/i
var customFiles = [];
var mainConfigs = __karma__.config.args[0];
var customLibsDir = mainConfigs.application.customLibsDir;
var oracleLibsDir = mainConfigs.application.oracleLibsDir;
var absoloutePathToFiles = `${mainConfigs.server.karma.urlRoot}/absolute`;
var absoloutePathOracleLibs = `${absoloutePathToFiles}${oracleLibsDir}`;
var absoloutePathCustomLibs = `${absoloutePathToFiles}${customLibsDir}`;

// Get a list of all the test files to include
Object.keys(window.__karma__.files).forEach(function (file) {
  if (TEST_REGEXP.test(file)) {
    // Normalize paths to RequireJS module names.
    // If you require sub-dependencies of test files to be loaded as-is (requiring file extension)
    // then do not normalize the paths
    var normalizedTestModule = file.replace(/^\.js$/g, '')
    allTestFiles.push(normalizedTestModule)
  }

  if(new RegExp(customLibsDir).test(file)) {
    customFiles.push(file);
  }
});

var requireJSConfigs = require.s.contexts._.config;

// Setting the right path
var stringifiedConfigs = JSON.stringify(requireJSConfigs);

stringifiedConfigs = stringifiedConfigs.replace(/"\/shared\//g, `"${absoloutePathOracleLibs}/shared/`);
stringifiedConfigs = stringifiedConfigs.replace(/"\/js\//g, `"${absoloutePathOracleLibs}/js/`);
requireJSConfigs = JSON.parse(stringifiedConfigs);

function replaceSetCustomFilesPaths() {
  var paths = requireJSConfigs.paths;
  var pathKey;
  var path;
  var fullPathToCustomFile;

  for(pathKey in paths) {
    path = paths[pathKey];
    // Don't deal with arrays as dependency. e.g: facebook
    if(Array.isArray(path)) {
      continue;
    }

    fullPathToCustomFile = path.replace(absoloutePathOracleLibs, absoloutePathCustomLibs) + '.js';

    if(customFiles.includes(fullPathToCustomFile)) {
      paths[pathKey] = fullPathToCustomFile.replace('.js', '');
      customFiles.splice(customFiles.indexOf(fullPathToCustomFile), 1);
    }
  }

  // Remaining items, these are probably files from dynamic paths like /pageLayout/site.js
  // TODO:
  // Improve the custom dynamic js path and its checking
  if(customFiles.length) {
    customFiles.forEach(customPath => {
      paths[customPath.replace(/.*?(shared|js)?js\//, '').replace('.js', '')] = customPath.replace('.js', '');
    });
  }
}

if(customFiles.length) {
  replaceSetCustomFilesPaths();
}

requireJSConfigs.paths['mainApp'] = `${absoloutePathToFiles}${mainConfigs.webpackDataDir}`;
requireJSConfigs.paths['widgetCore'] = `${requireJSConfigs.paths['mainApp']}/widget-core/index`;
requireJSConfigs.paths['widgetsPath'] = `${requireJSConfigs.paths['mainApp']}/widgets/objectedge`;
requireJSConfigs.baseUrl = absoloutePathToFiles;
requireJSConfigs.deps = allTestFiles;
requireJSConfigs.callback = window.__karma__.start;

window.defaultRoute = mainConfigs.page;

window.waitForRenderComplete = function (ko, layoutContainer, masterViewModel) {
  const intervalId = setInterval(() => {
    if(Object.keys(layoutContainer.widgetCache.cache).length) {
      window.__mainData = {
        layoutContainer: layoutContainer,
        masterViewModel: masterViewModel
      };
      clearInterval(intervalId);
    }
  }, 300);
};

define('mainLoader', ['jquery', 'widgetCore'], function ($, widgetCore) {
  let viewModels = {};

  return {
    load: function (type, id, classes) {
      return new Promise(function (resolve) {
        var mainDataInterval = setInterval(function () {
          if(__mainData) {
            var loader = new widgetCore.loaders.Widget();
            var widgetData = __mainData.layoutContainer.widgetCache.get(type, id).result;
            viewModels = loader.load(widgetData, widgetData, classes);
            resolve(__mainData);
            clearInterval(mainDataInterval);
          }
        }, 500);
      });
    },
    getViewModel: function (viewModelName) {
      return viewModels[viewModelName];
    }
  };
});

// /**
//  * @fileoverview The require.js main file for the storefront
//  */
// /*jslint plusplus: true */
require.config(requireJSConfigs);
