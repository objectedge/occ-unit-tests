/**
 * @fileoverview Defines a REST adapter capable of making REST calls to load
 * external data.
 */
/*global $ */
define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'pageLayout/rest-adapter',

  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['jquery', 'knockout', 'ccRestClient', 'ccConstants', 'pageLayout/simple-cache', 'navigation'],

  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function ($, ko, ccRestClient, CCConstants, Cache, navigation) {

    "use strict";

    var restClient = ccRestClient;
    var DEFAULT_CACHE_LOADER = '__default__';
    

    //-----------------------------------------------------------------
    // Class definition & member variables
    //-----------------------------------------------------------------
    /**
     * Creates a REST adapter.
     * @private
     * @name RestAdapter
     * @param {String} basePath !!DEBUG!!
     * @class The RestAdapter is responsible for managing the system's interaction with
     * the external source of data. It handles loading and modification of items by using
     * type & id parameters to indicate what type of data is being dealt with. Based on the provided
     * type different REST calls will be invoked to handle the operation.
     */
    function RestAdapter(basePath) {
      this.basePath = basePath;
      this.cache = new Cache();
      this.cacheLoaders = {
      };
      this.registerCacheLoader(DEFAULT_CACHE_LOADER, this.defaultCacheLoader);
      return (this);
    }

    /**
     * Object literal representing a map of rest calls to the data type they return. This should probably be defined on the server.
     * @private
     */
    RestAdapter.prototype.restToDataTypes = {
      'widget': 'widget',
      'widgetDefinition': 'widgetDefinition',
      'layout': 'layout',
      'cart': 'product',
      'productList': 'product',
      'categoryList': 'category'
    };

    /**
     * Populates the cache for the given response data of the given dataType having ids
     * specified by the ids array.
     * This cache loader simply puts the items into the cache using the ids array as
     * the cache key for each entry. Cache values are assumed to be in the data array.
     * It's also assumed that ids[x] is the cache key for the value located at data[x].
     */
    RestAdapter.prototype.defaultCacheLoader = function (cache, dataType, data, ids) {
      for (var i = 0; i < ids.length; i++) {
        if (data[i] && data[i].id && (ids[i] === data[i].id)) {
          /* test if the data's id property matches the id we are inserting into cache */
          cache.set(dataType, ids[i], data[i]);
        }
      }
    };

    /**
     * Cache loaders are responsible for populating the cache with data from a server
     * response. There is always a default cache loader, but cache loaders may
     * also be specified per rest service by registering them here.
     */
    RestAdapter.prototype.registerCacheLoader = function (restType, cacheLoader) {
      this.cacheLoaders[restType] = cacheLoader;
    };

    RestAdapter.prototype.getCacheLoader = function (restType) {
      return this.cacheLoaders[restType];
    };
    
    /**
     * Loads the item of the type given by dataType having ids specified in ids
     * from cache and returns them as an array
     * @private
     */
    RestAdapter.prototype.reassembleDataFromCache = function (dataType, ids) {
      var self = this;
      var reassembledData = [];
      for (var j = 0; j < ids.length; j++) {
        reassembledData.push(self.cache.get(dataType, ids[j]).result);
      }
      return reassembledData;
    };

    /**
     * Loads data from a remote service in the case when the ids of items being returned 
     * are not known. For example, requesting the child categories of a root category, or
     * products located under a collection.
     * Results are cached based off of ids in the returned data.
     */
    RestAdapter.prototype.cachedRootCategories = function (success, error) {
      /* check the cache, have we done this query before? */
      /* f this, bad idea */
      // child categories
      // root categories
      // child products
      // child skus
      // get product
      // get products
      // 
    };

    /**
     Loads data externally based on type and parameters. Results are stored into cache.
     Subsequent requests for items of the same type and id will return from cache rather
     than making a remote call to the server.
     @function RestAdapter#cachedLoadJSON
     @param {String} restType The type of rest call to be used for requesting data
     @param {String|Array} id The id of the item being loaded. Either a simple id (String) or
     a complex id (Array).
     @param {Object} [params] Additional parameters for loading the item.
     @param {function} success Succes callback function if the item was successfully loaded. The callback has
     the resulting data as its only parameter.
     @param {function} [error] Error callback function if there was an error in loading the item.
     */
    RestAdapter.prototype.cachedLoadJSON = function (restType, id, params, success, error) {
      /**
       Lookup the cache type of what is being requested
       check if we have any of the items of the given id in cache
       */

       /* Declared for the "localSuccess" callback  */
      var cacheResult, finalId;
      var self = this;
      var dataType = this.restToDataTypes[restType];
      /**
         Success callback which handles cache population
         and reassembly of results from cache.
         @ignore
       */
      var localSuccess = function (data) {
        var reassembledData, cacheLoader;
        /** get the cache loader for this service **/
        cacheLoader = self.getCacheLoader(restType);
        if (!cacheLoader) {
          cacheLoader = self.getCacheLoader(DEFAULT_CACHE_LOADER);
        }
        /* Can't cache without a dataType */
        if (dataType) {
          /** populate cache **/
          if (!(finalId instanceof Array)) {
            cacheLoader(self.cache, dataType, data, [finalId]);
            reassembledData = data;
          } else if (finalId instanceof Array) {
            cacheLoader(self.cache, dataType, data, finalId);
            reassembledData = self.reassembleDataFromCache(dataType, id);
          }
        }
        success(reassembledData);
      };
      if (id instanceof Array) {
        finalId = [];
        for (var i = 0; i < id.length; i++) {
          cacheResult = self.cache.get(dataType, id[i]);
          if (!cacheResult.hit) {
            /* Add to the list of items we need to request */
            finalId.push(id[i]);
          }
        }
        if (finalId.length > 0) {
          /* if we need more data, go get it */
          this.loadJSON(restType, finalId, params, localSuccess, error);
        } else {
          /* otherwise we have it all from cache so just return it */
          return self.reassembleDataFromCache(dataType, id);
        }
      } else {
        finalId = id;
        cacheResult = self.cache.get(dataType, id);
        if (cacheResult.hit) {
          success(cacheResult.result);
        } else {
          this.loadJSON(restType, finalId, params, localSuccess, error);
        }
      }
      
    };

    /**
       Loads the requested item from the external datasource based on type, id and parameters.
       @private
       @function RestAdapter#loadJSON
       @param {String} type The type of item being loaded.
       @param {String|Array} id The id of the item being loaded. Either a simple id (String) or
       a complex id (Array).
       @param {Object} [params] Additional parameters for loading the item.
       @param {function} success Succes callback function if the item was successfully loaded. The callback has
       the resulting data as its only parameter.
       @param {function} [error] Error callback function if there was an error in loading the item.
     */
    RestAdapter.prototype.loadJSON = function (type, id, params, success, error) {
      var url, dataId, input, restVersion, dataType;
      if ($.isFunction(params)) {
        error = success;
        success = params;
        params = null;
      }

      

      //-----------------------------------------------------------------
      // DEBUG CODE FOR GETTING WIDGETS FROM FILE SOURCES
      // ONCE WIDGETS ARE AVAILABLE FROM REPOSITORY THIS SHOULD BE
      // REPLACED AND REMOVED
      //-----------------------------------------------------------------
      switch (type) {
        //-------------------------------------------------------------
        //Widget Loading
        //-------------------------------------------------------------
        case 'widget':
          url = '../shared/widget/' + id + '/non-dist/data/widget.json';
          break;
        //-------------------------------------------------------------
        //Widget Definition Loading
        //-------------------------------------------------------------
        case 'widgetDefinition':
          url = '../shared/widget/' + id + '/non-dist/data/widget.json';
          break;
      }

      if (url) {
        $.ajax({
          url: url,
          dataType: 'json',
          type: 'GET',
          success: success,
          error: error
        });
        return;
      }

      //--------------------------
      //ACTUAL REST ADAPTER STUFF
      //--------------------------

      input = {};
      var pathParam = null;
      var autoWrap = false;

      switch (type) {
        //-------------------------------------------------------------
        //Layout Loading
        //-------------------------------------------------------------
        case 'layout':
          url = CCConstants.ENDPOINT_PAGES_GET_PAGE;
          pathParam = id;
          input = params;
          break;

        //-------------------------------------------------------------
        //Cart Loading
        //-------------------------------------------------------------
        case 'cart':
          if (!id || typeof id !== 'object' || id.length < 1) {
            throw "Error with getting cart";
          }
          if (params) {
            input = params;
          }
          input[CCConstants.CATALOG] = id[0];
          input[CCConstants.PRODUCT_IDS] = id[1];
          if (id[2]) {
            input[CCConstants.INCLUDE_HISTORICAL] = id[2];
          }
          if (id[3]) {
            input[CCConstants.STORE_PRICELISTGROUP_ID] = id[3];
          }
          if(id[4]){
        	input[CCConstants.FIELDS_QUERY_PARAM] = id[4];
          }
          if(id[5]){
            input[CCConstants.INCLUDE_CKILD_SKUS_LISTING_IDS] = id[5];
          }
          url = CCConstants.ENDPOINT_PRODUCTS_LIST_PRODUCTS;
          break;

        case 'getCurrentProfileOrder':
          if (params) {
            input = params;
          }
          url = CCConstants.ENDPOINT_GET_PROFILE_ORDER;
          dataType = 'price';
          break;
         
        //-------------------------------------------------------------
        //Cart validation for the stock levels
        //-------------------------------------------------------------
        case 'getStockStatus':
          if (params) {
            input = params;
          }
          pathParam = id[1];
          input[CCConstants.SKU_ID] = id[0];
          input[CCConstants.CATALOG] = id[2];
          url = CCConstants.ENDPOINT_GET_PRODUCT_AVAILABILITY;
          break;
          
        case CCConstants.ENDPOINT_GET_INITIAL_ORDER:
          pathParam = id;
          input = params;
          url = CCConstants.ENDPOINT_GET_INITIAL_ORDER;
          break;
       
        case 'getStockStatuses':
          input[CCConstants.PRODUCTS_PARAM] = params.products;
          input[CCConstants.CATALOG] = params.catalogId;
          if (params.filterKey && params.filterKey.length > 0) {
            input[CCConstants.FILTER_KEY] = params.filterKey;
          }
          url = CCConstants.ENDPOINT_PRODUCTS_AVAILABILITY;
          break;
          
        //-------------------------------------------------------------
        //Product Prices
        //-------------------------------------------------------------
        case CCConstants.ENDPOINT_GET_PRODUCT_PRICES:
          pathParam = id;
          if (params) {
            input[CCConstants.SKU_ID] = params;
          }
          if (null != params && params.constructor === Object && params.filterKey && params.filterKey.length > 0) {
            input[CCConstants.FILTER_KEY] = params.filterKey;
          }
          url = CCConstants.ENDPOINT_GET_PRODUCT_PRICES;
          break;
           
        case 'orderPricing':
          input = params;
          url = CCConstants.ENDPOINT_ORDERS_PRICE_ORDER;
          input[CCConstants.CHECKOUT] = true;
          dataType = 'price';
          break;

        //-------------------------------------------------------------
        //Product Loading
        //-------------------------------------------------------------
        case 'product':
          if (!id || typeof id !== 'object' || id.length <= 1) {
            throw "Error with getting product";
          }
          if (params) {
            input = params;
          }
          input[CCConstants.CATALOG] = id[1];
          url = CCConstants.ENDPOINT_PRODUCTS_GET_PRODUCT;
          pathParam = id[0];
          dataType = 'product';
          break;

        //-------------------------------------------------------------
        //Product List Loading
        //---------------------------------------- ---------------------
        case 'productList':
          url = CCConstants.ENDPOINT_PRODUCTS_LIST_PRODUCTS;
          if (params) {
            input = params;
          }
          input[CCConstants.CATEGORY] = id;
          input[CCConstants.INCL_CHILDREN] = true;
          break;

        //-------------------------------------------------------------
        //Category List Loading
        //-------------------------------------------------------------
        case 'categoryList':
          if (!id || typeof id !== 'object' || id.length <= 1) {
            throw "Error with getting category list";
          }
          if (params) {
            input = params;
          }
          input[CCConstants.CATALOG] = id[1];
          input[CCConstants.CATALOG_MAXLEVEL_PARAM] = id[2];
          input[CCConstants.EXPAND_QUERY_PARAM] = "childCategories";
          if (id[3]) {
              input[CCConstants.FIELDS_QUERY_PARAM] = id[3];        	  
          }else if (!input.filterKey) {
            input[CCConstants.FIELDS_QUERY_PARAM] = "childCategories(items)";
          }
          autoWrap = true;
          // /ccrest/category
          url = CCConstants.ENDPOINT_COLLECTIONS_GET_COLLECTION;
          pathParam = id[0];
          break;

        case 'search':
          input = params;
          url = CCConstants.ENDPOINT_SEARCH_SEARCH;
          break;
        
        case 'assembler':
          input = params;
          url = CCConstants.ENDPOINT_ASSEMBLE;
          pathParam = 'assemble';
          break;
          
        case 'paymentauthresponse':
          pathParam = id;
          input = params; 
          url = CCConstants.ENDPOINT_PAYMENT_GET_PAYMENT_AUTH_RESPONSE;
          break;
        
        case 'paymentGroup':
          if (params) {
            input = params;
          }
          pathParam = id;
          url = CCConstants.ENDPOINT_GET_PAYMENT_GROUP;
          break;
          
        //--------------------------------------------------------------
        // Profile end points
        //--------------------------------------------------------------
        case 'getUser':
          if (params) {
            input = params;
          }
          url = CCConstants.ENDPOINT_GET_CURRENT_USER;
          break;
        
        case 'updateProfile':
          pathParam = null;
          input = params;
          url = CCConstants.ENDPOINT_UPDATE_PROFILE;
          break;
        case 'changePassword':
          pathParam = null;
          input = params;
          url = CCConstants.ENDPOINT_UPDATE_PROFILE;
          break;
       
        //--------------------------------------------------------------
        // Order History end points
        //--------------------------------------------------------------
        case 'getAllOrdersForProfile':
          input = params;
          url = CCConstants.ENDPOINT_GET_ALL_ORDERS_FOR_PROFILE;
          break;
        case 'getAllOrdersCountForProfile':
          input = params;
          if (input === null) {
            input = {};
          }
          input[CCConstants.COUNT_ONLY] = true;
          url = CCConstants.ENDPOINT_GET_ALL_ORDERS_FOR_PROFILE;
          break;
          
        //--------------------------------------------------------------
        // Dynamic properties meta-data
        //--------------------------------------------------------------
        
        case 'dynamicProperties':
          pathParam = id;
          url = CCConstants.ENDPOINT_METADATA_GET_METADATA;
          input = params;
          if (input === null) {
            input = {};
          }
          input[CCConstants.DYNAMIC_ONLY] = true;
          break;
          
        case 'getItemType':
            pathParam = id;
            url = CCConstants.ENDPOINT_GET_ITEM_TYPE;
            input = params;
            if (input === null) {
              input = {};
            }
            input[CCConstants.INCLUDE_BASE] = false;
            input[CCConstants.PARENT] = id;
            break;

        //-------------------------------------------------------------
        //Cart Loading
        //-------------------------------------------------------------
        case 'sku':
          if (!id || typeof id !== 'object' || id.length < 1) {
            throw "Error with getting sku";
          }
          if(params) {
            input = params;
          }
          input[CCConstants.CATALOG] = id[0];
          input[CCConstants.SKU_IDS] = id[1];
          input[CCConstants.PROD_STATE] = id[2];
          if (id[3]) {
            input[CCConstants.STORE_PRICELISTGROUP_ID] = id[3];
          }
          url = CCConstants.ENDPOINT_PRODUCTS_LIST_SKUS;
		  break;
        case 'getGiftWithPurchaseChoices':
          url = CCConstants.ENDPOINT_GET_GIFT_CHOICES;
          if (params) {
            input = params;
          }
          input[CCConstants.GIFT_WITH_PURCHASE_DETAIL] = id[0];
          input[CCConstants.GIFT_WITH_PURCHASE_TYPE] = id[1];
          break;

        //--------------------------------------------------------------
        // Scheduled Orders
        //--------------------------------------------------------------
        case 'scheduledOrder':
          input = params;
          pathParam = id;
          url = CCConstants.ENDPOINT_GET_SCHEDULED_ORDER;
          break;

        case 'scheduledOrders':
          input = params;
          url = CCConstants.ENDPOINT_LIST_SCHEDULED_ORDERS_BY_PROFILE;
          break;

        case 'listMembers':
          input = params;
          url = CCConstants.ENDPOINT_LIST_CONTACTS_BY_ORGANIZATION;
          break;
      }

      if (!url) {
        throw "No REST target found for item type: " + type;
      }

      restClient.request(url, input,
        function (result) {
          if (success) {
            var resultData = result;
            if (autoWrap) {
              resultData = resultData.items;
            }
            success(resultData, dataType);
          }
        },
        function (result) {
          if (result.status == CCConstants.HTTP_NOT_FOUND) {
            // Passing in true for noHistory param (2nd param), we don't want the url to change on 404 pages.
            navigation.goTo("/404", true, true);
          }  
          else if (error && result) {
            error(result);
          }
        },
        pathParam);
    };

    /**
       Persists the creation of an item by making an external request to create the item.
       @private
       @param {String} type The type of item being created.
       @param {String|Array} id The id of the item being created. Either a simple id (String) or
       a complex id (Array).
       @param {Object} json Json object representing the created item.
       @param {Object} [params] Additional parameters for the creation.
       @param {function} success Succes callback function if the item was successfully created.
       @param {function} [error] Error callback function if there was an error in creating the item.
     */
    RestAdapter.prototype.persistCreate = function (type, id, json, params, success, error) {
      var url, input = {};

      if ($.isFunction(params)) {
        error = success;
        success = params;
        params = null;
      }

      switch (type) {
        //-------------------------------------------------------------
        //Cart Pricing
        //-------------------------------------------------------------
        case CCConstants.ENDPOINT_ORDERS_PRICE_ORDER:
          input = json;
          url = CCConstants.ENDPOINT_ORDERS_PRICE_ORDER;
          break;

        //-------------------------------------------------------------
        //Create Profile
        //-------------------------------------------------------------
        case CCConstants.ENDPOINT_CREATE_PROFILE:
          input = json;
          url = CCConstants.ENDPOINT_CREATE_PROFILE;
          break;

        //-------------------------------------------------------------
        //Forgotten Password
        //------------------------------------------------------------- 
        case CCConstants.ENDPOINT_FORGOT_PASSWORD:
          input = json;
          url = CCConstants.ENDPOINT_FORGOT_PASSWORD;
          break;

        //-------------------------------------------------------------
        //Reset Expired Password
        //------------------------------------------------------------- 
        case CCConstants.ENDPOINT_UPDATE_EXPIRED_PASSWORD:
         input = json;
         url = CCConstants.ENDPOINT_UPDATE_EXPIRED_PASSWORD;
         break;

        //-------------------------------------------------------------
        // Shipping method list Loading
        //-------------------------------------------------------------
        case CCConstants.ENDPOINT_SHIPPING_METHODS_LIST_SHIPPING_METHODS:
          input = json; 
          url = CCConstants.ENDPOINT_SHIPPING_METHODS_LIST_SHIPPING_METHODS;
          break;

        case 'product':
          //Not implemented
        break;

        case 'order':
          input = json;
          if (params != null && params.incomplete) {
            url = CCConstants.ENDPOINT_UPDATE_PROFILE_ORDER;
            input[CCConstants.OP] = CCConstants.CREATE_OP;
          } else {
            url = CCConstants.ENDPOINT_ORDERS_CREATE_ORDER;
          }
          break;

        case 'requestQuote':
          input = json;
          url = CCConstants.ENDPOINT_QUOTE_REQUEST;
          break;
        
        case 'rejectQuote':
            input = json;
            url = CCConstants.ENDPOINT_QUOTE_REJECT;
            break;

        case 'payment':
          input = json;
          url = CCConstants.ENDPOINT_PAYMENT_AUTH_PAYMENT;
          input[CCConstants.SITE_ID] = params;
          break;
          
        case 'scheduledOrder':
          input = json;
          url = CCConstants.ENDPOINT_CREATE_SCHEDULED_ORDER;
          break;
          
        case 'addPayments':
          input = json;
          url = CCConstants.ADD_ORDER_PAYMENTS;
          break;
      }

      if (!url) {
        throw "No REST target found for item type: " + type;
      }

      //Make the REST call
      restClient.request(url, input, success, error);
    };

    /**
       Persists the update of an item by making an external request to update the item.
       @private
       @param {String} type The type of item being deleted.
       @param {String|Array} id The id of the item being deleted. Either a simple id (String) or
       a complex id (Array).
       @param {Object} json Json object representing the updated item.
       @param {Object} [params] Additional parameters for the update.
       @param {function} success Succes callback function if the item was successfully updated.
       @param {function} [error] Error callback function if there was an error in updating the item.
     */
    RestAdapter.prototype.persistUpdate = function (type, id, json, params, success, error) {
      var url, input = {};
      var pathParam = null;
      
      if ($.isFunction(params)) {
        error = success;
        success = params;
        params = null;
      }

      switch (type) {
      
        case 'product':
          //Not implemented
        break;
        
        case 'order':
          input = json;
          url = CCConstants.ENDPOINT_UPDATE_PROFILE_ORDER;
          input[CCConstants.OP] = CCConstants.UPDATE_OP;
          break;

        case 'updateOrder':
          input = json;
          pathParam = id;
          url = CCConstants.ENDPOINT_UPDATE_ORDER;
          break;

        case 'scheduledOrder':
          input = json;
          pathParam = id;
          url = CCConstants.ENDPOINT_UPDATE_SCHEDULED_ORDER;
          break;
        case 'updateOrganization':
          input = json;
          pathParam = id;
          url = CCConstants.ENDPOINT_UPDATE_ORGANIZATION;
          break;
      }

      if (!url) {
        throw "No REST target found for item type: " + type;
      }

      //Make the REST call
      restClient.request(url, input, success, error, pathParam);
    };

    /**
       Persists the removal of an item by making an external request to delete the item.
       @private
       @param {String} type The type of item being deleted.
       @param {String|Array} id The id of the item being deleted. Either a simple id (String) or
       a complex id (Array).
       @param {Object} [params] Additional parameters for the deletion.
       @param {function} success Succes callback function if the item was successfully deleted.
       @param {function} [error] Error callback function if there was an error in deleting the item.
     */
    RestAdapter.prototype.persistRemove = function (type, id, params, success, error) {
      var url, input = {};
      var pathParam = null;
      
      if ($.isFunction(params)) {
        error = success;
        success = params;
        params = null;
      }

      switch (type) {
        case 'product':
          //Not implemented
          break;
        
        case 'order':
          url = CCConstants.ENDPOINT_REMOVE_PROFILE_INCOMPLETE_ORDER;
          break;

        case 'scheduledOrder':
          url = CCConstants.ENDPOINT_DELETE_SCHEDULED_ORDER;
          pathParam = id;
          break;
      }

      if (!url) {
        throw "No REST target found for item type: " + type;
      }

      //Make the REST call
      restClient.request(url, input, success, error, pathParam);
    };

    return RestAdapter;
  }
);

