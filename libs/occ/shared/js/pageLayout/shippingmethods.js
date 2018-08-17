/**
 * @fileoverview Shipping Methods Class
 * Calls the rest service to get the shipping methods. 
 * 
 */

/*global define */
define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'pageLayout/shippingmethods',

  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['knockout', 'pubsub', 'ccConstants', 'viewModels/shippingMethodItemViewModel',
   'ccLogger', 'pageLayout/cart', 'jquery', 'ccRestClient'],

  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (ko, pubsub, CCConstants, ShippingMethodItemViewModel, log, CartViewModel, $, ccRestClient) {

    'use strict';
    var mCartUpdatedListener;

    //------------------------------------------------------------------
    // Class definition & member variables
    //------------------------------------------------------------------
    /**
     * Creates a Shipping Methods view model. ShippingMethodsViewModel is a singleton class and you should
     * can access the instance using getInstance.
     *
     * @param {RestAdapter} pAdapter The REST adapter.
     * @param {Object} [data] Additional data.
     *  
     * @private
     * @class
     * @name ShippingMethodsViewModel
     * @property {Object} adapter Internal copy of adapter object.
     * @property {observableArray<Object>} shippingOptions List of available shipping options.
     * @property {observable<Object>} defaultShipping Default shipping option.
     * @property {observable<string>} Text representation of default shipping option.
     */
    function ShippingMethodsViewModel(pAdapter, data) {
      if(ShippingMethodsViewModel.singleInstance) {
        throw new Error("Cannot instantiate more than one ShippingMethodsViewModel, use getInstance(pAdapter, data)");  
      }
      var self = this;

      self.adapter = pAdapter;
      self.shippingOptions = ko.observableArray();
      self.defaultShipping = ko.observable();
      self.defaultShippingName = ko.observable();

      // Based on this flag, we are checking if the existing request/response structure to be processed
      // or the new request/response structure to be processed.
      self.isOrderInRequestPayloadAllowed = ko.observable(false);

      /**
       * This method will invoke the CloudConfigurations API to fetch the flag corresponding to creating request 
       * pay load with Order Information.
       *
       * */
      self.fetchRequestPayloadFlag = function() {

        var url = CCConstants.ENDPOINT_GET_CLOUD_CONFIGURATION;
        ccRestClient.request(url, null,
          // Success callback
          function(data) {
            //self.isOrderInRequestPayloadAllowed();
            if (data && data.clientConfiguration && data.clientConfiguration.includeOrderDetailsInShippingMethodsPayload) {
              self.isOrderInRequestPayloadAllowed(true);
            }
          },
          // Error callback
          function(data) {
            // The default pay load for List Shipping methods is the old pay load structure (without the Order Info)
            // In case of any error switching back to the default set up.
            self.isOrderInRequestPayloadAllowed(false);
          });
      };

      /**
       * Populate the list of available shipping methods by making a REST call.
       * 
       * @private
       * @function
       * @name ShippingMethodsViewModel#loadShippingOptions
       */
      self.loadShippingOptions = function() {
        var shippingAddress = this[CCConstants.SHIPPING_ADDRESS_FOR_METHODS];
        if (shippingAddress) {
          if ((!shippingAddress.afterValidation) || (!self.cart.shippingMethod())) {
            if(!self.isOrderInRequestPayloadAllowed()) {
              // Construct Old request payload for backward compatibility

              var inputParams = {};
              self.cart = CartViewModel.getInstance(null, null, null);
              inputParams[CCConstants.PRODUCT_IDS_FOR_SHIPPING] = this[CCConstants.PRODUCT_IDS_FOR_SHIPPING];
              if (this[CCConstants.PROFILE_ID] !== undefined) {
                inputParams[CCConstants.PROFILE_ID] = this[CCConstants.PROFILE_ID];
              }
              /* In case of edit order, to detect if user has changed secondary currency code at site level,
               * we still need to use the order specific secondary currency to retrieve shipping methods.
               * Thus, we need to pass secondary currency code explicitly.
               * Currently, this is agent specific property
               */
              if (this[CCConstants.SECONDARY_CURRENCY_CODE] !== undefined) {
                inputParams[CCConstants.SECONDARY_CURRENCY_CODE] = this[CCConstants.SECONDARY_CURRENCY_CODE];
              }
              inputParams.priceInfo = {
                amount: self.cart.amount(),
                total: self.cart.total(),
                shipping: self.cart.shipping(),
                totalWithoutTax: self.cart.totalWithoutTax(),
                currencyCode: self.cart.currencyCode(),
                shippingSurchargeValue: self.cart.shippingSurcharge(),
                tax: self.cart.tax(),
                subTotal: self.cart.subTotal(),
                orderDiscount: self.cart.orderDiscount(),
                coupons:self.cart.coupons()
              };
              // Items array
              inputParams.items = [];
              for (var i = 0; i < self.cart.items().length; i++) {
                var item = self.cart.items()[i];
                // Adding price to include in external webhook.
                item.price = item.itemTotal;
                inputParams.items.push(item);
              }
              inputParams[CCConstants.SHIPPING_ADDRESS_FOR_METHODS] = shippingAddress.toJSON();
              inputParams[CCConstants.POPULATE_SHIPPING_METHODS] = true;

              var successCallback = function (data) {
                // add estimated cost text to the array results
                var i;
                self.shippingOptions.removeAll();
                self.cart = CartViewModel.getInstance(null, null, null);
                if(data !== undefined) {
                  for(i = 0; i < data.length; i++) {
                    self.shippingOptions.push( new ShippingMethodItemViewModel(data[i], (self.cart)? self.cart.amount() : 0));
                  }

                  self.setDefaultShipping();
                }
                var messageDetails = [{message: CCConstants.SEARCH_MESSAGE_SUCCESS}];
                $.Topic(pubsub.topicNames.SHIPPING_METHODS_LOADED).publishWith( self ,messageDetails);
                self.cart.shippingMethodsLoaded.call(self);
              };
              var errorCallback = function (data) {
                if(data && data.message && data.message !== '') {
                  // error message received, i18n occurs on server
                  log.error("order.loadShippingMethod" + data.message);
                } else {
                  // unknown error - use generic fail message
                  log.error("order.loadShippingMethod - unknown error returned");
                }
                $.Topic(pubsub.topicNames.LOAD_SHIPPING_METHODS_FAILED).publishWith(data);
              };
              self.loadMultipleShippingOptions(successCallback, errorCallback, inputParams);
            } else {

              // Success and Error call backs for new API request/response structure
              var successFunc = function(data) {

                // The only change with existing success handler code is that in this case we will get
                // List of ShippingGroups. Each shipping group contains List of available Shipping Options
                // Since this is not a split shipping there will be only one Shipping Group present
                if(data.items && data.items.length == 1) {
                  self.shippingOptions.removeAll();
                  self.cart = CartViewModel.getInstance(null, null, null);
                  for(var i=0; i<data.items[0].shippingMethods.length; i++) {
                    self.shippingOptions.push(new ShippingMethodItemViewModel(data.items[0].shippingMethods[i], (self.cart)? self.cart.amount() : 0));
                  }
                  self.setDefaultShipping();
                  var messageDetails = [{message: CCConstants.SEARCH_MESSAGE_SUCCESS}];
                  $.Topic(pubsub.topicNames.SHIPPING_METHODS_LOADED).publishWith( self ,messageDetails);
                  self.cart.shippingMethodsLoaded.call(self);
                }
              };
              var errorFunc = function(data) {
                // With the updated API signature, there is no change in error response

                if(data && data.message && data.message !== '') {
                  // error message received, i18n occurs on server
                  log.error("order.loadShippingMethod" + data.message);
                } else {
                  // unknown error - use generic fail message
                  log.error("order.loadShippingMethod - unknown error returned");
                }
                $.Topic(pubsub.topicNames.LOAD_SHIPPING_METHODS_FAILED).publishWith(data);
              };
              if (this[CCConstants.PROFILE_ID] !== undefined) {
                self[CCConstants.PROFILE_ID] = this[CCConstants.PROFILE_ID];
              }
              // This method will invoke the API for List ShippingMethods. 
              self.loadMultipleShippingOptions(successFunc, errorFunc);
            }
          }
          delete shippingAddress.afterValidation;
        }
      };
      $.Topic(pubsub.topicNames.RELOAD_SHIPPING_METHODS).subscribe(self.loadShippingOptions);

      /**
       * Utility method to iterate over the cart items recursively and create a array of Product Ids
       * This method works for multi level add-on products as well.
       * @function
       * @name ShippingMethodsViewModel#createProductIdsFromShippingGroupItems
       * @param items - Cart Items object that need to be iterated recursively
       * @param productIds - List that holds the productIds obtained by iterating
       * over the cart items.
       * */
      self.createProductIdsFromShippingGroupItems = function(items, productIds) {
        for(var i=0; i<items.length; i++) {
          if(productIds.indexOf(items[i].productId) == -1) {
            productIds.push(items[i].productId);
          }
          if(items[i].childItems && items[i].childItems.length > 0) {
            self.createProductIdsFromShippingGroupItems(items[i].childItems, productIds);
          }
        }
      };

      /**
       * This method will invoke the API for List Shipping Methods.
       *
       * @param successCallback - Success handler method
       * @param errorCallback - Error handler method
       * @param inputParams - Optional Request data to be passed to the API. If passed, this will
       * be used to invoke the API. Otherwise, request structure based on new API signature will be
       * constructed.
       *
       * */
      self.loadMultipleShippingOptions = function(successCallback, errorCallback, inputParams) {
        var requestPayload = null;
        if(inputParams) {
          // Request data is passed as argument to this method. This will happen in scenarios
          // where old signature to be used (for backward compatibility scenarios)
          requestPayload = inputParams;
        } else {
          // Create the request data to the API as per the updated API signature

          self.cart = CartViewModel.getInstance(null, null, null);
          // 1. Shopping Cart, Coupons, Custom Properties, GWP data
          var pricingModel = self.cart.createCartPricingModel();

          // 2. Price Info
          pricingModel.priceInfo = {
            amount: self.cart.amount(),
            total: self.cart.total(),
            shipping: self.cart.shipping(),
            totalWithoutTax: self.cart.totalWithoutTax(),
            currencyCode: self.cart.currencyCode(),
            shippingSurchargeValue: self.cart.shippingSurcharge(),
            tax: self.cart.tax(),
            subTotal: self.cart.subTotal(),
            orderDiscount: self.cart.orderDiscount(),
            coupons:self.cart.coupons()
          };

          // 3. Shipping Groups List
          pricingModel.shippingGroups = self.cart.createShippingGroups(true);
          for(var i=0; i<pricingModel.shippingGroups.length; i++) {
            var productIds = [];
            // Populate productIdForShippingSurcharge for each shippingGroup
            self.createProductIdsFromShippingGroupItems(pricingModel.shippingGroups[i].items, productIds);
            pricingModel.shippingGroups[i].productIdForShippingSurcharge = productIds;
            delete pricingModel.shippingGroups[i].shippingMethod;
          }
          if (this[CCConstants.PROFILE_ID] !== undefined) {
            pricingModel[CCConstants.PROFILE_ID] = this[CCConstants.PROFILE_ID];
          }

          requestPayload = pricingModel;
        }

        self.adapter.persistCreate(CCConstants.ENDPOINT_SHIPPING_METHODS_LIST_SHIPPING_METHODS, 'id', requestPayload,
          // Success
          function(data) {
            successCallback(data);
          },
          // Error
          function(data) {
            errorCallback(data);
          });
      };

      // Registering loadMultipleShippingOptions as callback in Cart
      self.cart = CartViewModel.getInstance(null, null, null);
      self.cart.registerMultiShippingMethodsCallback(self.loadMultipleShippingOptions);

      return self;
    }

  

    /**
     * Update the total cart value for each shipping option.
     *  
     * @function
     * @name ShippingMethodsViewModel#updateEstimatedTextCost
     * @param {number} cartValue Total value of items in cart.
     */
    ShippingMethodsViewModel.prototype.updateEstimatedTextCost = function(cartValue) {

      var self = this;

      ko.utils.arrayForEach(self.shippingOptions(), function(item){

       item.cartValue(cartValue);
      });
    };

    /**
     * Calculate the correct shipping cost based on the cart value and price ranges of shipping items.
     * 
     * @function
     * @name ShippingMethodsViewModel#calcCorrectAmout
     * @param {Object} shippingItem Object representing an individual item to be shipped.
     * @param {number} cartValue Total value of items in cart.
     * @return {number} The correct shipping cost based on the cart value. 
     */
    ShippingMethodsViewModel.prototype.calcCorrectAmout = function(shippingItem, cartValue){
      
      var correctAmount = 0;
      for (var i = 0; i < shippingItem.ranges.length; i++ ) {

        var highValue = shippingItem.ranges[i].high;
        var lowValue = shippingItem.ranges[i].low;

        if (shippingItem.ranges[i].high == null){
          highValue = Number.MAX_VALUE;
        }

        if ((cartValue >= lowValue) && (cartValue <= highValue )) {
          correctAmount = shippingItem.ranges[i].amount;
        }
      }
      return correctAmount;
    };
    
    /**
     * Set the default shipping option: If there are one or more available options, the default
     * shipping option will be the first option.
     * 
     * @function
     * @name ShippingMethodsViewModel#setDefaultShipping
     */
    ShippingMethodsViewModel.prototype.setDefaultShipping = function(){

      var self = this;
      if (self.shippingOptions().length >= 1){
        self.defaultShipping(self.shippingOptions()[0].repositoryId);
        self.defaultShippingName(self.shippingOptions()[0].displayName);
      }
    };

    /**
     * Return the single instance of ShippingMethodsViewModel. Create it if it doesn't exist.
     * 
     * @function
     * @name ShippingMethodsViewModel.getInstance
     * @param {RestAdapter} pAdapter The REST adapter.
     * @param {Object} [data] Additional data.
     * @return {ShippingMethodsViewModel} Singleton instance.
     */
    ShippingMethodsViewModel.getInstance = function(pAdapter, data) {
      if(!ShippingMethodsViewModel.singleInstance) {
        ShippingMethodsViewModel.singleInstance = new ShippingMethodsViewModel(pAdapter, data);
        ShippingMethodsViewModel.singleInstance.fetchRequestPayloadFlag();
      }

      return ShippingMethodsViewModel.singleInstance;
    };    
    
    return ShippingMethodsViewModel;
});

