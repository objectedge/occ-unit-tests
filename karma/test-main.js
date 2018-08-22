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

function load() {
  return new Promise(resolve => {
    require([
      'jquery',
      'knockout',
      'pageLayout/layout-container',
      'pageLayout/rest-adapter',
      'pageLayout/api-builder',
      'pageLayout/user',
      'routing',
      'CCi18n',
      'ccRestClient',
      'ccOAuthTimeout',
      'shared/store-loader',
      'ccResourceLoader!APPLICATION_JS',],
    ($, ko, LayoutContainer, MyRestAdapter, APIBuilder, User, Routing, CCi18n,
          ccRestClient, CCOAuthTimeout) => {

          //---------------------------------------------------------------
          // Check if this is a SAML login
          //---------------------------------------------------------------
          function processSamlResponse(rawSamlResponse) {
            var data;
            ccRestClient.samlLogin(rawSamlResponse, handleSamlLoginSuccess, handleSamlLoginError, data);
          }

          function handleSamlLoginSuccess(pResult) {
            var path = ccRestClient.getSessionStoredValue("SSO_RETURN_URL");
            if (path == null) {
              path = "/";
            }
            window.location.assign(path);
          }

          function handleSamlLoginError(pResult) {
            var path = ccRestClient.getSessionStoredValue("SSO_RETURN_URL");
            if (path == null) {
              path = "/";
            }
            window.location.assign(path);
          }

          function processSamlResponseCallback() {
            processSamlResponse(getSamlResponse());
          }

          if (typeof getSamlResponse === 'function' && getSamlResponse() != null && getSamlResponse().length >0) {
            // This is a SAML login.  Register a callback and stop further processing.
            ccRestClient.registerInitCallback(processSamlResponseCallback);
            return;
          }

          function processAgentAuthToken () {
              ccRestClient.storeToken(getAgentAuthToken());
              ccRestClient.setStoredValue("cc-agent-redirect-url", getAgentRedirectUrl());
              window.location.assign("/");
          }

          if (typeof getAgentAuthToken === 'function' && getAgentAuthToken() != null && getAgentAuthToken().length > 0) {
              ccRestClient.registerInitCallback(processAgentAuthToken);
          }


          //---------------------------------------------------------------
          // CONFIGURE VIEW MODEL PATHS
          //---------------------------------------------------------------
          var adapter = new MyRestAdapter('/ccstore/v1/'),
              basePath = "/",
              layoutContainer = new LayoutContainer(adapter,basePath),
              masterViewModel = new layoutContainer.LayoutViewModel(),
              routing = new Routing(),
              ccOAuthTimeout = new CCOAuthTimeout(ccRestClient);

          layoutContainer.masterViewModel(masterViewModel);

          // Change the default template suffix for storefront
          infuser.defaults.templateSuffix = '';
          // Configuration Options for Validation Plugin
          // See https://github.com/ericmbarnard/Knockout-Validation/wiki/Configuration
          var options = {};
          options.errorsAsTitle = false;
          options.insertMessages = false;
          options.decorateElement = true;
          options.errorElementClass = "invalid";

          // Initialize Validation Plugin
          ko.validation.init(options);

          // set the i18next and load the common name space
          var i18nOptions = {
            compatibilityJSON: 'v1',
            compatibilityAPI: 'v1',
            ns : {
              namespaces : ['ns.common','ns.ccformats'],
              defaultNs : ['ns.common']
            },
            fallbackLng : ['en'],
            useLocalStorage : false,
            useCookie : false,
            debug : false,
            contextSeparator: ":",
            resGetPath: '/ccstoreui/v1/resources/__ns__?locale=__lng__',
            backend: {
              ajax: CCi18n.ajax
            }
          };

          CCi18n.deferInit(i18nOptions, function() {});
          APIBuilder.widgetBuilder(layoutContainer.WidgetViewModel, layoutContainer);
          APIBuilder.regionBuilder(layoutContainer.RegionViewModel, layoutContainer);
          resolve(layoutContainer);
    });
  });
}

define('mainLoader', ['pageLayout/user', 'widgetCore'], (User, widgetCore) => {
  let layoutContainer;

  return {
    load: () => {
      return new Promise(resolve => {
        if(layoutContainer) {
          return resolve(layoutContainer);
        }

        load().then(layoutContainerInstance => {
          layoutContainer = layoutContainerInstance;
          window.layoutContainer = layoutContainer;
          resolve(layoutContainer);
        });
      });
    },
    setData: (mockData) => {
      return new Promise(resolve => {
        $.ajax({
          url: `/mock?path=${mockData.user}`
        }).done(responseUserData => {
          User.singleInstance = null;
          const userData = new User(layoutContainer, responseUserData);
          $.ajax({
            url: `/mock?path=${mockData.widget}`
          }).done(responseWidgetData => {
            const widgetData = layoutContainer.viewModelBuilder.widget.load(responseWidgetData, layoutContainer, { load: false });
            layoutContainer.runWidgetInitialization(widgetData, true);
            widgetData.setCurrent('user', userData);
            resolve(widgetData);
          });
        });
      });
    },
    loadViewModels: (widgetData, classes) => {
      return new Promise(resolve => {
        const loader = new widgetCore.loaders.Widget();
        viewModels = loader.load(widgetData, widgetData, classes);
        resolve(viewModels);
      });
    },
    clear: () => {
      layoutContainer.contextHandler.flush(true);
    }
  };
});
// /**
//  * @fileoverview The require.js main file for the storefront
//  */
// /*jslint plusplus: true */
require.config(requireJSConfigs);
