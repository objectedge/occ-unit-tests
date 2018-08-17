/**
 * @fileoverview Controlling class that maintains the processing and
 * flow of a page. Defines the LayoutContainer view model.
 */

/*global $ */
/*global require */
define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'pageLayout/layout-container',

  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  [ 'knockout',
    'pageLayout/data',
    'pageLayout/layout',
    'pageLayout/region',
    'pageLayout/widget',
    'pageLayout/cart',
    'pageLayout/order',
    'pageLayout/layout-mapping',
    'pageLayout/simple-cache',
    'pageLayout/context-handler',
    'pageLayout/view-model-builder',
    'pageLayout/search',
    'pageLayout/shippingmethods',
    'pageLayout/payment-auth-response',
    'pageLayout/user',
    'pageLayout/product',
    'pageLayout/space',
    'pageViewTracker',
    'viewModels/paymentDetails',
    'pubsub',
    'CCi18n',
    'ccConstants',
    'ccLogger',
    'jquery',
    'notifier',
    'pageLayout/site',
    'sfExceptionHandler',
    'ccStoreServerLogger',
    'viewportHelper',
    'navigation',
    'ccRestClient',
    'ccPreviewBar',
    'ccStoreConfiguration',
    'viewModels/orderDetailsViewModel',
    "pageLayout/css-loader"
  ],

  //-------------------------------------------------------------------
  // MODULE DEFINTIION
  //-------------------------------------------------------------------
  function (ko, ServerData, LayoutViewModel, RegionViewModel, WidgetViewModel,
   CartViewModel, OrderViewModel, LayoutMapping, Cache, ContextHandler,
   ViewModelBuilder, SearchViewModel, ShippingMethodsViewModel, PaymentAuthResponseViewModel,
   UserViewModel, ProductViewModel, SpaceViewModel, pageViewTracker, PaymentDetails, PubSub, CCi18n, CCConstants,
   ccLogger, $, notifier, SiteViewModel, ExceptionHandler, StoreServerLogger, viewportHelper, navigation, ccRestClient,
   ccPreviewBar, ccStoreConfiguration,OrderDetailsViewModel, cssLoader
   ) {

    "use strict";

    //-----------------------------------------------------------------
    //Class definition & member variables (the constructor)
    //-----------------------------------------------------------------
    /**
     * Creates an LayoutContainer object. LayoutContainer controls the flow of a page including how to build
     * a {@link LayoutViewModel|layout}, how to load data, and managing contextual data. All
     * {@link WidgetViewModel|widgets} are constructed via the LayoutContainer.
     *
     * @param {Object} adapter The current context of the page.
     * @param {String} basePath The URL path to this widget.
     *
     * @private
     * @class
     * @name LayoutContainer
     * @property {LayoutMapping} layoutMapping The mapping used to map a layout.
     * @property {WidgetEditorViewModel} editor The widget editor responsible for editing widgets.
     * @property {SimpleCache} cache The Cache used to store retrieved records.
     * @property {ContextHandler} contextHandler The context handler used to manage contextual data.
     * @property {ViewModelBuilder} viewModelBuilder The view model builder used to convert json to view models.
     * @property {ccStoreConfiguration} storeConfiguration An instance of the cc-store-configuration containing store-configuration data.
     */
    function LayoutContainer(adapter, basePath) {
      var self = this;

      this.isPreview;
      this.layoutMapping = new LayoutMapping(this);
      this.masterViewModel= ko.observable();
      this.basePath = basePath;
      this.adapter = adapter;
      this.cache = new Cache();
      this.widgetCache = new Cache();
      this.contextHandler = new ContextHandler();
      this.viewModelBuilder = ViewModelBuilder;
      this.contextDataSet = $.Deferred();
      this.contextDataSetSubscriber = this.contextDataSet.promise();
      this.networkErrorMessage;
      this.networkErrorReloadText;
      self.storeServerLog = StoreServerLogger.getInstance();
      this.storeConfiguration = ccStoreConfiguration.getInstance();

      this.currentPage = null;
      // Widgets that are currently being initialized (if any)
      this.pendingWidgets = ko.observableArray().extend({ deferred: true });
      $.Topic(PubSub.topicNames.PAGE_VIEW_CHANGED).subscribe(self.pageViewChanged.bind(self));
      $.Topic(PubSub.topicNames.PAGE_CONTEXT_CHANGED).subscribe(self.pageContextChanged.bind(self));
      $.Topic(PubSub.topicNames.PAGE_PARAMETERS_CHANGED).subscribe(self.pageParametersChanged.bind(self));
      $.Topic(PubSub.topicNames.PAGE_READY).subscribe(self.pageReady.bind(self));
      $.Topic(PubSub.topicNames.RECORD_PAGINATION_PAGE_CHANGE).subscribe(self.pageReady.bind(self));
      $.Topic(PubSub.topicNames.USER_NETWORK_ERROR).subscribe(self.networkError.bind(self));

      // Exception handing
      var clientDebugMode = true;
      if (clientDebugMode) {
        this.exceptionHandler = new ExceptionHandler();
        if (this.exceptionHandler.subscribe) {
          this.exceptionHandler.subscribe();
        }
      }

      return (this);
    }

    //------------------------------------------------------------------
    // Class functions
    //------------------------------------------------------------------

    /**
     * Returns a view model builder for the passed in type, or creates a default builder if none found.
     *
     * @function
     * @name LayoutContainer#getViewModelBuilder
     * @param {string} type The type of object for which to return a builder.
     * @returns {ViewModelBuilder} View model builder for `type'.
     */
    LayoutContainer.prototype.getViewModelBuilder = function(type) {
      var builder = this.viewModelBuilder[type];

      if(builder == null) {
        builder = {
          scope: 'page',
          cacheable: false,
          load: true,
          create: true
        };
      }
      return builder;
    };

  /**
   * Walk the properties in "global" and "page" scope.
   * For each property add it to the context handler so that
   * it can be available for widgets to enjoy.
   *
   * @private
   * @function
   * @name LayoutContainer#setContextData
   * @param {Object} serverData
   */
  LayoutContainer.prototype.setContextData = function(serverData) {
    //var serverData = layoutViewMapping.data,
    var topLevelProps, propsIdx = 0,
      property;
    //if (!serverData) { return; }
    var self = this;
    var processServerData = function() {
      topLevelProps = ['global', 'page'];
      for (propsIdx = 0; propsIdx < topLevelProps.length; propsIdx++) {
        for (property in serverData[topLevelProps[propsIdx]]) {
          if (serverData[topLevelProps[propsIdx]].hasOwnProperty(property) && property !== "__ko_mapping__") {
            self.loadCurrentFromJSON(property,
              serverData[topLevelProps[propsIdx]][property], serverData);
          }
        }
      }

      // Context data all set. Dependencies can execute now
      self.contextDataSet.resolve();

      // Reset the deferred stuff as it seems to not quite work on IE if you dont...
      self.contextDataSet = $.Deferred();
      self.contextDataSetSubscriber = self.contextDataSet.promise();

    };
     // Setup locale before building any view models
    var localeFromServer = serverData['global']['locale'];
    if (localeFromServer && localeFromServer !== null) {
      CCi18n.setLocaleOnce(localeFromServer,processServerData);
    } else {
      // we don't have a locale, keep on going
      processServerData();
    }
  };

  /**
   * Listens for PAGE_CONTEXT_CHANGED events and
   * requests only data from the server. When data is
   * return it sets up context variables according to the
   * returned data.
   *
   * @private
   * @function
   * @name LayoutContainer#pageContextChanged
   * @param {string} data.contextId New context id.
   * @param {string} data.pageId URL to request.
   */
   LayoutContainer.prototype.pageContextChanged = function (data) {
    var self = this;
    self.currentPage = data;

    var requestURL = data.pageId;
    var params = {};
    params[CCConstants.PAGE_PARAM] = data.contextId;
    params[CCConstants.DATA_ONLY] = true;
    this.load('layout', requestURL, params,
      // Callback for load result
      function (result) {
        // Update context variables
        self.setContextData(result.data);
        self.updatePageEventData(result.data, data);
        if (result.data && result.data.global && result.data.global.site) {
          if (result.data.global.site.tenantId) {
            pageViewTracker.tenantId(result.data.global.site.tenantId);
          }
        }
        // Do we need to publish here? Sure...
       $.Topic(PubSub.topicNames.PAGE_METADATA_CHANGED).publish(result);
       $.Topic(PubSub.topicNames.PAGE_READY).publish(data);
      },
      self.handleServerError
      );
   };

   /**
    * Adds the page repository id from the server context data to the page event data being
    * passed around.
    *
    * @private
    * @function
    * @name LayoutContainer#updatePageEventData
    * @param {Object} pServerData
    * @param {Object} pPageEventData
    */
   LayoutContainer.prototype.updatePageEventData = function(pServerData, pPageEventData) {

     if (pServerData.page && pServerData.page.repositoryId) {
       pPageEventData.pageRepositoryId = pServerData.page.repositoryId;
     }
   };

   /**
    * Callback function invoked if an error is returned after a request.
    *
    * @private
    * @function
    * @name LayoutContainer#handleServerError
    * @param {Object} result Result object returned from server.
    */
   LayoutContainer.prototype.handleServerError  = function (result) {
     this.networkError();
   };

   /**
    * Listens for PAGE_PARAMETERS_CHANGED events. When data is returned it
    * pushes a PubSub PAGE_PARAMETERS event for transferring the data to
    * appropriate location for handling the data
    * e.g. when the view is "searchresults"
    * the data is sent to searchViewModel for creation of a
    * new search with the data provided
    *
    * @private
    * @function
    * @name LayoutContainer#pageParametersChanged
    * @param {Object} pageEventData The parameter string part of the URL.
    */
   LayoutContainer.prototype.pageParametersChanged = function(pageEventData) {
     var parameters = this.getParameterData(pageEventData.parameters);
     $.Topic(PubSub.topicNames.PAGE_PARAMETERS).publishWith(
       {
         pageId: pageEventData.pageId,
         seoslug: pageEventData.seoslug,
         parameters: parameters
       },[{message:"success"}]);
   };

    /**
     * Listens for PAGE_VIEW_CHANGED events and updates the
     * layout according to the new view id.
     *
     * @private
     * @function
     * @name LayoutContainer#pageViewChanged
     * @param {Object} pageEventData Arguments passed in via the page view event.
     */
    LayoutContainer.prototype.pageViewChanged = function (pageEventData) {

      var self = this;

      self.shouldPageBeRefreshed(pageEventData.path);

      self.currentPage = pageEventData;
      // default location if no pageId is provided
      var requestURL = 'home/';
      var params = null;
      if (pageEventData.pageId) {
        // use the provided page ID
        requestURL = pageEventData.pageId;
      }
      if (pageEventData.contextId) {
        // If we have context params add them
        requestURL = pageEventData.pageId;
        params = {};
        params[CCConstants.PAGE_PARAM] = pageEventData.contextId;
        params[CCConstants.DATA_ONLY] = false;
      }

      if (pageEventData.path) {
        requestURL = pageEventData.path;
      }

      // Remove the site base path from the page request
      var siteBasePath = window.siteBaseURLPath;
      if (siteBasePath && siteBasePath !== '/') {
        // Strip leading and trailing  /
        if (siteBasePath.substr(0, 1) === '/') {
          siteBasePath = siteBasePath.substr(1);
        }
        if (siteBasePath.substring(siteBasePath.length - 1, 1) === '/'){
          siteBasePath = siteBasePath.substr(0, siteBasePath.length - 1);
        }
        if (requestURL.indexOf(siteBasePath) !== -1) {
          requestURL = requestURL.replace(siteBasePath, '');

          // Strip leading /
          if (requestURL.substr(0, 1) === '/') {
            requestURL = requestURL.substr(1);
          }

          // If left with nothing, default to home
          if (requestURL === '') {
            requestURL = 'home';
          }
        }
      }

      // Need any query params from the window if we are in preview.
      var uriSplit = window.location.href.split("?"),
      queryParams =  null,
      parameterString = undefined;

      if (uriSplit.length > 1) {
        parameterString = uriSplit[1];
        queryParams = uriSplit[1].split("&");
      }

      if (queryParams) {

        if (params == null) {
          params = {};
        }

        for (var index in queryParams) {
          var queryParam = queryParams[index].split("=");

          // When redirected to a 404 page, strip out the usePageId and usePreviewData parameters
          if (pageEventData.path && pageEventData.path === '404'
            && (!pageEventData.parameters || pageEventData.parameters === '')) {
            if (queryParam[0] !== 'usePageId' && queryParam[0] !== 'usePreviewData') {
              params[queryParam[0]] = queryParam[1];
            }
          }
          else {
            if (queryParam[0] !== 'occsite') {
              params[queryParam[0]] = queryParam[1];
            }
          }
        }
      }

      if (params == null) {
        params = {};
      }
      if (!params.dataOnly) {
        params.dataOnly = false;
      }
      this.load('layout', requestURL, params,
      // Callback for load result
      function (result) {
        self.isPreview = result.isPreview();

        if (result.data.page.pageId) {
          pageEventData.pageId = result.data.page.pageId;
        }

        if (result.data.page.contextId) {
          pageEventData.contextId = result.data.page.contextId;
        }

        var subscription;
        // Update context variables
        self.setContextData(result.data);
        self.updatePageEventData(result.data, pageEventData);
        if (result.data && result.data.global && result.data.global.site) {
          if (result.data.global.site.tenantId) {
            pageViewTracker.tenantId(result.data.global.site.tenantId);
          }
        }

        // Send the parameters
        if (pageEventData.parameters) {

          $.Topic(PubSub.topicNames.PAGE_PARAMETERS).publishWith({
            pageId: pageEventData.pageId,
            seoslug: pageEventData.seoslug,
            parameters: self.getParameterData(pageEventData.parameters)
          },[{message:"success"}]);

        }

        $.Topic(PubSub.topicNames.PAGE_CHANGED).publish(
          pageEventData
        );

        // Update page regions
        // TODO: Fire event here rather than
        // direct link to the view model
      //  masterViewModel.regions(result.regions());
       $.Topic(PubSub.topicNames.PAGE_LAYOUT_LOADED).publish(result, pageEventData);
       var param = {"pageId" : pageEventData.pageId};
       self.storeServerLog.logInfo("getPage",self.storeServerLog.getMessage("getPage", param));
       // if we have pending widgets, delay this event till they load
       if (self.pendingWidgets().length === 0)
         $.Topic(PubSub.topicNames.PAGE_READY).publish(pageEventData);
       else {
         // wait for pending widget count to drop to zero
         subscription = self.pendingWidgets.subscribe(function(watchedPendingWidgets) {
         if (watchedPendingWidgets.length === 0) {
           $.Topic(PubSub.topicNames.PAGE_READY).publish(pageEventData);
           subscription.dispose(); // stop listening
         }
        });
       }

      },
      // Error Callback. Server is likely down.
      self.handleServerError
      );
    };

    /**
     * Request to persist the creation of a new object.
     *
     * @private
     * @function
     * @name LayoutContainer#create
     * @param {String} type The type of data being created.
     * @param {String|String[]} id The id of the object being created using either a simple id (string) or
     *   complex id (an array of values).
     * @param {Object} model The viewModel to persist the creation of.
     * @param {Object} params Additional parameters used for the request.
     * @param {function} success A success function callback. Passes paramters (value, caller). value is the result of the create,
     *   caller is used to reference the calling context.
     * @param {function} error An error function callback invoked if there was an error with creation of the object.
     * @param {Object} caller The caller to be passed to the success and error callbacks.
     */
    LayoutContainer.prototype.create = function(type, id, model, params, success, error, caller) {
      var self = this,
          builder,
          createFunc,
          json;

      if($.isFunction(params)) {
        if($.isFunction(success)) {
          caller = error;
          error = success;
        } else {
          caller = success;
        }
        success = params;
        params = null;
      } else if(!$.isFunction(error)) {
        caller = error;
        error = null;
      }

      //Get the viewModelBuilder for this type of object. If no builder, we
      //cannot load an object of this type.
      builder = this.getViewModelBuilder(type);
      if(!builder || !builder.create) {
        return;
      }

      //Add the item to the cache if it is cachable
      if(builder.cachable) {
        var cacheKey = self.idAndParamsToCacheKey(id, params);
        self.cache.set(type, cacheKey, model);
      }

      //Get the builder's load function into this context.
      createFunc = builder.create;

      if(!createFunc) {
        throw "Loading of resource type: " + type + " forbidden";
      }

      if(createFunc === true) {
        json = model;
      } else {
        json = createFunc(model, params, caller);
      }

      //Ask the adapter to save the json
      this.adapter.persistCreate(type, id, json, params,
        function(data) {
          if(success) {
            success(data, caller);
          }
        },
        function(data) {
          if(error) {
            error(data, caller);
          }
        });
    };

    /**
     * Request to persist an update of an object.
     *
     * @private
     * @function
     * @name LayoutContainer#update
     * @param {string} type The type of data being updated.
     * @param {string|string[]} id The id of the object being updated using either a simple id (string) or
     * complex id (an array of values).
     * @param {Object} model The viewModel to update.
     * @param {Object} params Additional parameters used for the request.
     * @param {function} success A success function callback. Passes paramters (value, caller). value is the result of the update,
     * caller is used to reference the calling context.
     * @param {function} error An error function callback invoked if there was an error with updating the data.
     * @param {Object} caller The caller to be passed to the success and error callbacks.
     */
    LayoutContainer.prototype.update = function(type, id, model, params, success, error, caller) {
      var self = this,
          builder,
          updateFunc,
          json,
          errorCallback,
          successCallback;

      if($.isFunction(params)) {
        if($.isFunction(success)) {
          caller = error;
          error = success;
        } else {
          caller = success;
        }
        success = params;
        params = null;
      } else if(!$.isFunction(error)) {
        caller = error;
        error = null;
      }

      //Get the viewModelBuilder for this type of object. If no builder, we
      //cannot load an object of this type.
      builder = this.getViewModelBuilder(type);
      if(!builder || !builder.update) {
        return;
      }

      //Get the builder's load function into this context.
      updateFunc = builder.update;

      if(!updateFunc) {
        throw "Updating of resource type: " + type + " forbidden";
      }

      if(updateFunc === true) {
        json = model;
      } else {
        json = updateFunc(model, params, caller);
      }

      //Ask the adapter to save the json
      this.adapter.persistUpdate(type, id, json, params,
        function(data) {
          if(success) {
            success(data, caller);
          }
        },
        function(data) {
          if(error) {
            error(data, caller);
          }
        });
    };


    /**
     * Request to permanently delete a new object.
     *
     * @private
     * @function
     * @name LayoutContainer#remove
     * @param {string} type The type of data being deleted.
     * @param {string|string[]} id The id of the object being deleted using either a simple id (string) or
     * complex id (an array of values).
     * @param {Object} params Additional parameters used for the request.
     * @param {function} success A success function callback. Passes paramters (value, caller). value is the result of the deletion,
     * caller is used to reference the calling context.
     * @param {function} error An error function callback invoked if there was an error with deletion of the object.
     * @param {Object} caller The caller to be passed to the success and error callbacks.
     */
    LayoutContainer.prototype.remove = function(type, id, params, success, error, caller) {
      var self = this,
          builder,
          removeFunc;

      if($.isFunction(params)) {
        if($.isFunction(success)) {
          caller = error;
          error = success;
        } else {
          caller = success;
        }
        success = params;
        params = null;
      } else if(!$.isFunction(error)) {
        caller = error;
        error = null;
      }

      //Get the viewModelBuilder for this type of object. If no builder, we
      //cannot load an object of this type.
      builder = this.getViewModelBuilder(type);
      if(!builder || !builder.remove) {
        return;
      }

      //If the object is cachable check the cache and result if there is a cache hit.
      if(builder.cachable) {
        var cacheKey = self.idAndParamsToCacheKey(id, params);
        this.cache.set(type, cacheKey, null);
      }

      //Get the builder's load function into this context.
      removeFunc = builder.remove;

      if(!removeFunc) {
        throw "Deleting of resource type: " + type + " forbidden";
      }

      //Ask the adapter to retreive the object.
      this.adapter.persistDelete(type, id, params,
        function(data) {
          //Perform the callback
          if(success) {
            success(data, caller);
          }
        },
        function(data) {
          if(error) {
            error(data, caller);
          }
        });
    };

    /**
     * Request to load a piece of external data based on url, id and params.
     *
     * @public
     * @function
     * @name LayoutContainer#loadRequestForLayout
     * @param {string} pUrl The Url of the endpoint.
     * @param {Object} pData Additional parameters used for the request.
     * @param {string|string[]} pParam1 The id of the object(s) being loaded using either a simple id (string) or
     * complex id (an array of values).
     */
    LayoutContainer.prototype.loadRequestForLayout = function(pUrl, pData, pParam1, pParam2, pParam3, pParam4, pBeforeSendCallback) {
        var deferred = $.Deferred();
        var self = this;
        ccRestClient.request(pUrl, pData,
          function (result) {
            self.shouldPageBeRefreshed(pParam1);
            deferred.resolve(result);
          },
          function (result) {
            deferred.reject(result);
            if (result.status == CCConstants.HTTP_NOT_FOUND) {
              // Passing in true for noHistory param (2nd param), we don't want the url to change on 404 pages.
              navigation.goTo("/404", true, true);
            }
          }, pParam1, pParam2, pParam3, pParam4, pBeforeSendCallback);

        return deferred;
    };

    function regionsDiffer(regionA,regionB) {
      if (!regionA || !regionB) return true;

      if(regionA.stackType && regionA.stackType() == CCConstants.STACK_TYPE_POPUP && regionB.stackType == CCConstants.STACK_TYPE_POPUP) {
        if (regionA.regions().length && regionA.regions()[0].widgets().length && regionA.regions()[0].widgets()[0].WIDGET_ID == CCConstants.WIDGET_ID_PRODUCT_LISTING){
          //if in a popup stack, and the product listing widget is changing to search, set as different
          if(regionA.regions()[0].widgets()[0].listType() != regionB.regions[0].widgets[0].listType) {
            return true;
          }
        }
      }

      if (regionA.similarRegions && (Object.keys(regionA.similarRegions).length > 0) &&
          regionA.similarRegions.hasOwnProperty(regionB.id)) {
        return false;
      }

      if (regionB.similarRegions && (Object.keys(regionB.similarRegions).length > 0) &&
          regionB.similarRegions.hasOwnProperty(regionA.id)) {
        return false;
      }

    	var unWrappedRegionAwidgets = ko.isObservable(regionA.widgets) ? regionA.widgets() : regionA.widgets;
      var unWrappedRegionAlength = unWrappedRegionAwidgets ? unWrappedRegionAwidgets.length : 0 ;

      if (unWrappedRegionAwidgets && unWrappedRegionAlength > 0) {

    	if(regionB.widgets && (regionB.widgets.length > 0)) {

          if((unWrappedRegionAlength !== regionB.widgets.length)) {
            return true;
          }

          var unWrappedRegionAwidth =  ko.isObservable(regionA.width) ? regionA.width() : regionA.width;
          if(unWrappedRegionAwidth !== regionB.width) {
            return true;
          }

          for(var i = 0; i < unWrappedRegionAlength; i++) {
        	var regionAwidgetId = ko.isObservable(unWrappedRegionAwidgets[i].id) ? unWrappedRegionAwidgets[i].id() : unWrappedRegionAwidgets[i].id;
            if(regionAwidgetId !== regionB.widgets[i].id) {
              return true;
            }
          }

          // If both regions have metadata, then compare region ids as this region must belong to experiments
          // and does not contain any widgets.
          if (regionA.metadata() && regionB.metadata && (regionA.id() != regionB.id)) {
            return true;
          }

          return false;
        }
        return true;
      }

      if(regionB.widgets) {
        return true;
      }

      return true;
    }

    /**
     * Returns the index of the given region in the given list of regions
     */
    function findRegion(region,regionsList) {
      var result = -1;
      for (var i = 0; i < regionsList.length; i++) {
        if (!regionsDiffer(region,regionsList[i])) {
          result = i;
          break;
        }
      }
      return result;
    };

    ko.observableArray.fn.setAt = function(index, value) {
      this.valueWillMutate();
      this()[index] = value;
      this.valueHasMutated();
    };

    /**
     * Request to load page endpoint data. The data is loaded and converted
     * to a view model before being passed to the success callback.
     *
     * @public
     * @function
     * @name LayoutContainer#loadDataForLayout
     * @param {Object} input Additional parameters used for the request.
     * @param {string|string[]} id The id of the object(s) being loaded using either a simple id (string) or
     * complex id (an array of values).
     * @param {function} success A success function callback. Passes paramters (viewModel, caller). viewModel is the result of the load,
     * caller is used to reference the calling context.
     * @param {function} error An error function callback invoked if there was an error with loading the data.
     * @param {Object} builder The view model builder object fot type 'layout'
     * @param {Object} caller The caller to be passed to the success and error callbacks.
     */
    LayoutContainer.prototype.loadDataForLayout = function(input, id, success, error, builder, caller) {
      var self = this, params = input, loadFunc = builder.load;
      var layoutOnlyRequest = $.extend({}, input);
      // 'dataOnly' param is not required for layout call.
      if (layoutOnlyRequest.hasOwnProperty(CCConstants.DATA_ONLY)) {
        delete layoutOnlyRequest[CCConstants.DATA_ONLY];
      }

      var vp = viewportHelper.viewportDesignation();
      if (self.storeConfiguration.enableLayoutsRenderedForLayout === true ) {
        var layoutIdsRendered = self.storeConfiguration.getLayoutIdsRendered();
        if (layoutIdsRendered.length > 0) {
          layoutOnlyRequest[CCConstants.LAYOUTS_RENDERED] = layoutIdsRendered.toString();
        }
      }
      if (vp) {
        layoutOnlyRequest['ccvp'] = vp;
      }

      var cacheableDataOnlyRequest = $.extend({}, input, {cacheableDataOnly:true});
      var productTypesRequired = true;
      if (self.contextHandler.get(CCConstants.PRODUCT_TYPES, 'page')() != undefined) {
        productTypesRequired = false;
      }
      cacheableDataOnlyRequest['productTypesRequired'] = productTypesRequired;

      var contextObj = {};
      contextObj[CCConstants.ENDPOINT_KEY] = CCConstants.ENDPOINT_PAGES_GET_PAGE;
      contextObj[CCConstants.PAGE_KEY] = id;
      contextObj[CCConstants.IDENTIFIER_KEY] = "layoutOnly";
      var filterKeyForLayoutData = self.storeConfiguration.getFilterToUse(contextObj);
      if (filterKeyForLayoutData) {
        layoutOnlyRequest[CCConstants.FILTER_KEY] = filterKeyForLayoutData;
      }
      // Check if we need to pass the disable minify javascript param, in preview mode only
      if (ccRestClient.previewMode) {
        layoutOnlyRequest[CCConstants.DISABLE_MINIFY] = ccPreviewBar.getInstance().isDisableMinifyJs();
      }

      contextObj[CCConstants.IDENTIFIER_KEY] = "cachableData";
      var filterKeyForCachableData = self.storeConfiguration.getFilterToUse(contextObj);
      if (filterKeyForCachableData) {
        cacheableDataOnlyRequest[CCConstants.FILTER_KEY] = filterKeyForCachableData;
      }

      var currentDataParams = {currentDataOnly:true};
      contextObj[CCConstants.IDENTIFIER_KEY] = "currentData";
      var filterKeyForCurrentData = self.storeConfiguration.getFilterToUse(contextObj);
      if (filterKeyForCurrentData) {
        currentDataParams[CCConstants.FILTER_KEY] = filterKeyForCurrentData;
      }

      $.when (
        this.loadRequestForLayout(CCConstants.ENDPOINT_GET_LAYOUT, layoutOnlyRequest, id),
        this.loadRequestForLayout(CCConstants.ENDPOINT_PAGES_GET_PAGE, cacheableDataOnlyRequest, id),
        this.loadRequestForLayout(CCConstants.ENDPOINT_PAGES_GET_PAGE, $.extend({}, input, {currentDataOnly:true}), id),
        cssLoader.loadCssForLayout(id)
      ).done (
        function (pLayoutResult, pCacheableDataResult, pCurrentDataResult) {
          if (success) {

            //Set the user pricelist group into site to be backward compatible.
            if(pCurrentDataResult.data.global.user.parentOrganization){
              pCacheableDataResult.data.global.site.priceListGroup.defaultPriceListGroup = pCurrentDataResult.data.global.user.priceListGroup;
              pCacheableDataResult.data.global.site.priceListGroup.activePriceListGroups = [pCurrentDataResult.data.global.user.priceListGroup];
              pCacheableDataResult.data.global.site.currency = pCurrentDataResult.data.global.user.priceListGroup.currency;
            }

            // This will merge the 3 results into 1, meaning the response will look the same to the caller, regardless of the
            // request being split into multiple calls.
            var data = $.extend(true, pLayoutResult, pCacheableDataResult, pCurrentDataResult);
            var result;
            params['pageId'] = id;

            // To ensure backward compatibility, add productTypes from contextHandler to data.
            if (data.data.page && (data.data.page.pageId === "product" || data.data.page.pageId === "category") &&
                data.data.page.hasOwnProperty(CCConstants.PRODUCT_TYPES) == false &&
                self.contextHandler.get(CCConstants.PRODUCT_TYPES, "page")() != undefined) {
              data.data.page[CCConstants.PRODUCT_TYPES] = self.contextHandler.get(CCConstants.PRODUCT_TYPES, "page")();
            }

            // Store the layout ids rendered.
            self.storeConfiguration.storeLayoutIdsRendered(pLayoutResult);

            //Perform the load function to transform the JSON. If
            //load is true, then just pass through the data. Otherwise
            //set result to the transformed data.
            if(loadFunc === true) {
              result = data;
            } else {
              result = loadFunc(data, self, params);

              var currentRegions = self.masterViewModel().regions(),
              newRegions = data.regions,
              i = 0;
              // make them the same length
              currentRegions.length = newRegions.length;
              var pendingRegions = new Array(currentRegions.length);
              self.masterViewModel().regions.valueWillMutate();
              for (i = 0 ; i < currentRegions.length ; i++ ) {
                var differ = regionsDiffer(currentRegions[i],newRegions[i]);
                if (differ) {

                  // check if the current region can be re-used again
                  // if so we'll save it for later in pendingRegions
                  var idx = findRegion(currentRegions[i],newRegions);
                  if (idx != -1 ) {
                    // Save away our pending move
                    pendingRegions[idx] = currentRegions[i];
                  }
                  if(! pendingRegions[i]){
                    var regionBuilder = self.getViewModelBuilder("region");
                    var newRegion = regionBuilder.load(newRegions[i], self, params);
                    // Update the current region to match the new list
                    currentRegions[i] = newRegion;
                  }
                } else {
                  // Associate the new region's id to current region for re-use.
                  currentRegions[i].similarRegions[newRegions[i].id] = {};
                }
              }

              // Make pending changes
              for (i = 0; i < pendingRegions.length ; i++) {
                // if its not undefined, set it on the final array
                if (pendingRegions[i] !== undefined) {
                  self.masterViewModel().regions()[i] = pendingRegions[i];
                }
              }

              self.masterViewModel().regions.valueHasMutated();
              self.masterViewModel().buildRows();
            }


            self.masterViewModel().title(result.title());
            self.masterViewModel().keywords(result.keywords());
            self.masterViewModel().description(result.description());
            self.masterViewModel().metaTags(result.metaTags());
            self.masterViewModel().isPreview(result.isPreview());
            self.masterViewModel().noindex(result.noindex());
            viewportHelper.layoutViewports(result.viewports ? result.viewports() : "");
            // Notify subscribers that the layout has been updated. Publish the page data and event data that caused the update.
            $.Topic(PubSub.topicNames.PAGE_LAYOUT_UPDATED).publish(data, params);

            //update the page change message
            if (data.data.page.category) {
              self.masterViewModel().pageChangeMessage(CCi18n.t(
                'ns.common:resources.categoryPageLoadedText',
                {
                   collection: data.data.page.category.displayName
                 }));
            } else if (data.data.page.product) {
              self.masterViewModel().pageChangeMessage(CCi18n.t(
                  'ns.common:resources.productPageLoadedText',
                  {
                    product: data.data.page.product.displayName
                  }));
            } else if (data.data.page.repositoryId === "userSpacesPage") {
              self.masterViewModel().pageChangeMessage(CCi18n.t('ns.common:resources.wishlistPageLoadedText'));
            }  else if (data.data.page.repositoryId != "searchResultsPage") {
              self.masterViewModel().pageChangeMessage(CCi18n.t(
                  'ns.common:resources.pageLoadedText',
                  {
                    page: data.data.page.repositoryId
                  }));
            }
            if (self.masterViewModel().pageChangeMessage() === "") {
              self.masterViewModel().dataForPageChangeMessage(data.data);
            }

            //Add the item to the cache if it is cachable
            if(builder.cachable) {
              var cacheKey = self.idAndParamsToCacheKey(id, params);
              self.cache.set(type, cacheKey, result);
            }

            //Perform the callback
            success (result, caller);
          } else if (result.status == 404) {
            navigation.goTo("/404", true, true);
          } else if (error && pResult) {
            error(pResult, caller);
          }
        }
      );
    };

    /**
     * Request to load a piece of external data based on type, id, and params. The data is loaded and converted
     * to a view model before being passed to the success callback.
     *
     * @public
     * @function
     * @name LayoutContainer#load
     * @param {string} type The type of data being requested.
     * @param {string|string[]} id The id of the object(s) being loaded using either a simple id (string) or
     * complex id (an array of values).
     * @param {Object} params Additional parameters used for the request.
     * @param {function} success A success function callback. Passes paramters (viewModel, caller). viewModel is the result of the load,
     * caller is used to reference the calling context.
     * @param {function} error An error function callback invoked if there was an error with loading the data.
     * @param {Object} caller The caller to be passed to the success and error callbacks.
     */
    LayoutContainer.prototype.load = function(type, id, params, success, error, caller) {
      var self = this,
          builder,
          loadFunc,
          cacheResult;

      if($.isFunction(params)) {
        if($.isFunction(success)) {
          caller = error;
          error = success;
        } else {
          caller = success;
        }
        success = params;
        params = null;
      } else if(!$.isFunction(error)) {
        caller = error;
        error = null;
      }

      //Get the viewModelBuilder for this type of object. If no builder, we
      //cannot load an object of this type.
      builder = this.getViewModelBuilder(type);

            // If it was not in the cache, need to
      // call the load function
      if(!builder || !builder.load) {
        return;
      }

      //If the object is cachable check the cache and result if there is a cache hit.
      if(builder.cachable) {
        var cacheKey = self.idAndParamsToCacheKey(id, params);
        cacheResult = this.cache.get(type, cacheKey);
        if(cacheResult.hit === true) {
          if(success) {
            success(cacheResult.result, caller);
          }
          return;
        }
      }

      //Get the builder's load function into this context.
      loadFunc = builder.load;

      if(!loadFunc) {
        throw "Loading of resource type: " + type + " forbidden";
      }

      var input = params ? params : {}
      if (type == 'layout' && input.dataOnly === false) {
        this.loadDataForLayout(input, id, success, error, builder, caller)
      } else {
        //Ask the adapter to retreive the object.
        this.adapter.loadJSON(type, id, params,
          //success callback
          function(data) {
            var result;

            //Perform the load function to transform the JSON. If
            //load is true, then just pass through the data. Otherwise
            //set result to the transformed data.
            if(loadFunc === true) {
              result = data;
            } else {
              result = loadFunc(data, self, params);
            }

            //Add the item to the cache if it is cachable
            if(builder.cachable) {
              var cacheKey = self.idAndParamsToCacheKey(id, params);
              self.cache.set(type, cacheKey, result);
            }

            //Perform the callback
            if(success) {
              success(result, caller);
            }
          },
          //error callback
          function(data) {
            if(error) {
              error(data, caller);
            }
          });
        }
    };
    /**
     * Build a view model from the provided json for the given
     * item type then sets that item as the current item for the given type.
     * If the item is cachable and an id is provided the cache will be updated.
     *
     * @private
     * @function
     * @name LayoutContainer#loadCurrentFromJSON
     * @param {String} type The type of item to load and set as current.
     * @param {Object} json The json object to transform into a view model
     * @param {Object} params Additional parameters for the load.
     * @param {string|string[]} id The id for the item as either a simple string id
     *   or complex array id. Required to cache the viewModel. The viewModel
     *   won't be cached if omitted
     */
    LayoutContainer.prototype.loadCurrentFromJSON = function(type, json, params, id) {
      var scope, builder, viewModel, cacheResult;

      builder = this.getViewModelBuilder(type);
      if(!builder) {
        return null;
      }

      if(builder.scope) {
        scope = builder.scope;
      } else {
        scope = 'page';
      }

      if(builder.load) {
        if(builder.load === true) {
          this.contextHandler.set(type, json, scope);

          if(id && builder.cachable) {
            var cacheKey = self.idAndParamsToCacheKey(id, params);
            this.cache.set(type, cacheKey, viewModel);
          }

          return json;
        }

        viewModel = builder.load(json, this, params);
        this.contextHandler.set(type, viewModel, scope);

        if(id && builder.cachable) {
          var cacheKey = self.idAndParamsToCacheKey(id, params);
          this.cache.set(type, cacheKey, viewModel);
        }

        return viewModel;
      }
      return null;
    };

    /**
     * Instantiate a widget from a definition. Effectively copies all properties from
     * the passed widget to a new {@link WidgetViewModel} then initializes the widget. The returned
     * widget is a new WidgetViewModel with all of the same properties & values as the old
     * widget, but with distinct observables.
     *
     * @private
     * @function
     * @name LayoutContainer#instantiateWidget
     * @param {WidgetViewModel} widget The widget definition to instantiate.
     * @returns {WidgetViewModel} The instantiated widget.
     * @see LayoutContainer#initializeWidget
     */
    LayoutContainer.prototype.instantiateWidget = function (widget) {
      var newWidget = new this.WidgetViewModel(this.basePath),
          key,
          ii;

      //Copy all properties from the widget definition to the widget instance
      for(key in widget) {
        if(widget.hasOwnProperty(key)) {
          //If copying an observable, create a new observable.
          if(ko.isObservable(widget[key]) && !ko.isComputed(widget[key])) {
            //If remove exists the observable is an array
            if(widget[key].remove) {
              newWidget[key] = ko.observableArray(widget[key]());
            } else {
              newWidget[key] = ko.observable(widget[key]());
            }
          } else if(!ko.isComputed(widget[key])){
            //If not an observable just copy the value
            newWidget[key] = widget[key];
          }
        }
      }

      //Initialize the new widget
      this.initializeWidget(newWidget, true);

      return newWidget;
    };

    /**
     * Run Widget Initialization after context data has been set from server.
     *
     * @private
     * @function
     * @name LayoutContainer#initializeWidget
     * @param {WidgetViewModel} widget Widget to initialize
     * @param {boolean} load=false Whether to run 'onLoad' function and resolve special properties.
     * @param {function} javascriptLoadedCallback Function/script to run after initializing widget.
     */
    LayoutContainer.prototype.initializeWidget = function (widget, load, javascriptLoadedCallback) {
      var self = this;

      self.contextDataSetSubscriber.done(function(){
        self.runWidgetInitialization(widget, load, javascriptLoadedCallback);
      });
    };

    /**
     * Initializes the widget by loading its custom javascript, resolving any special properties,
     * and running the onLoad function. Marks the widget as initialized once the processing has completed.
     *
     * @private
     * @function
     * @name LayoutContainer#runWidgetInitialization
     * @param {WidgetViewModel} widget The widget to initialize
     * @param {boolean} load Whether or not to run the onLoad function and resolve its
     *   special properties. True will cause the onLoad function to run, default is false.
     * @param {function} javascriptLoadedCallback Function/script to run after initializing widget.
     */
    LayoutContainer.prototype.runWidgetInitialization = function (widget, load, javascriptLoadedCallback) {
      var importKey, imports, scope, ii, layoutContainer = this;

      layoutContainer.pendingWidgets.push(widget);

      if(load) {
        //Load any things pointed to as part of 'current'
        if(widget.imports) {
          imports = ko.utils.unwrapObservable(widget.imports);
          for(ii = imports.length - 1; ii >= 0; ii -= 1) {
            importKey = imports[ii];
            scope = this.getViewModelBuilder(importKey);
            if(scope) {
              scope = scope.scope || 'page';
            }
            widget[importKey] = this.contextHandler.get(importKey, scope);
          }
        }
      }

      //If the widget has javascript load it.
      if(ko.utils.unwrapObservable(widget.javascript)) {
        // Use require to load the javascript.
        // Check asset mappings to make sure we are loading
        // the correct version
        var mappingBase = widget.jsPath() + '/';
        var jsPath = widget.javascript();

        if (widget.assetMappings) {
          var mappingKey = '/js/' + widget.javascript() + '.js';
          var mappingValue = widget.assetMappings[mappingKey];

          if (mappingValue) {
            var idx = mappingValue().lastIndexOf('/');
            mappingBase = mappingValue().substring(0,idx);
            jsPath = mappingValue();
          }
        }
        // While loading the module thru require([],fn{}), require creates a module
        //map with the url to load the module from, dependencies, and call back after
        //loading the module.  During the migration from require 2.0.6 to require.js 2.1.10,
        //it is observed that there is a delay of the 4 milliseconds added by require to load
        //the dependencies as part of context.nextTick.and prepare the module map after
        //that delay. This was creating the problem while loading the widgets as the delay
        //overrides the base url for all the widgets. So we have to override the nextTick
        //implementation to execute load immediately.
        requirejs.s.contexts._.nextTick = function(fn){fn();}

        var mapping = requirejs.s.contexts._.config.map ? requirejs.s.contexts._.config.map : {};

        mapping[jsPath] = {};

        // For widgets that contain multiple js files, we need to provide a mapping so that require knows to load it from the url specified in asset mappings

        // load js extension if available
        var extJsDeferred = $.Deferred();
        if (widget.javascriptExtension() !== null) {
          var extjsMapping = widget.assetMappings["/js/ext/" + widget.javascriptExtension()];
          var extjsPath = ko.unwrap(extjsMapping);
          if (extjsPath) {
            require([extjsPath], function( extjs ) {
              if (extjs && extjs.onLoad && typeof extjs.onLoad === 'function') {
                extjs.onLoad.call(widget,widget);
              }
              widget.__cc__extjs = extjs;
              // notify deferred that we are ready. this is used to make sure
              // extensionjs beforeAppear is called after the parent widgets beforeAppear
              extJsDeferred.resolve(extjs);
            });
          }
        }

        for (var asset in widget.assetMappings) {
          // Just map js files that aren't the main widget js file
          if (asset.indexOf('/js/') === 0 && asset.indexOf(widget.javascript() + '.js') === -1) {
            var extPos = asset.indexOf('.js');
            var url = widget.assetMappings[asset]();
            var moduleName = asset.substring(1, extPos);
            mapping[jsPath][moduleName] = url;
          }
        }

        require({baseUrl: mappingBase, map : mapping}, [jsPath], function(extensions) {
          if(typeof extensions === 'function') {
            extensions = extensions().bind(ko);
          }
          var key;
          //For each property in the returned object copy it to the widget.
          for(key in extensions) {
            if(extensions.hasOwnProperty(key)) {
              //If copying an observable, create a new observable.
              if(ko.isObservable(extensions[key]) && !ko.isComputed(extensions[key])) {
                if(extensions[key].remove) {
                  widget[key] = ko.observableArray(extensions[key]());
                } else {
                  widget[key] = ko.observable(extensions[key]());
                }
              } else {
                widget[key] = extensions[key];
              }
            }
          }
          // Let the widget know that all its properties have been set
          widget.allPropertiesSet(widget);
          if (!extensions) {
            ccLogger.warn("Failed to execute javascript for widget: " + widget.javascript());
          }
          //Run the onLoad function for the extended javascript
          if(load && extensions && extensions.onLoad) {
            extensions.onLoad(widget);
          }

          // Some things need i18n resources loaded first
          if(load && extensions && extensions.resourcesLoaded) {
            if(widget.resources()) {
              extensions.resourcesLoaded(widget);
            }

            widget.resources.subscribe(function(resources) {
              if(resources) {
                // resource bundle has been loaded.
                extensions.resourcesLoaded(widget);
              }
            });
          }

          // Mark as initialized
          widget.initialized(true);
          if (javascriptLoadedCallback)
            javascriptLoadedCallback.call(this,widget);
          // remove us from pending list
          layoutContainer.pendingWidgets.remove(widget);
          // Used to notify widget that it is about to be displayed on a page
          if (widget.hasBeforeAppear()) {
            $.Topic(PubSub.topicNames.PAGE_READY).subscribe(
              widget.maybeFireBeforeAppearExtJSDeferred(extJsDeferred).bind(widget)
            );
          }
        });
        //Reset the overridden behaviour so that loading behaviuour of other modules is not affected
        requirejs.s.contexts._.nextTick = requirejs.nextTick;
      } else {
        layoutContainer.pendingWidgets.remove(widget);
        // Mark as initialized
        widget.initialized(true);
      }
    };

      /**
       * Convert an id and params map into an array key for caching.
       *
       * @private
       * @function
       * @name LayoutContainer#idAndParamsToCacheKey
       * @param {string} pId ID
       * @param {Object} pParams Parameter object
       * @returns pId if pParams is null, otherwise returns an Array containing pId and the values of param
       *   keys PAGE_PARAM and DATA_ONLY if those keys exist in pParams.
       */
      LayoutContainer.prototype.idAndParamsToCacheKey = function(pId, pParams) {
        if(pParams == null)
          return pId;
        var keyArray = new Array();
        keyArray.push(pId);
        if(pParams[CCConstants.PAGE_PARAM])
          keyArray.push(pParams[CCConstants.PAGE_PARAM]);
        if(pParams[CCConstants.DATA_ONLY])
          keyArray.push(pParams[CCConstants.DATA_ONLY]);
        return keyArray;
      };

      /**
       * This method is executed when page is ready. This records the page view
       * count and sends to the server and then calls the Visitor Id service if
       * a visitorId doesn't exist.
       *
       * @private
       * @function
       * @name LayoutContainer#pageReady
       */
      LayoutContainer.prototype.pageReady = function() {
        var self = this;
        if (!self.isServerSideProcess()) {
          if (!self.isPreview) {
            var pageViewEvent = pageViewTracker.createPageViewEvent(1);
            pageViewTracker.recordPageChange(pageViewEvent);
          }
        }
      };

      /**
       * Check whether a server side process (SEO Scheduler) generated the pages.
       *
       * @function
       * @name LayoutContainer#isServerSideProcess
       * @returns {boolean} true if page was generated by a server side process, otherwise false.
       */
      LayoutContainer.prototype.isServerSideProcess = function() {
        var isServerSide = false;
        var url = window.location.href;
        if (url.indexOf(CCConstants.SERVERSIDE_PROCESS_STRING) != -1) {
          isServerSide = true;
        }
        return isServerSide;
      };

      /**
       * Convert parameter data from the URL into an key/value object.
       *
       * @private
       * @function
       * @name LayoutContainer#getParameterData
       * @param {string} args String representation of URL parameters
       * @returns {Object} Object where each URL parameter is converted to a key:value.
       */
      LayoutContainer.prototype.getParameterData = function(args) {
        var param = args.split("&");
        var parameters = {};
        for (var i = 0; i < param.length; i++) {
          var tempParam = param[i].split("=");
          parameters[tempParam[0]] = tempParam[1];
        }
        return parameters;
      };

      /**
       * Checkout for network errors and notify the user. E.g. This method is executed when user is
       * not connected to internet.
       *
       * @private
       * @function
       * @name LayoutContainer#networkError
       */
      LayoutContainer.prototype.networkError = function() {
        var self = this;
        self.networkErrorMessage = CCi18n.t(
                'ns.common:resources.networkConnectivityError', {}
              );
        self.networkErrorReloadText = CCi18n.t(
                'ns.common:resources.reloadPage', {}
              );
        $(window).scrollTop('0');
        //To hide modals if any
        $('.modal').modal('hide');
        //To hide spinner if any
        $('#loadingModal').hide();
        $('body').removeClass('modal-open');
        $('.modal-backdrop').remove();
        notifier.sendTemplateInfo(CCConstants.LAYOUT_CONTAIER_ID, self, 'notificationsNetworkError');
      };

     /** Catches all the run time errors
     * supported on browsers : Chrome 13+
     * Firefox 6.0 Internet Explorer 5.5+
     * Opera 11.60+ Safari 5.1+
     *@param {String} errorMessage is the error message
      @param {String} errorUrl where error was raised
      @param {Number} errorLineNumber number where error was raised
     */
    window.onerror = function(errorMessage, errorUrl, errorLineNumber, errorColNumber, errorObj) {
      $.Topic(PubSub.topicNames.ONERROR_EXCEPTION_HANDLER).publish(errorMessage,
        errorUrl, errorLineNumber, errorColNumber, errorObj);
    }

    //--------------------------------------------------------------------
    // Static member variables
    //--------------------------------------------------------------------

    /**
     * The LayoutViewModel constructor to used to create layouts.
     * @private
     * @type {LayoutViewModel}
     * @name LayoutContainer.LayoutViewModel
     */
    LayoutContainer.prototype.LayoutViewModel = LayoutViewModel;

    /**
     * The RegionViewModel constructor used to create regions.
     * @private
     * @type {RegionViewModel}
     * @name LayoutContainer.RegionViewModel
     */
    LayoutContainer.prototype.RegionViewModel = RegionViewModel;

    /**
     * The WidgetViewModel constructor used to create widgets.
     * @private
     * @type {WidgetViewModel}
     * @name LayoutContainer.WidgetViewModel
     */
    LayoutContainer.prototype.WidgetViewModel = WidgetViewModel;

    /**
     * The CartViewModel constructor used to create the cart.
     * @private
     * @type {CartViewModel}
     * @name LayoutContainer.CartViewModel
     */
    LayoutContainer.prototype.CartViewModel = CartViewModel;

    /**
     * The OrderViewModel constructor used to create orders.
     * @private
     * @type {OrderViewModel}
     * @name LayoutContainer.OrderViewModel
     */
    LayoutContainer.prototype.OrderViewModel = OrderViewModel;

    /**
     * The SearchViewModel constructor used to create searches.
     * @private
     * @type {SearchViewModel}
     * @name LayoutContainer.SearchViewModel
     */
    LayoutContainer.prototype.SearchViewModel = SearchViewModel;

    /**
     * The ShippingMethodsViewModel constructor used to create a list of
     * shipping methods.
     * @private
     * @type {ShippingMethodsViewModel}
     * @name LayoutContainer.ShippingMethodsViewModel
     */
    LayoutContainer.prototype.ShippingMethodsViewModel = ShippingMethodsViewModel;

    /**
     * The PaymentDetails constructor used to create PaymentDetails
     * view model.
     * @private
     * @type {PaymentDetails}
     * @name LayoutContainer.PaymentDetails
     */
    LayoutContainer.prototype.PaymentDetails = PaymentDetails;

    /**
     * The PaymentAuthResponseViewModel constructor used to create
     * the payment authorization view model.
     * @private
     * @type {PaymentAuthResponseViewModel}
     * @name LayoutContainer.PaymentAuthResponseViewModel
     */
    LayoutContainer.prototype.PaymentAuthResponseViewModel = PaymentAuthResponseViewModel;

    /**
     * The UserViewModel constructor used to create
     * the user registration and login view model.
     * @private
     * @type {UserViewModel}
     * @name LayoutContainer.UserViewModel
     */
    LayoutContainer.prototype.UserViewModel = UserViewModel;

    /**
     * The ProductViewModel constructor used to represent product.
     * @private
     * @type {ProductViewModel}
     * @name LayoutContainer.ProductViewModel
     */
    LayoutContainer.prototype.ProductViewModel = ProductViewModel;


    /**
     * The OrderDetailsViewModel constructor used create.
     * @private
     * @type {OrderDetailsViewModel}
     * @name LayoutContainer.OrderDetailsViewModel
     */
    LayoutContainer.prototype.OrderDetailsViewModel = OrderDetailsViewModel;

    /**
     * The SpaceViewModel constructor used to represent your current Space.
     * @private
     * @type {SpaceViewModel}
     * @name LayoutContainer.SpaceViewModel
     */
    LayoutContainer.prototype.SpaceViewModel = SpaceViewModel;

    LayoutContainer.prototype.ServerData = ServerData;

    /**
     * The SiteViewModel constructor used to represent price list groups.
     * @private
     * @type {SiteViewModel}
     * @name LayoutContainer.SiteViewModel
     */
    LayoutContainer.prototype.SiteViewModel = SiteViewModel;

    /**
     * Refresh page on layout change and if publish has happened.
     */
    LayoutContainer.prototype.shouldPageBeRefreshed = function(page) {
      if (ccRestClient.isRefreshRequired && page !== 'payment') {
        window.location.reload();
      }
    };

    return LayoutContainer;
  }
);

