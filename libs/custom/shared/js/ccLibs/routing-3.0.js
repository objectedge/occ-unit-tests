define(

  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'routing',

  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  [
    'jquery',
    'crossroads',
    'pubsub',
    'ccConstants',
    'navigation',
    'ccNavState'
  ],

  //-------------------------------------------------------------------
  // MODULE DEFINTIION
  //-------------------------------------------------------------------
  function($, crossroads, PubSub, CCConstants, navigation, ccNavState) {

    "use strict";

    //----------------------------------------
    // Private Variables
    //----------------------------------------
    
    // routing variables
    var currentPath                      = null,
        currentParameters                = null,
        defaultRoute                     = null,
        defaultParameterRoute            = null,
        defaultPageNumberRoute           = null,
        defaultPageNumberParametersRoute = null,
        noEncodeUrls                     = ["searchresults"],
        loaded                           = false,
        additionalRoutes                 = {};

    //----------------------------------------
    /**
     * constructor
     */
    function Routing() {
      var self = this;
      
      // Override crossroads.parse().
      var oldCrossroadsParse = crossroads.parse;

      crossroads.parse = function(origRequest, defaultArgs) {
        var request = origRequest,
        shouldEncode = true;
        // some url paths should not be encoded
        for (var i = 0 ; i < noEncodeUrls.length; i++ ) {
          if (origRequest && origRequest.indexOf(noEncodeUrls[i]) !== -1) {
            shouldEncode = false;
            break;
          }
        }
        if (shouldEncode) {
          request = self.uriEncodeQueryString(origRequest);
        }
        // Still need to maintain history for back button on product details. see widget.js#updateHistoryStackArray
        var oldPath = navigation.getPath();
        var eventData = {'oldHash' : oldPath, 'newHash' : request};
        $.Topic(PubSub.topicNames.UPDATE_HASH_CHANGES).publish(eventData);

        request = navigation.getPathWithoutContext(request);

        // Call the real function.
        oldCrossroadsParse.call(this, request, defaultArgs);
      };

      $.Topic(PubSub.topicNames.HISTORY_PUSH_STATE).subscribe(self.historyPushed.bind(self));
      // ------------------------------------------
      // route definitions

      /**
       * Function compares to paths for equality. Leading slashes '/' are stripped off each path first,
       * to ensure consistent comparisons
       */
      function pathsEqual(pathA, pathB) {

        if (pathA) {
          pathA = (pathA.charAt(0) === '/') ? pathA.substr(1) : pathA;
        }

        if (pathB) {
          pathB = (pathB.charAt(0) === '/') ? pathB.substr(1) : pathB;
        }

        return (pathA === pathB);
      }

      /**
       * All route matches go through the function.
       */
      function defaultRouteHandler(pPath, pParameters, pPageNumber) {
        pPath = window.routePath || pPath;

        if (pPath == '/' || pPath === 'app/debug.html') {
          pPath = 'home';
        }

        pPath = (pPath.charAt(0) === '/') ? pPath.substr(1) : pPath;

        var paginationOnlyChange = false;

        pPath = navigation.getPathWithoutLocale(pPath);

        if (pathsEqual(currentPath, pPath) && pPageNumber) {
          paginationOnlyChange = true;
        }

        $.Topic(PubSub.topicNames.PAGE_PAGINATION_CHANGE).publish({
          page: pPageNumber,
          paginationOnly: paginationOnlyChange
        },[{message:"success"}]);

        if (pParameters && self.shouldDecode(pPath)) {
          pParameters = decodeURIComponent(pParameters);
        }

        var data = {
          path : pPath,
          parameters : pParameters,
          page : pPageNumber,
          paginationOnly : paginationOnlyChange
        };

        if (!paginationOnlyChange) {

          self.handleViewChanged(data);

        } else if (currentParameters !== pParameters) {

          $.Topic(PubSub.topicNames.PAGE_PARAMETERS_CHANGED).publish(data);

        }

        currentPath = pPath;
        currentParameters = pParameters;
        loaded = true;
      }

      function defaultRoutePageNumberHandler(pPath, pPageNumber, pParameters) {
        defaultRouteHandler(pPath, pParameters, pPageNumber);
      }

      defaultRoute = crossroads.addRoute('{path*}', null, 500);
      defaultRoute.matched.add(defaultRouteHandler);

      defaultParameterRoute = crossroads.addRoute('{path*}?{parameters}', null, 600);
      defaultParameterRoute.matched.add(defaultRouteHandler);

      /*
       * This function adds page number and parameter routes for the current page, for pagination.
       * This will generally be called for category pages only and will create pageNumber routes on demand.
       *
       * e.g. /for-the-home/category/homeStoreRootCategory/{pageNumber}
       *      /for-the-home/category/homeStoreRootCategory/{pageNumber}?{parameters}
       */
      function addPageNumberRouteMatchersForRoute(route) {
        ccNavState.route(route);

        if (!additionalRoutes[route]) {
          // Store the routes to avoid creating more later on.
          additionalRoutes[route] = {
            // prioritise these above the default routes above (800 & 850), as these will be a near exact match on the category route.
            pageNumber : crossroads.addRoute(route + '/{pageNumber}', null, 800),
            pageNumberParameters : crossroads.addRoute(route + '/{pageNumber}?{parameters}', null, 850)
          };

          additionalRoutes[route].pageNumber.matched.add(function(pageNumber) {
            defaultRoutePageNumberHandler(route, pageNumber);
          });

          additionalRoutes[route].pageNumberParameters.matched.add(function(pageNumber, parameters) {
            defaultRoutePageNumberHandler(route, pageNumber, parameters);
          });
        }
      }

      // function checks if the current page is a category page and adds pagination route matchers if so.
      function addAdditionalRoutesIfCategoryPage(pageResult, pageEventData) {

        if ('category' === pageResult.data.page.pageId) {
          var route = pageResult.data.page.category.route;

          addPageNumberRouteMatchersForRoute(route);
        }
      }

      $.Topic(PubSub.topicNames.PAGE_LAYOUT_LOADED).subscribe(addAdditionalRoutesIfCategoryPage);

      /*
       * This all sets up hasher to do it's thing.  Add a parsing method [1],
       * listen for changes with that parsing method, then initialize (run)
       * Hasher.
       *
       * [1] Maybe there's something clever we want to do here to track the
       * hash values, or something else?  But this is obviously where the old
       * and new values are available for any cleverness.
       */
      function parseHash(newHash, oldHash) {
        crossroads.parse(newHash);
      }

      function initializeFromUrl() {
        var url = window.location.pathname, paginating=false;

        // If the on load page has a page number, we need to cater for that when we initializeFromUrl.
        if (ccNavState.statusCode() === '200' && ccNavState.pageNumber() && ccNavState.pageNumber() > 1) {
          var route = '', parts = url.split('/'), potentialPageNumber = parts[parts.length-1];

          if (potentialPageNumber === ccNavState.pageNumber()) {
            for (var i=0;i<parts.length-1;i++) {
              if (parts[i] !== '') {
                route = route + '/' + parts[i];
              }
            }

            // add the pagination routes for the current page. These are added before crossroads.parse is called.
            addPageNumberRouteMatchersForRoute(route);
          }
        }

        // Handling serverside query param to make sure that does not cause the
        // normal flow to be disrupted.
        if (window.location.search != CCConstants.URL_SERVERSIDE) {
          url += window.location.search;
        }

        if (ccNavState.statusCode() === '404') {
          url = '/404';
        }

        $.Topic(PubSub.topicNames.HISTORY_PUSH_STATE).publish(url);
        if (navigation.checkLogin) navigation.checkLogin(url);
      }

      if (window.history && window.history.pushState) {
        window.addEventListener('popstate', function(event) {
          crossroads.parse(location.pathname + location.search);
        });
      }

      initializeFromUrl();

      return (self);
    }

    // ----------------------------------------
    /**
     * Initialize CrossroadsJS and Hasher to listen for HASH URL change events.
     * When the URL changes, a new page model will be loaded.
     *
     * extra credit: can we cache this view model to avoid trips to the server?
     */

     /**
      * Encode the query string parameters of the given url and return the encoded
      * version. This avoids passing characters into crossroadsjs that may confuse
      * its regular expression used for parsing the uri.
      * @param  {String} uri The uri to be encoded. Only the query string key and values will be encoded
      * @return {String}     The encoded uri
      */
    Routing.prototype.uriEncodeQueryString = function (uri) {
      if (!uri) return null;
      var newUri = uri,
        params = {};
      if (uri.indexOf("?") != -1) {
        var uriSplit = uri.split("?"),
          queryParams = uriSplit[1].split("&"),
          newqs = "";
        for ( var i = 0; i < queryParams.length; i++) {
          var keyValue = queryParams[i].split("=");
          params[keyValue[0]] = encodeURIComponent(keyValue[1]);
        }
        // reconstruct query string
        var needsAmpersand = false;
        for (var key in params) {
          var value = params[key];
          if (needsAmpersand) {
            newqs += "&";
          }
          newqs+=key+"="+value;
          needsAmpersand = true;
        }
        newUri = uriSplit[0] + "?" + newqs;
      }
      return newUri;
    };

    /**
     * Catch HTML5 History push, generally done by ccLink binding.
     */
    Routing.prototype.historyPushed = function (args) {
      crossroads.parse(args);
    };

    /**
     * Listens for viewChanged events
     * Loads the current view model for the view to which we have changed.
     *
     * When we map a view model twice it causes infinite recursion in
     * knockout.mapping. To work around the issue we're just making a new
     * layout view model each time and updating just the regions property
     * on our local model.
     *
     * data - expected set of values is the following:
     *  pageId
     *    String of the page type ID to load (e.g., category, product, etc.).
     *  contextId
     *    String of the context ID (e.g., category ID, product ID, etc.).
     */
    Routing.prototype.handleViewChanged = function(data) {
      $.Topic(PubSub.topicNames.PAGE_VIEW_CHANGED).publish(data);
    }; // handleViewChanged

    /**
     *
     * Listens for the parameter change.
     * data - expected set of values:
     *  pageId
     *    String of the page type ID to load
     *  parameters
     *    String of parameters in amp(&) separated values
     */
    Routing.prototype.handleParametersChanged = function(data) {
      $.Topic(PubSub.topicNames.PAGE_PARAMETERS_CHANGED).publish(data);
    };

    /**
     * A method for determining if the uri parameters should be decoded. Note that the parameters
     * are encoded in the constructor to avoid parsing problems in crossroads.
     * pageId
     *   String of the page type ID
    */
    Routing.prototype.shouldDecode = function(pageId){
      var shouldDecode = true;
      // no need to decode the urls that are not encoded in the first place.
      for (var i = 0 ; i < noEncodeUrls.length; i++ ) {
        if (noEncodeUrls[i].indexOf(pageId) !== -1) {
          shouldDecode = false;
          break;
        }
      }
      return shouldDecode;
    };

    return Routing;
  }
);
