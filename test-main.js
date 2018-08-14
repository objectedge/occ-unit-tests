var allTestFiles = []
var TEST_REGEXP = /(spec|test)\.js$/i

// Get a list of all the test files to include
Object.keys(window.__karma__.files).forEach(function (file) {
  if (TEST_REGEXP.test(file)) {
    // Normalize paths to RequireJS module names.
    // If you require sub-dependencies of test files to be loaded as-is (requiring file extension)
    // then do not normalize the paths
    var normalizedTestModule = file.replace(/^\/base\/|\.js$/g, '')
    allTestFiles.push(normalizedTestModule)
  }
})

var requireJSConfigs = require.s.contexts._.config;

// Setting the right path
var stringifiedConfigs = JSON.stringify(requireJSConfigs);
stringifiedConfigs = stringifiedConfigs.replace(/"\/shared\//g, '"libs/shared/').replace(/"\/js\//g, '"libs/js/');
requireJSConfigs = JSON.parse(stringifiedConfigs);

requireJSConfigs.baseUrl = '/base';
requireJSConfigs.deps = allTestFiles;
requireJSConfigs.callback = window.__karma__.start;

// /**
//  * @fileoverview The require.js main file for the storefront
//  */
// /*jslint plusplus: true */
require.config(requireJSConfigs);
