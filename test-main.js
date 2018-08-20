var allTestFiles = []
var TEST_REGEXP = /(spec|test)\.js$/i
var customFiles = [];

// Get a list of all the test files to include
Object.keys(window.__karma__.files).forEach(function (file) {
  if (TEST_REGEXP.test(file)) {
    // Normalize paths to RequireJS module names.
    // If you require sub-dependencies of test files to be loaded as-is (requiring file extension)
    // then do not normalize the paths
    var normalizedTestModule = file.replace(/^\/base\/|\.js$/g, '')
    allTestFiles.push(normalizedTestModule)
  }

  if(/\/base\/libs\/custom/.test(file)) {
    customFiles.push(file);
  }
});

var requireJSConfigs = require.s.contexts._.config;

// Setting the right path
var stringifiedConfigs = JSON.stringify(requireJSConfigs);
stringifiedConfigs = stringifiedConfigs.replace(/"\/shared\//g, '"libs/occ/shared/')
                                       .replace(/"\/js\//g, '"libs/occ/js/');
requireJSConfigs = JSON.parse(stringifiedConfigs);

function replaceSetCustomFilesPaths() {
  var paths = requireJSConfigs.paths;
  var pathKey;
  var path;
  var fullPath;
  var fullPathToCustomFile;

  for(pathKey in paths) {
    path = paths[pathKey];
    fullPath = '/app/base/' + path + '.js';
    fullPathToCustomFile = fullPath.replace('occ', 'custom');

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

requireJSConfigs.baseUrl = '/app/base';
requireJSConfigs.deps = allTestFiles;
requireJSConfigs.callback = window.__karma__.start;

let defaultPage = __karma__.config.args.filter(item => item.includes('page'));
if(defaultPage.length) {
  defaultPage = defaultPage[0].replace('page=', '');
  window.defaultRoute = defaultPage;
}

window.waitForRenderComplete = function (ko, layoutContainer, masterViewModel) {
  window.__mainData = {
    layoutContainer: layoutContainer,
    masterViewModel: masterViewModel
  };
};

define('main-loader', ['jquery', '/app/base/dist/widget-core/index'], function ($, widgetCore) {
  return {
    load: function (type, id, classes) {
      return new Promise(function (resolve) {
        var mainDataInterval = setInterval(function () {
          if(__mainData) {
            var loader = new widgetCore.loaders.Widget();
            var widgetData = __mainData.layoutContainer.widgetCache.get(type, id).result;
            loader.load(widgetData, widgetData, classes);
            resolve(__mainData);
            clearInterval(mainDataInterval);
          }
        }, 300);
      });
    }
  };
});

// /**
//  * @fileoverview The require.js main file for the storefront
//  */
// /*jslint plusplus: true */
require.config(requireJSConfigs);
