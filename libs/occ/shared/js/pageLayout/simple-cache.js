/**
 * @fileoverview Defines a simple caching mechanism to store view
 * models and other loaded data.
 */
define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'pageLayout/simple-cache',
  
  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['knockout'],
    
  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (ko) {
    
    "use strict";
    
    //-----------------------------------------------------------------
    // Class definition & member variables
    //-----------------------------------------------------------------
    /**
       Creates a simple cache object.
       @private
       @name SimpleCache
       @property {map} cache The cached values. 
       @class The SimpleCache is a very basic cache implementation. Any inserted
       elements are returned on requests for data with the same type & id.
     */
    function SimpleCache() {
      this.cache = {};
      return(this);
    }
    
    /**
       Adds the provided model to the cache using the provided type & id
       @private
       @param {String} type The type of data being added to the cache.
       @param {String|Array} id The id being added to the cache using either a simple id (string) or
       complex id (an array of values).
       @param {Object} model The model to add to the cache.
     */
    SimpleCache.prototype.set = function(type, id, model) {
      var typeObject;
      if(this.cache[type]) {
        typeObject = this.cache[type];
      } else {
        typeObject = {};
        this.cache[type] = typeObject;
      }
      
      typeObject[id] = model;
    };
    
    /**
       Attempts to get the value from the cache using the provided type & id.
       @private
       @param {String} type The type of data being retrieved from the cache.
       @param {String|Array} id The id being retrieved from the cache using either a simple id (string) or
       complex id (an array of values).
       @return {Object} The cache result with two properties: hit and result. {boolean} hit is true if there
       was a cache result. {Object} result is the result from the cache or null if hit is false. 
     */
    SimpleCache.prototype.get = function(type, id) {
      var object;
      if(this.cache[type]) {
        object = this.cache[type][id];
        if(object || object === null || object === false) {
          return {result: object, hit: true};
        }
      }
      
      return {result: null, hit: false};
    };
    
    /**
       Flushes the cache of all data.
       @private
     */
    SimpleCache.prototype.flush = function() {
      this.cache = {};
    };
    
    return SimpleCache;
  }
);

