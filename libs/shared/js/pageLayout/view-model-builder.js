/**
 * @fileoverview View Model Builder that constructs view models based off
 * of input JSON and determines the view model behavior
 *
 */
define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'pageLayout/view-model-builder',

  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['knockout', 'viewModels/paymentsViewModel'],

  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (ko, PaymentsViewModel) {

    "use strict";

    //-----------------------------------------------------------------
    // Class definition & member variables
    //-----------------------------------------------------------------
    /**
     * @namespace ViewModelBuilder
     * @name ViewModelBuilder
     * @private
     * @property {LayoutViewModel} layout Layout view model.
     * @property {WidgetViewModel} widget Widget view model.
     * @property {ProductViewModel} product Product view model.
     * @property {WidgetViewModel} widgetDefinition Widget definition view model.
     * @property {OrderViewModel} order Order view model.
     * @property {ProductViewModel[]} productList List of product view models.
     * @property {Object[]} categoryList List of categories.
     * @property {CartViewModel} cart Cart view model.
     * @property {PaymentAuthResponseViewModel} paymentauthorization Payment authorisation response view model.
     * @property {SearchViewModel} search Search view model.
     * @property {ShippingMethodsViewModel} shippingMethods Shipping methods view model.
     * @property {SpaceViewModel} space Space view model.
     * @property {UserViewModel} user User view model.
     */
    return {
      //-------------------------------------------------------------
      // Page Object Type
      //-------------------------------------------------------------
      /**
         @name ViewModelBuilder.page
         @private
         @class Builder for the page type. Handles transforming data to and
         from JSON.
       */
      page: {
        scope: 'global',

        /**
           Whether or not pages are cachable.
           @private
           @memberof ViewModelBuilder.page
           @name cachable
           @type {boolean}
           @default true
         */
        cachable: true,
        /**
           Whether or not a page can be loaded without transformation.
           @private
           @memberof ViewModelBuilder.page
           @name load
           @type {boolean}
           @default true
         */
        load: true
      },

      //-------------------------------------------------------------
      // Layout context object type
      //-------------------------------------------------------------
      /**
       * @name ViewModelBuilder.layout
       * @private
       * @class Builder for the layout type. Handles transforming data to and
       *        from JSON.
       */
      layout: {
        /**
         * Whether or not layouts are cacheable.
         *
         * @private
         * @memberof ViewModelBuilder.layout
         * @name cacheable
         * @type {boolean}
         * @default true
         */
        cachable: false,

        /**
         * Converts json to a {LayoutViewModel}.
         *
         * @private
         * @memberof ViewModelBuilder.layout
         * @function load
         * @param {Object} data The JSON data to convert.
         * @param {Object} [caller] The caller of this function.
         * @param {Object} [params] Additional parameters for this
         *        transformation.
         */
        load: function(data, caller, params) {
          var layout;
          // Create the layout and map it to the JSON
          if(params && params.model) {
            layout = params.model;
          } else {
            layout = new caller.masterViewModel();
          }
          var mapping = {'ignore': ["data", "regions"]};
          // this is done in layout view model already caller.setContextData(data.data);
          ko.mapping.fromJS(data, mapping, layout);
          layout.data = data.data;
          return layout;
        }
      },

      region: {
        /**
         * Whether or not layouts are cacheable.
         *
         * @private
         * @memberof ViewModelBuilder.layout
         * @name cacheable
         * @type {boolean}
         * @default true
         */
        cachable: false,

        /**
         * Converts json to a {LayoutViewModel}.
         *
         * @private
         * @memberof ViewModelBuilder.layout
         * @function load
         * @param {Object} data The JSON data to convert.
         * @param {Object} [caller] The caller of this function.
         * @param {Object} [params] Additional parameters for this
         *        transformation.
         */
        load: function(data, caller, params) {
          var regionModel=null, cacheRegionResult;
          if(data.id !== null && data.id !== undefined){
            cacheRegionResult = caller.cache.get('region', data.id);
            if (cacheRegionResult !== undefined && cacheRegionResult.hit !== undefined && cacheRegionResult.hit) {
              // use the cached result
              regionModel = cacheRegionResult.result;
              // If metadata is present add/update it with the server data even though the cached region is used.
              if (data.metadata) {
                regionModel.metadata(data.metadata);
              }
            } else {
              regionModel = new caller.RegionViewModel();
              ko.mapping.fromJS(data, caller.layoutMapping, regionModel);
              caller.cache.set('region', data.id, regionModel);
            }
          }

          // May be some further processing of metadata required
          regionModel.handleMetadata();
          return regionModel;
        }
      },

      //-------------------------------------------------------------
      // Widget definition object type
      //-------------------------------------------------------------
      /**
       * @name ViewModelBuilder.widgetDefinition
       * @private
       * @class Builder for the widgetDefinition type. Handles transforming
       *        widget data to and from JSON.
       */
      widgetDefinition: {
        /**
           Whether or not layouts are cacheable.
           @private
           @memberof ViewModelBuilder.widgetDefinition
           @name cacheable
           @type {boolean}
           @default true
         */
        cachable: true,

        /**
         * Converts JSON to a {WidgetViewModel} representing a widget
         * definition.
         *
         * @private
         * @memberof ViewModelBuilder.widgetDefinition
         * @function load
         * @param {Object} data The JSON data to convert.
         * @param {Object} [caller] The caller of this function.
         * @param {Object} [params] Additional parameters for this
         *        transformation.
         * @param {boolean} [params.load=false] Whether or not the widget's
         *        onLoad function should be run.
         */
        load: function(data, caller, params) {

          var load = false;
          var widget = new caller.WidgetViewModel(caller.basePath);

          if(params && params.load === true) {
            load = true;
          }

          ko.mapping.fromJS(data, {}, widget);
          caller.initializeWidget(widget, load);
          return widget;
        }
      },

      //-------------------------------------------------------------
      // Widget instance object type
      //-------------------------------------------------------------
      /**
         @name ViewModelBuilder.widget
         @private
         @class Builder for the widget type. Handles transforming data to and
         from JSON.
       */
      widget: {
        /**
           Whether or not layouts are cachable.
           @private
           @memberof ViewModelBuilder.widget
           @name cachable
           @type {boolean}
           @default true
         */
        cachable: true,

        /**
           Converts json to a {WidgetViewModel} representing a widget instance.
           @private
           @memberof ViewModelBuilder.widget
           @function load
           @param {Object} data The json data to convert.
           @param {Object} [caller] The caller of this function.
           @param {Object} [params] Additional parameters for this transformation.
           @param {boolean} [params.load=true] Whether or not the widget's onLoad function should be run.
         */
        load: function(data, caller, params) {

          var load = true;
          var widget = new caller.WidgetViewModel(caller.basePath);

          if(params && params.load === false) {
            load = false;
          }

          ko.mapping.fromJS(data, {}, widget);
          caller.initializeWidget(widget, load);
          return widget;
        }
      },

      category: {
        cachable: true,
        load: true
      },

      //-------------------------------------------------------------
      // Product Object Type
      //-------------------------------------------------------------
      /**
         @name ViewModelBuilder.product
         @private
         @class Builder for the product type. Handles transforming data to and
         from JSON.
       */
      product: {
        /**
           Whether or not layouts are cachable.
           @private
           @memberof ViewModelBuilder.product
           @name cachable
           @type {boolean}
           @default true
         */
        cachable: true,
        /**
           Whether or not a product can be loaded without transformation.
           @private
           @memberof ViewModelBuilder.product
           @function load
           @type {boolean}
           @default true
         */
        load: function(data, caller, params) {
            var load = true;
            if (params && params.load === false) {
              load = false;
            }
            var product = new caller.ProductViewModel(data, params);
            //layout container should get sku properties.
            product.fetchSkuProperties();
            return product;
          }
      },

//      //-------------------------------------------------------------
//      // User Object Type
//      //-------------------------------------------------------------
//      /**
//         @name ViewModelBuilder.user
//         @private
//         @class Builder for the user type. Handles transforming data to and
//         from JSON.
//       */
//      user: {
//        scope: 'global',
//
//        /**
//           Whether or not users are cachable.
//           @private
//           @memberof ViewModelBuilder.user
//           @name cachable
//           @type {boolean}
//           @default true
//         */
//        cachable: false,
//        /**
//           Whether or not a user can be loaded without transformation.
//           @private
//           @memberof ViewModelBuilder.user
//           @name load
//           @type {boolean}
//           @default true
//         */
//        load: true
//      },

      //-------------------------------------------------------------
      // Store Object Type
      //-------------------------------------------------------------
      /**
         @name ViewModelBuilder.store
         @private
         @class Builder for the store type. Handles transforming data to and
         from JSON.
       */
      store: {
        scope: 'global',

        /**
           Whether or not stores are cachable.
           @private
           @memberof ViewModelBuilder.store
           @name cachable
           @type {boolean}
           @default true
         */
        cachable: true,
        /**
           Whether or not a store can be loaded without transformation.
           @private
           @memberof ViewModelBuilder.store
           @name load
           @type {boolean}
           @default true
         */
        load: true
      },

      //-------------------------------------------------------------
      // Links Object Type
      //-------------------------------------------------------------
      /**
         @name ViewModelBuilder.links
         @private
         @class Builder for the links type. Handles transforming data to and
         from JSON.
       */
      links: {
        scope: 'global',

        /**
           Whether or not the links are cachable.
           @private
           @memberof ViewModelBuilder.links
           @name cachable
           @type {boolean}
           @default false
         */
        cachable: false,
        /**
           Whether or not a store can be loaded without transformation.
           @private
           @memberof ViewModelBuilder.links
           @name load
           @type {boolean}
           @default true
         */
        load: true
      },

      //-------------------------------------------------------------
      // Payment Object Type
      //-------------------------------------------------------------
      /**
         @name ViewModelBuilder.links
         @private
         @class Builder for the paymeny type. Handles transforming data to and
         from JSON.
       */
      payment: {
        scope: 'page',

        /**
           Whether or not the payment info is cachable.
           @private
           @memberof ViewModelBuilder.links
           @name cachable
           @type {boolean}
           @default false
         */
        cachable: false,
        create: true,
        /**
           Whether or not a store can be loaded without transformation.
           @private
           @memberof ViewModelBuilder.links
           @name load
           @type {boolean}
           @default true
         */
        load: function(data, caller, params) {
          PaymentsViewModel.getInstance(data, caller.contextHandler.get("user","global"));
          return caller.PaymentDetails.getInstance(caller.adapter, data, caller.contextHandler.get("user","global"));
        }
      },

      //-------------------------------------------------------------
      // Cart Object Type
      //-------------------------------------------------------------
      /**
         @name ViewModelBuilder.cart
         @private
         @class Builder for the cart type. Handles transforming data to and
         from JSON.
       */
      cart: {
        scope: 'global',

        /**
           Whether or not the cart is cachable.
           @private
           @memberof ViewModelBuilder.cart
           @name cachable
           @type {boolean}
           @default false
         */
        cachable: false,
        /**
           This method creates the cart view model. It passes all data received
           from the page responder to the shopping cart to populate it. If no
           data exists then this data is read from the cookie and the cart is
           populated from there.
           @private
           @memberof ViewModelBuilder.cart
           @function load
           @param {Object} data The json data to convert.
           @param {Object} [caller] The caller of this function.
           @param {Object} [params] Additional parameters for transformation.
         */
        load: function(data, caller, params) {
          return caller.CartViewModel.getInstance(caller.adapter, data, params, caller.contextHandler.get("user","global"));
        }
      },

      //-------------------------------------------------------------
      // Order Object Type
      //-------------------------------------------------------------
      /**
         @name ViewModelBuilder.order
         @private
         @class Builder for the order type. Handles transforming data to and
         from JSON.
       */
      order: {
        scope: 'page',

        /**
           Whether or not the oder is cachable.
           @private
           @memberof ViewModelBuilder.order
           @name cachable
           @type {boolean}
           @default false
         */
        cachable: false,
        /**
           This method creates the order view model. It passes all data received
           from the page responder to the order to populate it.
           @private
           @memberof ViewModelBuilder.order
           @function load
           @param {Object} data The json data to convert.
           @param {Object} [caller] The caller of this function.
           @param {Object} [params] Additional parameters for transformation.
         */
        load: function(data, caller, params) {
          return caller.OrderViewModel.getInstance(caller.adapter, caller.contextHandler.get("cart","global"), data, params, caller.contextHandler.get("user","global"));
        }
      },

      //-------------------------------------------------------------
      // Confirmation Object Type
      //-------------------------------------------------------------
      /**
         @name ViewModelBuilder.confirmation
         @private
         @class Builder for the confirmation type. Handles transforming data to
         and from JSON.
       */
      confirmation: {
        /**
           Whether or not layouts are cachable.
           @private
           @memberof ViewModelBuilder.confirmation
           @name cachable
           @type {boolean}
           @default true
         */
        cachable: true,
        /**
           Whether or not a confirmation can be loaded without transformation.
           @private
           @memberof ViewModelBuilder.confirmation
           @name load
           @type {boolean}
           @default true
         */
        load: true
      },

      //-------------------------------------------------------------
      // Product List Object Type
      //-------------------------------------------------------------

      productList: {
        /**
           Whether or not layouts are cachable.
           @type {boolean}
           @memberof ViewModelBuilder.productList
           @name cachable
           @default false
         */
        cachable: true,

        /**
           Converts json to an Array of products representing a product list.
           @private
           @memberof ViewModelBuilder.productList
           @function load
           @param {Object} data The json data to convert.
           @param {Object} [caller] The caller of this function.
           @param {Object} [params] Additional parameters for this transformation.
         */
        load: function(data, caller, params) {
          return data.products;
        }
      },

      //-------------------------------------------------------------
      // Category List Object Type
      //-------------------------------------------------------------
      /**
       * @name ViewModelBuilder.categoryList
       * @private
       * @class Builder for the categoryList type. Handles transforming category
       *        data to and from JSON.
       */
      categoryList: {
        /**
         * Whether or not layouts are cacheable.
         *
         * @private
         * @memberof ViewModelBuilder.categoryList
         * @name cacheable
         * @type {boolean}
         * @default true
         */
        cachable: false,

        /**
         * Converts JSON to an Array of categories representing a list of
         * categories.
         *
         * @private
         * @memberof ViewModelBuilder.categoryList
         * @function load
         * @param {Object} data The JSON data to convert.
         * @param {Object} [caller] The caller of this function.
         * @param {Object} [params] Additional parameters for this
         *        transformation.
         */
        load: function(data, caller, params) {
          return data;
        }
      },

      //-------------------------------------------------------------
      // Search Object Type
      //-------------------------------------------------------------
      /**
         @name ViewModelBuilder.search
         @private
         @class Builder for the search type. Handles transforming data to and from JSON.
       */
      search: {
        scope: 'global',

        /**
           Whether or not the search is cachable.
           @private
           @memberof ViewModelBuilder.search
           @name cachable
           @type {boolean}
           @default false
         */
        cachable: false,
        /**
           This method creates the search view model.
           @private
           @memberof ViewModelBuilder.search
           @function load
           @param {Object} data The json data to convert.
           @param {Object} [caller] The caller of this function.
           @param {Object} [params] Additional parameters for transformation.
         */
        load: function(data, caller, params) {
            return caller.SearchViewModel.getInstance(caller.adapter, data, params);
        }
      },

      //-------------------------------------------------------------
      // Site Object Type
      //-------------------------------------------------------------
      /**
         @name ViewModelBuilder.site
         @private
         @class Builder for the site type.
       */
      site: {
        scope: 'global',

        /**
           Whether or not the site is cachable.
           @private
           @memberof ViewModelBuilder.site
           @name cachable
           @type {boolean}
           @default false
         */
        cachable: false,

        /**
           This method creates the site view model.
           @private
           @memberof ViewModelBuilder.site
           @function load
           @param {Object} data The json data to convert.
           @param {Object} [caller] The caller of this function.
           @param {Object} [params] Additional parameters for transformation.
         */
        load: function(data, caller, params) {
          return caller.SiteViewModel.getInstance(caller.adapter, data, params);
        }
      },

      //-------------------------------------------------------------
      // Shipping Method Object Type
      //-------------------------------------------------------------
      /**
         @name ViewModelBuilder.shippingMethods
         @private
         @class Builder for the shipping method. Handles transforming data to and from JSON.
       */
      shippingmethods: {

        scope: 'page',
        /**
           Whether or not the shippingMethods is cachable.
           @private
           @memberof ViewModelBuilder.shippingMethods
           @name cachable
           @type {boolean}
           @default false
         */
        cachable: false,
        /**
           This method creates the shipping Methods view model.
           @private
           @memberof ViewModelBuilder.shippingMethods
           @function load
           @param {Object} data The json data to convert.
           @param {Object} [caller] The caller of this function.
           @param {Object} [params] Additional parameters for transformation.
         */
        load: function(data, caller, params) {
          return caller.ShippingMethodsViewModel.getInstance(caller.adapter, data);
        }
      },

      //-------------------------------------------------------------
      // payment authorization Object Type
      //-------------------------------------------------------------
      /**
         @name ViewModelBuilder.paymentauthorization
         @private
         @class Builder for the payment authorization. Handles transforming data to and from JSON.
       */
      paymentauthorization: {

        scope: 'page',
        /**
           Whether or not the payment authorization is cachable.
           @private
           @memberof ViewModelBuilder.paymentauthorization
           @name cachable
           @type {boolean}
           @default false
         */
        cachable: false,
        /**
           This method creates the payment authorization view model.
           @private
           @memberof ViewModelBuilder.paymentauthorization
           @function load
           @param {Object} data The json data to convert.
           @param {Object} [caller] The caller of this function.
           @param {Object} [params] Additional parameters for transformation.
         */
        load: function(data, caller, params) {

          var load = true;
          var paymentAuthResponseViewModel = new caller.PaymentAuthResponseViewModel(caller.adapter, data);

          return paymentAuthResponseViewModel;
        }
      },
      //-------------------------------------------------------------
      // Space Object Type
      //-------------------------------------------------------------
      /**
         @name space
         @private
         @class Builder for the SpaceViewModel
       */
      space: {

        scope: 'global',
        /**
           Whether or not the SpaceViewModel is cachable.
           @private
           @memberof ViewModelBuilder.space
           @name cachable
           @type {boolean}
           @default false
         */
        cachable: false,
        /**
           This method creates the SpaceViewModel.
           @private
           @memberof ViewModelBuilder.paymentauthorization
           @function load
           @param {Object} data The json data to convert.
           @param {Object} [caller] The caller of this function.
           @param {Object} [params] Additional parameters for transformation.
         */
        load: function(data, caller, params) {
          return caller.SpaceViewModel.getInstance(caller.adapter, data, params);
        }
      },
      //-------------------------------------------------------------
      // User Registration and Login Object Type
      //-------------------------------------------------------------
      /**
         @name ViewModelBuilder.user
         @private
         @class Builder for the user registration and login. Handles the registration and login from the front end.
       */
      user: {
        
        scope: 'global',
        /**
           Whether or not the user is cachable.
           @private
           @memberof ViewModelBuilder.user
           @name cachable
           @type {boolean}
           @default false
        */
        cachable: false,
        /**
           This method creates the user view model.
           @private
           @memberof ViewModelBuilder.user
           @function load
           @param {Object} data The json data to convert.
           @param {Object} [caller] The caller of this function.
        */
        load: function(data, caller, params) {
          return caller.UserViewModel.getInstance(caller.adapter, data, params);
        }
      },
      orderDetails: {
          scope: 'page',

          /**
             Whether or not the OrderDetailsViewModel is cachable.
             @private
             @memberof ViewModelBuilder.OrderDetailsViewModel
             @name cachable
             @type {boolean}
             @default false
           */
          cachable: false,
          /**
             This method creates the search view model.
             @private
             @memberof ViewModelBuilder.OrderDetailsViewModel
             @function load
             @param {Object} data The json data to convert.
             @param {Object} [caller] The caller of this function.
             @param {Object} [params] Additional parameters for transformation.
           */
          load: function(data, caller, params) {
        	  
              return new caller.OrderDetailsViewModel(data);
          }
        },
    };
  }
);

