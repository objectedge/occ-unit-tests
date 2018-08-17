/**
 * @fileoverview custom loader module which will allow application level modules to be loaded into the application
 * prior to widgets loading. It will also allow for widgets to reference these modules as dependencies.
 * 
 * The jsUrls property will be passed to the module from the server to load the application level js files during the main.js loading.
 * These urls will also be stored along with a corresponding 'prettier' module name, so that widgets can reference them as dependencies in their own modules.
 * e.g. ccResourceLoader!global/myAwesomeModule
 * 
 */
define(

  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'ccResourceLoader',

  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  [
    // 'module' is a special reserved requirejs dependency. 
    // This holds information about the current module, initial config e.g. jsUrls in this case. 
    'module',
    
    'ccLogger'
  ],

  //-------------------------------------------------------------------
  // MODULE DEFINTIION
  //-------------------------------------------------------------------
  function (pModule, ccLogger) {
    
    var GLOBAL = 'global', MIN_JS_EXT = '.min.js', JS_EXT = '.js', APPLICATION_JS_RESOURCE = 'APPLICATION_JS';
    
    /**
     * function returns a module name for the url passed in.
     * This module name will start at 'global' part in the url, and the '.js' extension will be removed.
     * 
     * @param   {String} pJsUrl the url to the js file
     * @returns {String} The module name normalized from the url e.g. passing in '/file/global/myModule.js' will return 'global/myModule'
     */
    function getModuleName(pJsUrl) {
      var globalPos = pJsUrl.indexOf(GLOBAL);
      
      // We need to account for either .min.js or .js type filenames.
      var jsPos = pJsUrl.indexOf(MIN_JS_EXT);
      
      if (jsPos == -1) {
        jsPos = pJsUrl.indexOf(JS_EXT);
      }
      
      if (globalPos > -1 && jsPos > -1) {
        return pJsUrl.substring(globalPos, jsPos);
      }
    }
    
    /**
     * Custom requirejs loader for loading some runtime type javascript modules that have been
     * uploaded in extensions.
     */
    function ResourceLoader() {
      var self = this;
      
      // Maintain this as common to all instances of ResourceLoader.
      ResourceLoader.moduleUrls = {};
      
      function addModuleUrl(pName, pUrl) {
        ResourceLoader.moduleUrls[pName] = pUrl;
      };
      
      function getModuleUrl(pName) {
        return ResourceLoader.moduleUrls[pName];
      };
      
      /**
       * Retrieves the list of application urls and requires them.
       * The method also executes the onLoad method of the module, if one is defined.
       */
      function getApplicationJsResources(name, req, onload) {
        
        var moduleConfig = pModule.config();
        
        req(moduleConfig.jsUrls, function () {
          //jsUrls could have multiple urls, each returned module will be in the arguments array
          var modules = arguments;

          for (var i = 0; i < modules.length; i++) {
            var module = modules[i];

            // Like widgets and elements, we'll allow an onLoad method to be defined.
            if (module && module.onLoad) {
              module.onLoad();
            }

            // We'll add this module url to the moduleUrls so it can be referenced later in a widget's dependency list.
            var moduleName = getModuleName(moduleConfig.jsUrls[i]);
            addModuleUrl(moduleName, moduleConfig.jsUrls[i]);
          }

          // tell require we're done loading.
          onload(name);
        });  
      }
      
      /**
       * Attempts to return a module for the specified name.
       * In this case, the dependency will be something like ccResourceLoader!global/myAwesomeModule
       * 
       * Method will lookup the url for global/myAwesome and require the correct url if it's found.
       */
      function getModuleResource(name, req, onload) {
        var url =getModuleUrl(name);

        if (url) {
          req([url], 
            function (module) {
              onload(module);
            },    
            function(error){
              ccLogger.error('Module ' + name + ' could not be loaded :' + error);
              onload();
            }
          );
        }
        else {
          ccLogger.warn(' Url for Module ' + name + ' was not found.');
          onload();
        }  
      }
      
      // the load method, this will be called by requirejs.
      self.load = function(name, req, onload, config) {
        var moduleConfig = pModule.config();

        // If running a build, just complete, resource will be retrieved at runtime
        if (config.isBuild) {
          onload();
        } 
        else if (name == APPLICATION_JS_RESOURCE) {
          getApplicationJsResources(name, req, onload);
        } 
        else {
          getModuleResource(name, req, onload);
        }  
      };
    }
    
    return new ResourceLoader();
  }
);

