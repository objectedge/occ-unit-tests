/**
 * @fileoverview Defines a CartViewModel used to represent and maintain the
 * shopping cart for the site.
 */

/*global define */
define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'pageLayout/cart',

  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  [
    'knockout',
    'pubsub',
    'notifier',
    'notifications',
    'storeKoExtensions',
    'CCi18n',
    'ccNumber',
    'jquery',
    'ccConstants',
    'navigation',
    'storageApi',
    'pageLayout/site',
    'viewModels/dynamicProperty',
    'ccRestClient',
    'viewModels/address',
    'koMapping',
    'ccStoreConfiguration',
    'viewModels/cart-item',
    'viewModels/shipping-group-relationship',
    'viewModels/cart-item-external-data',
    'currencyHelper'
  ],

  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (
    ko,
    pubsub,
    notifier,
    notifications,
    storeKoExtensions,
    CCi18n,
    ccNumber,
    $,
    ccConstants,
    navigation,
    storageApi,
    SiteViewModel,
    DynamicProperty,
    ccRestClient,
    Address,
    koMapping,
    CCStoreConfiguration,
    CartItem,
    ShippingGroupRelationship,
    CartItemExternalData,
    currencyHelper
  ) {

    "use strict";

    var CART_EVENT_ADD = 1;
    var CART_EVENT_UPDATE = 2;
    var CART_EVENT_DELETE = 3;
    var CART_EVENT_COUPON_ADD = 4;
    var CART_EVENT_COUPON_DELETE = 5;
    var CART_EVENT_GIFTCARD_ADD = 6;
    var CART_EVENT_GIFTCARD_DELETE = 7;
    var CART_EVENT_GIFTCARD_REAPPLY = 8;
    var CART_EVENT_REPRICE = 9;
    var CART_EVENT_RECONFIGURE = 10;
    var CART_EVENT_SPLIT = 11;
    var CART_EVENT_IINS_UPDATED = 12;
    var CART_EVENT_GIFTCARDS_ADD = 13;
    var CART_EVENT_ADD_MULTIPLE_ITEMS = 14;
    var CART_EVENT_COUPONS_ADD = 15;

    var CART_VIEW_MODEL_ID = "CartViewModel";
    var GIFT_WITH_PURCHASE_ID = "GiftWithPurchase";

    var application = ccConstants.APPLICATION_STOREFRONT;

    //------------------------------------------------------------------
    // Class definition & member variables
    //------------------------------------------------------------------
    /**
     * Creates a cart view model. The CartViewModel is used to represent and maintain the cart for
     * the site. CartViewModel is a singleton and you can use 'getInstance' to access it.
     *
     * CartViewModel holds a list of cart events with the following types defined:
     *
     * <ul>
     *  <li><b>CART_EVENT_ADD=1</b> - Cart Event type representing an added item.</li>
     *  <li><b>CART_EVENT_UPDATE=2</b> - Cart Event type representing update to cart.</li>
     *  <li><b>CART_EVENT_DELETE=3</b> - Cart Event type representing a deleted item.</li>
     *  <li><b>CART_EVENT_COUPON_ADD=4</b> - Cart Event type representing a coupon code added to cart.</li>
     *  <li><b>CART_EVENT_COUPON_DELETE=5</b> - Cart Event type representing a coupon code being removed from cart.</li>
     *  <li><b>CART_EVENT_GIFTCARD_ADD=6</b> - Cart Event type representing a gift card being added to cart.</li>
     *  <li><b>CART_EVENT_GIFTCARD_DELETE=7</b> - Cart Event type representing a gift card being removed from cart.</li>
     *  <li><b>CART_EVENT_REPRICE=9</b> - Cart Event type indicating required repricing.</li>
     *  <li><b>CART_EVENT_RECONFIGURE=10</b> - Cart Event type representing reconfiguration of a cart item.</li>
     *  <li><b>CART_EVENT_SPLIT=11</b> - Cart Event type representing splitting of a cart item.</li>
     *  <li><b>CART_EVENT_IINS_UPDATED=12</b> - Cart Event type representing a change of the IIN (first 6 digits of credit card) which the shopper intends to pay with.</li>
     * </ul>
     *
     * @public
     * @class Shopping cart view model.
     * @name CartViewModel
     * @property {RestAdapter} adapter An adapter used to make the REST calls.
     * @property {UserViewModel} user Internal reference to user view model.
     * @property {observableArray<CartItem>} items List of items in the cart.
     * @property {observableArray<Object>} coupons List of coupons added to cart.
     * @property {observable<number>} numberOfItems Number of items in the cart.
     * @property {observable<number>} total Total value of cart including items, tax and shipping modifications.
     * @property {observable<number>} totalWithoutTax total value minus the tax.
     * @property {observable<number>} subTotal Total value of items in cart.
     * @property {observable<number>} tax Tax calculated for cart.
     * @property {observable<number>} shipping Shipping cost of cart.
     * @property {observable<number>} shippingDiscount Shipping discount applied to cart.
     * @property {observable<number>} shippingSurcharge Shipping surcharge applied to cart.
     * @property {observable<number>} orderDiscount Discounts applied to items in cart.
     * @property {observable<string>} shippingMethod Currently selected shipping method.
     * @property {observable<string>} shippingAddress Currently selected shipping address, cached in case
     *   anonymous users leave the checkout page. Will be overridden by user's default shipping address if
     *   available.
     * @property {observable<string>} catalogId ID of the catalog for the item
     * @property {observable<string>} currencyCode Code of currency used for prices and discounts.
     * @property {observable<boolean>} isDirty true if the cart has unsaved changes.
     * @property {observable<boolean>} isPricingRequired true if the cart needs it's cost totals updated.
     * @property {observable<boolean>} skipPriceChange true will cause the cart to skip the next price change.
     * @property {observable<boolean>} checkoutWithPaypalClicked true if paypal checkout has been activated.
     * @property {observable<boolean>} isMatchingCookieData true if the cart state matches the state of the saved cookie.
     * @property {observableArray<GiftCardViewModel>} giftCards Array of gift cards
     * @property {observableArray<DynamicProperty>} dynamicProperties Array of dynamic properties
     * @property {observableArray<DynamicProperty>} lineAttributes Array of custom properties for order line item.
     * @property {observable<boolean>} validateAndRedirectCart true will cause cart validation and redirection to
     *   either the edit cart page (if invalid) or checkout page (if valid).
     * @property {observable<boolean>} updateFromRepository true if we need to fetch updated data from the server.
     * @property {observable<string>} orderDiscountDescList List of descriptions for any order discounts
     *   applied to cart.
     * @property {observable<string>} couponErrorMessage Localised message to display if there is an error with a coupon.
     * @property {string[]} invalidProductNames List of names considered invalid.
     * @property {observableArray<string>} errors List of errors logged against the cart.
     * @property {Object} giftWithPurchaseOrderMarkers Contains any gwp order marker information.
     * @property {observableArray<Object>} placeHolderItems List of place holder items in the cart.
     * @property {observable<boolean>} isSplitShipping The property that indicates if split shipping is activated.
     *    When the user selects split shipping this property must be set to true. It is also this property that 
     *    should be used to control the visibility of split/single shipping UI elements.
     * @property {observableArray<Object>} orderShippingGroups The latest shipping groups array (if any) returned from
     *    a web service call.
     * @property {string} combineLineItems yes if line items are required to be combined.
     * @property {CCStoreConfiguration} storeConfiguration An instance of the cc-store-configuration containing store-configuration data.
     * @property {observable<number>} recurringChargeAmount
     * @property {observable<string>} recurringChargeCurrencyCode
     * @property {observable<number>} recurringChargeShipping
     * @property {observable<number>} recurringChargeSubTotal
     * @property {observableArray<Object>} recurringChargeSubTotalByFrequency
     * @property {observable<number>} recurringChargeTax
     * @property {observableArray<Object>} recurringChargeTaxByFrequency
     * @property {observable<number>} recurringChargeTotal
     */
    function CartViewModel(pAdapter, pShoppingCartData, pUser, pContext) {

      if (CartViewModel.singleInstance) {
        throw new Error("Cannot instantiate more than one CartViewModel, use getInstance(pAdapter, pShoppingCartData)");
      }

      var self = this;

      var site = SiteViewModel.getInstance();
      // Handle rare-ish race condition
      // Set the currency once the price list group has been initialized
      self.currency = null;
      $.when (site.priceListGroupDeferred).done(function() {
        self.currency = site.selectedPriceListGroup().currency;
      });

      self.exchangeRate = ko.observable(null);
      self.payShippingInSecondaryCurrency = ko.observable(false);
      self.payTaxInSecondaryCurrency = ko.observable(false);
      self.secondaryCurrency = ko.observable(null);

      //Show shipping data in secondary currency, only if we have secondaryCurrency and the flag payShippingInSecondaryCurrency is set to true
      self.showSecondaryShippingData = ko.pureComputed(function() {
        return (null != self.secondaryCurrency()) && self.payShippingInSecondaryCurrency();
      });

      //Show tax data in secondary currency, only if we have secondaryCurrency and the flag payTaxInSecondaryCurrency is set to true
      self.showSecondaryTaxData = ko.pureComputed(function() {
        return (null != self.secondaryCurrency()) && self.payTaxInSecondaryCurrency();
      });

      // Returns true if the tax and shipping has to be collected in secondary currency.
      self.isChargeTaxShippingInSecondaryCurrency = ko.pureComputed(function() {
        return (self.payShippingInSecondaryCurrency() ||
            self.payTaxInSecondaryCurrency());
      });

      //Set secondaryCurrency related data in cart view model
      self.setSecondaryCurrencyData = function(pSecondaryCurrency,pExchangeRate,pPayShippingInSecondaryCurrency,pPayTaxInSecondaryCurrency) {
        self.exchangeRate(pExchangeRate);
        self.payTaxInSecondaryCurrency(pPayTaxInSecondaryCurrency);
        self.secondaryCurrency(pSecondaryCurrency);
        self.payShippingInSecondaryCurrency(pPayShippingInSecondaryCurrency);
        $.Topic(pubsub.topicNames.ORDER_SECONDARY_INFO_LOADED).publish(self);
      };

      self.user = pUser;
      self.deferLoadCart = $.Deferred();
      // Load the cart, after userViewModel has been initialized
      self.deferLoadCartForUser = function(){
        if (self.user()) {
          self.deferLoadCart.resolve();
          deferLoadCartForUserSubscriber.dispose();
        }
      }
      var deferLoadCartForUserSubscriber = self.user.subscribe(self.deferLoadCartForUser);
      self.isDirty = ko.observable(false);
      self.callPriceBeforeShippingMethods = false;
      self.updatedFromRepository = false;
      self.adapter = pAdapter;
      self.errors = ko.observableArray([]);
      self.items = ko.observableArray([]);
      self.allItems = ko.observableArray([]); // This variable will hold place holder and cart items.
      self.coupons = ko.observableArray([]);
      self.orderItems = ko.observableArray([]);
      self.orderCurrency={};
      self.couponMultiPromotions = ko.observableArray([]);
      self.claimedCouponMultiPromotions = ko.observableArray([]);
      self.numberOfItems = ko.observable(0);
      self.total = ko.observable(0);
      self.totalWithoutTax = ko.observable(0);
      self.subTotal = ko.observable(0);
      self.amount = ko.observable(0);
      self.tax = ko.observable(0);
      self.secondaryCurrencyTaxAmount = ko.observable(0);
      self.secondaryCurrencyTotal = ko.observable(0);
      self.primaryCurrencyTotal = ko.observable(0);
      self.shipping = ko.observable(0);
      self.secondaryCurrencyShippingAmount = ko.observable(0);
      self.taxExclusiveAmount = ko.observable(0);
      self.shippingDiscount = ko.observable(0);
      self.secondaryCurrencyShippingDiscount = ko.observable(0);
      self.currencyCode = ko.observable('');
      self.shippingMethod = ko.observable('');
      self.catalogId = ko.observable('');
      self.priceListGroupId = ko.observable('');
      self.shippingAddress = ko.observable('');
      self.currentCountry = ko.observable('');
      self.currentState = ko.observable('');
      self.selectedCountry = ko.observable('');
      self.selectedState = ko.observable('');
      self.shippingSurcharge = ko.observable(0);
      self.secondaryCurrencyShippingSurcharge = ko.observable(0);
      self.updatedProduct = ko.observable('');
      self.validateAndRedirectCart = ko.observable(false);
      self.orderDiscount = ko.observable(0);
      self.orderDiscountDescList = ko.observableArray([]);
      self.couponErrorMessage = ko.observable();
      self.skipPriceChange = ko.observable(false);
      self.isPricingRequired = ko.observable(false);
      self.invalidProductNames = [];
      self.isPreOrderBackOrderEnabled = false;
      self.checkoutWithPaypalClicked = ko.observable(false);
      self.isMatchingCookieData = ko.observable(false);
      self.giftCards = ko.observableArray([]);
      self.IINDetails = ko.observableArray([]);
      self.dynamicProperties = ko.observableArray([]);
      self.lineAttributes = ko.observableArray([]);
      self.cartPriceListGroupId = ko.observable();
      self.showSelectedOptions = ko.observable(false);
      self.isSplitShipping = ko.observable(false);
      self.orderShippingGroups = ko.observableArray();
      self.mergeCart = ko.observable(false);
      self.storeConfiguration = CCStoreConfiguration.getInstance();
      self.usingImprovedShippingWidgets = ko.observable(false);
      if(pContext && pContext.global && pContext.global.site && pContext.global.site.extensionSiteSettings 
    		&& pContext.global.site.extensionSiteSettings.storeEndpointSettings 
    		&& pContext.global.site.extensionSiteSettings.storeEndpointSettings.cartFields)
    	self.fields = pContext.global.site.extensionSiteSettings.storeEndpointSettings.cartFields;

      self.callbacks = {};

      //Value to determine if line items are to be combined.By default, it is set to yes
      self.combineLineItems = ccConstants.COMBINE_YES;

      self.giftWithPurchaseOrderMarkers = [];
      self.gwpQualified = false;
      self.placeHolderItems = ko.observableArray([]);
      // In store, for logged-in user with shipping address, any operation on order results in two
      // pricing calls one after another. As GWP messages are sent only once, the second pricing call do
      // not contain the pricing messages.
      self.skipGWPMessage = false;
      
      // Adding current order id for loaded orders
      self.currentOrderId = ko.observable(null);
      // Adding current order state for loaded orders
      self.currentOrderState = ko.observable(null);

      self.recurringChargeAmount = ko.observable(0);
      self.recurringChargeCurrencyCode = ko.observable('');
      self.recurringChargeShipping = ko.observable(0);
      self.recurringChargeSubTotal = ko.observable(0);
      self.recurringChargeSubTotalByFrequency = ko.observableArray([]);
      self.recurringChargeTax = ko.observable(0);
      self.recurringChargeTaxByFrequency = ko.observableArray([]);
      self.recurringChargeTotal = ko.observable(0);

      self.isOrderSubmissionInProgress = false;
      // Flag to check the progress of get Order call
      self.isCurrentCallInProgress = false;
      // Marks the cart as having been changed
      self.markDirty = function() {
        if (!self.isDirty() && !self.isOrderSubmissionInProgress) {
          self.isDirty(true);
        }
      };
      
      self.emailAddressForGuestUser = null;
      
      /**
       * Reset the Cart to a state of unmodified and save the contents to local storage.
       *
       * @private
       * @function
       * @name CartViewModel#cartUpdated
       */
      self.cartUpdated = function () {
        if (self.isDirty()) {
          self.isDirty(false);
        }
        self.saveCartCookie();
        // Callback to tell others the cart is ready
        $.Topic(pubsub.topicNames.CART_UPDATED).publish(self);
        self.updateAllItemsArray();
        if (self.validateAndRedirectCart()) {
          self.handleValidateCart();
        }
      };

      self.isDirty.subscribe(self.priceCartIfNeccessary.bind(self));

      /**
       * Registered for the add to cart growl notification's checkout button, to validate the cart and redirect.
       *
       * @private
       * @function
       * @name CartViewModel#handleValidateCart
       */
      self.handleValidateCart= function() {
        self.validatePrice = true;
        $.Topic(pubsub.topicNames.LOAD_CHECKOUT).publishWith(self, [{message: "success"}]);
      };

      /**
       * Registering the load Multiple Shipping Methods call back from the ShippingMethods VM
       * @param loadMultipleShippingOptions - Callback method in ShippingMethods to invoke the API to fetch multiple Shipping Options
       * */
      self.registerMultiShippingMethodsCallback = function(loadMultipleShippingOptions) {
        self.loadMultipleShippingMethods = loadMultipleShippingOptions;
      };

      /**
       * Update the contents of the cart, or update cart items based on the type of the most
       * recent cart event. Invoked on receiving a CART_PRICE_COMPLETE pubsub event.
       *
       * @private
       * @function
       * @name CartViewModel#updateCartItems
       */
      self.updateCartItems = function () {
        if (self.events.length > 0) {
          var data;
          var lastCartEvent = self.events.pop();
          self.events.push(lastCartEvent);
          switch (lastCartEvent.type) {
            case CART_EVENT_ADD :
              data = lastCartEvent.product;
              self.addItem(data);
              break;
            case CART_EVENT_UPDATE :
              data = lastCartEvent.product;
              self.updateItemQuantity(data);
              break;
            case CART_EVENT_DELETE :
              data = lastCartEvent.product;
              self.removeItemsByProduct(data.id);
              self.removeItem(data);
              break;
            case CART_EVENT_COUPON_DELETE :
              data = lastCartEvent.coupon;
              self.removeCouponFromCart(data);
              break;
            case CART_EVENT_COUPON_ADD :
              data = lastCartEvent.coupon;
              self.addCouponToCart(data);
              break;
            case CART_EVENT_COUPONS_ADD :
              data = lastCartEvent.coupons;
              self.addMultipleCouponsToCart(data);
              break;
            case CART_EVENT_RECONFIGURE :
              data = lastCartEvent.product;
              self.addItem(data);
              
          }
        }
      };

      /**
       * Adds a given item to the cart.
       *
       * @function
       * @name CartViewModel#addItem
       * @param {Object} data Object containing item data to create {CartItem} from.
       */
      self.addItem = function (data) {
        if (data && data.childSKUs) {
          var productFound = false;
          var newQuantity;
          // Create sub-items as CartItems, if they exist.
          var childItems;
          if (self.isConfigurableItem(data)) {
            childItems = [];
            childItems = self.getChildItemsDataAsCartItems(data);
          }
          if(data.selectedAddOnProducts && data.selectedAddOnProducts.length > 0) {
            var addonChildItems = self.getAddonDataAsCartItems(data);
            if(childItems && childItems.length > 0) {
              childItems = childItems.concat(addonChildItems);
            } else {
              childItems = [];
              childItems = addonChildItems;
            }
          }
          // Check for line item only if there are no child items.
          var cartItem = null;
             if (!data.commerceItemId && self.isConfigurableItem(data)) {
               cartItem = self.getConfigurableCartItem(data.id, data.childSKUs[0].repositoryId, data.commerceItemId);
             } else if(self.isProductWithAddons(data)) {
               // In case of Product with add-ons, and if Product is not a CPQ product, always create
               // a new cart item, as shopper may have different shopperInputs and need not decide based
               // on the actual ShopperInput data
               cartItem = null;
             } else {
               //Search for corresponding cart item only if line items are to be combined, else proceed just like a new item being added to cart.
               if(self.combineLineItems == ccConstants.COMBINE_YES){
                   cartItem = self.getCartItem(data.id, data.childSKUs[0].repositoryId, data.commerceItemId);
               }
          }
          if (cartItem !== null) {
            newQuantity = cartItem.quantity() + data.orderQuantity;
            cartItem.quantity(newQuantity);            
            // Add giftWithPurchaseSelections of the cart item
            if (data.giftProductData) {
              cartItem.giftWithPurchaseSelections = [
                {
                  "giftWithPurchaseIdentifier": data.giftProductData.giftWithPurchaseIdentifier,
                  "promotionId": data.giftProductData.promotionId,
                  "giftWithPurchaseQuantity": data.giftProductData.giftWithPurchaseQuantity
                }
              ];
            }            
            productFound = true;
            // Notify successful quantity update.
            $.Topic(pubsub.topicNames.CART_UPDATE_QUANTITY_SUCCESS).publishWith(function() {[{message:"success"}];});
          }
          // Adding a condition for reconfiguration flow. In this case the commerceItemId will
          // be null. However the configuratorId should be set for the item.
          if ((data.commerceItemId == null) && self.isConfigurableItem(data)) {
            cartItem = self.getCartItemForReconfiguration(data.id, data.childSKUs[0].repositoryId, data.configuratorId);
            if (cartItem !== null) {
              // Update the childItems
              // Do not overwrite the childItems directly, as there could be add-on product childItems
              // existing with the CPQ main product item
              var addOnProductItems = [];
              for(var index=0; index<cartItem.childItems.length; index++) {
                if (cartItem.childItems[index].addOnItem) {
                  // If the childItem contains another level of childItems, as in multi level
                  // add-ons then it will be automatically handled as we are persisting the
                  // entire childItem object
                  addOnProductItems.push(cartItem.childItems[index]);
                }
              }
              if (addOnProductItems.length > 0) {
                childItems = childItems.concat(addOnProductItems);
              }
              cartItem.childItems = childItems;
              cartItem.externalPrice(data.price);
              cartItem.externalData((data.externalData || []).map(function (data) {
                return new CartItemExternalData(data);
              }));
              cartItem.actionCode(data.actionCode);
              cartItem.externalRecurringCharge(data.externalRecurringCharge);
              cartItem.externalRecurringChargeFrequency(data.externalRecurringChargeFrequency);
              cartItem.externalRecurringChargeDuration(data.externalRecurringChargeDuration);
              cartItem.assetId(data.assetId);
              cartItem.serviceId(data.serviceId);
              cartItem.customerAccountId(data.customerAccountId);
              cartItem.billingAccountId(data.billingAccountId);
              cartItem.serviceAccountId(data.serviceAccountId);
              cartItem.activationDate(data.activationDate);
              cartItem.deactivationDate(data.deactivationDate);
              cartItem.clearUnpricedError();
              cartItem.updatableQuantity.rules.remove( function(updatableQuantity) {
                return updatableQuantity.rule == 'max';
              });
              self.getCartAvailability();
              // Add giftWithPurchaseSelections of the cart item
              if (data.giftProductData) {
                cartItem.giftWithPurchaseSelections = [
                  {
                    "giftWithPurchaseIdentifier": data.giftProductData.giftWithPurchaseIdentifier,
                    "promotionId": data.giftProductData.promotionId,
                    "giftWithPurchaseQuantity": data.giftProductData.giftWithPurchaseQuantity
                  }
                ];
              }
              productFound = true;
            }
          }
          // If product is not in the cart then add it with the quantity set on the new product.
          if (!productFound) {
            newQuantity = data.orderQuantity;

            var cartItemData = {
              productId: data.id,
              productData: data,
              quantity: newQuantity,
              catRefId: data.childSKUs[0].repositoryId, 
              selectedOptions: data.selectedOptions,
              currency: self.currency,
              externalData: data.externalData,
              actionCode: data.actionCode,
              lineAttributes: self.lineAttributes,
              externalRecurringCharge: data.externalRecurringCharge,
              externalRecurringChargeFrequency: data.externalRecurringChargeFrequency,
              externalRecurringChargeDuration: data.externalRecurringChargeDuration,
              assetId: data.assetId,
              serviceId: data.serviceId,
              customerAccountId: data.customerAccountId,
              billingAccountId: data.billingAccountId,
              serviceAccountId: data.serviceAccountId,
              activationDate: data.activationDate,
              deactivationDate: data.deactivationDate,
              addOnItem: data.addOnItem,
              shopperInput: data.shopperInput
            };

            if (self.isConfigurableItem(data)) {
              // Handle configurable items. Expect to get external prices for
              // the configurable items.
              $.extend(cartItemData, {
                configuratorId: data.configuratorId,
                childItems: childItems,
                externalPrice: data.price,
                externalPriceQuantity: -1
              })
            } else if (self.isProductWithAddons(data)) {
              $.extend(cartItemData, {
                childItems: childItems
              })
              // If the product contains add-ons and if the product is externally priced,
              // then as per the existing restriction on the ExternalPricingCalculator only
              // -1 can be passed to the externalPriceQuantity
              var externalQuantity = data.externalPriceQuantity;
              // Iterate over the childItems and check if any childItem is externally Priced
              // such that the externalQuantity should be -1 in that case
              for(var i=0; i<childItems.length; i++) {
                if(childItems[i].externalPrice) {
                  externalQuantity = -1;
                  break;
                }
              }

              if(data.externalPrice) {
                $.extend(cartItemData, {
                  externalPrice: data.externalPrice,
                  externalPriceQuantity: externalQuantity
                })
              }
            } else if (data.externalPrice && data.externalPriceQuantity) {
              $.extend(cartItemData, {
                externalPrice: data.externalPrice,
                externalPriceQuantity: data.externalPriceQuantity
              })
            }

            var productItem = new CartItem(cartItemData);
            
            // SKU properties of the product item.
            productItem.skuProperties = data.skuProperties;
            productItem.selectedSkuProperties = data.selectedSkuProperties;

            self.items.push(productItem);
          }
          self.isDirty(false);
          self.markDirty();
        }

      };

      /**
       * Adds a given array of items to the cart.
       *
       * @function
       * @name CartViewModel#addItems
       * @param {Object} data Object containing items data to create {CartItem} from.
       */
      self.addItems = function (data) {
        var product;
        var numOfItems = data.length;
        for(var i = 0; i < numOfItems; i++){
          product = data[i];
          if (product && product.childSKUs) {
            var productFound = false;
            var newQuantity;
            // Create sub-items as CartItems, if they exist.
            var childItems;
            if (product.childItems) {
              childItems = [];
              for (var j = 0; j < product.childItems.length; j++) {
                var childItem = product.childItems[j];
                var catRefId;
                if (childItem.catalogRefId) {
                  catRefId = childItem.catalogRefId;
                } else {
                  catRefId = childItem.catRefId;
                }
                var childCartItem = {
                  productId: childItem.productId,
                  quantity: childItem.quantity,
                  catRefId: catRefId,
                  selectedOptions: childItem.selectedOptions,
                  currency: self.currency,
                  addOnItem: childItem.addOnItem,
                  shopperInput: childItem.shopperInput,
                  configurablePropertyId: childItem.configurablePropertyId,
                  configurationOptionId: childItem.configurationOptionId
                };
                childItems[j] = new CartItem(childCartItem);
              }
            }
            // Check for line item only if there are no child items.
            var cartItem = self.getCartItem(product.id, product.childSKUs[0].repositoryId, product.commerceItemId);
            // If the product contains childItems, then cannot merge the items and always create a new Cart Item
            if (product.childItems && product.childItems.length > 0) {
              cartItem = null;
            }
            if (cartItem !== null) {
              newQuantity = cartItem.quantity() + product.orderQuantity;
              cartItem.quantity(newQuantity);
              //updating the first shippingGroupRelationships quantity with the newly added item quantity
              if(cartItem.shippingGroupRelationships() && cartItem.shippingGroupRelationships().length > 0 ){
                var shippingGroupQuantity =  cartItem.shippingGroupRelationships()[0].quantity() + product.orderQuantity;
                var shippingGroupRel = cartItem.shippingGroupRelationships()[0];
                shippingGroupRel.quantity(shippingGroupQuantity);
                if(shippingGroupRel.updatableQuantity){
                  shippingGroupRel.updatableQuantity(shippingGroupQuantity);
                }
              }
              // Add giftWithPurchaseSelections of the cart item
              if (product.giftProductData) {
                cartItem.giftWithPurchaseSelections = [
                  {
                    "giftWithPurchaseIdentifier": product.giftProductData.giftWithPurchaseIdentifier,
                    "promotionId": product.giftProductData.promotionId,
                    "giftWithPurchaseQuantity": product.giftProductData.giftWithPurchaseQuantity
                  }
                ];
              }
              productFound = true;
              // Notify successful quantity update.
              $.Topic(pubsub.topicNames.CART_UPDATE_QUANTITY_SUCCESS).publishWith(function() {[{message:"success"}];});
            }

            // If product is not in the cart then add it with the quantity set on the new product.
            if (!productFound) {
              newQuantity = product.orderQuantity;
              var productItem;
              var cartItemData = {
                  productId: product.id,
                  productData: product,
                  quantity: newQuantity,
                  catRefId: product.childSKUs[0].repositoryId,
                  selectedOptions: product.selectedOptions,
                  currency: self.currency,
                  shopperInput: product.shopperInput
                };
              if (product.childItems) {
                $.extend(cartItemData, {
                  configuratorId: product.configuratorId,
                  childItems: childItems
                  //externalPrice: product.itemTotal, // TODO
                  //externalPriceQuantity: -1         // TODO
                });
              } else if (product.externalPrice && product.externalPriceQuantity) {
                $.extend(cartItemData, {
                  externalPrice: product.externalPrice,
                  externalPriceQuantity: product.externalPriceQuantity
                });
              }
              productItem = new CartItem(cartItemData);

              // SKU properties of the product item.
              productItem.skuProperties = product.skuProperties;
              productItem.selectedSkuProperties = product.selectedSkuProperties;

              self.items.push(productItem);
            }
          }
        }
        self.isDirty(false);
        self.markDirty();
      };

      /**
       * Add item to the cart.
       *
       * @function
       * @name CartViewModel#addToCart
       */
      self.addToCart = function () {
        // If product to add is in the cart then simply increase the quantity.
        var cookieData = self.getCookieDataAndCompare();
        self.events.push(new CartEvent(CART_EVENT_ADD, 1, this));
        if (!self.mergeCart() && cookieData && !self.isMatchingCookieData()) {
          self.getLocalData(cookieData);
          if (cookieData.items.length == 0) {
            self.addItem(this);
          }
        } else {
          self.addItem(this);
        }

      };
      //Subscription to update cart items after pricing complete.
      $.Topic(pubsub.topicNames.CART_PRICE_COMPLETE).subscribe(self.updateCartItems);

      /**
       * Remove the given item from the cart.
       *
       * @function
       * @name CartViewModel#removeFromCart
       */
      self.removeFromCart = function (data) {
        // Find the product in the cart items
        // If product to add is in the cart then simply increase the quantity.
        // If price call is already in progress then dont proceed to remove the item from cart
        if(!self.isDirty()) {
        self.events.push(new CartEvent(CART_EVENT_DELETE, 0, this));
        var cookieData = self.getCookieDataAndCompare();
        if (cookieData && cookieData.items.length > 0 && !self.isMatchingCookieData()) {
          self.getLocalData(cookieData);
        } else {
          if (data) {
            var cartItem = self.getCartItem(this.id, this.childSKUs[0].repositoryId, data.commerceItemId);
          } else {
            var cartItem = self.getCartItem(this.id, this.childSKUs[0].repositoryId);
          }
          if (cartItem !== null) {
            cartItem.updatableQuantity(0);
            self.removeItem(cartItem);
          }
        }
        }
      };

      /**
       * Remove the given child item from the cart.
       * Identifying the target cart item is based on the commerceItemId
       * (that is being passed in the arguments object)
       *
       * @function
       * @name CartViewModel#removeChildItemFromCart
       * @param {Object} childCartItem - The (Child) cart-item object that needs to be removed
       * @param {boolean} repriceRequired - Boolean flag indicating if reprice is required following the removal of child cart item
       * @param {Object[]} cartItems - An optional cart items array from which the removal happens
       */
      self.removeChildItemFromCart = function(childCartItem, repriceRequired, cartItems) {
        var targetItems = self.items();
        if(cartItems) {
          targetItems = cartItems;
        }

        for (var i=0; i<targetItems.length; i++) {
          if(targetItems[i].commerceItemId == childCartItem.commerceItemId) {
            // Delete the cart Item
            targetItems.splice(i, 1);
            // TODO -
            // Can we mark the cart as dirty always? SPLIT_ITEMS scenario to be considered?
            // Should event based mechanism to be followed?
            // Do we need to create a pubsub and fire that in case of any childItems change/delete
            return;
          } else if (targetItems[i].childItems && targetItems[i].childItems.length > 0) {
            // Use recursion
            self.removeChildItemFromCart(childCartItem, repriceRequired, targetItems[i].childItems);
            if(targetItems[i].childItems && targetItems[i].childItems.length == 0) {
              delete targetItems[i].childItems;
            }
          }
        }

        if(!cartItems && repriceRequired) {
          // Using this arg to check if this is inside recursive loop / top level method call (i.e. being invoked from widget/VM)
          // If inside recursive loop should not mark as dirty as this will result in multiple price calls
          self.markDirty();
        }
      };

      /**
       * Edit the given child item from the cart.
       * Identifying the target cart item is based on the commerceItemId
       * (that is being passed in the arguments object) 
       *
       * @function
       * @name CartViewModel#editChildItemFromCart
       */
      self.editChildItemFromCart = function(childCartItem, cartItems) {
        var targetItems = self.items();
        if(cartItems) {
          targetItems = cartItems;
        }

        for (var i=0; i<targetItems.length; i++) {
          if(targetItems[i].commerceItemId == childCartItem.commerceItemId) {
            // edit the cart item
            targetItems[i] = childCartItem;
            self.markDirty();
            break;
          } else if (targetItems[i].childItems && targetItems[i].childItems.length > 0) {
            // Use recursion
            self.editChildItemFromCart(childCartItem, targetItems[i].childItems);
          }
        }
      };

      /**
       * Adds the given child items for the given cart item.
       *
       * @function
       * @name CartViewModel#addAddOnChildItemsToCartItem
       */
      self.addAddOnChildItemsToCartItem = function(cartItem, product) {
        var targetItem = cartItem;

        var addOnChildItems = self.getAddonDataAsCartItems(product);
        var childItems = targetItem.childItems;
        if(targetItem.childItems) {
            childItems = childItems.concat(addOnChildItems);
            targetItem.childItems = childItems;
        } else {
            targetItem.childItems = addOnChildItems;
        }

        self.markDirty();
      };

      /**
       * Get cookie data and compare it with cart. Sets the flag 'isMatchingCookieData' if cookieData was
       * found for the cart.
       *
       * @private
       * @function
       * @name CartViewModel#getCookieDataAndCompare
       * @returns {Object} Cookie data
       */
      self.getCookieDataAndCompare = function () {
        var cookieData = self.getCookieData();
        if (cookieData) {
          self.isMatchingCookieData(self.compareItems(cookieData.items));
        }
        return cookieData;
      };



      /**
       * Extracted remove item functionality from above
       * so that it can also be called by updateQuantity
       * when the new quantity is zero.
       *
       * @function
       * @name CartViewModel#removeItem
       * @param {Object} product Product to remove from cart
       */
      self.removeItem = function(product) {
        if (product === undefined) {
          return;
        }
        // Remove the item from the cart view model
        self.items.remove(product);
		self.allItems.remove(product);
        var lastCartEvent = self.events.pop();
        if(!(lastCartEvent && lastCartEvent.type == CART_EVENT_SPLIT)){
             self.markDirty();
          }

        
        
        // To remove item from drop-down mini-cart
        $.Topic(pubsub.topicNames.CART_REMOVE_SUCCESS).publishWith([{message:"success", "commerceItemId": product.commerceItemId}]);
      };

      /**
       * Remove all items from the cart.
       *
       * @function
       * @name CartViewModel#emptyCart
       */
      self.emptyCart = function() {
        self.items.removeAll();
        self.allItems.removeAll();
        self.shippingMethod('');
        $.Topic(pubsub.topicNames.CHECKOUT_RESET_SHIPPING_METHOD).publish();
        self.numberOfItems(0);
        self.total(0);
        self.totalWithoutTax(0);
        self.subTotal(0);
        self.amount(0);
        self.shipping(0);
        self.secondaryCurrencyShippingAmount(0);
        self.taxExclusiveAmount(0);
        self.shippingDiscount(0);
        self.secondaryCurrencyShippingDiscount(0);
        self.shippingSurcharge(0);
        self.secondaryCurrencyShippingSurcharge(0);
        self.tax(0);
        self.secondaryCurrencyTaxAmount(0);
        self.secondaryCurrencyTotal(0);
        self.primaryCurrencyTotal(0);
        self.currencyCode('');
        self.orderDiscount(0);
        self.giftCards([]);
        self.IINDetails([]);
        self.giftWithPurchaseOrderMarkers = [];
        self.placeHolderItems.removeAll();
        if (self.orderDiscountDescList()) {
          self.orderDiscountDescList.removeAll();
        }
        if (self.coupons() && self.coupons().length > 0) {
          self.coupons.removeAll();
        }

        if (self.couponMultiPromotions() && self.couponMultiPromotions().length > 0) {
            self.couponMultiPromotions.removeAll();
            self.claimedCouponMultiPromotions.removeAll();
        }

        if (self.dynamicProperties() && self.dynamicProperties().length > 0) {
          self.dynamicProperties.removeAll();
        }

        self.cartUpdated();
      };

      /**
       * Function to be invoked on successful order submission.
       *
       * @private
       * @function
       * @name CartViewModel#handleOrderSubmit
       */
      self.handleOrderSubmit = function() {
        self.emptyCart();
        if (self.user().loggedIn() && (self.user().orderId() && self.user().orderId()!='')) {
          //self.removeCurrentProfileOrder();
          self.user().orderId('');
          self.user().persistedOrder(null);
          self.user().setLocalData('orderId');
        }
      };

      /**
       * Function to be invoked when the shipping method is updated.
       *
       * @private
       * @function
       * @name CartViewModel#updateShippingMethod
       */
      self.updateShippingMethod = function() {
        if (this && this.repositoryId) {
          self.shippingMethod(this.repositoryId);
          self.shipping(this.shippingCost);
          self.secondaryCurrencyShippingAmount(this.secondaryCurrencyShippingCost());
          if (self.items().length) {
            self.priceCartForCheckout();
          }
        } else {
          self.shippingMethod('');
          self.shippingDiscount(0);
          self.secondaryCurrencyShippingDiscount(0);
          self.shippingSurcharge(0);
          self.secondaryCurrencyShippingSurcharge(0);
          // If we had previously priced for checkout then we need to reset pricing.
          if (self.shipping() != 0 ) {
            self.markDirty();
          }
        }
      };

      /**
       * Function to be invoked when the shipping methods loaded.
       *
       * @private
       * @function
       * @name CartViewModel#shipppingMethodsLoaded
       */
      self.shippingMethodsLoaded = function() {
    	var shippingOption, shippingMethodfound = false;
    	if (this.shippingOptions()) {
          for (var i = 0; i < this.shippingOptions().length; i++) {
            if (self.shippingMethod() && self.shippingMethod() === this.shippingOptions()[i].repositoryId) {
              shippingOption = this.shippingOptions()[i];
              shippingMethodfound = true;
              break;
            }
          }
          if (!shippingMethodfound) {
            //do we need to send invalidshippingMethod notification?
            for (var i = 0; i < this.shippingOptions().length; i++) {
              if(this.defaultShipping() === this.shippingOptions()[i].repositoryId) {
                shippingOption = this.shippingOptions()[i];
                break;
              }
            }
          }
    	}
    	$.Topic(pubsub.topicNames.CHECKOUT_SHIPPING_METHOD).publishWith(
    			shippingOption, [ {
                  message : "success"
                } ]);
      };

      /**
       * Function to be invoked when shipping address is updated.
       *
       * @private
       * @function
       * @name CartViewModel#updateShippingAddress
       */
      self.updateShippingAddress = function () {
        if (this && this["shippingAddress"] && this["shippingAddress"].validateForShippingMethod()) {
          var oldShippingAddress = self.shippingAddress();
          self.shippingAddress(this["shippingAddress"].toJSON());
          if(self.isShippingAddressChanged(self.shippingAddress(), oldShippingAddress) || 
        		  (!self.shippingMethod())){
            $.Topic(pubsub.topicNames.RELOAD_SHIPPING_METHODS).publishWith(
              this, [ {
                message : "success"
            } ]);
          }
        } else {
          self.shippingAddress('');
        }
      };

      /**
       * Function to be invoked when shipping address is updated.
       *
       * @private
       * @function
       * @name CartViewModel#updateShippingAddress
       */
      self.updateShippingAddressAndReloadMethod = function () {
        if (this && this["shippingAddress"] && this["shippingAddress"]().validateForShippingMethod()) {
          var oldShippingAddress = self.shippingAddress();	
          self.shippingAddress(this["shippingAddress"].toJSON());
          if(self.isShippingAddressChanged(self.shippingAddress(), oldShippingAddress) || 
        		  (!self.shippingMethod())){
            $.Topic(pubsub.topicNames.RELOAD_SHIPPING_METHODS).publishWith(
              this, [ {
                message : "success"
            } ]);
          }
        } else {
          self.shippingAddress('');
        }
      };
      /**
       * Clear cart shipping address information. Invoked when shipping address is cleared.
       *
       * @function
       * @name CartViewModel#resetShippingAddress
       */
      self.resetShippingAddress = function () {
        self.shippingAddress('');
      };

      /**
       * Update cart item with new quantity.
       *
       * @private
       * @function
       * @name CartViewModel#updateQuantity
       */
      self.updateQuantity = function(data) {
        // Add the commerceItemId
        if (data && data.commerceItemId) {
          this.commerceItemId = data.commerceItemId;
        }
        self.events.push(new CartEvent(CART_EVENT_UPDATE, 0, this));
        var cookieData = self.getCookieDataAndCompare();
        if(!self.mergeCart() && cookieData && !self.isMatchingCookieData()) {
          self.getLocalData(cookieData);
        } else {
          self.updateItemQuantity(this);
        }
      };

      /**
       * Validate quantity and update cart item if valid.
       *
       * @function
       * @name CartViewModel#updateItemQuantity
       * @param {Object} data Object containing item data to update if it exists in the cart.
       */
      self.updateItemQuantity = function(data) {
    	  var cartItem;
          if(data.childSKUs){
       		 cartItem = self.getCartItem(data.id, data.childSKUs[0].repositoryId, data.commerceItemId);
       	 }
       	 else {
       		 cartItem = self.getCartItem(data.productId, data.catRefId, data.commerceItemId);
       	 }
        if (cartItem !== null) {
          var product = cartItem;
          if (product.productPriceChanged()) {
            product.productPriceChanged(false);
          }
          if (product.updatableQuantity.isValid()) {
            var numQuantity = parseInt(product.updatableQuantity());
            if (!numQuantity) {
              self.removeItem(product);
            } else {
              product.quantity(parseFloat(product.updatableQuantity()));
              //validate the stock status for the updated quantity and then proceed to pricing
              self.validateProduct(product);
              //update dropdown mini-cart
              $.Topic(pubsub.topicNames.CART_UPDATE_QUANTITY_SUCCESS).publishWith(function() {[{message:"success"}];});
            }
          }
        }
      };

      /**
       * Trigger the getProductsAvailability end point with the updated product quantity and
       * based on the success or error call back validate the product stock status.
       *
       * @private
       * @function
       * @name CartViewModel#validateProduct
       * @param {Object} product Product to validate.
       */
      self.validateProduct = function(product) {
        var catalogId = this.catalogId();
        if(self.user().catalogId) {
          catalogId = self.user().catalogId();
        }
        var id = new Array(product.catRefId, product.productId, catalogId);
        var params = {};
        var contextObj = {};
        contextObj[ccConstants.ENDPOINT_KEY] = ccConstants.ENDPOINT_GET_PRODUCT_AVAILABILITY;
        contextObj[ccConstants.IDENTIFIER_KEY] = "stockStatusForProdValidation";
        var filterKey = self.storeConfiguration.getFilterToUse(contextObj);
        if (filterKey) {
          params[ccConstants.FILTER_KEY] = filterKey;
        }
        self.adapter.loadJSON('getStockStatus',id ,params ,
          //success callback
          function(data) {
            self.validateProductForPricing(data);
          },
          //error callback
          function(data) {
            self.reloadCart();
          }
        );
      };

      /**
       * Check the stock status of the product and if it's good to go then proceed with pricing. Otherwise,
       * reload the cart.
       *
       * @function
       * @name CartViewModel#validateProductForPricing
       * @param {Object} data Product data to validate.
       */
      self.validateProductForPricing = function (data) {
        if (data.stockStatus === 'IN_STOCK' || data.stockStatus === 'PREORDERABLE' || data.stockStatus === 'BACKORDERABLE') {
          for (var i = 0; i < self.items().length; i++) {
            if ((self.items()[i].productId === data.productId) && (self.items()[i].catRefId === data.catRefId)) {
              if (self.items()[i].updatableQuantity() <= data.orderableQuantity) {
                self.items()[i].stockStatus(true);
                var partialMsg = "";
                if(self.isPreOrderBackOrderEnabled && data.inStockQuantity > 0 
                               && self.items()[i].updatableQuantity() > data.inStockQuantity) {
                  if (data.backOrderableQuantity > 0) {
                    partialMsg = CCi18n.t('ns.common:resources.partialBackOrderMsg', {
                      stockLimit: data.inStockQuantity});
                  } else if(data.preOrderableQuantity > 0) {
                    partialMsg = CCi18n.t('ns.common:resources.partialPreOrderMsg', {
                      stockLimit: data.inStockQuantity});
                  }
                }
                self.items()[i].orderableQuantityMessage(partialMsg);
                self.items()[i].stockState(data.stockStatus);
                self.updatedProduct(self.items()[i].catRefId);
                self.markDirty();
                return;
              } else {
                self.reloadCart();
                return;
              }
            }
          }
          self.reloadCart();
        } else {
          self.reloadCart();
        }
      };

      var viewChangedHandler = function() {
        notifications.emptyGrowlMessages();

        for (var i = 0; i < self.items().length; i++) {
          self.items()[i].revertQuantity();
        }
      };

      /**
       * Return the cart Item based on the productId and catRefId passed.
       *
       * @function
       * @name CartViewModel#getCartItem
       * @param {string} productId Product ID.
       * @param {string} catRefId Catalog reference ID.
       * @param {string} commerceItemId (optional) commerceItemId.
       * @returns {CartItem} Cart item if it exists, otherwise null.
       */
      self.getCartItem = function (productId, catRefId, commerceItemId) {
        for (var i = 0; i < self.items().length; i++) {
         //Check matching item in cart using the given productId and catRefId
          if ((self.items()[i].productId === productId) && (self.items()[i].catRefId === catRefId)) {
           // Match further with commerceItemId
           //  1. If it is null and has no child items.
           //  2. If it exists with correct match.
            if ((commerceItemId == null && !(self.isConfigurableItem(self.items()[i])))
                 || (commerceItemId && (commerceItemId == self.items()[i].commerceItemId))) {
              return self.items()[i];
            }
          }
        }
        return null;
      };

      /**
       * Return the Configurable Cart Item based on the productId, catRefId passed.
       * Items with sub-items needs to be checked further with the commerceItemId.
       *
       * @function
       * @name CartViewModel#getConfigurableCartItem
       * @param {string} productId Product ID.
       * @param {string} catRefId Catalog reference ID.
       * @param {string} commerceItemId (optional) commerceItemId.
       * @returns {CartItem} Cart item if it exists, otherwise null.
       */
      self.getConfigurableCartItem = function (productId, catRefId, commerceItemId) {
        for (var i = 0; i < self.items().length; i++) {
          // Check if the item has sub-items. If so, check the commerceItemId
          if ((self.items()[i].productId === productId) && (self.items()[i].catRefId === catRefId) && self.isConfigurableItem(self.items()[i])) {
            if (!(commerceItemId || self.isConfigurableItem(self.items()[i])) ||
                (commerceItemId && self.isConfigurableItem(self.items()[i]) && (commerceItemId == self.items()[i].commerceItemId))) {
              return self.items()[i];
            }
          }
        }
        return null;
      };

      self.getCartItemForReconfiguration = function (productId, catRefId, configuratorId) {
        for (var i = 0; i < self.items().length; i++) {
          // Check if the item has sub-items. If so, do not merge.
          if ((self.items()[i].productId === productId) && (self.items()[i].catRefId === catRefId)) {
            if ((configuratorId && self.isConfigurableItem(self.items()[i]) && (configuratorId == self.items()[i].configuratorId))) {
              return self.items()[i];
            }
          }
        }
        return null;
      }

      /**
       * Derives a distinct list of sku ids present in a multilevel cpq item.
       *
       * @function
       * @name CartViewModel#addSkuIdFromConfigurableProduct
       * @param {string[]} skuIds Array of sku ids collected so far.
       * @param {Object} item multi-level cpq item containing child items.
       */
      self.addSkuIdFromConfigurableProduct = function (skuIds, item) {
        for (var i = 0; item.childItems && i < item.childItems.length; i++) {
          // Add the child item sku ids.
          if (skuIds.indexOf(item.childItems[i].catalogRefId) === -1) {
            skuIds.push(item.childItems[i].catalogRefId);
          }
          if (item.childItems[i].childItems && item.childItems[i].childItems.length > 0) {
            self.addSkuIdFromConfigurableProduct(skuIds, item.childItems[i]);
          }
        }
      };

      /**
       * Derives a distinct list of product ids present in a multilevel cpq item.
       *
       * @function
       * @name CartViewModel#addProductIdFromConfigurableProduct
       * @param {string[]} productIds Array of product ids collected so far.
       * @param {Object} item Multi-level cpq item containing child items.
       */
      self.addProductIdFromConfigurableProduct = function (productIds, item) {
          for (var i = 0; item.childItems && i < item.childItems.length; i++) {
            // Add the child item product ids.
            if (productIds.indexOf(item.childItems[i].productId) === -1) {
              productIds.push(item.childItems[i].productId);
            }
            if (item.childItems[i].childItems && item.childItems[i].childItems.length > 0) {
              self.addProductIdFromConfigurableProduct(productIds, item.childItems[i]);
            }
          }
        };

      /**
       * Creates and returns complete child tree recursively by updating each sub items with the 
       * sku data returned from server.
       *
       * @function
       * @name CartViewModel#createChildItemTree
       * @param {Object[]} data Array of sku data returned from the sku listing endpoint.
       * @param {Object} item Multi-level cpq item containing child items.
       */
      self.createChildItemTree = function (data, item) {
        var childItems = [];
        for (var j = 0; item.childItems && j < item.childItems.length; j++) {
          for (var i = 0; i < data.length; i++) {
            // if same, update the reference in product
            var skuData = $.extend(true, {}, data[i]);
            if (skuData.repositoryId == item.childItems[j].catalogRefId) {
              // Set the product data to the parent product.
              var subItem = skuData.parentProducts[0];
              // Get the child SKU.
              var childSku = skuData;
              // Remove the parent product.
              delete childSku[ccConstants.PARENT_PRODUCTS];
              // Set it to the subitem.
              subItem.childSKUs = [childSku];
              // Set the selected options.
              if (skuData.productVariantOptions && skuData.productVariantOptions.length > 0) {
                subItem.selectedOptions = skuData.productVariantOptions[0];
              }
              // Add some proper data.
              subItem.orderQuantity = parseInt(item.childItems[j].quantity);
              subItem.catalogRefId = item.childItems[j].catalogRefId;
              subItem.externalData = item.childItems[j].externalData;
              subItem.actionCode = item.childItems[j].actionCode;
              subItem.price = item.childItems[j].externalPrice;
              subItem.externalRecurringCharge = item.childItems[j].externalRecurringCharge;
              subItem.externalRecurringChargeFrequency = item.childItems[j].externalRecurringChargeFrequency;
              subItem.externalRecurringChargeDuration = item.childItems[j].externalRecurringChargeDuration;
              subItem.assetId = item.childItems[j].assetId;
              subItem.serviceId = item.childItems[j].serviceId;
              subItem.customerAccountId = item.childItems[j].customerAccountId;
              subItem.billingAccountId = item.childItems[j].billingAccountId;
              subItem.serviceAccountId = item.childItems[j].serviceAccountId;
              subItem.activationDate = item.childItems[j].activationDate;
              subItem.deactivationDate = item.childItems[j].deactivationDate;
              // Add the childSKUs to the subItems
              if (item.childItems[j].childItems && item.childItems[j].childItems.length > 0) {
                subItem.childItems = self.createChildItemTree(data, item.childItems[j]);
              }
              childItems.push(subItem);
              break;
            }
          }
        }
        return childItems;
      };

      /**
       * Update the productData for all the child items in a multilevel cpq item which matches the passed product data.
       *
       * @function
       * @name CartViewModel#updateChildTreeProductData
       * @param {CartItem} cartItem Multi-level cpq CartItem object containing child items.
       * @param {Object} currentProduct Product data which is to be matched against sub-item's product data.
       */
      self.updateChildTreeProductData = function (cartItem, currentProduct) {
        for (var k = 0; cartItem.childItems && k < cartItem.childItems.length; k++) {
          if (currentProduct.id == cartItem.childItems[k].productId) {
            for (var index = 0; index < currentProduct.childSKUs.length; index++) {
              if (currentProduct.childSKUs[index].repositoryId == cartItem.childItems[k].catRefId) {
                cartItem.childItems[k].productData(jQuery.extend(true, {}, currentProduct));
              }
            }
          }
          if (cartItem.childItems[k].childItems && cartItem.childItems[k].childItems.length > 0) {
            self.updateChildTreeProductData(cartItem.childItems[k], currentProduct);
          }
        }
      };

      /**
       * Returns an array of CartItem objects corresponding to the child items present at a particular level.
       * This method also recursively creates CartItem objects for all the child items of an item
       * and adds them to its corresponding parent CartItem object.
       *
       * @function
       * @name CartViewModel#getChildItemsDataAsCartItems
       * @param {Object} data Multi-level cpq data which is to be converted to corresponding CartItem objects tree.
       */
      self.getChildItemsDataAsCartItems = function (data) {
        var cartItems = [];
        if (data.childItems) {
          cartItems = data.childItems.map(function (childItem) {
            var cartItemData = {
              productId: childItem.id,
              productData: childItem,
              quantity: childItem.orderQuantity,
              catRefId: childItem.catalogRefId, 
              selectedOptions: childItem.selectedOptions,
              currency: self.currency,
              externalPrice: childItem.price,
              externalPriceQuantity: -1,
              externalData: childItem.externalData,
              actionCode: childItem.actionCode,
              externalRecurringCharge: childItem.externalRecurringCharge,
              externalRecurringChargeFrequency: childItem.externalRecurringChargeFrequency,
              externalRecurringChargeDuration: childItem.externalRecurringChargeDuration,
              assetId: childItem.assetId,
              serviceId: childItem.serviceId,
              customerAccountId: childItem.customerAccountId,
              billingAccountId: childItem.billingAccountId,
              serviceAccountId: childItem.serviceAccountId,
              activationDate: childItem.activationDate,
              deactivationDate: childItem.deactivationDate,
              addOnItem: childItem.addOnItem,
              shopperInput: childItem.shopperInput
            };

            if (childItem.childItems && childItem.childItems.length > 0) {
              $.extend(cartItemData, {
                childItems: self.getChildItemsDataAsCartItems(childItem)
              });
            }
          
            return new CartItem(cartItemData);
          });
        }
        return cartItems;
      };

      /**
       * Returns an array of CartItem objects corresponding to the child items present at a particular level.
       * This method also recursively creates CartItem objects for all the child items of an item
       * and adds them to its corresponding parent CartItem object.
       *
       * @function
       * @name CartViewModel#getAddonDataAsCartItems
       * @param {Object} data Multi-level add-on data which is to be converted to corresponding CartItem objects tree.
       */
      self.getAddonDataAsCartItems = function(data) {
        var cartItems = [];
        if (data.selectedAddOnProducts) {
          cartItems = data.selectedAddOnProducts.map(function (addonProduct) {
            var tempCartItems = [];
            // Within a Config Property, shopper can select multiple Config Options.
            // So tempCartItems can actually contains multiple cartItem objects
            for(var i=0; i<addonProduct.addOnOptions.length; i++) {
              var selectedConfigOption = addonProduct.addOnOptions[i];
              if(selectedConfigOption) {
                var cartItemData = {
                    productId: selectedConfigOption.product.id,
                    productData: selectedConfigOption.product,
                    quantity: selectedConfigOption.quantity,
                    catRefId: selectedConfigOption.sku.repositoryId,
                    selectedOptions: selectedConfigOption.selectedOptions,
                    currency: self.currency,
                    externalData: selectedConfigOption.externalData,
                    actionCode: selectedConfigOption.actionCode,
                    lineAttributes: selectedConfigOption.lineAttributes,
                    externalRecurringCharge: selectedConfigOption.externalRecurringCharge,
                    externalRecurringChargeFrequency: selectedConfigOption.externalRecurringChargeFrequency,
                    externalRecurringChargeDuration: selectedConfigOption.externalRecurringChargeDuration,
                    assetId: selectedConfigOption.assetId,
                    serviceId: selectedConfigOption.serviceId,
                    customerAccountId: selectedConfigOption.customerAccountId,
                    billingAccountId: selectedConfigOption.billingAccountId,
                    serviceAccountId: selectedConfigOption.serviceAccountId,
                    activationDate: selectedConfigOption.activationDate,
                    deactivationDate: selectedConfigOption.deactivationDate,
                    addOnItem: true,
                    shopperInput: selectedConfigOption.shopperInput,
                    configurablePropertyId: addonProduct.repositoryId,
                    configurationOptionId: selectedConfigOption.repositoryId
                };
                // If the add-on childItem is externally Priced, then set the Price and Quantity
                // As per the existing limitations on the ExternalPriceCalculator, only -1 can be passed in the childItems 
                if (selectedConfigOption.externalPrice) {
                  $.extend(cartItemData, {
                    externalPrice: selectedConfigOption.externalPrice,
                    externalPriceQuantity: -1
                  });
                }
              }
              if (self.isProductWithAddons(selectedConfigOption.product)) {
                $.extend(cartItemData, {
                  childItems: self.getAddonDataAsCartItems(selectedConfigOption.product)
                });
              }
              tempCartItems.push(new CartItem(cartItemData));
            }
            // Returning only if there is a valid data, otherwise need to handled
            // undefined values further down the line
            if(tempCartItems.length > 0) {
              return tempCartItems;
            }
          });
        }

        // Since the earlier iteration results in a two dimensional array of cartItems 
        // (as there can be multiple Config Options selected for a Config Prop), need to
        // iterate over and create a list of cartItem objects
        var childItems = [];
        for(var i=0; i<cartItems.length; i++) {
          childItems = childItems.concat(cartItems[i]);
        }
        return childItems;
      }

      /**
       * Method to update detailed item price info and itemTotal for all the child items recursively using the data received from the server
       *
       * @function
       * @name CartViewModel#updateChildItemPrices
       * @param {Object[]} sourceItems Array of data objects per child item returned from the server.
       * @param {Object[]} targetItems Array of CartItem objects per child item present in the cart.
       */
      self.updateChildItemPrices = function (sourceItems, targetItems) {
        for (var i=0; i < sourceItems.length; i++) {
           for (var j = 0; j < targetItems.length; j++) {
             if (sourceItems[i].productId == targetItems[j].productId && sourceItems[i].catRefId == targetItems[j].catRefId) {
               targetItems[j].detailedItemPriceInfo(sourceItems[i].detailedItemPriceInfo);
               if (sourceItems[i].amount) {
                 targetItems[j].itemTotal(sourceItems[i].amount);
               }
               if (sourceItems[i].rawTotalPrice) {
                 targetItems[j].rawTotalPrice(sourceItems[i].rawTotalPrice);
               }
               if (sourceItems[i].id) {
                 targetItems[j].repositoryId = sourceItems[i].id;
                 if(!((self.currentOrderState() == ccConstants.QUOTED_STATES) || 
                     (self.currentOrderState() == ccConstants.PENDING_PAYMENTS) || 
                     (self.currentOrderState() == ccConstants.PENDING_PAYMENT_TEMPLATE))){
                     if(sourceItems[i].commerceItemId){
                       targetItems[j].commerceItemId = sourceItems[i].commerceItemId;
                     }else{
                       targetItems[j].commerceItemId = sourceItems[i].id;
                     }
                 }
               }
               if (targetItems[j].childItems && sourceItems[i].childItems) {
                 // update the detailedItemPriceInfo of child items recursively
                 self.updateChildItemPrices(sourceItems[i].childItems, targetItems[j].childItems);
               }
               break;
             }
           }
        }
      };
        
      /**
       * Returns an array of CartItem objects corresponding to the child items present at a particular level.
       * This method also recursively creates CartItem objects for all the child items of an item
       * and adds them to its corresponding parent CartItem object.
       *
       * @function
       * @name CartViewModel#getChildItemsAsCartItems
       * @param {Object} data Multi-level cpq data which is to be converted to corresponding CartItem objects tree.
       */
      self.getChildItemsAsCartItems = function (data) {
        var cartItems = [];
        if (data.childItems) {
          cartItems = data.childItems.map(function (childItem) {
            var cartItemData = {
              productId: childItem.productId,
              quantity: childItem.quantity,
              catRefId: childItem.catRefId, 
              selectedOptions: childItem.selectedOptions,
              currency: self.currency,
              externalPrice: childItem.externalPrice,
              externalPriceQuantity: childItem.externalPriceQuantity,
              externalData: childItem.externalData,
              actionCode: childItem.actionCode,
              externalRecurringCharge: childItem.externalRecurringCharge,
              externalRecurringChargeFrequency: childItem.externalRecurringChargeFrequency,
              externalRecurringChargeDuration: childItem.externalRecurringChargeDuration,
              assetId: childItem.assetId,
              serviceId: childItem.serviceId,
              customerAccountId: childItem.customerAccountId,
              billingAccountId: childItem.billingAccountId,
              serviceAccountId: childItem.serviceAccountId,
              activationDate: childItem.activationDate,
              deactivationDate: childItem.deactivationDate,
              rawTotalPrice: childItem.rawTotalPrice,
              commerceItemId: childItem.commerceItemId,
              addOnItem: childItem.addOnItem,
              shopperInput: childItem.shopperInput,
              configurablePropertyId: childItem.configurablePropertyId,
              configurationOptionId: childItem.configurationOptionId
            };
            if (childItem.childItems && childItem.childItems.length > 0) {
              $.extend(cartItemData, {
                childItems: self.getChildItemsAsCartItems(childItem)
              });
            }
            else {
              $.extend(cartItemData, {
                backOrderQuantity: childItem.backOrderQuantity,
                preOrderQuantity: childItem.preOrderQuantity
              });
            }
          
            var cartItem =  new CartItem(cartItemData);
          
            cartItem.displayName = ko.observable(childItem.displayName);
            cartItem.detailedItemPriceInfo(childItem.detailedItemPriceInfo);
            cartItem.itemTotal(childItem.amount);
            cartItem.detailedRecurringChargeInfo(childItem.detailedRecurringChargeInfo);
            cartItem.repositoryId = childItem.id;
          
            return cartItem;
          });
        }
        return cartItems;
      };

      /**
       * This method checks the validity all the child items in a multilevel cpq item. 
       * If any of the product in the sub tree is inactive then the product name is added to the list of invalid product names. 
       * If any product in the sub tree is active but its corresponding sku is no more valid then that particular sku id is added 
       * to the list of invalid skus.
       * 
       * @function
       * @name CartViewModel#checkCpqItemValidity
       * @param {Object} data Item to keep if they are present in the cart.
       * @param {Object} currentItem Multi-level cpq cart item which is to be validated.
       * @param {String[]} invalidProductNames Array of invalid product names.
       * @param {String[]} invalidSkus Array of invalid sku ids.
       */
      self.checkCpqItemValidity = function (data, currentItem, invalidProductNames, invalidSkus, invalidAddonChildItems) {
        for (var index = 0; currentItem.childItems && index < currentItem.childItems.length; index++){
          if (data.id == currentItem.childItems[index].productId) {
            if (!data.active || !data.childSKUs || data.childSKUs.length == 0) {
              // If this is a add-on cart item then populate invalidAddons array
              if (currentItem.childItems[index].addOnItem) {
                if(invalidAddonChildItems.indexOf(currentItem.childItems[index])== -1) {
                  invalidAddonChildItems.push(currentItem.childItems[index]);
                }
              } else {
                if(invalidProductNames.indexOf(data.displayName)== -1)
                  invalidProductNames.push(data.displayName);
              }
            } else {
              var childSkuIndex = 0;
              var childSkuFound = false;
              for (childSkuIndex = 0; data.childSKUs && childSkuIndex < data.childSKUs.length; childSkuIndex++) {
                if (data.childSKUs[childSkuIndex].repositoryId == currentItem.childItems[index].catRefId) {
                  childSkuFound = true;
                  break;
                }
              }
              // check if the sku is inactive and populate it in the invalidSkus Array
              if (data.childSKUs[childSkuIndex] && !data.childSKUs[childSkuIndex].active) {
                // check if the cart-item is a add-on item and populate the array accordingly
                if (currentItem.childItems[index].addOnItem) {
                  if(invalidAddonChildItems.indexOf(currentItem.childItems[index])== -1) {
                    invalidAddonChildItems.push(currentItem.childItems[index]);
                  }
                } else {
                  if(invalidSkus.indexOf(currentItem.childItems[index].catRefId)== -1) 
                    invalidSkus.push(currentItem.childItems[index].catRefId);
                }
              } else if(data.childSKUs[childSkuIndex] && 
                  data.childSKUs[childSkuIndex].listPrice == null && 
                  currentItem.childItems[index].addOnItem) {
                if(invalidAddonChildItems.indexOf(currentItem.childItems[index])== -1) {
                  invalidAddonChildItems.push(currentItem.childItems[index]);
                }
              } else if (!childSkuFound && currentItem.childItems[index].addOnItem) {
                if(invalidAddonChildItems.indexOf(currentItem.childItems[index])== -1) {
                  invalidAddonChildItems.push(currentItem.childItems[index]);
                }
              }
            }
          }
          if (currentItem.childItems[index].childItems && currentItem.childItems[index].childItems.length > 0) {
            self.checkCpqItemValidity(data, currentItem.childItems[index], invalidProductNames, invalidSkus, invalidAddonChildItems);
          }
        }
      };

      self.getChildItemsCookie = function (data) {
        var childItems = [];
        for (var i = 0; data.childItems && i < data.childItems.length; i++) {
          var childItem = data.childItems[i];
          childItems[i] = {
            productId : childItem.productId,
            quantity : childItem.quantity(),
            catRefId : childItem.catRefId,
            amount : childItem.itemTotal(),
            id: childItem.repositoryId,
            rawTotalPrice : childItem.rawTotalPrice(),
            stockStatus : childItem.stockStatus(),
            displayName : childItem.displayName(),
            selectedOptions : childItem.selectedOptions,
            selectedSkuProperties : childItem.selectedSkuProperties,
            discountInfo : childItem.discountInfo(),
            detailedItemPriceInfo : childItem.detailedItemPriceInfo(),
            externalPrice : childItem.externalPrice(),
            externalPriceQuantity : childItem.externalPriceQuantity(),
            configuratorId : childItem.configuratorId,
            externalData: childItem.externalData(),
            actionCode: childItem.actionCode(),
            commerceItemId: childItem.commerceItemId,
            unpricedExternalMessage: childItem.unpricedExternalMessage(),
            isGWPChoicesAvaliable: childItem.isGWPChoicesAvaliable(),
            giftData: (childItem.giftData ? childItem.giftData : null),
            giftWithPurchaseCommerceItemMarkers: childItem.giftWithPurchaseCommerceItemMarkers,
            priceListGroupId :  childItem.priceListGroupId(),
            invalid : childItem.invalid,
            isPersonalized: childItem.isPersonalized(),
            detailedRecurringChargeInfo : childItem.detailedRecurringChargeInfo(),
            externalRecurringCharge : childItem.externalRecurringCharge(),
            externalRecurringChargeFrequency : childItem.externalRecurringChargeFrequency(),
            externalRecurringChargeDuration : childItem.externalRecurringChargeDuration(),
            assetId: childItem.assetId(),
            serviceId: childItem.serviceId(),
            customerAccountId: childItem.customerAccountId(),
            billingAccountId: childItem.billingAccountId(),
            serviceAccountId: childItem.serviceAccountId(),
            activationDate: childItem.activationDate(),
            deactivationDate: childItem.deactivationDate(),
            addOnItem: childItem.addOnItem,
            shopperInput: childItem.shopperInput,
            configurablePropertyId: childItem.configurablePropertyId,
            configurationOptionId: childItem.configurationOptionId
          };
          if (childItem.childItems && childItem.childItems.length > 0) {
            childItems[i]['childItems'] = self.getChildItemsCookie(childItem);
          }
        }
        return childItems;
      };

      /**
       * Return a localized text for remove coupon link for accessibility.
       *
       * @function
       * @name CartViewModel#getRemoveCouponReadText
       * @returns {string} Localized text for remove coupon link.
       */
      self.getRemoveCouponReadText = function() {
        return CCi18n.t('ns.common:resources.removeCouponLinkReadText');
      };

      /**
       * This method populates the gift cards to the pricing model
       */
      self.populateGiftCards = function(pricingModel, lastCartEvent) {
        if (self.giftCards().length > 0) {
          for ( var i = 0; i < self.giftCards().length; i++) {
            var giftItem = {};
            var giftCard = self.giftCards()[i];
            giftItem['type'] = ccConstants.GIFT_CARD_PAYMENT_TYPE;
            giftItem['giftCardNumber'] = giftCard.giftCardNumber();
            giftItem['giftCardPin'] = giftCard.giftCardPin();
            if (giftCard.amountInGiftCard() ) {
              if(!(lastCartEvent && lastCartEvent.type === CART_EVENT_GIFTCARD_REAPPLY &&
            		  lastCartEvent.product.giftCardNumber() === giftCard.giftCardNumber() )){
            	  giftItem['amount'] = giftCard.amountInGiftCard();
              }
            }
            pricingModel.payments.push(giftItem);
          }
        }
      };

      /**
       * This method takes any IINs currently stored on the cart and adds them to the pricing model
       * (which then may be used in the generation of the pricing request payload)
       */
      self.populateIINs = function(pricingModel, lastCartEvent) {
        if (self.IINDetails().length > 0) {
          for (var i = 0; i < self.IINDetails().length; i++) {
            var IINItem = self.IINDetails()[i];
            IINItem['IIN'] = IINItem.IIN;

            // Originally this structure was used only to represent IIN-based payments. Following the arival
            // of split payment we now need to give the server visibility of not just IIN-based payments, but all
            // payments as the presence or lack of presence of payments other than IIN-based payments may influence
            // the application of IIN promotions. To ensure backwards compatiblity, we will continue to refer to
            // to each payment in terms of IINs but now we can think of it in terms of payments relating to IIN
            // promotions, some of which (e.g. credit cards) will have an actual IIN and some (e.g. invoice) will not.
            // We assume an IIN-based type if no other type is reported.
            var typeToUse = ccConstants.IIN_PAYMENT_TYPE;
            if (IINItem.type) {
              typeToUse = IINItem.type;
            }
            IINItem['type'] = typeToUse;
            pricingModel.payments.push(IINItem);
          }
        }
      }

      /**
       * This method updates the IINs currently stored on the cart and, in the process, marks the cart as dirty,
       * which we can expect will result in a pricing operation.
       */
      self.applyIINsToCart = function(pricingPaymentsArray) {
        self.IINDetails([]);
        for (var i = 0; i < pricingPaymentsArray.length; i++) {
          self.IINDetails.push(pricingPaymentsArray[i]);
        }
        self.events.push(new CartEvent(CART_EVENT_IINS_UPDATED, 0, pricingPaymentsArray));
        self.markDirty();
      };

      /**
       * this validates the gift cards data on the place order
       */
      self.validateGiftCards = function() {
        for ( var i = 0; i < self.giftCards().length; i++) {
          var giftItem = self.giftCards()[i];
         if (!giftItem.validateNow()) {
            return false
          }
        }
        return true;
      };

      /**
       * this updates the allItems array after cart is ready/updated.
       */
      self.updateAllItemsArray = function() {
        self.allItems.removeAll();
        ko.utils.arrayForEach(self.items(), function(item) {
          self.allItems.push(item);
        });
        ko.utils.arrayForEach(self.placeHolderItems(), function(item) {
          self.allItems.push(item);
        });
      };

      /**
       * This methods checks if an item is configurable or not.
       * The check validates if the item contains a valid
       * configurator id key or a valid commerce items key.
       * 
       * @param {object} data the item.
       * @return whether the item is configurable or not.
       */
      self.isConfigurableItem = function(data) {
        if ((data.configuratorId != undefined && data.configuratorId != null && data.configuratorId != '') ||
            (data.childItems != undefined && data.childItems != null && data.childItems != '')) {
          // Only return that this item is configurable if it has 
          // non-empty configurator id or non-empty childItems
          return true;
        } else {
          return false;
        }
      };

      self.isProductWithAddons = function(data) {
        if(data.selectedAddOnProducts && data.selectedAddOnProducts.length > 0) {
          return true;
        }
        return false;
      };

      /**
       * Returns the total, after comparing between the partialTotal and the orderTotal,
       * based on the condition whether we are charging Tax and shipping in secondary currency
       * or not. Partial total should either be primaryCurrencyTotal or the secondaryTotal
       * @function CartViewModel#getDerivedTotal
       * @param partialTotal A portion of the orderTotal, should be either primaryCurrencyTotal or secondaryCurrencyTotal
       * @param orderTotal The order total in site selected currency.
       */
      self.getDerivedTotal = function(partialTotal, orderTotal) {
        var total = this.isChargeTaxShippingInSecondaryCurrency() ?
            partialTotal : orderTotal;
        return total;
      };

      // Subscribe to add to cart
      $.Topic(pubsub.topicNames.CART_ADD).subscribe(self.addToCart);
      $.Topic(pubsub.topicNames.CART_REMOVE).subscribe(self.removeFromCart);
      $.Topic(pubsub.topicNames.ORDER_SUBMISSION_SUCCESS).subscribe(self.handleOrderSubmit);
      $.Topic(pubsub.topicNames.SCHEDULED_ORDER_SUBMISSION_SUCCESS).subscribe(self.handleOrderSubmit);
      $.Topic(pubsub.topicNames.CART_UPDATE_QUANTITY).subscribe(self.updateQuantity);
      $.Topic(pubsub.topicNames.CHECKOUT_SHIPPING_METHOD).subscribe(self.updateShippingMethod);
      $.Topic(pubsub.topicNames.PAGE_CONTEXT_CHANGED).subscribe(notifications.emptyGrowlMessages);
      $.Topic(pubsub.topicNames.PAGE_VIEW_CHANGED).subscribe(viewChangedHandler);
      $.Topic(pubsub.topicNames.PAGE_LAYOUT_UPDATED).subscribe(self.initCatalog.bind(self));
      $.Topic(pubsub.topicNames.LOAD_CHECKOUT).subscribe(self.checkPriceDataAndRedirect);
      $.Topic(pubsub.topicNames.POPULATE_SHIPPING_METHODS).subscribe(self.updateShippingAddress);
      $.Topic(pubsub.topicNames.CHECKOUT_SHIPPING_ADDRESS_INVALID).subscribe(self.resetShippingAddress);
      $.Topic(pubsub.topicNames.USER_PROFILE_ADDRESSES_REMOVED).subscribe(self.resetShippingAddress);
      $.Topic(pubsub.topicNames.USER_AUTO_LOGIN_SUCCESSFUL).subscribe(self.loadCartForProfile.bind(self));
      $.Topic(pubsub.topicNames.USER_LOAD_CART).subscribe(self.loadCartForProfile.bind(self));
      $.Topic(pubsub.topicNames.USER_CLEAR_CART).subscribe(self.clearCartForProfile.bind(self));
      $.Topic(pubsub.topicNames.REFRESH_USER_CART).subscribe(self.refreshUserCart.bind(self));
      $.Topic(pubsub.topicNames.REMOVE_INVALID_ITEMS).subscribe(self.handleInvalidItems.bind(self));
      $.Topic(pubsub.topicNames.ORDER_SUBMISSION_FAIL).subscribe(self.clearPins.bind(self));
      $.Topic(pubsub.topicNames.PAGE_CHANGED).subscribe(function(data) {
        self.clearLoadedOrder(data);
        self.clearPins();
      });
      $.Topic(pubsub.topicNames.USER_LOGOUT_SUBMIT).subscribe(self.clearPins.bind(self));
      $.Topic(pubsub.topicNames.USER_SESSION_RESET).subscribe(self.clearPins.bind(self));
      $.Topic(pubsub.topicNames.GIFTCARD_REAPPLY_PINS).subscribe(self.reApplyGiftCardPins.bind(self));
      $.Topic(pubsub.topicNames.PLACE_HOLDER_REMOVE).subscribe(function(item) {
        self.removePlaceHolderFromCart(item);
      });

      // When user logs out or session expires, reset the shipping address
      $.Topic(pubsub.topicNames.USER_LOAD_SHIPPING).subscribe(function(obj) {
        if (self.user() && !self.user().loggedIn()) {
          self.resetShippingAddress();
        }
      });

      return(self);
    }

    /**
     * Callback to load server side cart info on receiving a USER_LOGIN_SUCCESSFUL or
     * USER_AUTO_LOGIN_SUCCESSFUL pubsub event.
     *
     * @private
     * @function
     * @name CartViewModel#loadCartForProfile
     */
    CartViewModel.prototype.loadCartForProfile = function(user) {
      var self = this;
      notifier.clearError(CART_VIEW_MODEL_ID);
      var clearCoupons = true;
      // Check and do not call if there is already a get Order call in progress.
      if(!self.isCurrentCallInProgress){
        self.isCurrentCallInProgress = true;
        if (self.user() && !self.user().loggedinAtCheckout()) {
          if(user && user.catalog) {
            var catalogId = user.catalog.repositoryId;
            if(this.catalogId() != catalogId){
              this.catalogId(catalogId);
            }
          }
        
        if(user && user.priceListGroup && user.priceListGroup.id) {
          this.priceListGroupId(user.priceListGroup.id);
        }
        var params = {};
        var contextObj = {};
        contextObj[ccConstants.ENDPOINT_KEY] = ccConstants.ENDPOINT_GET_PROFILE_ORDER;
        contextObj[ccConstants.IDENTIFIER_KEY] = "loadCartForProfile";
        var filterKey = self.storeConfiguration.getFilterToUse(contextObj);
        if (filterKey) {
          params[ccConstants.FILTER_KEY] = filterKey;
        }
        self.adapter.loadJSON('getCurrentProfileOrder', '0', params,
          //success callback
          function(data) {
            if(data === undefined) {
              // No server side cart for the user.
            	
              // Existing email ID should be reset when user is just created with no server cart. 
              // TODO: Do we need to reset entire shipping Address ?
              if(self.shippingAddress() && 
                 ko.utils.unwrapObservable(self.shippingAddress().email)) {
                 self.shippingAddress().email = null;
              }
              
              $.Topic(pubsub.topicNames.CART_READY).publish(self);
            }
            if (data && data.orderId) {
              self.user().orderId(data.orderId);
              self.user().persistedOrder(data);
              self.user().setLocalData('orderId');
              var itemsRemoved = self.removeItems(data);
              self.mergeItems(data);
              self.isPricingRequired(true);
              self.validateServerCart();
              self.getProductData();
              self.getDynamicPropertiesMetadata(true);
              self.getItemDynamicPropertiesMetadata(ccConstants.ENDPOINT_COMMERCE_ITEM_TYPE_PARAM);
              self.updateDynamicProperties(data);
              // load the coupon data
              if (data.discountInfo.orderImplicitDiscountList) {
                self.orderDiscountDescList(data.discountInfo.orderImplicitDiscountList);
              }
              if (data.discountInfo.unclaimedCouponsMap) {
                self.populateCoupons(data.discountInfo.unclaimedCouponsMap, ccConstants.COUPON_STATUS_UNCLAIMED);
              }
              if (data.discountInfo.orderCouponsMap) {
                self.populateCoupons(data.discountInfo.orderCouponsMap, ccConstants.COUPON_STATUS_CLAIMED);
              }
              self.couponMultiPromotions.splice(0);
              if (data.discountInfo.unclaimedCouponMultiPromotions) {
                self.populateCouponMultiPromotions(data.discountInfo.unclaimedCouponMultiPromotions, ccConstants.COUPON_STATUS_UNCLAIMED, ccConstants.PROMOTION_NOT_APPLIED);
              }
              if (data.discountInfo.claimedCouponMultiPromotions) {
                  self.populateCouponMultiPromotions(data.discountInfo.claimedCouponMultiPromotions, ccConstants.COUPON_STATUS_CLAIMED, ccConstants.PROMOTION_APPLIED);
              }
              self.populateClaimedCouponMultiPromotions(self.couponMultiPromotions());
              // Merge coupons coming from the server
              for (var i=self.coupons().length-1;i>=0;i--) {
                if (!data.discountInfo.orderCouponsMap.hasOwnProperty(self.coupons()[i].code()) && !data.discountInfo.unclaimedCouponsMap.hasOwnProperty(self.coupons()[i].code())) {
                  self.coupons.splice(i,0);
                }
              }
              if (data.shippingGroups && data.shippingGroups.length == 1 && self.shippingAddress && self.shippingAddress() == '' 
                  && !(self.user() && self.user().shippingAddressBook() && self.user().shippingAddressBook.length > 0)) {
                var translateHelper =  {
                  translate: function(key, options) {
                    return CCi18n.t('ns.common:resources.' + key, options);
                  }
                };
                var shippingAddress = new Address('cart-shipping-address', '', translateHelper, self.contextData.page.shippingCountriesPriceListGroup, self.contextData.page.defaultShippingCountry);
                shippingAddress.copyFrom(data.shippingGroups[0].shippingAddress, self.contextData.page.shippingCountriesPriceListGroup);
                shippingAddress.resetModified();
                if (shippingAddress.validateForShippingMethod()) {
                  self.shippingAddress(shippingAddress);
                  self.shippingMethod(data.shippingGroups[0].shippingMethod.value);
                  $.Topic(pubsub.topicNames.CART_SHIPPING_ADDRESS_UPDATED).publishWith();
                }
              }
            } else if (self.items() && self.items().length > 0){
              self.validateServerCart();
              self.getProductData();
              self.createCurrentProfileOrder();
            }
          },
          //error callback
          function(data) {
            self.isCurrentCallInProgress = false;
            self.loadCart();
          }
        );
      }
    }else{
      self.isCurrentCallInProgress = false;
     }
    };
    
    /**
     * Loads the current order details to the cart
     * 
     * @funtion
     * @name CartViewModel#loadOrderForProfile
     */
    CartViewModel.prototype.loadOrderForProfile = function(order, user) {
      var self = this;
      if (!self.user()) {
        self.user = user;
      }
      // Clear the cart first
      self.user().persistedOrder(null);
      self.emptyCart();
      // Now add the items
      self.orderCurrency=order.priceListGroup.currency;
      self.orderItems(order.order.items);
      self.mergeItems(order);
      self.updateCartData(order, false, true);
      self.cartUpdated();
    };
      
    /**
     * Clears the loaded order on the cart and associated items
     * 
     * @function
     * @name CartViewModel#clearLoadedOrder
     */
    CartViewModel.prototype.clearLoadedOrder = function(data) {
      var self = this;
      if (!self.mergeCart() && self.currentOrderId()) {
    	  if ((data.pageId != ccConstants.PAGE_TYPE_CHECKOUT && data.pageId != ccConstants.PAGE_TYPE_PAYMENT) && (self.currentOrderState() == ccConstants.QUOTED_STATES || self.currentOrderState() == ccConstants.PENDING_PAYMENTS || self.currentOrderState() == ccConstants.PENDING_PAYMENT_TEMPLATE)) {
          self.currentOrderId(null);
          self.currentOrderState(null);
          self.orderItems([]);
          self.orderCurrency={};
          self.emptyCart();
          self.loadCartForProfile(self.user());
          $.Topic(pubsub.topicNames.LOAD_ORDER_RESET_ADDRESS).publish();
        }
      }
    };

    /**
     * Checks if Shipping is required.
     *
     * @function
     * @name CartViewModel#isShippingAddressChanged
     */
    CartViewModel.prototype.isShippingAddressChanged = function (newAddress, oldAddress) {
      return  ( newAddress.state && newAddress.state != oldAddress.state) ||
          ( newAddress.postalCode && newAddress.postalCode != oldAddress.postalCode) ||
          ( newAddress.country && newAddress.country != oldAddress.country);
    };

    /**
     * Remove invalid items from the shopping cart in the given data object. This method
     * will mutate the data object passed as a parameter.
     *
     * @function
     * @name CartViewModel#removeItems
     * @param {Object} data Data to be processed
     * @param {CartItem[]} data.shoppingCart.items Array of cart items to check validity and remove.
     * @returns boolean true if any cart items were removed, otherwise false.
     */
    CartViewModel.prototype.removeItems = function (data) {
      var self = this;
      var itemsRemoved = false;
      var productFound;
      var items = data.shoppingCart.items;
      for (var i=0; i < items.length; i++) {
        if (!items[i].isItemValid ) {
          if (items[i].displayName && self.invalidProductNames.indexOf(items[i].displayName) == -1) {
            self.invalidProductNames.push(items[i].displayName);
          }
          items.splice(i, 1);
          i--;
          itemsRemoved = true;
        }
      }
      return itemsRemoved;
    };

    /**
     * Compare items in the cart with items in the cookie data.
     *
     * @function
     * @CartViewModel#compareItems
     * @param {Object[]} cookieItems List of cart items from cookie to compare with current cart items.
     * @returns {boolean} true if both collections contain the same items, otherwise false, probably.
     */
    CartViewModel.prototype.compareItems = function (cookieItems) {
      var self = this;
      var items = cookieItems;
      var productFound;
      if(items.length != self.items().length || items.length == 0) {
        return false;
      } else if(items.length == 0) {
        return true;
      }
      var lastCartEvent = self.events.pop();
      if (lastCartEvent) {
        self.events.push(lastCartEvent);
      }
      for (var j = 0; j < self.items().length; j++) {
        productFound = false;
        for (var i=0; i < items.length; i++) {
          if (items[i].productId == self.items()[j].productId && items[i].catRefId == self.items()[j].catRefId) {
            // Check if the items are configurable. Then add an extra check.
            if ((!(self.isConfigurableItem(items[i]) || self.isConfigurableItem(self.items()[j])) && (items[i].commerceItemId != null)
                    && (items[i].commerceItemId == self.items()[j].commerceItemId)) ||
                (self.isConfigurableItem(items[i]) && self.isConfigurableItem(self.items()[j])
                    && (items[i].commerceItemId == self.items()[j].commerceItemId))) {
              if(!(lastCartEvent && lastCartEvent.type == 2 && lastCartEvent.product.id == items[i].productId)) {
                if(items[i].quantity != self.items()[j].quantity()) {
                  self.items()[j].quantity(items[i].quantity);
                  self.items()[j].updatableQuantity(items[i].quantity);
                }
              }
              productFound = true;
              break;
            }
          }
        }
        if(!productFound) {
           return false;
        }
      }
      return true;
    };

    CartViewModel.prototype.compareItemsAndQuantity = function (cookieItems) {
        var self = this;
        var items = cookieItems;
        var productFound;
        if(items.length != self.items().length || items.length == 0) {
          return false;
        } else if(items.length == 0) {
          return true;
        }
        var lastCartEvent = self.events.pop();
        if (lastCartEvent) {
          self.events.push(lastCartEvent);
        }
        for (var j = 0; j < self.items().length; j++) {
          productFound = false;
          for (var i=0; i < items.length; i++) {
            // Check if the product is configurable, if so do not update the quantity.
            if (self.isConfigurableItem(self.items()[i])) {
              continue;
            } else if (items[i].productId == self.items()[j].productId && items[i].catRefId == self.items()[j].catRefId) {
              // Check if the items are configurable. Then add an extra check.
              if ((!(self.isConfigurableItem(items[i]) || self.isConfigurableItem(self.items()[j])) && (items[i].commerceItemId != null)
                     && (items[i].commerceItemId == self.items()[j].commerceItemId)) ||
                  (self.isConfigurableItem(items[i]) && self.isConfigurableItem(self.items()[j])
                      && (items[i].commerceItemId == self.items()[j].commerceItemId))) {
                if(!(lastCartEvent && lastCartEvent.type == 2 && lastCartEvent.product.id == items[i].productId)) {
                  if(items[i].quantity != self.items()[j].quantity() ) {
                    break;
                  }
                }
                productFound = true;
                break;
              }
            }
          }
          if(!productFound) {
             return false;
          }
        }
        return true;
      };
    
    
    /**
     * Compare coupons in the parameter with coupons in the cart.
     *
     * @function
     * @name CartViewModel#compareCoupons
     * @param {Object[]} coupons List of coupons to compared against coupons on the cart.
     * @returns {boolean} true if the lists contain the same coupons, otherwise false.
     */
    CartViewModel.prototype.compareCoupons = function (coupons) {
      var self = this;
      var couponFound;
      if(coupons.length != self.coupons().length) {
          return false;
      } else if(coupons.length == 0) {
        return true;
      }
      for (var j = 0; j < self.coupons().length; j++) {
        couponFound = false;
        for (var i=0; i < coupons.length; i++) {
          if (coupons[i].code == self.coupons()[j].code()) {
            couponFound = true;
          }
        }
        if(!couponFound) {
           return false;
        }
      }
      return true;
    };

    /**
     * Merge the items from the parameter into the list of items in cart. If a product already exists in the
     * cart then update the quantity.
     *
     * @function
     * @name CartViewModel#mergeItems
     * @param {Object} data Data object
     * @param {CartItem} data.shoppingCart.items List of cart items in the data parameter to merge into the cart.
     */
    CartViewModel.prototype.mergeItems = function (data) {
      var self = this;
      var items;
      if (data.order && (self.currentOrderId()||self.mergeCart())) {
        items = data.order.items;
      }
      else if(data.commerceItems && self.mergeCart()){
   	    items = data.commerceItems;
   	  }
      else {
        items = data.shoppingCart.items;
      }
      var addItems = [];
      for (var i=0; i < items.length; i++) {
        var found = false;
        if(items[i].catalogRefId){
	 	     items[i].catRefId = items[i].catalogRefId;
	 	}
        //Setting combine value based on both client side and server side cart.
        self.combineLineItems = (self.shouldCombineLineItems(self.items()) && self.shouldCombineLineItems(items)) == true
                                 ? ccConstants.COMBINE_YES : ccConstants.COMBINE_NO;
        var cartItem = null;
        if (self.isConfigurableItem(items[i])) {
          cartItem = self.getConfigurableCartItem(items[i].productId, items[i].catRefId, items[i].commerceItemId);
        } else {
          if(self.combineLineItems == ccConstants.COMBINE_YES){
              //Search for an item in cart with productId and catRefId only if line items are to be combined.
              cartItem = self.getCartItem(items[i].productId, items[i].catRefId);
          } else {
              //Else include commerceItemId to compare accordingly
              cartItem = self.getCartItem(items[i].productId, items[i].catRefId, items[i].commerceItemId);
          }
       }
        //If cart item is found, proceed with merging
       if (cartItem !== null) {
              var updatedQuantity = items[i].quantity + cartItem.quantity();
              cartItem.quantity(updatedQuantity);
              cartItem.updatableQuantity(updatedQuantity);
              cartItem.discountInfo(items[i].discountInfo);
              cartItem.rawTotalPrice(items[i].rawTotalPrice);
              cartItem.detailedItemPriceInfo(items[i].detailedItemPriceInfo);
              cartItem.detailedRecurringChargeInfo(items[i].detailedRecurringChargeInfo);
              found = true;
        }
       //If not found, add this as a new cart item
        if (!found) {
          addItems.push(items[i]);
        }
      }
      for (var i=0; i<addItems.length; i++) {
        var selectedOptions = getSelectedOptions(addItems[i]);
        var childItems = null;         
        if (self.isConfigurableItem(addItems[i]) && addItems[i].childItems && addItems[i].childItems.length > 0) {
          childItems = [];
          childItems = self.getChildItemsAsCartItems(addItems[i]);
        }

        var cartItemData = {
          productId: addItems[i].productId,
          quantity: addItems[i].quantity,
          catRefId: addItems[i].catRefId, 
          selectedOptions: selectedOptions,
          currency: self.currency,
          discountInfo: addItems[i].discountInfo,
          rawTotalPrice: addItems[i].rawTotalPrice, 
          externalPrice: addItems[i].externalPrice,
          externalPriceQuantity: addItems[i].externalPriceQuantity,
          configuratorId: addItems[i].configuratorId,
          childItems: childItems,
          commerceItemId: addItems[i].commerceItemId,
          externalData: addItems[i].externalData,
          actionCode: addItems[i].actionCode,
          externalRecurringCharge: addItems[i].externalRecurringCharge,
          externalRecurringChargeFrequency: addItems[i].externalRecurringChargeFrequency,
          externalRecurringChargeDuration: addItems[i].externalRecurringChargeDuration,
          assetId: addItems[i].assetId,
          serviceId: addItems[i].serviceId,
          customerAccountId: addItems[i].customerAccountId,
          billingAccountId: addItems[i].billingAccountId,
          serviceAccountId: addItems[i].serviceAccountId,
          activationDate: addItems[i].activationDate,
          deactivationDate: addItems[i].deactivationDate,
          addOnItem: addItems[i].addOnItem,
          shopperInput: addItems[i].shopperInput
        };

        var item = new CartItem(cartItemData);

        item.itemTotal(addItems[i].price);
        item.repositoryId = addItems[i].id;
        item.originalPrice(addItems[i].unitPrice);
        item.updatableQuantity(addItems[i].quantity);
        item.detailedItemPriceInfo(addItems[i].detailedItemPriceInfo);
        self.updateItemDynamicProperties(item, addItems[i]);
        if(data.priceListGroup && data.priceListGroup.repositoryId != null) {
          item.priceListGroupId(data.priceListGroup.repositoryId);
        }

        item.detailedRecurringChargeInfo(addItems[i].detailedRecurringChargeInfo);
        self.items.push(item);
      }
    };

    /**
     * Create  a javascript object representing the selection items for an items variants.
     *
     * @private
     * @function
     */
    function getSelectedOptions(item) {
      var selectedOptions = null;
      if (item.variant && item.variant.length > 0) {
        var options = item.variant;
        selectedOptions = [];
        for (var j = 0; j < options.length; j++) {
          selectedOptions.push({'optionName': options[j].optionName, 'optionValue': options[j].optionValue});
        }
      }
      return selectedOptions;
    };

    /**
     * Validate the cart after merge, but before redirecting to checkout.
     *
     * @function
     * @name CartViewModel#validateServerCart
     */
    CartViewModel.prototype.validateServerCart = function() {
      var self = this;
      if (self.user().pageToRedirect() && self.user().pageToRedirect() == self.checkoutLink) {
        self.validateAndRedirectCart(true);
      } else {
        self.validateAndRedirectCart(false);
      }
    };

    /**
     * Clear client cart after logout, or when not logged in. Invoked on receiving a USER_CLEAR_CART
     * pubsub event.
     *
     * @private
     * @function
     * @CartViewModel#clearCartForProfile
     * @param {Object} userData User object to be used if self.user() is unset.
     */
    CartViewModel.prototype.clearCartForProfile = function(userData) {
      var self = this;
      if (!self.user()) {
        self.user(userData);
      }
      if (self.user()) {
        self.user().persistedOrder(null);
        if (!self.user().loggedinAtCheckout() && !self.user().loggedoutAtCheckout() && self.user().orderId() != '') {
          self.emptyCart();
        }
        self.user().orderId('');
        self.user().setLocalData('orderId');
      }
    };

    /**
     * Refresh the cart data from the server.
     *
     * @private
     * @function
     * @name CartViewModel#refreshUserCart
     * @param {Object} userData User object to be used if self.user() is unset.
     */
    CartViewModel.prototype.refreshUserCart = function(userData) {
      var self = this;
      if (!self.user()) {
        self.user(userData);
      }
      if (!self.isCurrentCallInProgress && !self.updatedFromRepository && self.currentOrderState() != ccConstants.PENDING_PAYMENTS && self.currentOrderState() != ccConstants.PENDING_PAYMENT_TEMPLATE){
        if (self.user() && self.user().loggedIn() && !self.user().loggedinAtCheckout() && !navigation.isPathEqualTo(self.checkoutLink)) {
          var params = {};
          var contextObj = {};
          contextObj[ccConstants.ENDPOINT_KEY] = ccConstants.ENDPOINT_GET_PROFILE_ORDER;
          contextObj[ccConstants.IDENTIFIER_KEY] = "refreshCart";
          var filterKey = self.storeConfiguration.getFilterToUse(contextObj);
          if (filterKey) {
            params[ccConstants.FILTER_KEY] = filterKey;
          }
          self.adapter.loadJSON('getCurrentProfileOrder', '0', params,
              //success callback
              function(data) {
                if (data!=null && data.orderId) {
                  self.user().orderId(data.orderId);
                  self.user().persistedOrder(data);
                  self.user().setLocalData('orderId');
                  var itemsRemoved = self.removeItems(data);
                  self.isPricingRequired(itemsRemoved);
                  if (!self.compareItemsAndQuantity(data.shoppingCart.items)) {
                	  self.updateCartData(data, true);
                	  self.isPricingRequired(true);
                  }
                  self.getProductData();
                  self.getDynamicPropertiesMetadata(true);
                  self.getItemDynamicPropertiesMetadata(ccConstants.ENDPOINT_COMMERCE_ITEM_TYPE_PARAM);
                  self.updateDynamicProperties(data);
                  
                  if (data.shippingGroups.length == 1 && self.shippingAddress && self.shippingAddress() == '' 
                    ) {
                  var translateHelper =  {
                    translate: function(key, options) {
                      return CCi18n.t('ns.common:resources.' + key, options);
                    }
                  };
                  var shippingAddress = new Address('cart-shipping-address', '', translateHelper, self.contextData.page.shippingCountriesPriceListGroup, self.contextData.page.defaultShippingCountry);
                  shippingAddress.copyFrom(data.shippingGroups[0].shippingAddress, self.contextData.page.shippingCountriesPriceListGroup);
                  shippingAddress.resetModified();
                  if (shippingAddress.validateForShippingMethod()) {
                    self.shippingAddress(shippingAddress);
                    //$.Topic(pubsub.topicNames.CART_SHIPPING_ADDRESS_UPDATED).publishWith();
                  }
                }
                  self.cartUpdated();
                } else {
                  self.user().orderId('');
                  self.user().persistedOrder(null);
                  self.user().setLocalData('orderId');
                }
              },
              //error callback
              function(data) {
                self.loadCart();
              }
            );
        }
      }
    };


    //handle the errors with invalid items with deleted products and skus while updating the server side cart
    /**
     * Handle invalid items and deleted products/SKUs while updating server-side cart.
     *
     * @private
     * @function
     * @name CartViewModel#handleInvalidItems
     * @param {Object} data
     */
    CartViewModel.prototype.handleInvalidItems = function(data) {
      var self = this;
      if (data.errorCode == ccConstants.CREATE_ORDER_PRODUCT_NOT_FOUND) {
        var itemsRemovedFromCart = self.removeItemsByProduct(data.moreInfo);
        self.markDirty();
      }
      if (data.errorCode == ccConstants.CREATE_ORDER_SKU_NOT_FOUND) {
        var moreInfo = JSON.parse(data.moreInfo);
        var itemsRemovedFromCart = self.removeItemsByProductCatRef(moreInfo.productId, moreInfo.catRefId);
        self.markDirty();
      }
    };

    /**
     * Initialize/reload Catalog data when page is changed or loaded.
     *
     * @private
     * @function
     * @name CartViewModel#initCalalog
     */
    CartViewModel.prototype.initCatalog = function() {
      var self = this;
      if (arguments[0].data.global.user && arguments[0].data.global.user.catalog) {
        var catalogId = arguments[0].data.global.user.catalog.repositoryId;

        if (this.catalogId() != catalogId) {
          this.catalogId(catalogId);
        }
      }
      if (arguments[0].data.global.user && arguments[0].data.global.user.priceListGroup) {
          var priceListGroupId = arguments[0].data.global.user.priceListGroup.id;
          this.priceListGroupId(priceListGroupId);
      }      
      //this is added as part of initCatalog to load the cart each time cart page loaded.
      //do not load the cart when redirected back to store checkout page from a web checkout such as paypal, payu.
      var isRedirected = (storageApi.getInstance().getItem(ccConstants.REDIRECTED_TO_WEB_PAYMENT));
      //cart should load in failure case of Paypal or Payu, in success case order.getOrder will make loadCart call in anonymous case
      var cartNotToBeLoaded = isRedirected && ((arguments[1].token && arguments[1].paymentId ) || (arguments[1].authorizationCode)) ? 'true' : 'false';
      storageApi.getInstance().setItem(ccConstants.REDIRECTED_TO_WEB_PAYMENT, 'false');
      if ((!navigation.isPathEqualTo(arguments[0].data.global.links.checkout.route) || !self.checkoutLink)
           && (cartNotToBeLoaded === 'false')) {
          // For load cart, we need to know if the user is anonymous or logged-in.
          // When cartViewModel is constructed, userViewModel is undefined.
          // Hence, the loadCart should be deferred to the point when we have the userViewModel.
          self.deferLoadCart.done(function() {
              self.loadCart();
          });
      }
    };

    /**
     * Determines if line items are to be combined based on comparison of their
     * commerceItemId's. Takes only normal CI line items into consideration.
     *
     * @function
     * @name CartViewModel#shouldCombineLineItems
     * @param  {Object[]} items the array of line items
     * @return {boolean} true if no two normal CI line items are having same productId and catRefId.
     *
     */
    CartViewModel.prototype.shouldCombineLineItems = function(items) {
        var self = this;
        for (var i=0; i< items.length; i++) {
            for (var j = i+1; j< items.length; j++) {
             //Considering only normal CI line items.
              if(!(self.isConfigurableItem(items[i]) || self.isConfigurableItem(items[j]))
                   && items[i].productId == items[j].productId
                   && items[i].catRefId == items[j].catRefId
                   && items[i].commerceItemId != items[j].commerceItemId){
                   return false;
              }
            }
        }
        return true;
    }

    /**
     * Load cart data from the shopping cart local storage.
     *
     * @function
     * @name CartViewModel#loadCart
     */
    CartViewModel.prototype.loadCart = function() {
      var self = this;

      self.isDirty(false);
      storageApi.getInstance().setItem(ccConstants.REDIRECTED_TO_WEB_PAYMENT, 'false');

      if (!self.updatedFromRepository) {
        //if the user is logged in and has a server side cart, then load the cart from the server instead of cookie, except on checkout page
        if (navigation.isPathEqualTo(self.checkoutLink) || (! (self.user() && self.user().loggedIn() && !self.user().loggedinAtCheckout() && self.user().orderId()))) {
          // Read product ID's and quantities from local storage if there are any
          var cookieData = self.getCookieData();
          if (cookieData != null) {
           self.getLocalData(cookieData);
          }
        }
      }

      if(!self.cartPriceListGroupId()){
        if(storageApi.getInstance().getItem("shoppingCart")){
          self.cartPriceListGroupId(JSON.parse(storageApi.getInstance().getItem("shoppingCart")).cartPriceListGroupId);
        }
      }

      self.combineLineItems = self.shouldCombineLineItems(self.items()) == true
                              ? ccConstants.COMBINE_YES : ccConstants.COMBINE_NO;
    };

    /**
     * Loads cart data from the shopping cart from the server in case of server side cart,
     * or from the cookie in the case of an anonymous user
     *
     * @function
     * @name CartViewModel#reloadCart
     */
    CartViewModel.prototype.reloadCart = function() {
      var self = this;
      if (self.user() && self.user().loggedIn() && !self.user().loggedinAtCheckout()) {
        self.isDirty(false);
        self.refreshUserCart(self.user());
      } else {
        self.loadCart();
      }
    };

    /**
     * Return the price of the cart item.
     * If product in the item has variants, then price for the sku to be considered, if it not null
     * otherwise product price will be considered.
     *
     * @function
     * @name CartViewModel#getItemPrice
     * @param {CartItem} item Item to get the price
     * @returns {number} Calculated price of item taking into account child SKUs and salePrice.
     */
    CartViewModel.prototype.getItemPrice = function (item) {
        var itemPrice = 0;
        if (item.productData() != null) {
          if (item.productData().childSKUs) {
            //the product has variant
            var childSkus = item.productData().childSKUs;
            var childSkusCount = item.productData().childSKUs.length;
            for (var i = 0; i < childSkusCount; i++) {
              if (item.productData().childSKUs[i].repositoryId == item.catRefId) {
                var matchingSku = item.productData().childSKUs[i];
                if (matchingSku.salePrice != null) {
                  itemPrice = matchingSku.salePrice;
                } else if (item.productData().salePrice != null) {
                  itemPrice = item.productData().salePrice;
                } else if (matchingSku.listPrice != null) {
                  itemPrice = matchingSku.listPrice;
                } else {
                  itemPrice = item.productData().listPrice;
                }
              }
            }
          } else if (item.productData().salePrice != null) {
            itemPrice = item.productData().salePrice;
          } else {
            itemPrice = item.productData().listPrice;
          }
          return itemPrice;
        }
      };

    /**
     * Saves the current cart information into the shopping cart local storage.
     *
     * @private
     * @function
     * @name CartViewModel#saveCartCookie
     */
    CartViewModel.prototype.saveCartCookie = function () {
      var self = this;
      var isPriceOverridden = false;
      // Write the view model details to local storage
      var shoppingCartCookie = new Object();
      shoppingCartCookie.numberOfItems = self.numberOfItems();
      shoppingCartCookie.total = self.total();
      shoppingCartCookie.totalWithoutTax = self.totalWithoutTax();
      shoppingCartCookie.subTotal = self.subTotal();
      shoppingCartCookie.amount = self.amount();
      shoppingCartCookie.tax = self.tax();
      shoppingCartCookie.currencyCode = self.currencyCode();
      shoppingCartCookie.shipping = self.shipping();
      shoppingCartCookie.shippingDiscount = self.shippingDiscount();
      shoppingCartCookie.shippingSurcharge = self.shippingSurcharge();
      shoppingCartCookie.orderDiscount = self.orderDiscount();
      shoppingCartCookie.orderDiscountDescList = self.orderDiscountDescList();
      shoppingCartCookie.coupons = self.coupons();
      shoppingCartCookie.cartPriceListGroupId = SiteViewModel.getInstance().selectedPriceListGroup().id;
      shoppingCartCookie.giftWithPurchaseOrderMarkers = self.giftWithPurchaseOrderMarkers;

      shoppingCartCookie.recurringChargeAmount = self.recurringChargeAmount();
      shoppingCartCookie.recurringChargeCurrencyCode = self.recurringChargeCurrencyCode();
      shoppingCartCookie.recurringChargeShipping = self.recurringChargeShipping();
      shoppingCartCookie.recurringChargeSubTotal = self.recurringChargeSubTotal();
      shoppingCartCookie.recurringChargeSubTotalByFrequency = self.recurringChargeSubTotalByFrequency();
      shoppingCartCookie.recurringChargeTax = self.recurringChargeTax();
      shoppingCartCookie.recurringChargeTaxByFrequency = self.recurringChargeTaxByFrequency();
      shoppingCartCookie.recurringChargeTotal = self.recurringChargeTotal();
      shoppingCartCookie.items = new Array();

      //local storage data to be compared with price change
      var cookieData = self.getCookieData();

      // If the local storage data comes back as a string, convert it to JSON - only happens in phantomjs.
      if (typeof cookieData === 'string') {
        cookieData = JSON.parse(cookieData);
      }

      var productData = {};
      if (cookieData != null) {
        for (var i = 0; i < cookieData.items.length; i++) {
          if (productData[cookieData.items[i].catRefId] === undefined) {
            productData[cookieData.items[i].catRefId] = cookieData.items[i].originalPrice;
          }
        }
      }

      var persistedOrder = self.user().persistedOrder();
      if (persistedOrder && persistedOrder.shoppingCart.items) {
        var persistedCart = persistedOrder.shoppingCart;
        var itemsCount = persistedCart.items.length;
        for (var i = 0; i < itemsCount; i++) {
          if (productData[persistedCart.items[i].catRefId] === undefined) {
            productData[persistedCart.items[i].catRefId] = persistedCart.items[i].unitPrice;
          }
        }
      }

      if(self.lineAttributes){
          // Add the current dynamic property values
          shoppingCartCookie.lineAttributes = new Array();
          for (var i = 0; i < self.lineAttributes().length; i++) {
            var dynPropItem = self.lineAttributes()[i];
            var dynPropId = dynPropItem.id();
            var dynPropValue = null;
            if (dynPropItem.value() != null) {
              dynPropValue = dynPropItem.value();
            }
            shoppingCartCookie.lineAttributes.push({
              id: dynPropId,
              value: dynPropValue
            });
          }
      }

      for (var i = 0; i < self.items().length; i++) {
        var originalPrice = 0;
        var itemPrice = self.getItemPrice(self.items()[i]);
        //to check if the product is not added to local storage
        if (productData[self.items()[i].catRefId] == undefined) {
            originalPrice = itemPrice;
        } else {
          //if the product is updated then updated the list price or sale price
          if (self.updatedProduct() != '' && self.updatedProduct() === self.items()[i].catRefId) {
            originalPrice = itemPrice;
            self.updatedProduct('');
          } else {
            originalPrice = productData[self.items()[i].catRefId];
          }
        }
        // If currency changes, the original price should be overridden
        if ((self.cartPriceListGroupId() != SiteViewModel.getInstance().selectedPriceListGroup().id) &&
          (itemPrice != undefined)) {
          self.items()[i].priceListGroupId(SiteViewModel.getInstance().selectedPriceListGroup().id);
          originalPrice = itemPrice;
          isPriceOverridden = true;
        }
        self.items()[i].originalPrice(originalPrice);
        // create childItem cookie if the item is a configurable item
        var childItemsCookie = undefined;
        if (self.isConfigurableItem(self.items()[i])) {
          childItemsCookie = [];
          childItemsCookie = self.getChildItemsCookie(self.items()[i]);
        } 
        //cookie object containing data of a cart item.
        var itemCookie = {
          productId: self.items()[i].productId,
          quantity: self.items()[i].quantity(),
          catRefId: self.items()[i].catRefId,
          itemTotal: self.items()[i].itemTotal(),
          id: self.items()[i].repositoryId,
          rawTotalPrice: self.items()[i].rawTotalPrice(),
          originalPrice: originalPrice,
          selectedOptions: self.items()[i].selectedOptions,
          selectedSkuProperties: self.items()[i].selectedSkuProperties,
          discountInfo: self.items()[i].discountInfo(),
          detailedItemPriceInfo: self.items()[i].detailedItemPriceInfo(),
          externalPrice: self.items()[i].externalPrice(),
          externalPriceQuantity: self.items()[i].externalPriceQuantity(),
          configuratorId: self.items()[i].configuratorId,
          childItems: childItemsCookie,
          externalData: self.items()[i].externalData(),
          actionCode: self.items()[i].actionCode(),
          externalRecurringCharge: self.items()[i].externalRecurringCharge(),
          externalRecurringChargeFrequency: self.items()[i].externalRecurringChargeFrequency(),
          externalRecurringChargeDuration: self.items()[i].externalRecurringChargeDuration(),
          commerceItemId: self.items()[i].commerceItemId,
          unpricedExternalMessage: self.items()[i].unpricedExternalMessage(),
          isGWPChoicesAvaliable: self.items()[i].isGWPChoicesAvaliable(),
          giftData: (self.items()[i].giftData ? self.items()[i].giftData : null),
          giftWithPurchaseCommerceItemMarkers: self.items()[i].giftWithPurchaseCommerceItemMarkers,
          detailedRecurringChargeInfo: self.items()[i].detailedRecurringChargeInfo(),
          isPersonalized: self.items()[i].isPersonalized(),
          assetId: self.items()[i].assetId(),
          serviceId: self.items()[i].serviceId(),
          customerAccountId: self.items()[i].customerAccountId(),
          billingAccountId: self.items()[i].billingAccountId(),
          serviceAccountId: self.items()[i].serviceAccountId(),
          activationDate: self.items()[i].activationDate(),
          deactivationDate: self.items()[i].deactivationDate(),
          addOnItem: self.items()[i].addOnItem,
          shopperInput: self.items()[i].shopperInput
        };

      //Saving custom property values of the cart item to the cookie object
      for(var attribute in self.lineAttributes()){
           itemCookie[self.lineAttributes()[attribute].id()] = self.items()[i][self.lineAttributes()[attribute].id()]();
       }
       shoppingCartCookie.items.push(itemCookie);
     }

      if (isPriceOverridden) {
        self.cartPriceListGroupId(SiteViewModel.getInstance().selectedPriceListGroup().id);
      }
      // Add dynamic properties
      if (self.dynamicProperties) {
        // Ensure we have dynamic property metadata
        // to aid setting of default values
        self.getDynamicPropertiesMetadata(true);

        // Add the current dynamic property values
        shoppingCartCookie.dynamicProperties = new Array();
        for (var i = 0; i < self.dynamicProperties().length; i++) {
          var dynPropItem = self.dynamicProperties()[i];
          var dynPropId = dynPropItem.id();
          var dynPropValue = null;
          if (dynPropItem.value() != null) {
            dynPropValue = dynPropItem.value();
          }
          shoppingCartCookie.dynamicProperties.push({
            id: dynPropId,
            value: dynPropValue
          });
        }
      }

      // Write the shopping cart to local storage
      try {
    	  if(self.currentOrderState()!=ccConstants.PENDING_PAYMENT){
        storageApi.getInstance().setItem("shoppingCart", JSON.stringify(shoppingCartCookie));
      }}
      catch(pError) {
      }
    };

    /**
     * Reads the shopping cart from local storage and populates the Cart object with data of cookie.
     *
     * @private
     * @function
     * @param {Object} cookieData the local storage data containing the shopping cart information
     *
     */
    CartViewModel.prototype.getLocalData = function(cookieData) {
      // FIXME: Rename parameter 'cookieData' to something more descriptive as it can be cookie, a cart input with order or shopping cart data.  
      var self = this;
      
      // If the local storage data is not JSON, convert it - especially for phantomjs.
      if (typeof cookieData === 'string') {
        cookieData = JSON.parse(cookieData);
      }

      if(cookieData) {
        // Add product ID's and quantities from local storage to the widget context
        self.numberOfItems(cookieData.numberOfItems);
        self.total(cookieData.total);
        self.totalWithoutTax(cookieData.totalWithoutTax);
        self.subTotal(cookieData.subTotal);
        self.amount(cookieData.amount);
        self.tax(cookieData.tax);
        self.currencyCode(cookieData.currencyCode);
        self.shipping(cookieData.shipping);
        self.shippingDiscount(cookieData.shippingDiscount);
        self.shippingSurcharge(cookieData.shippingSurcharge);
        self.orderDiscount(cookieData.orderDiscount);
        self.orderDiscountDescList(cookieData.orderDiscountDescList);
        self.cartPriceListGroupId(cookieData.cartPriceListGroupId);
        self.giftWithPurchaseOrderMarkers = cookieData.giftWithPurchaseOrderMarkers;


        // As coupon code and description are observables,
        //  access the local data and set them.
        self.coupons.splice(0);
        if (cookieData.hasOwnProperty('coupons')) {
          for (var i = 0; i < cookieData.coupons.length; i++) {
            var couponItem = new Coupon(
                cookieData.coupons[i].code,
                cookieData.coupons[i].description,
                cookieData.coupons[i].status,
                cookieData.coupons[i].level,
                cookieData.coupons[i].id,
                cookieData.coupons[i].totalAdjustment,
                cookieData.coupons[i].name,
                cookieData.coupons[i].longDescription
            );
            self.coupons.push(couponItem);
          }
        }

        self.populateClaimedCouponMultiPromotions(self.couponMultiPromotions());

        self.items.splice(0);
        for (var i = 0; i < cookieData.items.length; i++) {
          // Updating for configurable items.
          
          var childItems = undefined;         
          if (self.isConfigurableItem(cookieData.items[i])) {
            childItems = [];
            childItems = self.getChildItemsAsCartItems(cookieData.items[i]);
          }

          var cartItemData = {
            productId: cookieData.items[i].productId,
            quantity: cookieData.items[i].quantity,
            catRefId: cookieData.items[i].catRefId, 
            selectedOptions: cookieData.items[i].selectedOptions,
            currency: self.currency,
            discountInfo: cookieData.items[i].discountInfo,
            rawTotalPrice: cookieData.items[i].rawTotalPrice, 
            externalPrice: cookieData.items[i].externalPrice,
            externalPriceQuantity: cookieData.items[i].externalPriceQuantity,
            configuratorId: cookieData.items[i].configuratorId,
            childItems: childItems,
            commerceItemId: cookieData.items[i].commerceItemId,
            unpricedExternalMessage: cookieData.items[i].unpricedExternalMessage,
            externalData: cookieData.items[i].externalData,
            actionCode: cookieData.items[i].actionCode,
            backOrderQuantity: cookieData.items[i].backOrderQuantity,
            preOrderQuantity: cookieData.items[i].preOrderQuantity,
            externalRecurringCharge: cookieData.items[i].externalRecurringCharge,
            externalRecurringChargeFrequency: cookieData.items[i].externalRecurringChargeFrequency,
            externalRecurringChargeDuration: cookieData.items[i].externalRecurringChargeDuration,
            assetId: cookieData.items[i].assetId,
            serviceId: cookieData.items[i].serviceId,
            customerAccountId: cookieData.items[i].customerAccountId,
            billingAccountId: cookieData.items[i].billingAccountId,
            serviceAccountId: cookieData.items[i].serviceAccountId,
            activationDate: cookieData.items[i].activationDate,
            deactivationDate: cookieData.items[i].deactivationDate,
            addOnItem: cookieData.items[i].addOnItem,
            shopperInput: cookieData.items[i].shopperInput
          };

          var productItem = new CartItem(cartItemData);

          productItem.itemTotal(cookieData.items[i].itemTotal);
          productItem.originalPrice(cookieData.items[i].originalPrice);
          productItem.productPriceChanged(false);
          productItem.detailedItemPriceInfo(cookieData.items[i].detailedItemPriceInfo);
          productItem.priceListGroupId(cookieData.cartPriceListGroupId);
          productItem.isGWPChoicesAvaliable(cookieData.items[i].isGWPChoicesAvaliable);
          productItem.skuProperties = cookieData.items[i].skuProperties;
          productItem.isPersonalized = ko.observable(cookieData.items[i].isPersonalized);
          
          if (cookieData.items[i].giftWithPurchaseCommerceItemMarkers) {
            productItem.giftWithPurchaseCommerceItemMarkers = cookieData.items[i].giftWithPurchaseCommerceItemMarkers;
          }
          if (cookieData.items[i].giftData) {
            productItem.giftData = cookieData.items[i].giftData;
          }
          //Fetching custom property values of order line items from cookieData
          for(var attribute in cookieData.lineAttributes){
             productItem[cookieData.lineAttributes[attribute].id] = ko.observable(cookieData.items[i][cookieData.lineAttributes[attribute].id]);
          }
          productItem.detailedRecurringChargeInfo(cookieData.items[i].detailedRecurringChargeInfo);
          self.items.push(productItem);
        }
      }
      if (self.items().length > 0) {
        //make a REST call to update the stock status and orderable quantity
        self.getProductData();
      }
      
      // Fetch metadata on custom order properties
      self.getDynamicPropertiesMetadata(true);
      
      // Retrieve dynamic property values
      if (cookieData.hasOwnProperty('dynamicProperties')) {
        self.updateDynamicProperties(cookieData);
      }
      
    };

    /**
     * Update item data of each item in the shopping cart with updated information from the server. Keep track
     * of whether any prices have changed.
     *
     * @private
     * @function
     * @name CartViewModel#processCartData
     * @param {Object[]} data List of product objects returned from server.
     * @returns {boolean} true if any product prices have changed, otherwise false.
     */
    CartViewModel.prototype.processCartData = function (data) {
      var self = this;
      var productPriceChanged = false;

      for (var j = 0; j < self.items().length; j++) {
        for (var i = 0; i < data.length; i++) {
          var currentProduct = data[i];
          if (currentProduct.id == self.items()[j].productId) {
            var skuIDImageMap = createImageMapForSkus(currentProduct);
            for (var index = 0; index < currentProduct.childSKUs.length; index++) {
              if (currentProduct.childSKUs[index].repositoryId == self.items()[j].catRefId) {
                var skuItem = currentProduct.childSKUs[index];
                var productData = jQuery.extend(true, {}, currentProduct);
                productData.childSKUs = [skuItem];
                self.items()[j].currentPrice(self.getItemPrice(self.items()[j]));
                //Sets Thumb Image URL which is used in all widgets
                if(!productData.childSKUs[0].primaryThumbImageURL && productData.childSKUs[0].listingSKUId){
                  productData.childSKUs[0].primaryThumbImageURL=skuIDImageMap[productData.childSKUs[0].listingSKUId];
                }
                self.items()[j].productData(productData);
                //If gift item is present then no need to update the prices, just let productData to be updated
                if (!checkForGiftItem(self.items()[j].discountInfo())) {
                  var itemPrice = self.getItemPrice(self.items()[j]);
                  // *** Suppress price change detection for Products/SKUs with volume prices (bulk/tiered).
                  // *** Temporary fix until CCCO-492 can be resolved.
                  skuItem = skuItem || {};
                  if (skuItem.saleVolumePrice || skuItem.listVolumePrice || productData.saleVolumePrice || productData.listVolumePrice) {
                    self.items()[j].productPriceChanged(false);
                  }
                  else if ((self.items()[j].originalPrice() != itemPrice) &&
                      (self.items()[i].priceListGroupId() == SiteViewModel.getInstance().selectedPriceListGroup().id) &&
                      (SiteViewModel.getInstance().selectedPriceListGroup().id == self.cartPriceListGroupId())) {
                    if (!(self.skipPriceChange() && self.items()[j].productPriceChanged() && (self.items()[j].currentPrice() == itemPrice)) && !self.items()[j].invalid) {
                      productPriceChanged = true;
                    }
                    //in case price has changed to null we want to make pricing call but don't want to show price changed messsage in cart
                    //so only in case price has not changed to null we need to set price changed message in cart
                    if(itemPrice != null) {
                       self.items()[j].productPriceChanged(true);
                    }
                  } else {
                    self.items()[j].productPriceChanged(false);
                    //if the price is reset to the original price, we do not need to show the price change notification
                    //but still need to re-price with the latest price
                    if (self.items()[j].currentPrice() && itemPrice && self.items()[j].currentPrice() != itemPrice && !self.items()[j].invalid) {
                      self.isPricingRequired(true);
                    }
                  }
                  if (currentProduct.productVariantOptions) {
                    for (var k = 0; k < currentProduct.productVariantOptions.length; k++) {
                      self.updateItemOptionDetails(currentProduct.productVariantOptions[k], self.items()[j].catRefId);
                    }
                  }
                  break;
                }
              }
            }
          }
          if (self.isConfigurableItem(self.items()[j]) && self.items()[j].childItems && self.items()[j].childItems.length > 0) {
            self.updateChildTreeProductData(self.items()[j], currentProduct);
          }
        }
      }
      self.skipPriceChange(false);
      self.showSelectedOptions(true);
      return productPriceChanged;
    };
    
    /**
     * Call the listProducts endpoint to fetch the product data and
     * remove the invalid items from the cart based on the response.
     *
     * @private
     * @function
     * @name CartViewModel#getProductData
     */
    CartViewModel.prototype.getProductData = function () {
      var self = this;
      $.when(
        self.getProductDataForCart(),
        self.getAvailabilityOfCart()
      ).done(
        function(pProductData, pCartDate){
          // Callback to tell others the cart is ready
          $.Topic(pubsub.topicNames.CART_READY).publish(self);
        }
      );
    };

    CartViewModel.prototype.filterInactiveAddons = function(product) {
      if (product.addOnProducts && product.addOnProducts.length > 0) {
        var productAddonsSize = product.addOnProducts.length;
        for(var i=(productAddonsSize-1); i>=0; i--) {
          // Verify is add-on Product is active, if not remove from the addons object
          if(!product.addOnProducts[i].addOnOptions ||
             product.addOnProducts[i].addOnOptions.length == 0 ||
             !product.addOnProducts[i].addOnOptions[0].product.active) {
            product.addOnProducts.splice(i, 1);
            continue;
          }
          // Verify is add-on SKU is active, if not remove from the addons object
          for(var j=(product.addOnProducts[i].addOnOptions.length-1); j>=0; j--) {
            if(!product.addOnProducts[i].addOnOptions[j].sku.active) {
              product.addOnProducts[i].addOnOptions.splice(j, 1);
            }
          }
        }
      }
    }

    CartViewModel.prototype.getProductDataForCart = function () {
      var self = this;
      var deferred = $.Deferred();
      var productIds = [];
      for (var i = 0; i < self.items().length; i++) {
        if (productIds.indexOf(self.items()[i].productId) === -1) {
          productIds.push(self.items()[i].productId);
        }
        if (self.isConfigurableItem(self.items()[i])) {
          self.addProductIdFromConfigurableProduct(productIds, self.items()[i]);
        }
      }
      // Make REST calls to get details of all the products in the cart
      var id = new Array(self.catalogId(), productIds, true, self.priceListGroupId(), self.fields, true);
      var productPriceChanged = false;
      var params = {};
      var contextObj = {};
      contextObj[ccConstants.ENDPOINT_KEY] = ccConstants.ENDPOINT_PRODUCTS_LIST_PRODUCTS;
      contextObj[ccConstants.IDENTIFIER_KEY] = "getProductData";
      var filterKey = self.storeConfiguration.getFilterToUse(contextObj);
      if (filterKey) {
        params[ccConstants.FILTER_KEY] = filterKey;
      }
      self.adapter.loadJSON('cart', id, params,
        //success callback
        function(data) {

        for(var index=0; index<data.length; index++) {
          self.filterInactiveAddons(data[index]);
        }

        if(self.mergeCart()){
    		  for(var k=0; k<data.length; k++){
    			  if(!(data[k].active)){
    				  if (data[k].displayName && self.invalidProductNames.indexOf(data[k].displayName) == -1) {
    	    	            self.invalidProductNames.push(data[k].displayName);
    	    	      }
    			  }
    		  }
    	  }
          var itemsRemovedFromCart = self.removeInvalidItems(data, self.invalidProductNames);
          // Currently when the main product is updated with associated linked add-ons, from admin, the existing
          // CP and CO objects are removed and getting recreated, hence the ids are getting changed.
          // Once the admin fix the issue, the we have to uncomment this validation
          var unlinkedAddonsRemoved = self.removeUnlinkedAddonItems(data, self.invalidProductNames);
          // In case itemsRemovedFromCart is already set, no need to set again based on add-ons scenario.
          // Otherwise check if add-ons are removed and set the flag for further processing
          if(!itemsRemovedFromCart) {
            itemsRemovedFromCart = unlinkedAddonsRemoved;
          }

          var productPriceChanged = self.processCartData(data);

          //If product price has changed then make a price engine call
          if (itemsRemovedFromCart == true || productPriceChanged === true || self.isPricingRequired() ) {
             //Pushing reprice cart event
             self.events.push(new CartEvent(CART_EVENT_REPRICE, 0, data));
            //if shipping method is set and user is on checkout page then price order total insead of subtotal.
            if (navigation.isPathEqualTo(self.checkoutLink) && self.shippingMethod() != "") {
              self.priceCartForCheckout();
            } else {
              self.markDirty();
            }
            self.isPricingRequired(false);
          } else if (self.cartPriceListGroupId() &&
                self.cartPriceListGroupId() != SiteViewModel.getInstance().selectedPriceListGroup().id) {
            // As price list group is changed, re-pricing is required.Pushing reprice cart event
            self.events.push(new CartEvent(CART_EVENT_REPRICE, 0, data));
            self.markDirty();
          } else {
             //Publishing price complete when pricing is finished
             $.Topic(pubsub.topicNames.CART_PRICE_COMPLETE).publish();
          }
          if(self.mergeCart()){
        	  self.notifyInvalidProducts('cart');
        	  if(!self.isDirty()){
        		  self.markDirty();
        	  }
        	  self.mergeCart(false);
          }
          else{
        	  self.notifyInvalidProducts();
          }

          self.updateAllItemsArray();
          deferred.resolve(data);
        },
        //error callback
        function(data) {
          deferred.reject(data);
          if (data.errors && data.errors.length >0) {
            self.handleListProductsFailure(data);
            self.getProductData();
          }
        });
      return deferred;
    };

    /**
     * Create a notification message for any items that have been removed from the cart because they
     * are now invalid.
     *
     * @private
     * @function
     * @param {string} The page where the notitifcation message should be displayed
     * @name CartViewModel#natifyInvalidProducts
     */
    CartViewModel.prototype.notifyInvalidProducts = function (page) {
      var self = this;
      var notificationMsg = "";
      if (self.invalidProductNames.length > 0) {
        var productNames = "";
        var count = self.invalidProductNames.length-1;
        for (var i=0; i < count; i++) {
          productNames = productNames + CCi18n.t('ns.common:resources.productNameHasNext', {productName: self.invalidProductNames[i]});
        }
        productNames = productNames + self.invalidProductNames[count];
        notificationMsg = CCi18n.t('ns.common:resources.invalidCartItemsError', {productNames: productNames});
      }
      if (notificationMsg) {
        if (!page) {
          // Add the notification message to the user view-model. This is necessary
          // for whenever a B2B user logs in and is redirected to the home page.
          self.user().redirectNotificationMessage(notificationMsg);
          notifier.sendWarning(CART_VIEW_MODEL_ID, notificationMsg, true);
        }
        else {
          notifier.sendWarningToPage(CART_VIEW_MODEL_ID, notificationMsg, true, page, true);
        }
      }
      self.invalidProductNames = [];
    };

    /**
     * Remove items from the cart matching the given product ID.
     *
     * @function
     * @name CartViewModel#removeItemsByProduct
     * @param {string} productId Product ID which will be removed from cart.
     * @returns {boolean} true if any items were removed from the cart, otherwise false.
     */
    CartViewModel.prototype.removeItemsByProduct = function (productId) {
      var self = this;
      var itemsRemovedFromCart = false;
      for (var i = 0; i < self.items().length; i++) {
        if (self.items()[i].productId === productId) {
          self.items.remove(self.items()[i]);
          i--;
          itemsRemovedFromCart = true;
          self.isPricingRequired(true);
        }
      }
      return itemsRemovedFromCart;
    };

    /**
     * Remove child items (multi level) from the cart matching the given product ID.
     *
     * @function
     * @name CartViewModel#removeChildItemsByProduct
     * @param {string} productId Product ID which will be removed from cart.
     * @param {Array} cartItems An optional cart items array
     * @returns {boolean} true if any items were removed from the cart, otherwise false.
     */
    CartViewModel.prototype.removeChildItemsByProduct = function (productId, cartItems) {
        var self = this;
        var targetItems = self.items();
        if(cartItems) {
          targetItems = cartItems;
        }
        var itemsRemovedFromCart = false;
        for (var i = 0; i < targetItems.length; i++) {
          if (targetItems[i].productId === productId) {
            targetItems.remove(targetItems[i]);
            i--;
            itemsRemovedFromCart = true;
            self.isPricingRequired(true);
          } else if (targetItems[i].childItems && targetItems[i].childItems.length > 0) {
            itemsRemovedFromCart = self.removeChildItemsByProduct(productId, targetItems[i].childItems);
            if(targetItems[i].childItems && targetItems[i].childItems.length == 0) {
              delete targetItems[i].childItems;
            }
          }
        }
        return itemsRemovedFromCart;
      };

    /**
     * Remove items from the cart matching both the product ID and catRef (SKU) ID.
     *
     * @function
     * @name CartViewModel#removeItemsByProductCatRef
     * @param {string} productId Product ID which will be removed from cart.
     * @param {string} catRefId Catalog reference (SKU) ID to be removed from cart.
     * @returns {boolean} true if any items were removed from the cart, otherwise false.
     */
    CartViewModel.prototype.removeItemsByProductCatRef = function (productId, catRefId) {
      var self = this;
      var itemsRemovedFromCart = false;
      for (var i = 0; i < self.items().length; i++) {
        if ((self.items()[i].productId === productId) && (self.items()[i].catRefId === catRefId)) {
          self.items.remove(self.items()[i]);
          i--;
          itemsRemovedFromCart = true;
          self.isPricingRequired(true);
        }
      }
      return itemsRemovedFromCart;
    };

    /**
     * Remove child items (multi level) from the cart matching both the product ID and catRef (SKU) ID.
     *
     * @function
     * @name CartViewModel#removeChildItemsByProductCatRef
     * @param {string} productId Product ID which will be removed from cart.
     * @param {string} catRefId Catalog reference (SKU) ID to be removed from cart.
     * @param {Array} invalidProductNames An array of invalid products that can be used to show notification messages
     * @param {Array} cartItems An optional cart items array
     * @returns {boolean} true if any items were removed from the cart, otherwise false.
     */
    /*CartViewModel.prototype.removeChildItemsByProductCatRef = function (productId, catRefId, invalidProductNames, cartItems) {
        var self = this;
        var targetItems = self.items();
        if(cartItems) {
          targetItems = cartItems;
        }

        var itemsRemovedFromCart = false;
        for (var i = 0; i < targetItems.length; i++) {
          if ((targetItems[i].productId === productId) && (targetItems[i].catRefId === catRefId)) {
            if (targetItems[i].productData && invalidProductNames.indexOf(targetItems[i].productData().displayName) == -1) {
              invalidProductNames.push(targetItems[i].productData().displayName);
            } else {
              invalidProductNames.push(productId);
            }
            targetItems.splice(i, 1);
            i--;
            itemsRemovedFromCart = true;
          } else if (targetItems[i].childItems && targetItems[i].childItems.length > 0) {
            itemsRemovedFromCart = self.removeChildItemsByProductCatRef(productId, catRefId, invalidProductNames, targetItems[i].childItems);
            if(targetItems[i].childItems && targetItems[i].childItems.length == 0) {
              delete targetItems[i].childItems;
            }
          }
        }

        if(!cartItems) {
          // Using this arg to check if this is inside recursive loop / top level method call (i.e. being invoked from widget/VM)
          // If inside recursive loop should not mark as dirty as this will result in multiple price calls
          self.isDirty(false);
          self.markDirty();
        }
        return itemsRemovedFromCart;
      };*/

      /**
       * Remove shopperInput from the cart including childItems ((multi level)) matching both the product ID and catRef (SKU) ID.
       *
       * @function
       * @name CartViewModel#removeShopperInputByProductCatRef
       * @param {string} productId Product ID corresponding to which the invalid shopperInput should be removed.
       * @param {string} catRefId Catalog reference (SKU) ID corresponding to which the invalid shopperInput should be removed.
       * @param {string} shopperInputId The Id corresponding to invalid shopperInput 
       * @param {Array} cartItems An optional cart items array
       * @returns {boolean} true if any shopperInputs were removed from the cart, otherwise false.
       */
      /*CartViewModel.prototype.removeShopperInputByProductCatRef = function (productId, catRefId, shopperInputId, cartItems) {
          var self = this;
          var targetItems = self.items();
          if(cartItems) {
            targetItems = cartItems;
          }

          var shopperInputRemovedFromCart = false;
          for (var i = 0; i < targetItems.length; i++) {
            if ((targetItems[i].productId === productId) && (targetItems[i].catRefId === catRefId)) {

              if(targetItems[i].shopperInput) {
                for(var key in targetItems[i].shopperInput) {
                  if (key == shopperInputId) {
                    delete targetItems[i].shopperInput[key];
                    shopperInputRemovedFromCart = true;
                  }
                }
                if(Object.keys(targetItems[i].shopperInput).length == 0) {
                  targetItems[i].shopperInput = undefined;
                }
              }
              self.isPricingRequired(true);
            } else if (targetItems[i].childItems && targetItems[i].childItems.length > 0) {
              shopperInputRemovedFromCart = self.removeShopperInputByProductCatRef(productId, catRefId, shopperInputId, targetItems[i].childItems);
            }
          }
          self.markDirty();
          return shopperInputRemovedFromCart;
        };*/

    /**
     * Marks items in the cart as invalid.
     *
     * @function
     * @name CartViewMOdel#markInvalidItems
     * @param {Object[]} data List of items to keep if they are present in the cart.
     * @param {string[]} invalidProductNames  List of names which will be removed from the cart.
     * @returns {boolean} true if any items were removed from the cart, otherwise false.
     */
    CartViewModel.prototype.markInvalidItems = function (data, invalidProductNames) {
      var self = this;

      for (var i = 0; i < self.items().length; i++) {
        var currentItem = self.items()[i];
        var found = false;
        for (var j = 0; j < data.length; j++) {
          if (data[j].id == currentItem.productId) {
            if (!data[j].active || !data[j].childSKUs || data[j].childSKUs.length == 0) {
              currentItem.invalid = true;
              break;
            } else {
              for (var index = 0; data[j].childSKUs && index < data[j].childSKUs.length; index++) {
                if (data[j].childSKUs[index].repositoryId == currentItem.catRefId && data[j].childSKUs[index].active) {
                  found = true;
                  break;
                }
              }
            }
            if (!found) {
              currentItem.invalid = true;
            } else {
              break;
            }
          }
        }
      }
      return false;
    };

    /**
     * Remove unlinked add-on items (that are not longed associated with main item) from the cart.
     *
     * @function
     * @name CartViewModel#removeUnlinkedAddonItems
     * @param {Object[]} data List of items to keep if they are present in the cart.
     * @param {string[]} invalidProductNames  List of names which will be removed from the cart.
     * @returns {boolean} true if any items were removed from the cart, otherwise false.
     */
    CartViewModel.prototype.removeUnlinkedAddonItems = function(data, invalidProductNames) {
      var self = this;
      var itemsRemovedFromCart = false;
      var invalidAddonProductNames = [];
      for (var i=0; i<self.items().length; i++) {
        for (var j=0; j<data.length; j++) {
          if (self.items()[i].productId == data[j].id) {
            // Verifying for invalid add-ons only if a cart-item contains childItems
            if(self.items()[i].childItems && self.items()[i].childItems.length > 0) {
              self.processInvalidAddonItems(self.items()[i], data[j], data, invalidAddonProductNames);  
            }
            break;
          }
        }
      }
      if(invalidAddonProductNames.length > 0) {
        for (var i=0; i<invalidAddonProductNames.length; i++) {
          invalidProductNames.push(invalidAddonProductNames[i]);
        }
        return true;
      } else {
        return false
      }
    };

    CartViewModel.prototype.processInvalidAddonItems = function(currentItem, productData, listData, invalidProductNames) {
      var self = this;
      var foundAddonOnMain = false;

      var invalidChildItemsTobeRemoved = [];
      for (var i=0; currentItem.childItems && i<currentItem.childItems.length; i++) {
        foundAddonOnMain = false;

        // This check if only for add-ons and hence checking if the childItem has addOn flag set. If this flag
        // is not set, that means this is a CPQ childItem and hence skipping the processing
        if (!currentItem.childItems[i].addOnItem) {
          continue;
        }

        for (var j=0; j<productData.addOnProducts.length; j++) {
          for (var k=0; k<productData.addOnProducts[j].addOnOptions.length; k++) {
            if (productData.addOnProducts[j].addOnOptions[k].product &&
                productData.addOnProducts[j].addOnOptions[k].product.repositoryId == currentItem.childItems[i].productId &&
                productData.addOnProducts[j].addOnOptions[k].sku &&
                productData.addOnProducts[j].addOnOptions[k].sku.repositoryId == currentItem.childItems[i].catRefId) {
                  foundAddonOnMain = true;
                  break;
            }
          }
          if (foundAddonOnMain) {
            break;
          }
        }

        if(!foundAddonOnMain) {
          invalidProductNames.push(currentItem.childItems[i].displayName());
          invalidChildItemsTobeRemoved.push(currentItem.childItems[i]);
        } else {
          if (currentItem.childItems[i].childItems && currentItem.childItems[i].childItems.length > 0) {
            for (var x=0; x<listData.length; x++) {
              if(listData[x].id == currentItem.childItems[i].productId) {
                self.processInvalidAddonItems(currentItem.childItems[i], listData[x], listData, invalidProductNames);
                break;
              }
            }
          }
        }
      };
      for(var i=0;i<invalidChildItemsTobeRemoved.length; i++) {
        self.removeChildItemFromCart(invalidChildItemsTobeRemoved[i], false);
      }
    };

    /**
     * Remove items from the cart if they are invalid, or if they are not present in the data parameter.
     *
     * @function
     * @name CartViewModel#removeInvalidItems
     * @param {Object[]} data List of items to keep if they are present in the cart.
     * @param {string[]} invalidProductNames  List of names which will be removed from the cart.
     * @returns {boolean} true if any items were removed from the cart, otherwise false.
     */
    CartViewModel.prototype.removeInvalidItems = function (data, invalidProductNames) {
      var self = this;
      var itemsRemovedFromCart = false;
      for (var i = 0; i < self.items().length; i++) {
        var currentItem = self.items()[i];
        var ItemtoBeRemoved = "", found = false, toBeRemoved = false, addonItemToBeRemoved = false;
        var addonChildItemsToBeRemoved = [];
        for (var j = 0; j < data.length; j++) {
          if (data[j].id == currentItem.productId) {
            if (!data[j].active || !data[j].childSKUs || data[j].childSKUs.length == 0 || data[j].notForIndividualSale ) {
              toBeRemoved = true;
              ItemtoBeRemoved = data[j].displayName;
              break;
            } else {
              for (var index = 0; data[j].childSKUs && index < data[j].childSKUs.length; index++) {
                if (data[j].childSKUs[index].repositoryId == currentItem.catRefId && data[j].childSKUs[index].active && data[j].childSKUs[index].listPrice != null) {
                  found = true;
                  break;
                }
              }
            }
            if (!found) {
              toBeRemoved = true;
              ItemtoBeRemoved = data[j].displayName;
            }
          }
          // check validity of all the items in the sub tree against data[j] for a multi level cpq case.
          if (self.isConfigurableItem(currentItem)) {
            var invalidSkus = [];
            var invalidProductNamesInCPQ = []
            var invalidAddonChildItems = []
            self.checkCpqItemValidity(data[j], currentItem, invalidProductNamesInCPQ, invalidSkus, invalidAddonChildItems);
            if (invalidProductNamesInCPQ.length > 0) {
              toBeRemoved = true;
              invalidProductNames = invalidProductNames.concat(invalidProductNamesInCPQ);
              $.unique(invalidProductNames);
            }
            if (invalidSkus.length > 0) {
              toBeRemoved = true;
              for (var index2 = 0; index2 < data.length; index2++) {
                if (data[index2].id == currentItem.productId) {
                  ItemtoBeRemoved = data[index2].displayName;
                  break;
                }
              }
              break;
            }
            if (invalidAddonChildItems.length > 0) {
              addonItemToBeRemoved = true;
              addonChildItemsToBeRemoved = invalidAddonChildItems;
            }
          }
        }
        if (self.currentOrderState()!=ccConstants.PENDING_PAYMENTS && self.currentOrderState() != ccConstants.PENDING_PAYMENT_TEMPLATE) {
          if(!found || toBeRemoved) {
            self.items.remove(currentItem);
            if (invalidProductNames && ItemtoBeRemoved && invalidProductNames.indexOf(ItemtoBeRemoved) == -1) {
                invalidProductNames.push(ItemtoBeRemoved);
            }
            itemsRemovedFromCart = true;
            i--;
          } else if(addonItemToBeRemoved) {
            for(var l=0; l<addonChildItemsToBeRemoved.length; l++) {
              self.removeChildItemFromCart(addonChildItemsToBeRemoved[l], false);
              if(invalidProductNames && invalidProductNames.indexOf(addonChildItemsToBeRemoved[l].displayName()) == -1) {
                invalidProductNames.push(addonChildItemsToBeRemoved[l].displayName());
              }
              itemsRemovedFromCart = true;
            }
          }
        }
      }
      return itemsRemovedFromCart;
    };

    /**
     * Updates an item's variant option name and option value
     *
     * @function
     * @name CartViewMOdel#updateItemOptionDetails
     * @param {Object} product Variant Option to be updated for the item.
     * @param {string} sku id of the item.
     */
    CartViewModel.prototype.updateItemOptionDetails = function(productVariantOption, catRefId) {
      // update the cart item selected options information
      for (var i = 0; i < this.items().length; i++) {
        if (this.items()[i].catRefId === catRefId && this.items()[i].selectedOptions) {
          for (var j = 0; j < this.items()[i].selectedOptions.length; j++) {
            if (this.items()[i].selectedOptions[j].optionId === productVariantOption.optionId) {
              this.items()[i].selectedOptions[j].optionName = productVariantOption.optionName;
              var optionValueMap = productVariantOption.optionValueMap;
              for (var key in optionValueMap) {
                if (optionValueMap[key] === this.items()[i].selectedOptions[j].optionValueId){
                  this.items()[i].selectedOptions[j].optionValue = key;
                  break;
                }
              }
              break;
            }
          }
        }
      }
      // update the local storage shopping cart
      var cookieData = this.getCookieData();
      if (cookieData) {
        var items = cookieData.items;
        for (var k = 0; k < this.items().length; k++) {
          for (var l = 0; l < items.length; l++) {
            if (this.items()[k].catRefId === items[l].catRefId) {
              items[l].selectedOptions = this.items()[k].selectedOptions;
              break;
            }
          }
        }
        cookieData.items = items;
        // Write the shopping cart to local storage
        try {
          storageApi.getInstance().setItem("shoppingCart", JSON.stringify(cookieData));
        }
        catch(pError) {
        }
      }
    };

    /**
     * Locate the shopping cart data in local storage.
     *
     * @private
     * @function
     * @name CartViewModel#getCookieData
     * @returns {Object} Shopping cart data as javascript object.
     */
    CartViewModel.prototype.getCookieData = function() {
      var self = this;
      //load the data from local storage
      var cookieData = null;
      try {
        cookieData = storageApi.getInstance().getItem("shoppingCart");
        if (cookieData && typeof cookieData == 'string') {
          cookieData = JSON.parse(cookieData);
        }
      }
      catch(pError) {
      }
      return cookieData;
    };

    /**
     * Locate the user data from local storage.
     *
     * @private
     * @function
     * @name CartViewModel#getCookieUserData
     * @returns {Object} User data as javascript object.
     */
    CartViewModel.prototype.getCookieUserData = function() {
      var self = this;
      //load the data from local storage
      var cookieData = null;
      try {
        cookieData = storageApi.getInstance().getItem("user");
        if (cookieData && typeof cookieData == 'string') {
          cookieData = JSON.parse(cookieData);
        }
      }
      catch(pError) {
      }
      return cookieData;
    };

    /**
     * Check the price data after loading the cart. The loaded cart price is checked with local storage
     * price to check if product price has changed. If the price(list/sale) is different than the local
     * storage data then the page will be redirected to the cart page else it will be redirected to the
     * checkout page.
     *
     * @private
     * @function
     * @name CartViewModel#checkPriceDataAndRedirect
     */
    CartViewModel.prototype.checkPriceDataAndRedirect = function() {
      //check the data with the existing data in local storage to see if the data is correct.
      var self = this;
      $.when(
        self.checkPriceDataBeforeCheckout(),
        self.validateCartAvailability()
      ).done(
        function(productPriceChanged, validCart){
          //if product price has changed, then redirect it to the cart page else redirect it to checkout page
          //and also request for repricing
          if (productPriceChanged === true || validCart == false) {
            self.redirect(self.cartLink);
            // As shopper is being redirected to cart page, notify the shopper on that page.
            self.notifyInvalidProducts('cart');
          } else {
            //everything is fine, redirect to checkout or paypal site
            if (self.checkoutWithPaypalClicked()) {
              self.redirect(ccConstants.PAYPAL_CHECKOUT_TYPE);
            } else {
              self.redirect(self.checkoutLink);
              // As shopper is being redirected to checkout page, notify the shopper on that page.
              self.notifyInvalidProducts('checkout');
            }
          }
        }
      );
    };

    CartViewModel.prototype.checkPriceDataBeforeCheckout = function(){
      //check the data with the existing data in local storage to see if the data is correct.
      var self = this;
      var deferred = $.Deferred();
      var productIds = [];
      for (var i = 0; i < self.items().length; i++) {
        if (productIds.indexOf(self.items()[i].productId) === -1) {
          productIds.push(self.items()[i].productId);
        }
      }

      var catalogId = self.catalogId();
      if(self.user().catalogId()) {
        catalogId = self.user().catalogId();
      }
      var id = new Array(catalogId, productIds, true, SiteViewModel.getInstance().selectedPriceListGroup().id,self.fields, true);
      var productPriceChanged = false;
      var params = {};
      var contextObj = {};
      contextObj[ccConstants.ENDPOINT_KEY] = ccConstants.ENDPOINT_PRODUCTS_LIST_PRODUCTS;
      contextObj[ccConstants.IDENTIFIER_KEY] = "getProductDataAndRedirect";
      var filterKey = self.storeConfiguration.getFilterToUse(contextObj);
      if (filterKey) {
        params[ccConstants.FILTER_KEY] = filterKey;
      }
      self.adapter.loadJSON('cart', id, params,
        //success callback
        function (data) {
          // Just mark an items as invalid, they'll get cleared from the cart on the next cart load.
          self.markInvalidItems(data, self.invalidProductNames);

          var productPriceChanged = false;
          if (self.items().length > 0) {
            productPriceChanged = self.processCartData(data);
            if (productPriceChanged === true || self.isPricingRequired() ) {
              if (navigation.isPathEqualTo(self.checkoutLink) && self.shippingMethod() != "") {
                self.priceCartForCheckout();
              } else {
                self.markDirty();
              }
              self.isPricingRequired(false);
            }
          } else {
            productPriceChanged = null;
            //notify immediately as we are not redirecting
            if (self.isPricingRequired()) {
              self.markDirty();
              self.isPricingRequired(false);
            }
            self.notifyInvalidProducts();
          }
          deferred.resolve(productPriceChanged);
        },
        //error callback
        function (data) {
          deferred.reject(data);
          if (data.errors && data.errors.length >0) {
            self.handleListProductsFailure(data);
            self.checkPriceDataAndRedirect();
          }
          self.checkoutWithPaypalClicked(false);
        });
      return deferred;
    };

    /**
     * Return an array containing the Product ID of each item in the cart.
     *
     * @function
     * @name CartViewModel#getProductIdsForItemsInCart
     * @return {string[]} List of Product IDs.
     */
    CartViewModel.prototype.getProductIdsForItemsInCart = function() {
      var self = this;
      var productArray = [];
      for (var itemIndex = 0 ; itemIndex < self.items().length; itemIndex++) {
        productArray.push(self.items()[itemIndex].productId);
      }
      return productArray;
     };

    /**
     * Remove invalid products from the cart for each error in the data parameter. Each error object holds
     * the product ID and possibly the display name of the invalid products. If items are removed, the cart
     * will be flagged for a price update (via removeItemsByProduct) and the related error display names will
     * be pushed to the invalid product names list.
     *
     * @private
     * @function
     * @name CartViewModel#handleListProductsFailure
     */
    CartViewModel.prototype.handleListProductsFailure = function (data) {
      var self= this;

      for (var i=0; i < data.errors.length ; i++) {
        var error = data.errors[i];

        if (error.errorCode == ccConstants.GET_PRODUCT_NO_PRODUCT_FOUND) {
          if (error.devMessage && self.invalidProductNames.indexOf(error.devMessage) == -1) {
            // error.devMessage will contain the actual display name of the invalid product.
            self.invalidProductNames.push(error.devMessage);
          }

          self.removeItemsByProduct(error.moreInfo);
          self.isPricingRequired(true);
        }
      }
    };

    /**
     * Helper function called during load cart to load the stock status and quantity orderable values
     * of the cart items via a REST call.
     *
     * @private
     * @function
     * @name CartViewModel#getCartAvailability
     */
    CartViewModel.prototype.getCartAvailability = function () {
      var self= this;
      var availabilityModel = new CartAvailabilityModel(self);
      var contextObj = {};
      contextObj[ccConstants.ENDPOINT_KEY] = ccConstants.ENDPOINT_PRODUCTS_AVAILABILITY;
      contextObj[ccConstants.IDENTIFIER_KEY] = "stockStatusesForCart";
      var filterKey = self.storeConfiguration.getFilterToUse(contextObj);
      if (filterKey) {
        availabilityModel[ccConstants.FILTER_KEY] = filterKey;
      }
      self.adapter.loadJSON('getStockStatuses', '0', availabilityModel,
        //success callback
        function(data) {
          for (var i = 0; i < self.items().length; i++) {
            if (self.isConfigurableItem(self.items()[i])) {
              // Configurable items
              self.items()[i].getItemQuantityInCart = self.getUpdatableItemQuantityInCart.bind(self, self.items(), self.items()[i].productId, self.items()[i].catRefId);
              self.items()[i].addConfigurableStockValidation(data, self.isPreOrderBackOrderEnabled);
            } else {
              // Normal items
              for (var j = 0; j < data.length; j++) {
                if ((self.items()[i].productId === data[j].productId) && (self.items()[i].catRefId === data[j].catRefId)) {
                  if (data[j].stockStatus === 'IN_STOCK' || data[j].stockStatus === 'PREORDERABLE' || data[j].stockStatus === 'BACKORDERABLE') {
                    self.items()[i].getItemQuantityInCart = self.getUpdatableItemQuantityInCart.bind(self, self.items(), self.items()[i].productId, self.items()[i].catRefId);
                    self.items()[i].addLimitsValidation(true, data[j].orderableQuantity, data[j], self.isPreOrderBackOrderEnabled);
                  } else {
                    self.items()[i].addLimitsValidation(false, data[j].orderableQuantity, data[j], self.isPreOrderBackOrderEnabled);
                  }
                  break;
                }
              }
            }
          }
        },
        //error callback
        function(data) {
          data.orderableQuantity = 0;
          for (var i = 0; i < self.items().length; i++) {
            self.items()[i].addLimitsValidation(false, 0, data, self.isPreOrderBackOrderEnabled);
          }
        }
      );
    };

    /**
     * This function is the extension of getCartAvailability function.
     * This new function will return a promise to introduce async in getProductData function
     * as getCartAvailability is being used in other places as well, this new method is created
     * Helper function called during load cart to load the stock status and quantity orderable values
     * of the cart items via a REST call.
     *
     * @private
     * @function
     * @name CartViewModel#getAvailabilityOfCart
     */
    CartViewModel.prototype.getAvailabilityOfCart = function(){
      var self = this;
      var deferred = $.Deferred();
      if(self.currentOrderState()!=ccConstants.PENDING_PAYMENTS && self.currentOrderState() != ccConstants.PENDING_PAYMENT_TEMPLATE){
        var availabilityModel = new CartAvailabilityModel(self);
        var contextObj = {};
        contextObj[ccConstants.ENDPOINT_KEY] = ccConstants.ENDPOINT_PRODUCTS_AVAILABILITY;
        contextObj[ccConstants.IDENTIFIER_KEY] = "stockStatusesForCart";
        var filterKey = self.storeConfiguration.getFilterToUse(contextObj);
        if (filterKey) {
          availabilityModel[ccConstants.FILTER_KEY] = filterKey;
        }
        self.adapter.loadJSON('getStockStatuses', '0', availabilityModel,
          //success callback
          function(data) {
            for (var i = 0; i < self.items().length; i++) {
              if (self.items()[i].childItems) {
                // Configurable items
                self.items()[i].getItemQuantityInCart = self.getUpdatableItemQuantityInCart.bind(self, self.items(), self.items()[i].productId, self.items()[i].catRefId);
                self.items()[i].addConfigurableStockValidation(data);
              } else {
                // Normal items
                for (var j = 0; j < data.length; j++) {
                  if ((self.items()[i].productId === data[j].productId) && (self.items()[i].catRefId === data[j].catRefId)) {
                    if (data[j].stockStatus === 'IN_STOCK' || data[j].stockStatus === 'PREORDERABLE' || data[j].stockStatus === 'BACKORDERABLE') {
                      self.items()[i].getItemQuantityInCart = self.getUpdatableItemQuantityInCart.bind(self, self.items(), self.items()[i].productId, self.items()[i].catRefId);
                      self.items()[i].addLimitsValidation(true, data[j].orderableQuantity, data[j], self.isPreOrderBackOrderEnabled);
                    } else {
                      self.items()[i].addLimitsValidation(false, data[j].orderableQuantity, data[j], self.isPreOrderBackOrderEnabled);
                    }
                    break;
                  }
                }
              }
            }
            deferred.resolve(data);
          },
          //error callback
          function(data) {
            for (var i = 0; i < self.items().length; i++) {
              self.items()[i].addLimitsValidation(false, 0, data, self.isPreOrderBackOrderEnabled);
            }
            deferred.reject(data);
          }
        );
      }
      return deferred;
    };

    /**
     * Gets the total item quantity in the cart of the given product.
     *
     * @private
     * @function
     * @name CartViewModel#getUpdatableItemCountInCart
     */
    CartViewModel.prototype.getUpdatableItemQuantityInCart = function(items, productId, catRefId, isCatRefId, childProductId) {
      var self = this;
      var quantity = 0;
      for (var i = 0; i < items.length; i++) {
        if (!childProductId && items[i].productId === productId) {
          if (isCatRefId && catRefId && items[i].catRefId != catRefId) {
            continue;
          }
          quantity += parseInt(items[i].updatableQuantity(), 10);
        } else if (childProductId) {
          if (items[i].productId === childProductId) {
            if (isCatRefId && catRefId && items[i].catRefId != catRefId) {
              continue;
            }
            quantity += parseInt(items[i].updatableQuantity(), 10);
          } else if (items[i].childItems && items[i].childItems.length > 0) {
            var childItems = items[i].childItems;
            for (var j = 0; j < childItems.length; j++) {
              if (childItems[j].productId === childProductId) {
                quantity += self.getUpdatableItemQuantityInCart([childItems[j]], childItems[j].productId) * parseInt(items[i].updatableQuantity(), 10);
              }
            }
          }
        } else if (items[i].childItems && items[i].childItems.length > 0) {
          var childItems = items[i].childItems;
          for (var j = 0; j < childItems.length; j++) {
            if (childItems[j].productId === productId) {
              quantity += self.getUpdatableItemQuantityInCart([childItems[j]], childItems[j].productId) * parseInt(items[i].updatableQuantity(), 10);
            }
          }
        }
      }
      return quantity;
    }

    /**
     * Gets the total item quantity of a product in a cart while adding it to
     * the cart in the product details page.
     *
     * @private
     * @function
     * @name CartViewModel#getItemCountInCart
     */
    CartViewModel.prototype.getItemQuantityInCart = function(items, productId, catRefId, isCatRefId, childProductId) {
      var self = this;
      var quantity = 0;
      for (var i = 0; i < items.length; i++) {
        if (!childProductId && items[i].productId === productId) {
          if (isCatRefId && catRefId && items[i].catRefId != catRefId) {
            continue;
          }
          quantity += parseInt(items[i].quantity(), 10);
        } else if (childProductId) {
          if (items[i].productId === childProductId) {
            if (isCatRefId && catRefId && items[i].catRefId != catRefId) {
              continue;
            }
            quantity += parseInt(items[i].quantity(), 10);
          } else if (items[i].childItems && items[i].childItems.length > 0) {
            var childItems = items[i].childItems;
            for (var j = 0; j < childItems.length; j++) {
              if (childItems[j].productId === childProductId) {
                quantity += self.getItemQuantityInCart([childItems[j]], childItems[j].productId) * parseInt(items[i].quantity(), 10);
              }
            }
          }
        } else if (items[i].childItems && items[i].childItems.length > 0) {
          var childItems = items[i].childItems;
          for (var j = 0; j < childItems.length; j++) {
            if (childItems[j].productId === productId) {
              quantity += self.getItemQuantityInCart([childItems[j]], childItems[j].productId) * parseInt(items[i].quantity(), 10);
            }
          }
        }
      }
      return quantity;
    }

    /**
     * Checks if the Cart has changed and calls pricing end point if necessary.
     *
     * @private
     * @function
     * @name CartViewModel#priceCartIfNeccessary
     */
    CartViewModel.prototype.priceCartIfNeccessary = function (dirty) {
      var self = this;

      if (dirty) {
        if (self.callbacks && self.callbacks.hasOwnProperty(ccConstants.PREPRICING) 
            && typeof self.callbacks[ccConstants.PREPRICING] === 'function') {
          self.callbacks[ccConstants.PREPRICING]();
        }
        if (self.items().length > 0) {
          //If the user is logged-in(header) then persist the items
          if ((!navigation.isPathEqualTo(self.checkoutLink) && self.user() && self.user().loggedIn() && !self.user().loggedinAtCheckout())
              || (self.user() && self.user().loggedIn() && !self.user().loggedinAtCheckout() && !self.shippingMethod())) {
            self.priceItemsAndPersist();
          } 
          //If shipping method exist, reload the shipping options, and price the cart
          else if (!self.callPriceBeforeShippingMethods && self.shippingMethod()) {
            if (!self.usingImprovedShippingWidgets()) {
              self.populateShipppingMethods();
            } else {
              self.priceCartForCheckout();
            }
          }
          //just price the cart items
          else {
            self.priceItems();
          }
        } else {
          self.emptyCart();
          self.events.pop();
          var user = self.getCookieUserData();
          if (user) {
            self.user().orderId(user.orderId);
          }
          if (self.items().length == 0 && self.user().loggedIn() &&
              !self.user().loggedinAtCheckout() && (self.user().orderId() && self.user().orderId() != '') ) {
            self.removeCurrentProfileOrder();
          }
        }
      }
    };
    
    
    /**
     * trigger RELOAD_SHIPPING_METHODS to reload the shipping options
     */
    CartViewModel.prototype.populateShipppingMethods = function() {
      var self = this;
      if (!self.hasSplitShippingInformation() && ((!(self.shippingAddress().afterValidation)) || (!self.shippingMethod()))) {
        var shippingAddressWithProductIDs = {};
        
        //Added toJSON because shippingmethods is trying to call toJSON on address object before listshippingmethods endpoint.
        shippingAddressWithProductIDs[ccConstants.SHIPPING_ADDRESS_FOR_METHODS] = self.shippingAddress() ? {
        		                                                                    toJSON: function() {
        	                                                                          return self.shippingAddress();
        	                                                                         }
                                                                                   }: self.shippingAddress();
        shippingAddressWithProductIDs[ccConstants.PRODUCT_IDS_FOR_SHIPPING] = this.getProductIdsForItemsInCart();
        $.Topic(pubsub.topicNames.RELOAD_SHIPPING_METHODS).publishWith(
          shippingAddressWithProductIDs, [ {
          message : "success"
        } ]);
      } else {
        self.priceCartForCheckout();
      }
    };

    /**
     * Price items in cart, update the order id on the user profile and create the order.
     *
     * @private
     * @function
     * @name CartViewModel#privateItemsAndPersist
     */
    CartViewModel.prototype.priceItemsAndPersist = function() {
      var self = this;
      var clearCoupons = false;
      var user = self.getCookieUserData();
      if (user) {
        self.user().orderId(user.orderId);
      }
      if (self.user().loggedIn() && self.user().orderId() && self.user().orderId() != '') {
        self.updateCurrentProfileOrder(false, clearCoupons);
      } else {
        self.createCurrentProfileOrder();
      }
    };

    /**
     * This method will construct and return the PricingModel object
     *
     * */
    CartViewModel.prototype.createCartPricingModel = function() {
      var self = this;
      var pricingModel = new CartPricingModel(self);
      return pricingModel;
    };

    /**
     * Update the current profile order via a REST call.
     *
     * @private
     * @function
     * @name CartViewModel#updateCurrentProfileOrder
     * @param {boolean} merge Whether to merge this order
     * @param {boolean} clearCoupons Whether to clear the coupons on this cart when creating the order.
     */
    CartViewModel.prototype.updateCurrentProfileOrder = function(merge, clearCoupons) {
      var self = this;
      var lastCartEvent = self.events.pop();
      if (!self.isOrderSubmissionInProgress) {
        var pricingModel = new CartPricingModel(self);
        self.populateGiftCards(pricingModel,lastCartEvent);
        self.populateIINs(pricingModel, lastCartEvent);
        self.populateDynamicProperties(pricingModel);
        pricingModel.merge = merge;
        pricingModel.clearCoupons = clearCoupons;
        
        if(this.currentOrderState()!= ccConstants.PENDING_PAYMENTS && self.currentOrderState() != ccConstants.PENDING_PAYMENT_TEMPLATE){
        self.adapter.persistUpdate('order', self.user().orderId(), pricingModel,
            //success callback
            function(data) {
              self.isCurrentCallInProgress = false;
              self.isPricingRequired(false);
              self.updateCart(data, lastCartEvent, merge);
              // Incase Shipping Method is already selected ask
              // for reprice for any coupons
              if (self.shippingMethod()) {
                // As the above method triggers another price call, the GWP messages get removed.
                // To avoid this, set a flag to not clear the GWP message.
                self.skipGWPMessage = true;
                if (!self.usingImprovedShippingWidgets()) {
                  self.populateShipppingMethods();
                } else {
                  self.priceCartForCheckout();
                }
              }
              $.Topic(pubsub.topicNames.COUPON_ADD_CLEAR_INPUT).publish();
              // Add the pricing success callback
              if (self.callbacks && self.callbacks.hasOwnProperty(ccConstants.PRICING_SUCCESS_CB) 
                  && typeof self.callbacks[ccConstants.PRICING_SUCCESS_CB] === 'function') {
                self.callbacks[ccConstants.PRICING_SUCCESS_CB](data);
              }
     
            },
            //error callback
            function(data) {
              self.isCurrentCallInProgress = false;
              if (data.status == ccConstants.HTTP_UNAUTHORIZED_ERROR) {
                self.handleSessionExpiry(lastCartEvent);
              } else {
                // Handle coupon apply error
                if (data.errorCode == ccConstants.COUPON_APPLY_ERROR) {
                  self.handleCouponPricingError(data, lastCartEvent);
                } else if (data.errorCode == ccConstants.CREATE_ORDER_PRODUCT_NOT_FOUND
                        || data.errorCode == ccConstants.CREATE_ORDER_SKU_NOT_FOUND
                        || data.errorCode == ccConstants.PRODUCT_NOT_FOR_INDIVIDUAL_SALE){
                  self.handleInvalidAddItem(data, lastCartEvent);
                  // Refresh the cart with last known good data on error
                  self.notifyInvalidProducts();
                  self.reloadCart();
                  self.tax(0);
                  self.secondaryCurrencyTaxAmount(0);
                } else if (data.errorCode == ccConstants.GIFTCARD_APPLY_ERROR
                    || data.errorCode == ccConstants.GIFTCARD_INSUFFICIENT_ERROR
                    || data.errorCode == ccConstants.INVALID_GIFTCARD_DATA_ERROR
                    || data.errorCode == ccConstants.GIFTCARD_ORDER_PROCESSING_ERROR) {
                  self.handleGiftCardError(data);
                } else if (data.errorCode == ccConstants.UNLINKED_ADD_ON_PRODUCT) {
                  self.reloadCart();
                } else if (data.errorCode == ccConstants.ADDON_VOLUME_PRICE_ERROR) {
                  var notificationMsg = data.message + " " + CCi18n.t('ns.common:resources.removeItemFromCart');
                  notifier.sendError(CART_VIEW_MODEL_ID, notificationMsg, true);
                  self.isDirty(false);
                } else if (data.errorCode == ccConstants.INVALID_SHOPPER_INPUT) {
                  var moreInfo = JSON.parse(data.moreInfo);
                  var invalidAddonProductName = moreInfo.productId;
                  var addonProduct = self.findCartProductById(invalidAddonProductName);
                  if (addonProduct) {
                    invalidAddonProductName = addonProduct.displayName;
                  }
                  var notificationMsg = CCi18n.t('ns.common:resources.invalidShopperInputError', {productName: invalidAddonProductName});
                  notifier.sendError(CART_VIEW_MODEL_ID, notificationMsg, true);
                  self.isDirty(false);
                } else {
                  self.shippingMethod('');
                  self.reloadCart();
                  self.tax(0);
                  self.secondaryCurrencyTaxAmount(0);
                }
              }
              // Add the pricing failure callback
              if (self.callbacks && self.callbacks.hasOwnProperty(ccConstants.PRICING_FAILURE_CB) 
                  && typeof self.callbacks[ccConstants.PRICING_FAILURE_CB] === 'function') {
                self.callbacks[ccConstants.PRICING_FAILURE_CB](data);
              }
            }
        );
        }
      } else {
        console.warn(CCi18n.t('ns.common:resources.priceOrderBlockedText'));
      }
    };

    /**
     * Check if an error was caused item the user has added being invalid and show a notification if it is.
     *
     * @private
     * @function
     * @name CartViewModel#handleInvalidAddItem
     * @param {Object} data An error object
     * @param {string} data.errorCode The error code.
     * @param {CartEvent} lastCartEvent The most recent cart event.
     */
    CartViewModel.prototype.handleInvalidAddItem = function(data, lastCartEvent) {
      var self = this;
      if (data.errorCode == ccConstants.CREATE_ORDER_PRODUCT_NOT_FOUND
          && lastCartEvent && lastCartEvent.type === CART_EVENT_ADD
          && lastCartEvent.product.id == data.moreInfo
          && lastCartEvent.product.displayName
          && self.invalidProductNames.indexOf(lastCartEvent.product.displayName) == -1) {
        self.invalidProductNames.push(lastCartEvent.product.displayName);
      } else if (data.errorCode == ccConstants.CREATE_ORDER_PRODUCT_NOT_FOUND
          && lastCartEvent && lastCartEvent.type === CART_EVENT_ADD
          && lastCartEvent.product.selectedAddOnProducts && lastCartEvent.product.selectedAddOnProducts.length > 0) {
        self.handleInvalidAddonItem(lastCartEvent.product.selectedAddOnProducts, data.moreInfo);
      } else if (data.errorCode == ccConstants.CREATE_ORDER_SKU_NOT_FOUND) {
        var moreInfo = JSON.parse(data.moreInfo);
        if (lastCartEvent && lastCartEvent.type === CART_EVENT_ADD
            && lastCartEvent.product.id == moreInfo.productId
            && lastCartEvent.product.childSKUs[0].repositoryId == moreInfo.catRefId
            && lastCartEvent.product.displayName
            && self.invalidProductNames.indexOf(lastCartEvent.product.displayName) == -1) {
          self.invalidProductNames.push(lastCartEvent.product.displayName);
        } else if (lastCartEvent && lastCartEvent.type === CART_EVENT_ADD
            && lastCartEvent.product.selectedAddOnProducts && lastCartEvent.product.selectedAddOnProducts.length > 0) {
          self.handleInvalidAddonItem(lastCartEvent.product.selectedAddOnProducts, moreInfo.productId, moreInfo.catRefId);
        }
      } else if (data.errorCode == ccConstants.PRODUCT_NOT_FOR_INDIVIDUAL_SALE 
                 && lastCartEvent && lastCartEvent.type === CART_EVENT_ADD 
                 && lastCartEvent.product.displayName 
                 && self.invalidProductNames.indexOf(lastCartEvent.product.displayName) == -1) {
         self.invalidProductNames.push(lastCartEvent.product.displayName);
      }
    };

    /**
     * Check if an error was caused by add-on item the user has added being invalid and show a notification if it is.
     *
     * @private
     * @function
     * @name CartViewModel#handleInvalidAddonItem
     * @param TODO
     * @param {String} productId
     * @param {String} catRefId
     */
    CartViewModel.prototype.handleInvalidAddonItem = function(selectedAddons, productId, catRefId) {
      var self = this;
      if (selectedAddons && selectedAddons.length > 0) {
        for (var i=0; i<selectedAddons.length; i++) {
          for (var j=0; j<selectedAddons[i].addOnOptions.length; j++) {
            if (catRefId && selectedAddons[i].addOnOptions[j].sku.repositoryId == catRefId
                && selectedAddons[i].addOnOptions[j].product.id == productId
                && self.invalidProductNames.indexOf(selectedAddons[i].addOnOptions[j].product.displayName) == -1) {
              self.invalidProductNames.push(selectedAddons[i].addOnOptions[j].product.displayName);
            } else if (selectedAddons[i].addOnOptions[j].product.id == productId
                && self.invalidProductNames.indexOf(selectedAddons[i].addOnOptions[j].product.displayName) == -1) {
              self.invalidProductNames.push(selectedAddons[i].addOnOptions[j].product.displayName);
            }

            if (selectedAddons[i].addOnOptions[j].product.selectedAddOnProducts
                && selectedAddons[i].addOnOptions[j].product.selectedAddOnProducts.length > 0) {
              self.handleInvalidAddonItem(selectedAddons[i].addOnOptions[j].product.selectedAddOnProducts, productId, catRefId);
            }
          }
        }
      }
    };

    /**
     * This method will get the product data for a given productId by searching the cart items recursively
     *
     * @private
     * @function
     * @name CartViewModel#findCartProductById
     * @param TODO
     * @param {String} productId The product id for which the product data need to be fetched
     * @param {Array} cartItems An optional cart items parameter
     */
    CartViewModel.prototype.findCartProductById = function(productId, cartItems) {
      var self = this;
      var targetItems = self.items();
      if(cartItems) {
        targetItems = cartItems;
      }

      for (var i=0; i<targetItems.length; i++) {
        if (targetItems[i].productId == productId) {
          return targetItems[i].productData();
        } else if (targetItems[i].childItems && targetItems[i].childItems.length > 0) {
          var product = self.findCartProductById(productId, targetItems[i].childItems);
          if (product) {
            return product;
          }
        }
      }
    }

    /**
     * Creates the current profile order via a REST call.
     *
     * @function
     * @name CartViewModel#createCureentProfileOrder
     */
    CartViewModel.prototype.createCurrentProfileOrder = function() {
      var self = this;
      var orderState = {incomplete : true};
      if (self.items() && self.items().length > 0 && !self.isOrderSubmissionInProgress) {
        var lastCartEvent = self.events.pop();
        var pricingModel = new CartPricingModel(self);
        self.populateGiftCards(pricingModel,lastCartEvent);
        self.populateIINs(pricingModel, lastCartEvent);

        self.adapter.persistCreate('order', '0', pricingModel, orderState,
            //success callback
            function(data) {
              self.isPricingRequired(false);
              self.updateCart(data, lastCartEvent, false);
              if (self.shippingMethod()) {
                // As the above method triggers another price call, the GWP messages get removed.
                // To avoid this, set a flag to not clear the GWP message.
                self.skipGWPMessage = true;
                self.populateShipppingMethods();
              }
              else {
                self.updateCart(data, lastCartEvent, false, true);
              }
              $.Topic(pubsub.topicNames.COUPON_ADD_CLEAR_INPUT).publish();
              // Add the pricing success callback
              if (self.callbacks && self.callbacks.hasOwnProperty(ccConstants.PRICING_SUCCESS_CB) 
                  && typeof self.callbacks[ccConstants.PRICING_SUCCESS_CB] === 'function') {
                self.callbacks[ccConstants.PRICING_SUCCESS_CB](data);
              }
            },
            //error callback
            function(data) {
              if (data.status == ccConstants.HTTP_UNAUTHORIZED_ERROR) {
                self.handleSessionExpiry(lastCartEvent);
              } else {
                // Handle coupon apply error
                if (data.errorCode == ccConstants.COUPON_APPLY_ERROR) {
                  self.handleCouponPricingError(data, lastCartEvent);
                } else if (data.errorCode == ccConstants.GIFTCARD_APPLY_ERROR
                    || data.errorCode == ccConstants.GIFTCARD_INSUFFICIENT_ERROR
                    || data.errorCode == ccConstants.INVALID_GIFTCARD_DATA_ERROR
                    || data.errorCode == ccConstants.GIFTCARD_ORDER_PROCESSING_ERROR) {
                  self.handleGiftCardError(data);
                } else if (data.errorCode == ccConstants.CREATE_ORDER_PRODUCT_NOT_FOUND
                        || data.errorCode == ccConstants.CREATE_ORDER_SKU_NOT_FOUND
                        || data.errorCode == ccConstants.PRODUCT_NOT_FOR_INDIVIDUAL_SALE) {
                    self.handleInvalidAddItem(data, lastCartEvent);
                    self.notifyInvalidProducts();
                  } else if (data.errorCode == ccConstants.UNLINKED_ADD_ON_PRODUCT) {
                    if (lastCartEvent && lastCartEvent.type == CART_EVENT_ADD
                        && lastCartEvent.product.selectedAddOnProducts) {
                      var moreInfo = JSON.parse(data.moreInfo);
                      self.handleInvalidAddonItem(lastCartEvent.product.selectedAddOnProducts, moreInfo.productId, moreInfo.catRefId);
                      self.notifyInvalidProducts();
                    }
                  } else if (data.errorCode == ccConstants.ADDON_VOLUME_PRICE_ERROR) {
                      var notificationMsg = data.message + " " + CCi18n.t('ns.common:resources.removeItemFromCart');
                      notifier.sendError(CART_VIEW_MODEL_ID, notificationMsg, true);
                      self.isDirty(false);
                  } else if (data.errorCode == ccConstants.INVALID_SHOPPER_INPUT) {
                      var moreInfo = JSON.parse(data.moreInfo);
                      var invalidAddonProductName = moreInfo.productId;
                      var addonProduct = self.findCartProductById(invalidAddonProductName);
                      if (addonProduct) {
                        invalidAddonProductName = addonProduct.displayName;
                      }
                      var notificationMsg = CCi18n.t('ns.common:resources.invalidShopperInputError', {productName: invalidAddonProductName});
                      notifier.sendError(CART_VIEW_MODEL_ID, notificationMsg, true);
                      self.isDirty(false);
                  }
                // Refresh the cart with last known good data on error
                self.loadCart();
              }
           // Add the pricing failure callback
              if (self.callbacks && self.callbacks.hasOwnProperty(ccConstants.PRICING_FAILURE_CB) 
                  && typeof self.callbacks[ccConstants.PRICING_FAILURE_CB] === 'function') {
                self.callbacks[ccConstants.PRICING_FAILURE_CB](data);
              }
            }
        );
      } else if (self.isOrderSubmissionInProgress) {
        console.warn(CCi18n.t('ns.common:resources.priceOrderBlockedText'));
      }
    };

    //Removes incomplete order for the user.
    /**
     * Remove the current order data on the user profile and persist change via a REST call.
     *
     * @function
     * @name CartViewModel#removeCurrentProfileOrder
     */
    CartViewModel.prototype.removeCurrentProfileOrder = function() {
      var self = this;
      self.adapter.persistRemove('order', self.user().orderId(), null,
          //success callback
          function(data) {
            self.user().orderId('');
            self.user().persistedOrder(null);
            self.user().setLocalData('orderId');
          },
          //error callback
          function(data) {
            // Refresh the cart with last known good data on error
            self.loadCart();
          }
       );
    };

    /**
     * Add a coupon to this cart via the Coupon ID. Look up a coupon by ID and if it is valid
     * add it to the cart.
     *
     * @function
     * @name CartViewModel#addCoupon
     * @param {string} couponId The coupon ID.
     */
    CartViewModel.prototype.addCoupon = function(couponId) {
      var self = this;
      if (couponId) {
        // If product to add is in the cart then simply increase the quantity.
        var cookieData = self.getCookieDataAndCompare();
        var coupon = new Coupon(couponId,'','','','');
        self.events.push(new CartEvent(CART_EVENT_COUPON_ADD , 1, coupon));
        if (cookieData && !self.isMatchingCookieData()) {
          self.getLocalData(cookieData);
        } else {
          self.addCouponToCart(coupon);
        }
      }
    };

    CartViewModel.prototype.addMultipleCoupons = function(couponsArray){
      var self = this;
      var couponId;
      var length = couponsArray.length;
      if(length > 0){
        // If product to add is in the cart then simply increase the quantity.
        var cookieData = self.getCookieDataAndCompare();
        for(var i=0; i< length; i++){
          couponId = couponsArray[i];
          var coupon = new Coupon(couponId,'','','','');
          couponsArray[i] = coupon;
        }
        self.events.push(new CartEvent(CART_EVENT_COUPONS_ADD , 1, couponsArray));
        if (cookieData && !self.isMatchingCookieData()) {
          self.getLocalData(cookieData);
        } else {
          self.addMultipleCouponsToCart(couponsArray);
        }
      }

    };

    /**
     * Add multiple coupons to this cart via the Coupon ID. Look up a coupon by ID and if it is valid
     * add it to the cart.
     *
     * @function
     * @name CartViewModel#addMultipleCoupons
     * @param {object} couponsArray is array of coupon IDs.
     */
    CartViewModel.prototype.addMultipleCoupons = function(couponsArray){
      var self = this;
      var couponId;
      var length = couponsArray.length;
      if(length > 0){
        // If product to add is in the cart then simply increase the quantity.
        var cookieData = self.getCookieDataAndCompare();
        for(var i=0; i< length; i++){
          couponId = couponsArray[i];
          var coupon = new Coupon(couponId,'','','','');
          couponsArray[i] = coupon;
        }
        self.events.push(new CartEvent(CART_EVENT_COUPONS_ADD , 1, couponsArray));
        if (cookieData && !self.isMatchingCookieData()) {
          self.getLocalData(cookieData);
        } else {
          self.addMultipleCouponsToCart(couponsArray);
        }
      }

    };

    /**
     * Add a Gift card to the cart and trigger pricing
     *
     * @function
     * @name CartViewModel#addCoupon
     * @param {string} couponId The coupon ID.
     */
    CartViewModel.prototype.addGiftCard = function(giftCardObj) {
      var self = this;
      if (giftCardObj.giftCardNumber && giftCardObj.giftCardPin) {
        self.giftCards.push(giftCardObj);
        if(self.currentOrderState() == ccConstants.PENDING_PAYMENTS || self.currentOrderState() == ccConstants.PENDING_PAYMENT_TEMPLATE){
          self.pendingPaymentGiftCardCheck(giftCardObj);
        }else{
          self.events.push(new CartEvent(CART_EVENT_GIFTCARD_ADD , 0, giftCardObj));
          self.markDirty();
        }
      }
    };

    /**
     * Add a Gift card to the cart and trigger pricing
     *
     * @function
     * @name CartViewModel#addCoupon
     * @param {string} couponId The coupon ID.
     */
    CartViewModel.prototype.addMultipleGiftCards = function(giftCards) {
      var self = this;
      var numberOfGiftCards = giftCards.length;
      var giftCardObj;
      if(numberOfGiftCards > 0){
        for(var i=0; i< numberOfGiftCards; i++){
          giftCardObj = giftCards[i];
          if (giftCardObj.giftCardNumber && giftCardObj.giftCardPin) {
            self.giftCards.push(giftCardObj);
          }
        }
        if(self.currentOrderState() == ccConstants.PENDING_PAYMENTS || self.currentOrderState() == ccConstants.PENDING_PAYMENT_TEMPLATE){
          self.pendingPaymentGiftCardCheck(giftCards);
        }else{
          self.events.push(new CartEvent(CART_EVENT_GIFTCARDS_ADD , 0, giftCards));
          self.markDirty();
        }
      }
    };


    /**
     * Calls Payment endpoint to inquire balance of Gift Cards in case of PENDING_PAYMENT state
     */
    CartViewModel.prototype.pendingPaymentGiftCardCheck = function(giftCardObj) {
      var self = this;
      var op = 'inquireBalance';
      var payments = [];
      var payment = {};
      for ( var i = 0; i < self.giftCards().length; i++) {
    	  var giftCard = self.giftCards()[i];
    	  var payment = {};
          payment.paymentMethodType = ccConstants.GIFT_CARD_PAYMENT_TYPE;
          payment.giftCardNumber = giftCard.giftCardNumber();
          payment.giftCardPin = giftCard.giftCardPin();
          if(payment.giftCardPin != null && payment.giftCardPin != undefined && payment.giftCardPin != ""){
            payments.push(payment);  
          }
      }
      var inputData={};
      inputData["orderId"]=self.currentOrderId();
      inputData["op"] = op;
      inputData["profileId"] =self.user().id ? self.user().id() : self.user().customerId();
      inputData["payments"] = payments;
      var url = "addPayments";
      // Inquire Balance the of gift card
      ccRestClient.request(url, inputData,
       // success callback
       function(data) {
        self.updateGiftCardDetailsForPendingPayment(data);
        
       },
       // error callback
       function(data) {
           self.handleGiftCardErrorPendingPayment(data,giftCardObj);
       });
    };
    /**
     * This method updates the giftcard details from the response to cart
     * and then publishes to Order
     */
      CartViewModel.prototype.updateGiftCardDetailsForPendingPayment = function(data) {
        var self = this;
      // Manipulating Amount after balance check 
        if (data.paymentResponses && self.giftCards().length > 0) {
          for ( var i = 0; i < self.giftCards().length; i++) {
            var found = false;
            var giftCard = self.giftCards()[i];
            for ( var j = 0; j < data.paymentResponses.length; j++) {
              var giftCardPayment = data.paymentResponses[j];
              if (giftCard.giftCardNumber() == giftCardPayment.giftCardNumber) {
                giftCard.amountInGiftCard(giftCardPayment.balance);
                //data.amountRemaining is order total
                var amountRemaining = self.isChargeTaxShippingInSecondaryCurrency() && data.amountsRemaining ?
                    data.amountsRemaining.secondaryCurrencyRemainingAmount : data.amountRemaining;
                if(amountRemaining >= parseFloat(giftCardPayment.balance)){
                  giftCard.amountUsed(parseFloat(giftCardPayment.balance));
                  giftCard.isAmountRemaining(false);
                  amountRemaining=parseFloat(amountRemaining)-parseFloat(giftCardPayment.balance)
                }else{
                  giftCard.amountUsed(parseFloat(amountRemaining));
                  giftCard.isAmountRemaining(true);
                  amountRemaining=0;
                }
                giftCard.maskedGiftCardNumber(giftCardPayment.maskedCardNumber);
                giftCard.isApplyGiftCardClicked(false);
                found = true;
                break;
              }
            }
            if (found == false) {
              giftCard.isPinCleared(true);
            }else{
              giftCard.isPinCleared(false);
            }
          }
        }
        //Update Gift Card array in order
        $.Topic(pubsub.topicNames.GIFTCARD_UPDATE_FROM_CART).publish(self.giftCards());
        $.Topic(pubsub.topicNames.UPDATE_AMOUNT_REMAINING).publish(amountRemaining);
        $.Topic(pubsub.topicNames.CART_UPDATED_PENDING_PAYMENT).publish(self);
      };
      
      /**
       * This method removes a giftcard from Giftcards in case of pending payment orders
       */
      CartViewModel.prototype.pendingPaymentRemoveGiftCard = function(pGiftCardObj) {
        var self = this;
        $.Topic(pubsub.topicNames.GIFTCARD_UPDATE_FROM_CART).publish(self.giftCards());
        $.Topic(pubsub.topicNames.UPDATE_AMOUNT_REMAINING_PENDING_PAYMENT).publish(pGiftCardObj.amountUsed());
        $.Topic(pubsub.topicNames.CART_UPDATED_PENDING_PAYMENT).publish(self);
      };
      
      /**
       * handles the failure of applying gift cards to cart.
       */
      CartViewModel.prototype.handleGiftCardErrorPendingPayment = function(data,giftCardObj) {
        var self = this;
        self.giftCards.remove(function(item) { return item.giftCardNumber() == giftCardObj.giftCardNumber(); });
        $.Topic(pubsub.topicNames.GIFTCARD_UPDATE_FROM_CART).publish(
      		          self.giftCards());
         $.Topic(pubsub.topicNames.GIFTCARD_PRICING_FAILED).publish(data,giftCardObj);
        self.isDirty(false);
      };
      
    /**
     * This method clears pins of all the giftcards
     */
    CartViewModel.prototype.clearPins = function() {
      var self = this;

      for ( var i = 0; i < self.giftCards().length; i++) {
        var giftCard = self.giftCards()[i];
        giftCard.giftCardPin('');
        giftCard.isPinCleared(true);
        giftCard.isApplyGiftCardClicked(false);
      }

      $.Topic(pubsub.topicNames.GIFTCARD_UPDATE_FROM_CART).publish(
          self.giftCards());
    };


    /**
     * This method re-applies the giftcard pins in the giftcards array
     */
    CartViewModel.prototype.reApplyGiftCardPins = function(giftCard) {
      var self = this;
      if(self.currentOrderState() == ccConstants.PENDING_PAYMENTS || self.currentOrderState() == ccConstants.PENDING_PAYMENT_TEMPLATE){
        self.pendingPaymentGiftCardCheck(giftCard);
      }else{
        self.events.push(new CartEvent(CART_EVENT_GIFTCARD_REAPPLY , 0, giftCard));
        self.markDirty();
      }
    };


    /**
     * This function handles removing a gift card and trigger pricing
     */
    CartViewModel.prototype.removeGiftCard = function(giftCard) {
      var self = this;
      self.giftCards.remove(function(item) { return item.giftCardNumber() == giftCard.giftCardNumber(); });
      if(self.currentOrderState() == ccConstants.PENDING_PAYMENTS || self.currentOrderState() == ccConstants.PENDING_PAYMENT_TEMPLATE){
        self.pendingPaymentRemoveGiftCard(giftCard);
      }else{
        self.events.push(new CartEvent(CART_EVENT_GIFTCARD_DELETE , 0, giftCard));
        self.markDirty();
      }
    };
    
    /**
     * Add a coupon object to the cart.
     *
     * @private
     * @function
     * @name CartViewModel#addCouponToCart
     * @param {Coupon} coupon Coupon to add
     */
    CartViewModel.prototype.addCouponToCart = function(coupon) {
      var self = this;
      self.coupons.push(coupon);
      self.couponMultiPromotions.push(new couponMultiPromotion(coupon.code()));
      self.markDirty();
    };

    CartViewModel.prototype.addMultipleCouponsToCart = function(couponsArray) {
      var self = this;
      var coupon, length = couponsArray.length;
      for(var i=0; i< length; i++){
        coupon = couponsArray[i];
        self.coupons.push(coupon);
        self.couponMultiPromotions.push(new couponMultiPromotion(coupon.code()));
      }
      self.markDirty();
    };

    /**
     * Add multiple coupon objects to the cart.
     *
     * @private
     * @function
     * @name CartViewModel#addMultipleCouponsToCart
     * @param {object} couponsArray array of Coupon objects to add
     */
    CartViewModel.prototype.addMultipleCouponsToCart = function(couponsArray) {
      var self = this;
      var coupon, length = couponsArray.length;
      for(var i=0; i< length; i++){
        coupon = couponsArray[i];
        self.coupons.push(coupon);
        self.couponMultiPromotions.push(new couponMultiPromotion(coupon.code()));
      }
      self.markDirty();
    };

    /**
     * This function handles the functionality of removing a coupon based on the cookie data
     *
     * @function
     * @name CartViewMOdel#removeCoupon
     * @param {Object} couponData Object containing coupon details
     * @param {string} couponData.code The coupon code.
     */
    CartViewModel.prototype.removeCoupon = function(couponData) {
      var self = this;
      if (couponData.code) {
        // If product to add is in the cart then simply increase the quantity.
        var cookieData = self.getCookieDataAndCompare();
        self.events.push(new CartEvent(CART_EVENT_COUPON_DELETE , 0, couponData));
        if (cookieData && !self.isMatchingCookieData()) {
          self.getLocalData(cookieData);
        } else {
          self.removeCouponFromCart(couponData);
        }
      }
    };

    /**
     * Remove coupon from cart.
     *
     * @private
     * @function
     * @CartViewModel#removeCouponFromCart
     * @param {Coupon} couponData Object containing coupon details.
     */
    CartViewModel.prototype.removeCouponFromCart = function(couponData) {
      var self = this;
      self.coupons.remove(function(item) { return item.code() == couponData.code(); });
      self.couponMultiPromotions.remove(function(item) { return item.code() == couponData.code(); });
      self.markDirty();
    };

    /**
     * Handle session expiry occurring suring cart updates.
     *
     * @private
     * @function
     * @name CartViewModel#handleSessionExpiry
     * @param {CartEvent} lastCartEvent Most recent cart event.
     */
    CartViewModel.prototype.handleSessionExpiry = function (lastCartEvent) {
      var self = this;
      if (lastCartEvent && lastCartEvent.type === CART_EVENT_ADD) {
        var product = lastCartEvent.product;
        var addItemToCart = self.addToCart.bind(product);
        addItemToCart();
      } else if(lastCartEvent && (lastCartEvent.type === CART_EVENT_UPDATE
              || lastCartEvent.type === CART_EVENT_DELETE || lastCartEvent.type === CART_EVENT_COUPON_ADD || lastCartEvent.type === CART_EVENT_COUPONS_ADD
              || lastCartEvent.type === CART_EVENT_COUPON_DELETE) && navigation.isPathEqualTo(self.cartLink)) {
        notifier.sendError(CART_VIEW_MODEL_ID, CCi18n.t('ns.common:resources.cartSessionExpired'), true);
        self.user().clearUserData();
      } else if(lastCartEvent && (lastCartEvent.type === CART_EVENT_COUPON_ADD || lastCartEvent.type === CART_EVENT_COUPONS_ADD
          || lastCartEvent.type === CART_EVENT_COUPON_DELETE) && navigation.isPathEqualTo(self.checkoutLink)) {
        self.isDirty(false);
        self.markDirty();
      }
    };

    /**
     * Handle error with coupon pricing.
     *
     * @private
     * @function
     * @name CartViewModel#handleCouponPricingError
     * @param {Object} errorData Object containing error data.
     * @param {string} errorData.message Error message.
     * @param {string} errorData.moreInfo Coupon code.
     * @param {CartEvent} lastCartEvent Most recent cart event.
     */
    CartViewModel.prototype.handleCouponPricingError = function(errorData, lastCartEvent) {
      var self = this;
      // set error message when there is an error while adding a coupon
      if (errorData.message && lastCartEvent && (lastCartEvent.type === CART_EVENT_COUPON_ADD || lastCartEvent.type === CART_EVENT_COUPONS_ADD)
          && (self.coupons()[self.coupons().length - 1].code() == errorData.moreInfo)) {
        self.couponErrorMessage(errorData.message);
      } else if (errorData.message && (!lastCartEvent || lastCartEvent.type != CART_EVENT_COUPON_ADD || lastCartEvent.type != CART_EVENT_COUPONS_ADD)) {
    	  notifier.sendError(CART_VIEW_MODEL_ID, CCi18n.t('ns.common:resources.orderPricingPromotionError'), true);
      }
      // moreInfo property of error data contains coupon code when there is a coupon add/claim error
      if (errorData.moreInfo) {
        self.isDirty(false);
        self.coupons.remove(function(item) { return item.code() == errorData.moreInfo; });
        self.couponMultiPromotions.remove(function(item) { return item.code() == errorData.moreInfo; });
        self.markDirty();
      }
    };

    /**
     * 
     * @private
     * @function
     * @name CartViewModel#handleCurrencyPricingError
     */
    CartViewModel.prototype.handleCurrencyPricingError = function() {
       var self = this;
       self.cartPriceListGroupId(SiteViewModel.getInstance().selectedPriceListGroup().id);
       //Setting to default price list group in storage which will be picked by request header
       ccRestClient.setStoredValue(ccConstants.LOCAL_STORAGE_PRICELISTGROUP_ID, ko.toJSON(SiteViewModel.getInstance().selectedPriceListGroup().id));
       self.isDirty(false);
       self.markDirty();
    };

    /**
     * Calls the pricing endpoint and updates CartItems with returned price information
     *
     * @name CartViewModel#priceItems
     */
    CartViewModel.prototype.priceItems = function() {
      var self = this;

      var lastCartEvent = self.events.pop();
      var pricingModel = new CartPricingModel(self);
      self.populateGiftCards(pricingModel,lastCartEvent);
      self.populateIINs(pricingModel, lastCartEvent);

      self.adapter.persistCreate(ccConstants.ENDPOINT_ORDERS_PRICE_ORDER, '0', pricingModel,
        //success callback
        function(data) {
          self.isPricingRequired(false);
          self.updateCart(data, lastCartEvent, false);
          if(self.callPriceBeforeShippingMethods) {
            self.populateShipppingMethods();
          }
          $.Topic(pubsub.topicNames.COUPON_ADD_CLEAR_INPUT).publish();
          // Add the pricing success callback
          if (self.callbacks && self.callbacks.hasOwnProperty(ccConstants.PRICING_SUCCESS_CB) 
              && typeof self.callbacks[ccConstants.PRICING_SUCCESS_CB] === 'function') {
            self.callbacks[ccConstants.PRICING_SUCCESS_CB](data);
          }
        },
        //error callback
        function(data) {
         if(data.errorCode == ccConstants.SELECTED_CURRENCY_NOT_FOUND) {
             //Handling error of currency not being found.
             self.handleCurrencyPricingError();
         } else if (data.errorCode == ccConstants.COUPON_APPLY_ERROR) {
            // Handle coupon related error
            self.handleCouponPricingError(data, lastCartEvent);
          } else if (data.errorCode == ccConstants.CREATE_ORDER_PRODUCT_NOT_FOUND
                  || data.errorCode == ccConstants.CREATE_ORDER_SKU_NOT_FOUND
                  || data.errorCode == ccConstants.PRODUCT_NOT_FOR_INDIVIDUAL_SALE){
            self.handleInvalidAddItem(data, lastCartEvent);
            // Refresh the cart with last known good data on error
            self.notifyInvalidProducts();
            self.loadCart();
            self.tax(0);
            self.secondaryCurrencyTaxAmount(0);
          } else if (data.errorCode == ccConstants.GIFTCARD_APPLY_ERROR
              || data.errorCode == ccConstants.GIFTCARD_INSUFFICIENT_ERROR
              || data.errorCode == ccConstants.INVALID_GIFTCARD_DATA_ERROR
              || data.errorCode == ccConstants.GIFTCARD_ORDER_PROCESSING_ERROR) {
        	  self.handleGiftCardError(data,lastCartEvent);
          } else if (data.errorCode == ccConstants.ANONYMOUS_USER_ACCESS_CONTROL_ERROR) {
            notifier.sendError('UserNotAuthorized', CCi18n.t('ns.common:resources.anonymousAccessControlError'), true);
          } else if (data.errorCode == ccConstants.UNLINKED_ADD_ON_PRODUCT) {
            if (lastCartEvent && lastCartEvent.type == CART_EVENT_ADD
                && lastCartEvent.product.selectedAddOnProducts) {
              var moreInfo = JSON.parse(data.moreInfo);
              self.handleInvalidAddonItem(lastCartEvent.product.selectedAddOnProducts, moreInfo.productId, moreInfo.catRefId);
              self.notifyInvalidProducts();
              self.loadCart();
            }
          } else if (data.errorCode == ccConstants.ADDON_VOLUME_PRICE_ERROR) {
              var notificationMsg = data.message + " " + CCi18n.t('ns.common:resources.removeItemFromCart');
              notifier.sendError(CART_VIEW_MODEL_ID, notificationMsg, true);
              self.isDirty(false);
          } else if (data.errorCode == ccConstants.INVALID_SHOPPER_INPUT) {
              var moreInfo = JSON.parse(data.moreInfo);
              var invalidAddonProductName = moreInfo.productId;
              var addonProduct = self.findCartProductById(invalidAddonProductName);
              if (addonProduct) {
                invalidAddonProductName = addonProduct.displayName;
              }
              var notificationMsg = CCi18n.t('ns.common:resources.invalidShopperInputError', {productName: invalidAddonProductName});
              notifier.sendError(CART_VIEW_MODEL_ID, notificationMsg, true);
              self.isDirty(false);
          } else {
            self.tax(0);
            self.secondaryCurrencyTaxAmount(0);
          }
          // Add the pricing failure callback
          if (self.callbacks && self.callbacks.hasOwnProperty(ccConstants.PRICING_FAILURE_CB) 
              && typeof self.callbacks[ccConstants.PRICING_FAILURE_CB] === 'function') {
            self.callbacks[ccConstants.PRICING_FAILURE_CB](data);
          }
        }
      );
    };


    /**
     * <p>
     *   Determine if, when in single shipping mode (i.e. isSplitShipping == false), single shipping address 
     *  and shipping method are populated.
     * </p>
     *
     * @function
     * @name CartViewModel#hasSingleShippingInformation
     * @return {boolean} true if single shipping mode is selected <b>and</b> all single shiping options are 
     *    populated, false otherwise.
     */
    CartViewModel.prototype.hasSingleShippingInformation = function () {
      var hasSingleShippingInformation = false;

      if (!this.isSplitShipping()) {
        hasSingleShippingInformation = this.shippingAddress() !== '' && this.shippingMethod() !== '';
      }

      return hasSingleShippingInformation;
    };

    /**
     * <p>
     *   Determine if, when in split shipping mode (i.e. isSplitShipping == true) all shipping 
     *   group relationships are populated with shipping addresses and shipping methods, and the 
     *   shippingGroupRelationships array is valid (see shippingGroupRelationships validators for details).
     * </p>
     *
     * @function
     * @name CartViewModel#hasSplitShippingInformation
     * @return {boolean} true if split shipping mode is selected <b>and</b> all split shiping options are 
     *    populated and valid, false otherwise.
     */
    CartViewModel.prototype.hasSplitShippingInformation = function () {
      var hasSplitShippingInformation = false;

      if (this.isSplitShipping()) {
        hasSplitShippingInformation = this.items().every(function (cartItem) {
          return cartItem.shippingGroupRelationships.isValid() && cartItem.shippingGroupRelationships().every(function (shippingGroupRelationship) {
            return shippingGroupRelationship.shippingAddress() && shippingGroupRelationship.shippingMethod();
          });
        });
      }

      return hasSplitShippingInformation;
    };

    /**
     * <p>
     *   Determine if the cart is populated with shipping information. This method delegates to 
     *   CartViewModel#hasSingleShippingInformation and CartViewModel#hasSplitShippingInformation.
     * </p>
     *
     * @function
     * @name CartViewModel#hasShippingInformation
     * @return {boolean} true if CartViewModel#hasSingleShippingInformation or 
     *    CartViewModel#hasSplitShippingInformation is true, false otherwise.
     */
    CartViewModel.prototype.hasShippingInformation = function () {
      var hasShippingInformation = this.hasSplitShippingInformation() || this.hasSingleShippingInformation();

      return hasShippingInformation;
    };

    /**
     * Sets the unpriced external message for the corresponding item and saves cart to local storage
     *
     * @name CartViewModel#setUnpricedErrorAndSaveCart
     * @param {string} itemId The commerceItemId for the item
     * @param {string} errorMessage The errorMessage for the corresponding item
     */
    CartViewModel.prototype.setUnpricedErrorAndSaveCart = function(itemId, errorMessage) {
      var self = this;
      ko.utils.arrayForEach(self.items(), function(item) {
        if (item.commerceItemId == itemId && self.isConfigurableItem(item) && item.childItems && item.childItems.length > 0) {
          item.setUnpricedError(errorMessage);
        }
      });
      self.saveCartCookie();
    };

    /**
     * Clears the unpriced Error Message for all the cart items
     *
     * @name CartViewModel#clearAllUnpricedErrorsAndSaveCart
     */
    CartViewModel.prototype.clearAllUnpricedErrorsAndSaveCart = function() {
      var self = this;
      ko.utils.arrayForEach(self.items(), function(item) {
        item.clearUnpricedError();
      });
      self.saveCartCookie();
    };

    /**
     * Sets the external prices for the cart-items
     *
     * @name CartViewModel#setExternalPricesForItems
     */
    CartViewModel.prototype.setExternalPricesForItems = function(info) {
      var self = this;
      ko.utils.arrayForEach(self.items(), function(item) {
        if (info.commerceItemId == item.commerceItemId) {
          item.externalPrice(info.externalPrice);
        }
      });
    };

    /**
     * Calls the pricing endpoint and updates CartItems with returned price information
     *
     * @name CartViewModel#priceCartForCheckout
     */
    CartViewModel.prototype.priceCartForCheckout = function() {
      var self = this;
      var lastCartEvent = self.events.pop();

      //check if shipping address and shipping options are not blank
      if (self.hasShippingInformation() && !self.isOrderSubmissionInProgress) {
        var pricingModel = new CartPricingModel(self);

        if (this.isSplitShipping()) {
          pricingModel.shippingGroups = this.createShippingGroups();
        }
        else {
          pricingModel.shippingMethod = {value: this.shippingMethod()};
          pricingModel.shippingAddress = this.shippingAddress();
          
          if(this.user().emailAddress() 
             && !ko.utils.unwrapObservable(pricingModel.shippingAddress.email)) {        	   
            pricingModel.shippingAddress.email = this.user().emailAddress();
          } 
          else if(!this.user().loggedIn() && this.emailAddressForGuestUser 
        		  && (!ko.utils.unwrapObservable(pricingModel.shippingAddress.email)||(pricingModel.shippingAddress.email != this.emailAddressForGuestUser) )) {
            pricingModel.shippingAddress.email = this.emailAddressForGuestUser;
          }
        }
        pricingModel.populateShippingMethods = true;
        self.populateGiftCards(pricingModel,lastCartEvent);
        self.populateIINs(pricingModel, lastCartEvent);
        if (self.items().length > 0) {
          if(this.currentOrderState() != ccConstants.PENDING_PAYMENTS && this.currentOrderState() != ccConstants.PENDING_PAYMENT_TEMPLATE){
          if (self.user() && self.user().loggedIn() && !self.user().loggedinAtCheckout()) {
            pricingModel.checkout = true;
            pricingModel.clearCoupons = false;
            pricingModel.merge = false;
            self.adapter.persistUpdate('order', self.user().orderId(), pricingModel,
              function(data) {
                self.isPricingRequired(false);
                self.updateCart(data, lastCartEvent, false);
                $.Topic(pubsub.topicNames.ORDER_PRICING_SUCCESS).publish([{message: "success"}]);
                $.Topic(pubsub.topicNames.COUPON_ADD_CLEAR_INPUT).publish();
              },
              function(data) {
                if(data.errorCode == ccConstants.SELECTED_CURRENCY_NOT_FOUND) {
                   //Handling error of currency not being found.
                   self.handleCurrencyPricingError();
                } else if (data.errorCode == ccConstants.COUPON_APPLY_ERROR) {
                   //Handle coupon related error
                  self.handleCouponPricingError(data, lastCartEvent);
                } else if (data.errorCode == ccConstants.CREATE_ORDER_PRODUCT_NOT_FOUND
                    || data.errorCode == ccConstants.CREATE_ORDER_SKU_NOT_FOUND) {
                  self.loadCart();
                  self.tax(0);
                  self.secondaryCurrencyTaxAmount(0);
                } else if (data.errorCode == ccConstants.GIFTCARD_APPLY_ERROR
                    || data.errorCode == ccConstants.GIFTCARD_INSUFFICIENT_ERROR
                    || data.errorCode == ccConstants.INVALID_GIFTCARD_DATA_ERROR
                    || data.errorCode == ccConstants.GIFTCARD_ORDER_PROCESSING_ERROR) {
                  self.handleGiftCardError(data,lastCartEvent);
                } else if (data.errorCode == ccConstants.INVALID_SHIPPING_METHOD && self.usingImprovedShippingWidgets()) {
                  self.populateShipppingMethods();
                } else if (data.errorCode == ccConstants.UNLINKED_ADD_ON_PRODUCT) {
                  self.loadCart();
                } else if (data.errorCode == ccConstants.ADDON_VOLUME_PRICE_ERROR) {
                  var notificationMsg = data.message + " " + CCi18n.t('ns.common:resources.removeItemFromCart');
                  notifier.sendError(CART_VIEW_MODEL_ID, notificationMsg, true);
                  self.isDirty(false);
                } else if (data.errorCode == ccConstants.INVALID_SHOPPER_INPUT) {
                  var moreInfo = JSON.parse(data.moreInfo);
                  var invalidAddonProductName = moreInfo.productId;
                  var addonProduct = self.findCartProductById(invalidAddonProductName);
                  if (addonProduct) {
                    invalidAddonProductName = addonProduct.displayName;
                  }
                  var notificationMsg = CCi18n.t('ns.common:resources.invalidShopperInputError', {productName: invalidAddonProductName});
                  notifier.sendError(CART_VIEW_MODEL_ID, notificationMsg, true);
                  self.isDirty(false);
                } else {
                  self.shippingMethod('');
                  self.loadCart();
                  self.tax(0);
                  self.secondaryCurrencyTaxAmount(0);
                  $.Topic(pubsub.topicNames.ORDER_PRICING_FAILED).publishWith(data);
                }
                
                $.Topic(pubsub.topicNames.DESTROY_SHIPPING_METHODS_SPINNER).publishWith(data);
              }
            );
          } else {
            self.adapter.loadJSON('orderPricing', '0', pricingModel,
              function(data) {
                self.isPricingRequired(false);
                self.updateCart(data, lastCartEvent, false);
                $.Topic(pubsub.topicNames.ORDER_PRICING_SUCCESS).publish([{message: "success"}]);
                $.Topic(pubsub.topicNames.COUPON_ADD_CLEAR_INPUT).publish();
              },
              function(data) {
                if (data.errorCode == ccConstants.SELECTED_CURRENCY_NOT_FOUND) {
                  //Handling error of currency not being found.
                  self.handleCurrencyPricingError();
                } else if (data.errorCode == ccConstants.COUPON_APPLY_ERROR) {
                  //Handle coupon related error
                  self.handleCouponPricingError(data, lastCartEvent);
                } else if (data.errorCode == ccConstants.CREATE_ORDER_PRODUCT_NOT_FOUND
                    || data.errorCode == ccConstants.CREATE_ORDER_SKU_NOT_FOUND) {
                  self.loadCart();
                  self.tax(0);
                  self.secondaryCurrencyTaxAmount(0);
                } else if (data.errorCode == ccConstants.GIFTCARD_APPLY_ERROR
                    || data.errorCode == ccConstants.GIFTCARD_INSUFFICIENT_ERROR
                    || data.errorCode == ccConstants.INVALID_GIFTCARD_DATA_ERROR
                    || data.errorCode == ccConstants.GIFTCARD_ORDER_PROCESSING_ERROR) {
                  self.handleGiftCardError(data,lastCartEvent);
                } else if (data.errorCode == ccConstants.INVALID_SHIPPING_METHOD && self.usingImprovedShippingWidgets()) {
                  self.populateShipppingMethods();
                } else if (data.errorCode == ccConstants.UNLINKED_ADD_ON_PRODUCT) {
                  self.loadCart();
                } else if (data.errorCode == ccConstants.ADDON_VOLUME_PRICE_ERROR) {
                  var notificationMsg = data.message + " " + CCi18n.t('ns.common:resources.removeItemFromCart');
                  notifier.sendError(CART_VIEW_MODEL_ID, notificationMsg, true);
                  self.isDirty(false);
                } else if (data.errorCode == ccConstants.INVALID_SHOPPER_INPUT) {
                  var moreInfo = JSON.parse(data.moreInfo);
                  var invalidAddonProductName = moreInfo.productId;
                  var addonProduct = self.findCartProductById(invalidAddonProductName);
                  if (addonProduct) {
                    invalidAddonProductName = addonProduct.displayName;
                  }
                  var notificationMsg = CCi18n.t('ns.common:resources.invalidShopperInputError', {productName: invalidAddonProductName});
                  notifier.sendError(CART_VIEW_MODEL_ID, notificationMsg, true);
                  self.isDirty(false);
                } else {
                  self.shippingMethod('');
                  self.loadCart();
                  self.tax(0);
                  self.secondaryCurrencyTaxAmount(0);
                  $.Topic(pubsub.topicNames.ORDER_PRICING_FAILED).publishWith(data);
                }

                $.Topic(pubsub.topicNames.DESTROY_SHIPPING_METHODS_SPINNER).publishWith(data);
              }
            );
          }
          }
        } else {
          self.emptyCart();
          $.Topic(pubsub.topicNames.ORDER_PRICING_FAILED).publish();
          // this is done to clear the server side cart in case it previously had only 1 product in it.
          if (self.user() && self.user().loggedIn() && !self.user().loggedinAtCheckout()) {
            self.removeCurrentProfileOrder();
          }
        }
      } else if (self.isOrderSubmissionInProgress) {
        console.warn(CCi18n.t('ns.common:resources.priceOrderBlockedText'));
      }
    };

    /**
     * handles the failure of applying gift cards to cart.
     */
    CartViewModel.prototype.handleGiftCardError = function(data,lastCartEvent) {
      var self = this;
      var giftCardObj = lastCartEvent.product;

      if(lastCartEvent.type ===  CART_EVENT_GIFTCARD_ADD)
      	{
    	  self.giftCards.remove(function(item) { return item.giftCardNumber() == giftCardObj.giftCardNumber(); });
      	}
        else if (lastCartEvent.type === CART_EVENT_GIFTCARDS_ADD){
          for(var i = 0; i < giftCardObj.length; i++){
            self.giftCards.remove(function(item) { return item.giftCardNumber() == giftCardObj[i].giftCardNumber(); });
          }
      }
      	else if( lastCartEvent.type ===  CART_EVENT_GIFTCARD_REAPPLY  && data.errorCode == ccConstants.GIFTCARD_INSUFFICIENT_ERROR){
      		self.giftCards.remove(function(item) { return item.giftCardNumber() == giftCardObj.giftCardNumber(); });
      		$.Topic(pubsub.topicNames.GIFTCARD_UPDATE_FROM_CART).publish(
    		          self.giftCards());
      		self.isDirty(false);
      		self.isDirty(true);
    	  }


      $.Topic(pubsub.topicNames.GIFTCARD_PRICING_FAILED).publish(data,
          giftCardObj,lastCartEvent);
      self.isDirty(false);
    };


    /**
     * Populates CartViewModel with passed in data
     *
     * @name CartViewModel#updateCart
     * @param {Object} data The JSON data received from the server.
     * @param {CartEvent} lastCartEvent Most recent cart event.
     * @param {boolean} merge
     */
    CartViewModel.prototype.updateCart = function(data, lastCartEvent, merge, loggedIn) {
      var self = this;
      if (merge || self.items().length > 0) {
        
        self.updateCartData(data, merge, loggedIn);
        self.updateGiftCardDetails(data, lastCartEvent);
        self.updateDynamicProperties(data);
        self.cartUpdated();
        ////Publishing price complete when pricing is finished
        $.Topic(pubsub.topicNames.CART_PRICE_COMPLETE).publish();
        // Actually CART_ADD_SUCCESS should be published after the cart has been updated and ready
        // But as no such flag is available, I am shifting this event to end of this function.
        if (lastCartEvent && lastCartEvent.type === CART_EVENT_ADD) {
          $.Topic(pubsub.topicNames.CART_ADD_SUCCESS).publish(lastCartEvent.product);
        }
        else if (lastCartEvent && lastCartEvent.type === CART_EVENT_UPDATE) {
          $.Topic(pubsub.topicNames.CART_UPDATE_SUCCESS).publish();
        }
        else if (lastCartEvent && lastCartEvent.type === CART_EVENT_COUPON_ADD) {
          $.Topic(pubsub.topicNames.COUPON_APPLY_SUCCESSFUL).publish();
        }
        else if (lastCartEvent && lastCartEvent.type === CART_EVENT_COUPON_DELETE) {
          $.Topic(pubsub.topicNames.COUPON_DELETE_SUCCESSFUL).publish();
        }
        $.Topic(pubsub.topicNames.CART_PRICE_SUCCESS).publish(self);
      }
    };

    /**
     * This method updates the giftcard details from the response to cart
     * and then publishes to Order
     */
      CartViewModel.prototype.updateGiftCardDetails = function(data,lastCartEvent) {
        var self = this;
        var gcToBeRemoved = [];
        if (data.payments && self.giftCards().length > 0) {
          for ( var i = 0; i < self.giftCards().length; i++) {
            var found = false;
            var giftCard = self.giftCards()[i];
            for ( var j = 0; j < data.payments.length; j++) {
              var giftCardPayment = data.payments[j];
              if (giftCardPayment.paymentMethod == ccConstants.GIFT_CARD_PAYMENT_TYPE
                  && giftCard.giftCardNumber() == giftCardPayment.giftCardNumber) {
                giftCard.amountInGiftCard(giftCardPayment.balance);
                giftCard.amountUsed(giftCardPayment.amount);
                giftCard.isAmountRemaining(giftCardPayment.isAmountRemaining);
                giftCard.maskedGiftCardNumber(giftCardPayment.maskedCardNumber);
                giftCard.isApplyGiftCardClicked(false);
                found = true;
                break;
              }
            }

            if (lastCartEvent && lastCartEvent.product && lastCartEvent.product.giftCardNumber && lastCartEvent.product.giftCardNumber() === giftCard.giftCardNumber()) {
            	giftCard.isPinCleared(false);
            }

            if (found == false) {
              gcToBeRemoved.push(giftCard);
            }
          }
          for ( var k = 0; k < gcToBeRemoved.length; k++) {
            self.giftCards
                .remove(function(item) {
                  return item.giftCardNumber() == gcToBeRemoved[k]
                      .giftCardNumber();
                });
          }
          if (gcToBeRemoved && gcToBeRemoved.length > 0) {
            notifier.sendError(CART_VIEW_MODEL_ID, CCi18n
                .t('ns.common:resources.orderPricingPromotionError'), true);
          }

        }
        $.Topic(pubsub.topicNames.GIFTCARD_UPDATE_FROM_CART).publish(
            self.giftCards());
        self.updateRemainingAmount(data);
      };
    
    /**
     * This method updates the remaining amount to be paid after applying the gift cards
     * and then publishes to Order
     */
      CartViewModel.prototype.updateRemainingAmount = function(data) {
        var self = this;
        var amountRemaining = null;
        if (data.payments && self.giftCards().length > 0) {
          // amountToPay is the amount that needs to be paid for the order in monetary value
          var amountToPay = self.getDerivedTotal(self.secondaryCurrencyTotal(), self.total());
          var currencyPrecision = self.isChargeTaxShippingInSecondaryCurrency() ?
              self.secondaryCurrency().fractionalDigits : self.currency.fractionalDigits;
          // amountCovered is the amount for which payment group has already been created, in monetary currency.
          var amountCovered = 0;
          var tempResult = 0;
          for ( var j = 0; j < data.payments.length; j++) {
            var payment = data.payments[j];
            // The amount in default PG is still unaccounted for. Hence, for non-default PGs, we
            // can add the amounts into amount covered.
            if ("true" != payment.default_initial) {
              tempResult = parseFloat(amountCovered) + parseFloat(payment.amount);
              amountCovered = currencyHelper.handleFractionalDigits(tempResult, currencyPrecision);
            }
          }
          tempResult = parseFloat(amountToPay) - parseFloat(amountCovered);
          amountRemaining = currencyHelper.handleFractionalDigits(tempResult, currencyPrecision);
        }
        $.Topic(pubsub.topicNames.UPDATE_AMOUNT_REMAINING).publish(
            amountRemaining);
      };
    
    /**
     * Update Cart after receiving data from the server.
     *
     * @private
     * @function
     * @name CartViewModel#updateCartData
     */
    CartViewModel.prototype.updateCartData = function(data, merge, loggedIn) {
      var self = this;
      if (data && (data.orderId || data.id)) {
        if(data.orderId)
          self.user().orderId(data.orderId);
        else if (data.id)
          self.user().orderId(data.id);
        self.user().setLocalData('orderId');
      }
      var reloadCart = null;
      if(data.priceListGroup && data.priceListGroup.currency){
    	  self.currency=data.priceListGroup.currency;  
      }
      $.when (SiteViewModel.getInstance().siteLoadedDeferred).done(function() {
        var secondaryCurrency = SiteViewModel.getInstance().getCurrency(data.secondaryCurrencyCode);
        self.setSecondaryCurrencyData(secondaryCurrency, data.exchangeRate, data.payShippingInSecondaryCurrency, data.payTaxInSecondaryCurrency)
      });
      if (data.order && (self.currentOrderId() || self.mergeCart())) {
        reloadCart = updateItems(data.order.items, self.items, merge, self, data, loggedIn);
      } else {
        reloadCart = updateItems(data.shoppingCart.items, self.items, merge, self, data, loggedIn);
      }

      if(self.combineLineItems === ccConstants.COMBINE_YES) {
        self.combineLineItems = self.shouldCombineLineItems(self.items()) == true
                              ? ccConstants.COMBINE_YES : ccConstants.COMBINE_NO;
      }

      if (data.order && (self.currentOrderId() || self.mergeCart())) {
        self.numberOfItems(data.order.numberOfItems);
      } else {
        self.numberOfItems(data.shoppingCart.numberOfItems);
      }
      self.total(data.priceInfo.total);
      self.totalWithoutTax(data.priceInfo.totalWithoutTax);
      self.subTotal(data.priceInfo.subTotal);
      self.shipping(data.priceInfo.shipping);
      self.secondaryCurrencyShippingAmount(data.priceInfo.secondaryCurrencyShippingAmount);
      self.taxExclusiveAmount(data.priceInfo.taxExclusiveAmount);
      self.tax(data.priceInfo.tax);
      self.secondaryCurrencyTaxAmount(data.priceInfo.secondaryCurrencyTaxAmount);
      self.currencyCode(data.priceInfo.currencyCode);
      self.shippingSurcharge(data.priceInfo.shippingSurchargeValue);
      self.secondaryCurrencyShippingSurcharge(data.priceInfo.secondaryCurrencyShippingSurchargeValue);
      self.secondaryCurrencyTotal(data.priceInfo.secondaryCurrencyTotal);
      self.primaryCurrencyTotal(data.priceInfo.primaryCurrencyTotal);

      if (data.recurringChargePriceInfo) {
        self.recurringChargeAmount(data.recurringChargePriceInfo.amount);
        self.recurringChargeCurrencyCode(data.recurringChargePriceInfo.currencyCode);
        self.recurringChargeShipping(data.recurringChargePriceInfo).shipping;
        self.recurringChargeSubTotal(data.recurringChargePriceInfo.subTotal);
        self.recurringChargeSubTotalByFrequency(data.recurringChargePriceInfo.subTotalByFrequency);
        self.recurringChargeTax(data.recurringChargePriceInfo.tax);
        self.recurringChargeTaxByFrequency(data.recurringChargePriceInfo.taxByFrequency);
        self.recurringChargeTotal(data.recurringChargePriceInfo.total);
      }

      if (data.discountInfo) {
        if (data.discountInfo.orderDiscount) {
          self.orderDiscount(data.discountInfo.orderDiscount);
        }
        else {
          self.orderDiscount(0);
        }
        if(data.discountInfo.shippingDiscount) {
          self.shippingDiscount(data.discountInfo.shippingDiscount);
          self.secondaryCurrencyShippingDiscount(data.discountInfo.secondaryCurrencyShippingDiscount);
        }
        else {
          self.shippingDiscount(0);
          self.secondaryCurrencyShippingDiscount(0);
        }

        if (data.discountInfo.orderImplicitDiscountList) {
          self.orderDiscountDescList(data.discountInfo.orderImplicitDiscountList);
        }


        if (data.discountInfo.unclaimedCouponsMap) {
          self.populateCoupons(data.discountInfo.unclaimedCouponsMap, ccConstants.COUPON_STATUS_UNCLAIMED);
        }

        if (data.discountInfo.orderCouponsMap) {
          self.populateCoupons(data.discountInfo.orderCouponsMap, ccConstants.COUPON_STATUS_CLAIMED);
        }

        self.couponMultiPromotions.splice(0);
        if (data.discountInfo.unclaimedCouponMultiPromotions) {
          self.populateCouponMultiPromotions(data.discountInfo.unclaimedCouponMultiPromotions, ccConstants.COUPON_STATUS_UNCLAIMED, ccConstants.PROMOTION_NOT_APPLIED);
        }

        if (data.discountInfo.claimedCouponMultiPromotions) {
            self.populateCouponMultiPromotions(data.discountInfo.claimedCouponMultiPromotions, ccConstants.COUPON_STATUS_CLAIMED, ccConstants.PROMOTION_APPLIED);
        }

        self.populateClaimedCouponMultiPromotions(self.couponMultiPromotions());
        // Clear up coupons that are no longer coming from the server
        for (var i=self.coupons().length-1;i>=0;i--) {
          if (!data.discountInfo.orderCouponsMap.hasOwnProperty(self.coupons()[i].code()) && !data.discountInfo.unclaimedCouponsMap.hasOwnProperty(self.coupons()[i].code())) {
            self.coupons.splice(i,1);
          }
        }

        if(data.shippingGroups) {
          self.orderShippingGroups(data.shippingGroups);
        }
        else {
          self.shippingDiscount([]);
          self.secondaryCurrencyShippingDiscount(0);
        }
      }
      //this change is required to avoid the pricing being called infinately, as this amount is subscribed in chekcout order summary
      self.amount(data.priceInfo.amount);

      if (!self.skipGWPMessage) {
        self.sendGWPMessages(data);
      }
      self.skipGWPMessage = false;


      self.giftWithPurchaseOrderMarkers = data.giftWithPurchaseOrderMarkers;
      // Gift item to select
      self.placeHolderItems.removeAll();
      if (data.giftWithPurchaseInfo && data.giftWithPurchaseInfo.length) {
        self.updatePlaceHolderItems(data.giftWithPurchaseInfo);
      }

      // As self.items are updated, now check if all the items have productData.
      for (var i = 0; i < self.items().length; i++) {
        //if(self.currentOrderState() != ccConstants.PENDING_PAYMENTS && self.currentOrderState() != ccConstants.PENDING_PAYMENT_TEMPLATE){
          if (self.items()[i].productData() == null) {
            self.getProductData();
            break;
          }
        //}
      }

      return reloadCart;
    };

    /**
     * Adds gift data to a cart item if gift choices are available.
     *
     * @private
     * @function
     * @name CartViewModel#addGiftDataToItem
     */
    CartViewModel.prototype.addGiftDataToItem = function (item, data) {
      var self = this;

      if (item.discountInfo().length) {
        var discountInfo = item.discountInfo();
        item.giftData = [];
        for (var i = 0; i < discountInfo.length; i++) {
          if (discountInfo[i].giftWithPurchaseDiscountInfo && discountInfo[i].giftWithPurchaseDiscountInfo.length) {
            for (var j = 0; j < discountInfo[i].giftWithPurchaseDiscountInfo.length; j++) {
              var giftWithPurchaseDiscountInfo = discountInfo[i].giftWithPurchaseDiscountInfo[j];
              if (giftWithPurchaseDiscountInfo.giftWithPurchaseChoicesAvailable) {
                var giftWithPurchaseIdentifier = giftWithPurchaseDiscountInfo.giftWithPurchaseIdentifier;
                // Now search in giftWithPurchaseInfo with this hash code to get giftWithPurchaseType and giftWithPurchaseDetail
                for (var k = 0; k < data.giftWithPurchaseInfo.length; k++) {
                  if (data.giftWithPurchaseInfo[k].giftWithPurchaseIdentifier == giftWithPurchaseIdentifier &&
                      data.giftWithPurchaseInfo[k].promotionId == discountInfo[i].promotionId) {
                    var giftData = {};
                    giftData.giftWithPurchaseType = data.giftWithPurchaseInfo[k].giftWithPurchaseType;
                    giftData.giftWithPurchaseDetail = data.giftWithPurchaseInfo[k].giftWithPurchaseDetail;
                    giftData.promotionId = data.giftWithPurchaseInfo[k].promotionId;
                    giftData.giftWithPurchaseIdentifier = data.giftWithPurchaseInfo[k].giftWithPurchaseIdentifier;
                    giftData.giftWithPurchaseQuantity = giftWithPurchaseDiscountInfo.giftWithPurchaseQuantity;
                    item.giftData.push(giftData);
                    item.isGWPChoicesAvaliable(true);
                    break;
                  }
                }
              }
            }
          }
        }
      }
    };

    /**
     * Adds items to placeHolderItems array based on gift availability.
     *
     * @private
     * @function
     * @name CartViewModel#updatePlaceHolderItems
     */
    CartViewModel.prototype.updatePlaceHolderItems = function (giftWithPurchaseInfo) {
      var self = this;

      for (var i = 0; i < giftWithPurchaseInfo.length; i++) {
        if (giftWithPurchaseInfo[i].giftWithPurchaseQuantityAvailableForSelection) {
          var giftWithPurchaseQuantity = giftWithPurchaseInfo[i].giftWithPurchaseQuantityAvailableForSelection;
          if (giftWithPurchaseQuantity) {
            var placeHolderData = giftWithPurchaseInfo[i];
            placeHolderData.displayName = CCi18n.t('ns.common:resources.freeProductText');
            placeHolderData.imageData = {
              'primaryThumbImageURL' : "/img/GWP_GiftWithPurchase.jpg",
              'primaryImageAltText' : placeHolderData.displayName,
              'primaryImageTitle' : placeHolderData.displayName,
            };
            placeHolderData.quantity = 1;
            placeHolderData.itemTotal = 0;
            placeHolderData.quantityDisabled = true;
            placeHolderData.id = Math.floor(Math.random() * 10000);
            placeHolderData.isPlaceHolderItem = true;
          }
          while (giftWithPurchaseQuantity) {
            self.placeHolderItems.push(placeHolderData);
            giftWithPurchaseQuantity --;
          }
        }
      }
      self.numberOfItems(self.numberOfItems() + self.placeHolderItems().length);
    };

    /**
     * Remove the given place holder item from the cart.
     *
     * @private
     * @function
     * @name CartViewModel#removePlaceHolderFromCart
     */
    CartViewModel.prototype.removePlaceHolderFromCart = function (item) {
      var self = this;
      self.placeHolderItems.remove(item);
      self.allItems.remove(item);
      $.Topic(pubsub.topicNames.CART_REMOVE_SUCCESS).publishWith([{message:"success"}]);
      self.numberOfItems(self.numberOfItems() - 1);
    };

    CartViewModel.prototype.sendGWPMessages = function(data) {
      var self = this;

      notifier.clearError(GIFT_WITH_PURCHASE_ID);

      if (self.gwpQualified) {
        $.Topic(pubsub.topicNames.GWP_CLEAR_QUALIFIED_MESSAGE).publish();
        self.gwpQualified = false;
      }

      if (data.pricingMessages && data.pricingMessages.giftWithPurchaseMessages
          && data.pricingMessages.giftWithPurchaseMessages.length) {
        var gwpMessages = data.pricingMessages.giftWithPurchaseMessages
        // gwpInvalidated flag to notify the shopper only once
        var gwpInvalidated = false;
        // gwpFailure flag to notify the shopper only once
        var gwpFailure = false;
        var promotionId = null;
        var errorMsg, successMsg, invalidatedMsg;
        for (var i = 0; i < gwpMessages.length; i++) {
          if ((gwpMessages[i].identifier == "GWPFullFailure") && !gwpFailure) {
            errorMsg = gwpMessages[i].summary;
            gwpFailure = true;
            // As messages are queued, so both failure and qualified messages are sent.
            // To avoid displaying qualified message in case of failure, need to check the promotion id.
            // Right now checking only for the first promotionId. Might need to change it later.
            if (gwpMessages[i].params[0] == promotionId) {
              $.Topic(pubsub.topicNames.GWP_CLEAR_QUALIFIED_MESSAGE).publish();
              self.gwpQualified = false;
              promotionId = null;
            } else {
              promotionId = gwpMessages[i].params[0];
            }
            $.Topic(pubsub.topicNames.GWP_FAILURE_MESSAGE).publish(gwpMessages[i]);
          } else if ((gwpMessages[i].identifier == "GWPQualified") && !self.gwpQualified) {
              successMsg = gwpMessages[i].summary;
              if (promotionId == gwpMessages[i].params[0]) {
                $.Topic(pubsub.topicNames.GWP_CLEAR_QUALIFIED_MESSAGE).publish();
                self.gwpQualified = false;
                promotionId = null;
              } else {
                $.Topic(pubsub.topicNames.GWP_QUALIFIED_MESSAGE).publish(gwpMessages[i]);
                // gwpQualified flag so that GWPQualified is published only once
                self.gwpQualified = true;
                promotionId = gwpMessages[i].params[0];
              }
          } else if ((gwpMessages[i].identifier == "GWPInvalidated") && !gwpInvalidated) {
            invalidatedMsg = gwpMessages[i].summary;
            gwpInvalidated = true;
            $.Topic(pubsub.topicNames.GWP_INVALIDATED_MESSAGE).publish(gwpMessages[i]);
          }
        }

        //send the notifications based on gwpFailure and gwpQualified flags

        if (gwpFailure && !self.gwpQualified) { //better to check for two flags since we get two price messages in the case of gwp failure
          notifier.sendError(GIFT_WITH_PURCHASE_ID, errorMsg, true);
        } else if (self.gwpQualified) {
          notifier.sendSuccess(GIFT_WITH_PURCHASE_ID, successMsg, true);
        } else if (gwpInvalidated) {
          notifier.sendError(GIFT_WITH_PURCHASE_ID, invalidatedMsg, true);
        }
      }
    };

    /**
     * Populate coupons on cart using a map of coupons that maps a coupon code onto an object containing
     * related coupon details. All coupons on the cart will have status given by the status parameter.
     *
     * @private
     * @function
     * @name CartViewModel#populateCoupons
     * @param {Object} coupons map A set of coupon codes mapping onto Objects containing {promotionDesc, promotionLevel, promotionId, totalAdjustment, promotionName, promotionLongDesc}
     * @param {string} status Status to set on all coupons in cart.
     */
    CartViewModel.prototype.populateCoupons = function(couponsMap, status) {
      var self = this;
      var couponsToAdd = [], found =false;;
      var couponsCount = self.coupons().length;
      for (var key in couponsMap){
        for (var i = 0; i < couponsCount; i++) {
          if (key == self.coupons()[i].code()) {
            self.coupons()[i].description(couponsMap[self.coupons()[i].code()].promotionDesc);
            self.coupons()[i].status(status);
            self.coupons()[i].level(couponsMap[self.coupons()[i].code()].promotionLevel);
            self.coupons()[i].id(couponsMap[self.coupons()[i].code()].promotionId);
    		self.coupons()[i].totalAdjustment(couponsMap[self.coupons()[i].code()].totalAdjustment);
            self.coupons()[i].name(couponsMap[self.coupons()[i].code()].promotionName);
            self.coupons()[i].longDescription(couponsMap[self.coupons()[i].code()].promotionLongDesc);
            found = true;
            break;
          }
        }
        if (!found) {
          couponsToAdd.push(new Coupon(key, couponsMap[key].promotionDesc, status,
                                       couponsMap[key].promotionLevel, couponsMap[key].promotionId,
                                       couponsMap[key].totalAdjustment, couponsMap[key].promotionName,
                                       couponsMap[key].promotionLongDesc));
        }
      }
      for (var i = 0; i < couponsToAdd.length; i++) {
        self.coupons.push(couponsToAdd[i]);
      }
    };

    /**
     * Populate coupons on cart using an object containing coupon code as the key, and a list of promotions associated with the coupon as value.
     * 
     * @function
     * @name CartViewModel#populateCouponMultiPromotions
     * @param {Object} sourceCoupons Object containing coupon code as key, and associated list of promotions as value
     * @param {String} couponStatus Status to be set on the coupons.
     * @param {Boolean} promotionApplied true, if the promotion is applied to the order
     */
    CartViewModel.prototype.populateCouponMultiPromotions = function(sourceCoupons, couponStatus, promotionApplied) {
      var self = this;
      var couponsToAdd = [], couponFound =false;
      var couponsCount = self.couponMultiPromotions().length;
      for (var key in sourceCoupons){
        couponFound = false;
        for (var i = 0; i < couponsCount; i++) {
          if (key == self.couponMultiPromotions()[i].code()) {
            self.couponMultiPromotions()[i].couponStatus(couponStatus);
            self.couponMultiPromotions()[i].populateCouponData(sourceCoupons[key], promotionApplied);
            couponFound = true;
            break;
          }
        }
        if (!couponFound) {
          couponsToAdd.push(new couponMultiPromotion(key, sourceCoupons[key], couponStatus, promotionApplied));
        }
      }
      for (var i = 0; i < couponsToAdd.length; i++) {
        self.couponMultiPromotions.push(couponsToAdd[i]);
      }
    };

    /**
     * Filters the couponMultiPromotions array, and save all the claimed coupons, along with applied promotions in a separate array
     * 
     * @function
     * @name CartViewModel#populateClaimedCouponMultiPromotions
     * @param {observableArray} couponMultiPromotions An array containing the coupons, along with associated promotions available in cart
     */
    CartViewModel.prototype.populateClaimedCouponMultiPromotions = function(couponMultiPromotions) {
      var self = this;
      self.claimedCouponMultiPromotions.splice(0);
      for (var couponIndex = 0; couponIndex < couponMultiPromotions.length; couponIndex++) {
        if(couponMultiPromotions[couponIndex].couponStatus() === ccConstants.COUPON_STATUS_CLAIMED) {
          var sourcePromotions = [];
          for(var promoIndex = 0; promoIndex < couponMultiPromotions[couponIndex].promotions().length; promoIndex++) {
            if(couponMultiPromotions[couponIndex].promotions()[promoIndex].promotionApplied()) {
              sourcePromotions.push(ko.mapping.toJS(couponMultiPromotions[couponIndex].promotions()[promoIndex]));
            }
          }
          self.claimedCouponMultiPromotions.push(new couponMultiPromotion(couponMultiPromotions[couponIndex].code(), sourcePromotions, ccConstants.COUPON_STATUS_CLAIMED, ccConstants.PROMOTION_APPLIED));
        }
      }
    }
    
    /**
     * This method populate shipping methods for the given shippingGroupRelationship. 
     * Before calling shipping methods, it calls price endpoint to get rawTotalPrice of that shippingGroup.
     *  
     */
    CartViewModel.prototype.populateShippingMethodsForShippingGroup = function (shippingGroupRelationship, successFunction, errorFunction) {
      var self = this;
      var priceInput = {};
      priceInput.shoppingCart = {};    	
      priceInput.shoppingCart.items = [];    
      
      // Get the current shipping group item details to get rawTotalPrice
      priceInput.shoppingCart.items.push({
        catRefId: shippingGroupRelationship.catRefId,
    	productId: shippingGroupRelationship.productId,
    	quantity: shippingGroupRelationship.quantity()
      });
    	
      self.adapter.persistCreate(ccConstants.ENDPOINT_ORDERS_PRICE_ORDER, '0', priceInput,
    	  //success callback
    	  function(data) {
    		// Build service request arguments.
            var inputParams = {};
            var shippingAddress = shippingGroupRelationship.shippingAddress();

            // Can only lookup shipping options if a shipping address has been selected.
            if (shippingAddress) {
              inputParams[ccConstants.PRODUCT_IDS_FOR_SHIPPING] = [shippingGroupRelationship.productId];
              inputParams[ccConstants.POPULATE_SHIPPING_METHODS] = true;
              inputParams[ccConstants.SHIPPING_ADDRESS_FOR_METHODS] = shippingAddress.toJSON();
              
              // Sending PriceInfo with entire cart (all items total) details.
              inputParams.priceInfo =  {
          			amount: self.amount(),
        			total: self.total(),
        			shipping: self.shipping(),
        			totalWithoutTax: self.totalWithoutTax(),
        			currencyCode: self.currencyCode(),
        			shippingSurchargeValue: self.shippingSurcharge(),
        			tax: self.tax(),
        			subTotal: self.subTotal() 
        		  }; 
              var targetItems = ko.observableArray();
              
              updateItems(data.shoppingCart.items, targetItems, true);
              
              inputParams.items = targetItems();

              // Empty the current shipping options.
              shippingGroupRelationship.shippingOptions.removeAll();

              // Instead of invoking the API from Cart VM, we are invoking it from ShippingMethods VM and passing success and error callbacks
              if(self.loadMultipleShippingMethods && $.isFunction(self.loadMultipleShippingMethods)) {
                self.loadMultipleShippingMethods(successFunction, errorFunction, inputParams);
              }
            }
   	      },
    	    //error callback
    	    function(data) {
    	      errorFunction(data);
    	    });	
     
    };
    /**
     * Helper Model for sending coupon info for pricing.
     *
     * @private
     * @class Represents a coupon.
     * @name Coupon
     * @property {observable<string>} code coupon code
     * @property {observable<string>} description promotion description
     * @property {observable<string>} name promotion name
     * @property {observable<string>} longDescription promotion long description
     *
     */
    function Coupon(code, description, status, level, promotionId, totalAdjustment, name, longDescription) {
      var self =this;
      self.code = ko.observable(code);
      self.description = ko.observable(description);
      self.status = ko.observable(status);
      self.level = ko.observable(level);
      self.id = ko.observable(promotionId);
      self.totalAdjustment = ko.observable(totalAdjustment);
      self.name = ko.observable(name);
      self.longDescription = ko.observable(longDescription);

      self.toJSON = function() {
        var copy = ko.toJS(self);
        return copy;
      };
      return self;
    };

    /**
     * Creates a coupon that supports multiple promotions
     *
     * @param {String} couponCode coupon code
     * @param {Array} sourcePromotions promotions that will be associated to the coupon code
     * @param {String} couponStatus status that will be associated to the coupon
     * @param {Boolean} true, if the promotion is applied to the order
     *
     */
    function couponMultiPromotion(couponCode, sourcePromotions, couponStatus, promotionApplied) {
      var self =this;
      self.code = ko.observable(couponCode);
      self.couponStatus = ko.observable(couponStatus?couponStatus:'');
      self.promotions = ko.observableArray([]);

      /**
       * Creates a new Promotion, that will be associated with the coupon
       * @param {String} promotionId The id for the promotion
       * @param {String} description The description for the promotion
       * @param {Boolean} promotionApplied true, if the promotion is applied to the order
       * @param {String} level The level for the promotion
       * @param {String} totalAdjustment The adjustment by the promotion
       * @param {String} name The name of the promotion
       * @param {String} longDescription The long description of the promotion
       */
      self.newPromotionInfo = function(promotionId, description, promotionApplied, level, totalAdjustment, name, longDescription) {
        var self = {};
        self.promotionId = ko.observable(promotionId?promotionId:'');
        self.promotionDesc = ko.observable(description?description:'');
        self.promotionApplied = ko.observable(promotionApplied?promotionApplied:false);
        self.promotionLevel = ko.observable(level?level:'');
        self.totalAdjustment = ko.observable(totalAdjustment?totalAdjustment:'0');
        self.promotionName = ko.observable(name ? name: '');
        self.promotionLongDesc = ko.observable(longDescription ? longDescription : '');

        self.toJSON = function() {
          var copy = ko.toJS(self);
          return copy;
        };

        return self;
      };

      /**
       * Populates promotionData, for a particular promotionId
       * @param {Object} sourcePromotion the promotion object, used to populate viewmodel data
       * @param {Object} targetPromotion the promotion object, populated by sourcePromotion
       * @param {Boolean} promotionApplied true, if the promotion is applied to the order
       */
      self.populatePromotionData = function(sourcePromotion, targetPromotion, promotionApplied) {
        targetPromotion.promotionDesc(sourcePromotion.promotionDesc);
        targetPromotion.promotionApplied(promotionApplied?promotionApplied:sourcePromotion.promotionApplied);
        targetPromotion.promotionLevel(sourcePromotion.promotionLevel);
        targetPromotion.totalAdjustment(sourcePromotion.totalAdjustment);
        targetPromotion.promotionName(sourcePromotion.promotionName);
        targetPromotion.promotionLongDesc(sourcePromotion.promotionLongDesc);
      };

      /**
       * Populates coupon data for a particular coupon code
       * @param {Array} List of promotions, for the particular coupon code
       * @param {Boolean} promotionApplied true, if the promotion is applied to the order
       */
      self.populateCouponData = function(sourcePromotions, promotionApplied) {
        var self = this;
        var promosToAdd = ko.observableArray([]);
        var promotionFound = false;
        if(sourcePromotions && sourcePromotions.length > 0) {
          for(var j = 0; j < sourcePromotions.length; j++) {
            promotionFound = false;
            for(var k = 0; k < self.promotions().length; k++) {
              if(sourcePromotions[j].promotionId == self.promotions()[k].promotionId()) {
                self.populatePromotionData(sourcePromotions[j], self.promotions()[k], promotionApplied);
                promotionFound = true;
                break;
              }
            }
            if(!promotionFound) {
              promosToAdd.push(self.newPromotionInfo(sourcePromotions[j].promotionId,sourcePromotions[j].promotionDesc, 
               promotionApplied?promotionApplied:sourcePromotions[j].promotionApplied, 
               sourcePromotions[j].promotionLevel, sourcePromotions[j].totalAdjustment,
               sourcePromotions[j].promotionName, sourcePromotions[j].promotionLongDesc));
            }
          }
        }
        for(var j = 0; j < promosToAdd().length; j++) {
          self.promotions.push(promosToAdd()[j]);
        }
      };

      self.toJSON = function() {
        var copy = ko.toJS(self);
        return copy;
      };

      if(sourcePromotions && sourcePromotions.length > 0) {
        self.populateCouponData(sourcePromotions, promotionApplied);
      }
      return self;
    };

    CartViewModel.prototype.events = new Array();

    /**
     * Updates CartItem list with quantity and price info from sourceItems
     *
     * @private
     * @function
     * @property sourceItems list of items with updated quantity and price
     * @property targetItems list of items to be updated
     * @property loggedIn set to true if the user is not anonymous
     */
    function updateItems(sourceItems, targetItems, merge, self, data, loggedIn) {
      var reloadCart = false;
      for (var i=0;i<sourceItems.length;i++) {
        var found = false;
        for (var j = 0; targetItems && j < targetItems().length; j++) {
          if (sourceItems[i].productId == targetItems()[j].productId && sourceItems[i].catRefId == targetItems()[j].catRefId) {
            // XOR conditions only.
            // 1. Both are normal CI
            // 2. Both are configurable CI
            if ((!(self.isConfigurableItem(sourceItems[i]) || self.isConfigurableItem(targetItems()[j])) && (sourceItems[i].commerceItemId != null)
                    && (sourceItems[i].commerceItemId == targetItems()[j].commerceItemId))||
                (self.isConfigurableItem(sourceItems[i]) && self.isConfigurableItem(targetItems()[j])
                    && (sourceItems[i].commerceItemId != null)
                    && (sourceItems[i].commerceItemId == targetItems()[j].commerceItemId))) {
              targetItems()[j].quantity(sourceItems[i].quantity);
              targetItems()[j].discountInfo(sourceItems[i].discountInfo);
              targetItems()[j].rawTotalPrice(sourceItems[i].rawTotalPrice);
              targetItems()[j].selectedOptions=sourceItems[i].variant;
              if (merge) {
                targetItems()[j].updatableQuantity(sourceItems[i].quantity);
              }
              targetItems()[j].itemTotal(sourceItems[i].price);
              targetItems()[j].detailedItemPriceInfo(sourceItems[i].detailedItemPriceInfo);
              targetItems()[j].repositoryId = sourceItems[i].id;
              if (self.isConfigurableItem(targetItems()[j]) && self.isConfigurableItem(sourceItems[i])) {
                // update the detailedItemPriceInfo and itemTotal of child items recursively
                self.updateChildItemPrices(sourceItems[i].childItems, targetItems()[j].childItems);
              }
              targetItems()[j].detailedRecurringChargeInfo(sourceItems[i].detailedRecurringChargeInfo);
              targetItems()[j].repositoryId = sourceItems[i].id;
              if (targetItems()[j].childItems && targetItems()[j].childItems.length > 0 && sourceItems[i].childItems && sourceItems[i].childItems.length > 0) {
                // update the detailedItemPriceInfo and itemTotal of child items recursively
                self.updateChildItemPrices(sourceItems[i].childItems, targetItems()[j].childItems);
              }
              targetItems()[j].giftWithPurchaseCommerceItemMarkers = sourceItems[i].giftWithPurchaseCommerceItemMarkers;
              targetItems()[j].isGWPChoicesAvaliable(false);
              // Check whether gift choices are available for an selected item
              self.addGiftDataToItem(targetItems()[j], data);
              // giftWithPurchaseSelections should not be sent in the next pricing request
              delete targetItems()[j].giftWithPurchaseSelections;
              //Update order line item properties to target
              self.updateItemDynamicProperties(targetItems()[j], sourceItems[i]);
              found = true;
              break;
            }
          }
        }
        // If the item is not found, it means this is the item that was 
        // recently added to cart.
        
        if(!((self.currentOrderState() == ccConstants.QUOTED_STATES) || (self.currentOrderState() == ccConstants.PENDING_PAYMENTS) || (self.currentOrderState() == ccConstants.PENDING_PAYMENT_TEMPLATE))){
        if (!found) {
          
          for (var j = 0; targetItems && j < targetItems().length; j++) {
            // Condition for the last item added to cart
            if (!targetItems()[j].commerceItemId) {
              targetItems()[j].quantity(sourceItems[i].quantity);
              targetItems()[j].discountInfo(sourceItems[i].discountInfo);
              targetItems()[j].rawTotalPrice(sourceItems[i].rawTotalPrice);
               // If this cartItem becomes a gift, then allow updatableQuantity to be changed
            if (merge || ((targetItems()[j].giftWithPurchaseCommerceItemMarkers && targetItems()[j].giftWithPurchaseCommerceItemMarkers.length)
                || (sourceItems[i].giftWithPurchaseCommerceItemMarkers && sourceItems[i].giftWithPurchaseCommerceItemMarkers.length))) {
                targetItems()[j].updatableQuantity(sourceItems[i].quantity);
              }
              targetItems()[j].itemTotal(sourceItems[i].price);
              targetItems()[j].detailedItemPriceInfo(sourceItems[i].detailedItemPriceInfo);
              targetItems()[j].repositoryId = sourceItems[i].id;
              if (self.isConfigurableItem(targetItems()[j]) && self.isConfigurableItem(sourceItems[i])) {
                // update the detailedItemPriceInfo and itemTotal of child items recursively
                self.updateChildItemPrices(sourceItems[i].childItems, targetItems()[j].childItems);
              }
              targetItems()[j].detailedRecurringChargeInfo(sourceItems[i].detailedRecurringChargeInfo);
              targetItems()[j].repositoryId = sourceItems[i].id;
              if (targetItems()[j].childItems && targetItems()[j].childItems.length > 0 && sourceItems[i].childItems && sourceItems[i].childItems.length > 0) {
                // update the detailedItemPriceInfo and itemTotal of child items recursively
                self.updateChildItemPrices(sourceItems[i].childItems, targetItems()[j].childItems);
              }
              targetItems()[j].giftWithPurchaseCommerceItemMarkers = sourceItems[i].giftWithPurchaseCommerceItemMarkers;
              targetItems()[j].isGWPChoicesAvaliable(false);
              // Check whether gift choices are available for an selected item
              self.addGiftDataToItem(targetItems()[j], data);
              // giftWithPurchaseSelections should not be sent in the next pricing request
              delete targetItems()[j].giftWithPurchaseSelections;
              //Update order line item properties to target
              self.updateItemDynamicProperties(targetItems()[j], sourceItems[i]);
              targetItems()[j].commerceItemId = sourceItems[i].id;
              // Just adding a preventive check to make sure if 2 items get added,
              // same id doesn't get set. Though this is not the ideal solution.
              //sourceItems[j].commerceItemId = sourceItems[i].id;
              found = true;
              break;
              }
            }
          }        
        if ((merge || checkForGiftItem(sourceItems[i].discountInfo)) && !found) {
          var selectedOptions = getSelectedOptions(sourceItems[i]);
          var childItems = null;         
          if (self.isConfigurableItem(sourceItems[i])) {
            childItems = [];
            childItems = self.getChildItemsAsCartItems(sourceItems[i]);
          }

          var cartItemData = {
            productId: sourceItems[i].productId,
            quantity: sourceItems[i].quantity,
            catRefId: sourceItems[i].catRefId, 
            selectedOptions: selectedOptions,
            currency: CartViewModel.singleInstance.currency,
            discountInfo: sourceItems[i].discountInfo,
            rawTotalPrice: sourceItems[i].rawTotalPrice, 
            externalPrice: sourceItems[i].externalPrice,
            externalPriceQuantity: sourceItems[i].externalPriceQuantity,
            configuratorId: sourceItems[i].configuratorId,
            childItems: childItems,
            commerceItemId: sourceItems[i].commerceItemId,
            unpricedExternalMessage: sourceItems[i].unpricedExternalMessage,
            externalData: sourceItems[i].externalData,
            actionCode: sourceItems[i].actionCode,
            lineAttributes: CartViewModel.singleInstance.lineAttributes,
            externalRecurringCharge: sourceItems[i].externalRecurringCharge,
            externalRecurringChargeFrequency: sourceItems[i].externalRecurringChargeFrequency,
            externalRecurringChargeDuration: sourceItems[i].externalRecurringChargeDuration,
            assetId: sourceItems[i].assetId,
            serviceId: sourceItems[i].serviceId,
            customerAccountId: sourceItems[i].customerAccountId,
            billingAccountId: sourceItems[i].billingAccountId,
            serviceAccountId: sourceItems[i].serviceAccountId,
            activationDate: sourceItems[i].activationDate,
            deactivationDate: sourceItems[i].deactivationDate,
            addOnItem: sourceItems[i].addOnItem,
            shopperInput: sourceItems[i].shopperInput
          };

          var item = new CartItem(cartItemData);

          item.itemTotal(sourceItems[i].price);
          item.detailedItemPriceInfo(sourceItems[i].detailedItemPriceInfo);
          item.detailedRecurringChargeInfo(sourceItems[i].detailedRecurringChargeInfo);
          item.repositoryId = sourceItems[i].id;
          // CCSF-11422: Update custom order line properties for cart items
          self.updateItemDynamicProperties(item, sourceItems[i]);
          item.giftWithPurchaseCommerceItemMarkers = sourceItems[i].giftWithPurchaseCommerceItemMarkers;
          // Check whether gift choices are available for an selected item
          self.addGiftDataToItem(item, data);
          targetItems.push(item);
          reloadCart = true;
        }
       }
      }

      for (var j = 0; targetItems && j < targetItems().length; j++) {
        var found = false;
        for (var i=0; i < sourceItems.length; i++) {
          if (sourceItems[i].productId == targetItems()[j].productId && sourceItems[i].catRefId == targetItems()[j].catRefId) {
            found = true;
            break;
          }
        }
        if (!found) {
          targetItems.remove(targetItems()[j]);
          // Removing an item from the array on which we are iterating causes problems as the index is incremented
          // but the length decreases. Hence we need to decrement the index, when removing the item.
          j--;
        }
      }
      return reloadCart;
    }

    /**
     * Checks whether the item in the shopping cart is a gift or not
     *
     * @private
     * @function
     * @property item Shopping cart item
     */
    function checkForGiftItem(itemDiscountInfo) {
      if (itemDiscountInfo && itemDiscountInfo.length) {
        for (var i=0; i < itemDiscountInfo.length; i++) {
          if (itemDiscountInfo[i].giftWithPurchaseDiscountInfo && itemDiscountInfo[i].giftWithPurchaseDiscountInfo.length) {
            return true;
          }
        }
      }
      return false;
    }
    
    /**
     * This function will create map with listing skuID as key and image url as value
     */
    function createImageMapForSkus(currentProduct) {
      var skuIDImageMap = {};
      for (var index = 0; index < currentProduct.childSKUs.length; index++) {
        if(currentProduct.childSKUs[index].primaryThumbImageURL){
          skuIDImageMap[currentProduct.childSKUs[index].repositoryId]= currentProduct.childSKUs[index].primaryThumbImageURL;
        }
      }
      return skuIDImageMap;
    }
    /**
     * Helper Model for sending cart info in correct format for getProductsAvailability
     *
     * @private
     * @class Represents cart availability information.
     * @name CartAvailabilityModel
     * @property {CartViewModel} cart
     */
    function CartAvailabilityModel(cart) {
      this.operation= "availability";
      this.products = new Array();
      this.catalogId = cart.catalogId();
      for (var i = 0; i < cart.items().length; i++) {
        var prodSkuCombo = cart.items()[i].productId;
        var skuId = cart.items()[i].catRefId;
        if(skuId)
          prodSkuCombo = prodSkuCombo + ":" + skuId;
        this.products.push(prodSkuCombo);
        this.getProductSkuFromChild = function (product) {
          for (var i = 0; i < product.childItems.length; i++) {
            var childProdSkuCombo = product.childItems[i].productId;
            var childSkuId = product.childItems[i].catRefId;
            if(childSkuId)
              childProdSkuCombo = childProdSkuCombo + ":" + childSkuId;
            this.products.push(childProdSkuCombo);
            if (product.childItems[i].childItems && product.childItems[i].childItems.length > 0) {
              this.getProductSkuFromChild(product.childItems[i]);
            }
          }
        };
        // Add the child items if they exist.
        if (cart.isConfigurableItem(cart.items()[i]) && cart.items()[i].childItems && cart.items()[i].childItems.length > 0) {
          this.getProductSkuFromChild(cart.items()[i]);
        }
      }
      // Adding a unique check to make sure duplicates do not get sent.
      $.unique(this.products);
      this.products = this.products.join(",");
    }

    /**
     * Calls the getProductsAvailability end point and based on the
     * stock status of cart items redirect to checkout or cart
     *
     * @private
     * @function
     * @name CartViewModel#validateCartAvailability
     * @returns {boolean} true if all items in the cart are currently available, otherwise false.
     */
    CartViewModel.prototype.validateCartAvailability = function() {
      var self = this;
      var deferred = $.Deferred();
      if (self.items().length > 0) {
        var availabilityModel = new CartAvailabilityModel(self);
        var contextObj = {};
        contextObj[ccConstants.ENDPOINT_KEY] = ccConstants.ENDPOINT_PRODUCTS_AVAILABILITY;
        contextObj[ccConstants.IDENTIFIER_KEY] = "stockStatsToValidateCart";
        var filterKey = self.storeConfiguration.getFilterToUse(contextObj);
        if (filterKey) {
          availabilityModel[ccConstants.FILTER_KEY] = filterKey;
        }
        self.adapter.loadJSON('getStockStatuses', '0', availabilityModel,
          //success callback
          function(data) {
            deferred.resolve(self.validateCartForCheckout(data));
          },
          //error callback
          function(data) {
            deferred.reject(data);
            self.redirect(self.cartLink);
            // As shopper is being redirected to cart page, notify the shopper on that page.
            self.notifyInvalidProducts('cart');
          }
        );
      }
      return deferred;
    };

    /**
     * If stock status of any of cart items is false then redirect to cart
     * else redirect to checkout.
     *
     * @private
     * @function
     * @name CartViewModel#validateCartForCheckout
     * @param {Object} data Updated data returned from server.
     */
    CartViewModel.prototype.validateCartForCheckout = function (data) {
      var self = this;
      for (var i = 0; i < self.items().length; i++) {
        if (self.isConfigurableItem(self.items()[i])) {
          // Configurable items
          self.items()[i].getItemQuantityInCart = self.getUpdatableItemQuantityInCart.bind(self, self.items(), self.items()[i].productId, self.items()[i].catRefId);
          self.items()[i].addConfigurableStockValidation(data, self.isPreOrderBackOrderEnabled);
        } else {
          for (var j = 0; j < data.length; j++) {
            if ((self.items()[i].productId === data[j].productId) && (self.items()[i].catRefId === data[j].catRefId)) {
              if (data[j].stockStatus === 'IN_STOCK' || data[j].stockStatus === 'PREORDERABLE' || data[j].stockStatus === 'BACKORDERABLE') {
                self.items()[i].getItemQuantityInCart = self.getUpdatableItemQuantityInCart.bind(self, self.items(), self.items()[i].productId, self.items()[i].catRefId);
                self.items()[i].addLimitsValidation(true, data[j].orderableQuantity, data[j], self.isPreOrderBackOrderEnabled);
              } else {
                self.items()[i].addLimitsValidation(false, data[j].orderableQuantity, data[j], self.isPreOrderBackOrderEnabled);
              }
              break;
            }
          }
        }
      }

      for (var i = 0; i < self.items().length; i++) {
        for (var j = 0; j < data.length; j++) {
          if ((self.items()[i].productId === data[j].productId) && (self.items()[i].catRefId === data[j].catRefId)) {
            if (!(((data[j].stockStatus === 'PREORDERABLE') || (data[j].stockStatus === 'IN_STOCK') || 
                            (data[j].stockStatus === 'BACKORDERABLE')) && (self.items()[i].quantity() <= data[j].orderableQuantity) && self.items()[i].updatableQuantity.isValid())) {
              self.redirect(self.cartLink);
              self.checkoutWithPaypalClicked(false);
              return false;
            }
           break;
          }
        }
      }
      return true;
    };

    /**
     * Redirect to link that is passed as the parameter
     * and reloads the page from server.
     *
     * @private
     * @function
     * @name CartViewModel#redirect
     * @param {string} link URL to redirect
     */
    CartViewModel.prototype.redirect = function (link) {
      var self = this;
      if (self.validateAndRedirectCart() || ((self.checkoutLink == link || link == ccConstants.PAYPAL_CHECKOUT_TYPE) && (self.user().loggedIn() || self.user().isUserSessionExpired()))) {
        self.validateAndRedirectCart(false);
        if (link == ccConstants.PAYPAL_CHECKOUT_TYPE) {
          self.user().validateAndRedirectPage(link);
        } else {
          self.user().validateAndRedirectPage(self.checkoutLink);
        }
      } else {
        if (!navigation.isPathEqualTo(link)) {
          if (link == ccConstants.PAYPAL_CHECKOUT_TYPE) {
            $.Topic(pubsub.topicNames.CONTINUE_TO_PAYPAL).publish();
          } else {
            navigation.goTo(link);
          }
        } else {
          //added this line to get the cart data from Server than cache
          self.reloadCart();
        }
      }
    };

    /**
     * Set internal cart context from parameter. Also set cartLink and checkoutLink URIs.
     *
     * @function
     * @name CartViewModel#setContext
     * @param {Object} pContext The context.
     */
    CartViewModel.prototype.setContext = function(pContext) {
      this.contextData = pContext;
      this.cartLink = this.contextData.global.links.cart.route;
      this.checkoutLink = this.contextData.global.links.checkout.route;
      this.isTaxIncluded = this.contextData.global.site.isTaxIncluded;
      this.showTaxSummary = this.contextData.global.site.showTaxSummary;
      this.isPreOrderBackOrderEnabled = this.contextData.global.preorderBackorderEnabled;
    };
    
    
    
    /**
     * This updates the values of dynamic properties for the order
     * @private
     * @function
     * @name CartViewModel#validateDynamicProperties
     * @param {Object} data
     */
    CartViewModel.prototype.validateDynamicProperties = function() {
      var self = this;
      for ( var i = 0; i < self.dynamicProperties().length; i++) {
        var dynProp = self.dynamicProperties()[i];
        if (!dynProp.validateNow()) {
          return false;
        }
      }
      return true;
    };

    /**
     * This updates the values of dynamic properties for the order
     * @private
     * @function
     * @name CartViewModel#updateDynamicProperties
     * @param {Object} data Dynamic property values
     */
    CartViewModel.prototype.updateDynamicProperties = function(data) {
      var self = this;
      if (data.dynamicProperties && self.dynamicProperties) {
        var refreshMetadata = false;
        for (var i = 0; i < data.dynamicProperties.length; i++) {
          var propertyFound = false;
          for (var j = 0; j < self.dynamicProperties().length; j++) {
            if (data.dynamicProperties[i].id === self.dynamicProperties()[j].id()) {
              self.dynamicProperties()[j].value(data.dynamicProperties[i].value);
              propertyFound = true;
              break;
            }
          }
          
          // If property not found then metadata is stale
          // Save ID and value for now
          if (!propertyFound) {
            refreshMetadata = true;
            var dynPropItem = new DynamicProperty();
            dynPropItem.id(data.dynamicProperties[i].id);
            dynPropItem.value(data.dynamicProperties[i].value);
            self.dynamicProperties.push(dynPropItem);
          }
        }
        
        // Refresh the metadata if required
        if (refreshMetadata) {
          self.getDynamicPropertiesMetadata(false);
        }
      }
    };

    /**
     * This updates the values of dynamic properties for an item from the source
     * on to the target
     * @private
     * @function
     * @name CartViewModel#updateItemDynamicProperties
     * @param targetItem the corresponding client side cartItem to be updated
     * @param sourceItem the corresponding server side item with required data
     */
    CartViewModel.prototype.updateItemDynamicProperties = function(targetItem, sourceItem) {
      var self = this;
      if(sourceItem.dynamicProperties) {
      for(var i=0; i<sourceItem.dynamicProperties.length; i++){
        targetItem[sourceItem.dynamicProperties[i].id] = ko.observable(sourceItem.dynamicProperties[i].value);
       }
      }
    };

    /**
     * This adds dynamic properties to the pricing model
     * @private
     * @function
     * @name CartViewModel#populateDynamicProperties
     * @param {Object} pricingModel
     */
    CartViewModel.prototype.populateDynamicProperties = function(pricingModel) {
      var self = this;
      for ( var i = 0; i < self.dynamicProperties().length; i++) {
        var dynPropItem = self.dynamicProperties()[i];
        var dynPropId = dynPropItem.id();
        var dynPropValue = dynPropItem.value();
        pricingModel[dynPropId] = dynPropValue;
      }
    };
    
    /**
     * Gets metadata on custom order properties
     * @private
     * @function
     * @name CartViewModel#getDynamicPropertiesMetadata
     * @param {boolean} pUseCache Whether to use cached metadata
     */
    CartViewModel.prototype.getDynamicPropertiesMetadata = function(pUseCache) {
      var self = this;
      var refreshCache = true;
      
      // Fetch the meta-data from the cache
      if (pUseCache) {
        var cookieData = null;
        try {
          cookieData = self.getStorageItem("cartDynPropsMetadata");
          if (cookieData) {
            cookieData = JSON.parse(cookieData);
            self.processDynamicPropertiesMetadata(cookieData, false);
            refreshCache = false;
          }
        }
        catch(pError) {
        }
      }
      
      // Fetch the metadata from the server
      if (refreshCache) {
        var params = {};
        var contextObj = {};
        contextObj[ccConstants.ENDPOINT_KEY] = ccConstants.ENDPOINT_METADATA_GET_METADATA;
        contextObj[ccConstants.IDENTIFIER_KEY] = "dynamicProperties";
        var filterKey = self.storeConfiguration.getFilterToUse(contextObj);
        if (filterKey) {
          params[ccConstants.FILTER_KEY] = filterKey;
        }
        self.adapter.loadJSON('dynamicProperties', 'order', params,
            //success callback
            function(data) {
              // Process the dynamic property metadata
              if (data) {
                self.processDynamicPropertiesMetadata(data, true);
              }
            },
            //error callback
            function(data) {
            }
          );
      }
    };

    /**
     * Fetches item related metadata from the server
     * @private
     * @function
     * @name CartViewModel#getItemDynamicPropertiesMetadata
     * @param {String} pItemType the item type
     */
    CartViewModel.prototype.getItemDynamicPropertiesMetadata = function(pItemType) {
      var self = this;
      // Fetch the metadata from the server
      self.adapter.loadJSON(ccConstants.ENDPOINT_GET_ITEM_TYPE, pItemType , null,
          //success callback
          function(data) {
          // Process the item dynamic property metadata
          if (data) {
              self.processItemDynamicPropertiesMetadata(data, pItemType);
            }
          },
          //error callback
          function(data) {
          }
        );
    };
    /**
     * Processes the dynamic property metadata
     * @private
     * @function
     * @name CartViewModel#processDynamicPropertiesMetadata
     * @param {Object[]} data List of dynamic properties
     * @param {boolean} saveInCache Whether to save dynamic properties to the cache
     */
    CartViewModel.prototype.processDynamicPropertiesMetadata = function(data, saveInCache) {
      var self = this;
      var newProperties = [];
      for (var i = 0; i < data.length; i++) {
        var newProperty = true;
        // If property already defined, update its metadata
        for (var j = 0; j < self.dynamicProperties().length && newProperty; j++) {
          if (data[i].id === self.dynamicProperties()[j].id()) {
            newProperty = false;
            self.dynamicProperties()[j].initializeMetadata(data[i], false);
          }
        }
        
        // Set up new property
        if (newProperty) {
          var dynPropItem = new DynamicProperty();
          dynPropItem.initializeMetadata(data[i], true);
          newProperties.push(dynPropItem);
        }
      }

      // Add new properties
      for (var i = 0; i < newProperties.length; i++) {
        self.dynamicProperties.push(newProperties[i]);
      }

      // Save metadata to the cache
      if (saveInCache) {
        try {
          var dynPropsMetadata = new Array();
          for (var i = 0; i < self.dynamicProperties().length; i++) {
            dynPropsMetadata.push(self.dynamicProperties()[i].getMetadata());
          }
          var cookieData = JSON.stringify(dynPropsMetadata);
          self.setStorageItem("cartDynPropsMetadata", cookieData, 10800); // expires in 3 hours time
        }
        catch (pError) {
        }
      }
    };

    /**
     * Processes the item related metadata
     * @private
     * @function
     * @name CartViewModel#processItemDynamicPropertiesMetadata
     * @param {Object[]} data List of properties
     * @param {String} pItemType the item type to process(values can be: commerceItem/)
     */
    CartViewModel.prototype.processItemDynamicPropertiesMetadata = function(data, pItemType) {
      var self = this;
      var newProperties = [];
      if(pItemType == ccConstants.ENDPOINT_COMMERCE_ITEM_TYPE_PARAM) {
         //Process dynamic properties
        for (var i = 0; i < data.specifications.length; i++) {
          var newProperty = true;
          // If property already defined, update its metadata
          for (var j = 0; j < self.lineAttributes().length && newProperty; j++) {
            if (data.specifications[i].id === self.lineAttributes()[j].id()) {
              newProperty = false;
              self.lineAttributes()[j].initializeMetadata(data.specifications[i], false);
            }
          }
          // Set up new property
          if (newProperty) {
            var dynPropItem = new DynamicProperty();
            dynPropItem.initializeMetadata(data.specifications[i], true);
            newProperties.push(dynPropItem);
          }
        }

        // Add new properties
        for (var i = 0; i < newProperties.length; i++) {
          self.lineAttributes.push(newProperties[i]);
        }
      }
    };
    
    /**
     * Saves the given value to client-side storage using the given key and with the
     * given expiry period
     * @private
     * @function
     * @name CartViewModel#setStorageItem
     * @param {String} name Key associated with storage item that the value will be saved to
     * @param {Object} value The value to be saved
     * @param {number} [expires=3600] Expiry period for the storage item. Defaults to 1 hour
     */
    CartViewModel.prototype.setStorageItem = function(name, value, expires) {
      if (expires === undefined || expires === null) {
        expires = 3600; // default 1 hour
      }
      var date = new Date();
      var expiryTime = Math.round((date.setSeconds(date.getSeconds() + expires)) / 1000);

      storageApi.getInstance().setItem(name, value);
      storageApi.getInstance().setItem(name + '_time', expiryTime);
    };
    
    /**
     * Retrieves value from client-side storage for the given key
     * @private
     * @function
     * @name CartViewModel#getStorage
     * @param {String} name Key used to fetch the stored value
     * @returns {Object} The stored object
     */
    CartViewModel.prototype.getStorageItem = function(name) {
      var date = new Date();
      var currentTime = Math.round(date/1000);
      
      // Get value and expiry time
      var value = storageApi.getInstance().getItem(name);
      var storedTime = storageApi.getInstance().getItem(name + '_time');
      if (storedTime === undefined || storedTime === null) {
        storedTime = 0;
      }
      
      // Handle case when the item has expired
      if (storedTime < currentTime) {
        this.removeStorageItem(name);
        return null;
      }
      else {
        return value;
      }
    };
    
    /**
     * Removes the items with the given key from client-side storage
     * @private
     * @function
     * @name CartViewModel#removeStorage
     * @param {String} name Key associated with storage to be removed
     */
    CartViewModel.prototype.removeStorageItem = function(name) {
      storageApi.getInstance().removeItem(name);
      storageApi.getInstance().removeItem(name + '_time');
    };
    

    /**
     * Facilitates the implementers to set callback functions.
     * @function
     * @name CartViewModel#setCallbackFunctions
     * @param {Object} callbackObject object containing keys as different events 
     *     and values as functions to be executed on those events.
     */
    CartViewModel.prototype.setCallbackFunctions = function(callbackObject) {
      var self = this;

      if (callbackObject && Object.keys(callbackObject) 
          && Object.keys(callbackObject).length > 0) {
        for (var key in callbackObject) {
          self.callbacks[key] = callbackObject[key];
        }
      }
    };


    /**
     * <p>
     *    Creates the shipping groups array from the ShippingGroupRelationships instances on the cart. The shipping 
     *    groups array is a transient (not saved) object that is only used as a request parameter for web service 
     *    calls (createOrder, priceOder, etc.). Transient means that shipping groups must be generated for every 
     *    service call. This ensures that the most current cart data is also sent in the service request.
     *  </p>
     *
     * @private
     * @function
     * @name CartViewModel#createShippingGroups
     * @param {boolean} createShippingGroupsForSingleShipping An optional boolean flag which indicates if Shipping Groups 
     * to be created in case of non-split shipping scenarios
     * @param {Object[]} The shiping groups array generated from the shipping group relationships on the cart.
     */
    CartViewModel.prototype.createShippingGroups = function (createShippingGroupsForSingleShipping) {
      var self = this;
      var shippingGroups;
      var emailAddress = null;

      if(this.user().emailAddress()) {
        emailAddress = this.user().emailAddress();
      } if(!this.user().loggedIn() && this.emailAddressForGuestUser) {
        emailAddress = this.emailAddressForGuestUser;
      }

      // In non-split shipping scenarios there could be cases where the quantity in shipping group relationship is not
      // consistent with the item quantity, and hence need to set the quantity appropriately. This does not arise in split shipping
      // as on the sample widget itself if the quantity is not matching then error is being throw, asking user to adjust the quantities 
      if (createShippingGroupsForSingleShipping) {
        for (var i=0; i<this.items().length; i++) {
          if(this.items()[i].shippingGroupRelationships()[0].quantity() != this.items()[i].quantity()) {
            this.items()[i].shippingGroupRelationships()[0].quantity(this.items()[i].quantity());
          }
        }
      }

      var index = 0;
      // Reusing this method even in case of non split-shipping scenarios based on createShippingGroupsForSingleShipping flag
      if (this.isSplitShipping() || createShippingGroupsForSingleShipping) {
        // Create a shipping groups map (as opposed to array) from the cart.
        //
        // FYI - Building shipping groups as an (intermediate) map avoids duplicate entries.

        // This method will iterate over all the cart.items() [] and within a cart-item iterate over
        // the shippingGroupRelationships []. Based on the shippingGroupRelationship generateKey (
        // which is based on ShippingAddress and shipping method) different shipping group relationships 
        // will be mapped to a Shipping Group.
        //
        var shippingGroupsMap = this.items().reduce(function (targetMap, cartItem) {
            if (cartItem.shippingGroupRelationships()) {
              for (var x = 0; x < cartItem.shippingGroupRelationships().length; x++) {
                cartItem.shippingGroupRelationships()[x].commerceItemId = cartItem.commerceItemId;
                // In case of split-shipping, address will be present in the Shipping Group Relationship
                // Since for non split shipping cases, address will not be present at shipping group 
                // relationship level, issues will come when using the asMap method etc. Hence setting the
                // shipping address
                if(!self.isSplitShipping()) {
                  cartItem.shippingGroupRelationships()[x].shippingAddress(self.shippingAddress());
                }
                // Shipping group relationships[] will be associated with the cart-item, and each shipping
                // group relationship object currently has productId, catRefId of the corresponding cart item
                // Enhancing this to add childItems corresponding to the cart-item as we need to support passing
                // add-ons (childItems) as well to the API.
                if(cartItem.childItems && cartItem.childItems.length > 0) {
                  cartItem.shippingGroupRelationships()[x].childItems = cartItem.childItems;
                }
              }
            }
          // Convert each shipping goup relationship into a map and merge together to create a single shipping groups map.
          cartItem.shippingGroupRelationships().forEach(function (shippingGroupRelationship) {
            var sourceMap = shippingGroupRelationship.asMap(emailAddress);
            var shippingGroupKey = Object.keys(sourceMap)[0];
            var targetShippingGroup = targetMap[shippingGroupKey];
            var sourceShippingGroup = sourceMap[shippingGroupKey];
            if (shippingGroupRelationship.commerceItemId) {
              var shippingGroupItemKey = shippingGroupRelationship.catRefId + "_" + shippingGroupRelationship.commerceItemId;
            } else {
              var shippingGroupItemKey = shippingGroupRelationship.catRefId;
            }
            var targetShippingGroupItem = targetShippingGroup ? targetShippingGroup.items[shippingGroupItemKey] : undefined;
            var sourceShippingGroupItem = sourceShippingGroup.items[shippingGroupItemKey];

            // Currently there is no way we can identify from the Shipping Group object, the associated
            // shipping group relationships. Since with the updated ShippingMethods API, the available 
            // Shipping Options are fetched for each Shipping Group, and since the Shipping Options will
            // be maintained at shipping group relationship level (in split shipping), there should be 
            // mapping for Shipping-group-relation object and the dynamic Shipping Group object.
            // If a index is passed at a Shipping Group level in the request, the same will be echoed back
            // in the response of the Shipping Methods API

            // Here we are checking if a shipping group is already available for the key (generateKey() )
            // corresponding to the current shipping-group-relationship, and assigning a index (for mapping 
            // purpose only) corresponding to the existing Shipping Group
            if (targetShippingGroup) {
              shippingGroupRelationship.shippingGroupId = targetShippingGroup.shippingGroupId;
            } else {
              // If there is no existing Shipping Group already created based on the key, and a new one will 
              // be created (in this iteration), then we are incrementing the mapping index to be used by the
              // new Shipping Group

              sourceShippingGroup.shippingGroupId = index.toString();
              shippingGroupRelationship.shippingGroupId = index.toString();
              index++;
            }

            // The source shipping group item already exists in the target shipping group.
            if (targetShippingGroupItem) {
              // Update the target quantity.
              targetShippingGroupItem.quantity += sourceShippingGroupItem.quantity;
            }
            else {
              // Merge source map into target  map.
              $.extend(true, targetMap, sourceMap);
            }
          });

          return targetMap;
        }, {});

        // Convert the shipping groups map to the shipping group array.
        shippingGroups = Object.keys(shippingGroupsMap)
          .map(function (key) {
            return shippingGroupsMap[key];
          })
          .filter(function (shippingGroup) {
            // Convert the items map to the items array.
            shippingGroup.items = Object.keys(shippingGroup.items)
              .map(function (key) {
                return shippingGroup.items[key];
              })
              .filter(function (shippingGroupItem) {
                // Only items with quantities are relevant.
                if (shippingGroupItem.quantity > 0) {
                  return shippingGroupItem;
                }
              });

            // Only shipping groups with items are relevant.
            if (shippingGroup.items.length) {
              return shippingGroup;
            }
          });
        }

      return shippingGroups;
    };


    /**
     * API for splitting/cloning existing cart items provided with different custom property values
     * and a list of split quantities. It removes existing cart item and adds new cart items with
     * different custom properties after which pricing is triggered in a single call.
     *
     * @function
     * @name CartViewModel#splitItems
     * @param {CartItem} cartItem The cart item to be split
     * @param {array<Integer>} quantities The integer array  specifying split quantities
     * @param {observableArray<Object>} customProps The object array specifying custom property key value pairs for each split
     */
    CartViewModel.prototype.splitItems = function(cartItem, quantities, customProps) {
        var self = this;
        var giftItemMarked = false;
        //On splitting item, the combine setting should always be set to no
        self.combineLineItems = ccConstants.COMBINE_NO;
        //To not trigger pricing if the last cart event is split on removing cart item
        self.events.push(new CartEvent(CART_EVENT_SPLIT, 11, cartItem));
        self.removeItem(cartItem);
        for(var i=0; i< quantities.length; i++) {
            var cartItemData = {
              productId: cartItem.productId,
              productData: cartItem.productData(),
              quantity: quantities[i],
              catRefId: cartItem.catRefId, 
              selectedOptions: cartItem.selectedOptions,
              currency: self.currency,
              externalData: cartItem.externalData(),
              actionCode: cartItem.actionCode(),
              lineAttributes: self.lineAttributes,
              externalRecurringCharge: cartItem.externalRecurringCharge(),
              externalRecurringChargeFrequency: cartItem.externalRecurringChargeFrequency(),
              externalRecurringChargeDuration: cartItem.externalRecurringChargeDuration(),
              assetId: cartItem.assetId(),
              serviceId: cartItem.serviceId(),
              customerAccountId: cartItem.customerAccountId(),
              billingAccountId: cartItem.billingAccountId(),
              serviceAccountId: cartItem.serviceAccountId(),
              activationDate: cartItem.activationDate(),
              deactivationDate: cartItem.deactivationDate(),
              childItems: cartItem.childItems,
              addOnItem: cartItem.addOnItem,
              shopperInput: cartItem.shopperInput
            };

            var splitItem = new CartItem(cartItemData);

            //Populate custom properties onto the cart item
            splitItem.populateItemDynamicProperties(customProps[i]);
            splitItem.isPersonalized(true);
            //If the cart item is a free gift, only marking the first splitItem to be eligible for discount.
            if(!giftItemMarked && checkForGiftItem(cartItem.discountInfo())){
                 //Copying the correponding gift markers.
                 splitItem.giftWithPurchaseCommerceItemMarkers = cartItem.giftWithPurchaseCommerceItemMarkers;
                 giftItemMarked = true;
            }
            self.items.push(splitItem);
        }
        self.getCartAvailability();
        //Marking dirty to proceed with pricing post splitting items.
        self.markDirty();
     };

    /**
     * Adds an item to the cart given the data in a proper format.
     * This can add a normal item as well as a customizable item to the cart.
     *
     * @function
     * @name CartViewModel#addItemToCart
     * @param {Object} item the set of data that corresponds to the item that
     *        will be added to the cart.
     * @param {function} success the success callback. This will be of the form
     *        success(item)
     * @param {function} error the error callback. This will be of the form
     *        failure(item, errorInfo). The errorInfo is an array of object
     *        with the following keys:
     *        1. errorCode: The SF specific error codes.
     *                      2001 - Error getting the SKU.
     *                      2002 - Error getting inventory.
     *                      2003 - Item/sub-item out of stock.
     *                      2004 - Error while pricing the item.
     *        2. catRefId: The catRefId of the item if available.
     *        3. errorMessage: The error message either SF specific or server-side.
     */
    CartViewModel.prototype.addItemToCart = function(item, success, error) {
      var self = this;

      // Error block generation function
      function createErrorBlock(errorCode, catRefId, errorMessage) {
        var errorBlock = [
          {
            "errorCode": errorCode,
            "catRefId": catRefId,
            "errorMessage": errorMessage
          }
        ];
        return errorBlock;
      }
      // Error block sender function
      function sendError(item, errors) {
        var errorBlock = [];
        for (var i = 0; i < errors.length; i++) {
          var err = {
            "errorCode": errors[i].errorCode,
            "catRefId": errors[i].catRefId,
            "errorMessage": errors[i].errorMessage
          };
          errorBlock.push(err);
        }
        if (typeof error === "function") {
          error(item, errorBlock);
        }
      }

      // Check if the currency is same as the current site's pricelist group.
      // TODO

      // Get the list of sku ids for the item and child items.
      var skuIds = [];
      // Add the main sku id.
      skuIds.push(item.catalogRefId);
      if (self.isConfigurableItem(item) && item.childItems && item.childItems.length > 0) {
        self.addSkuIdFromConfigurableProduct(skuIds, item);
      }
      // Make REST calls to get details of all the products in the cart.
      var id = new Array(self.catalogId(), skuIds, false, SiteViewModel.getInstance().selectedPriceListGroup().id);
      // Call the listProducts endpoint to get the product details for the item.
      // and the sub-items
      var params = {};
      var contextObj = {};
      contextObj[ccConstants.ENDPOINT_KEY] = ccConstants.ENDPOINT_PRODUCTS_LIST_SKUS;
      contextObj[ccConstants.IDENTIFIER_KEY] = "skuListing";
      var filterKey = self.storeConfiguration.getFilterToUse(contextObj);
      if (filterKey) {
        params[ccConstants.FILTER_KEY] = filterKey;
      }
      self.adapter.loadJSON('sku', id, params,
        function(data) {
          var product;
          var childItems = [];
          var inactiveProducts = [];
          var productActive = true;
          // Bug fix for agent. in case of agent data.items is undefined. data itself has the sku data.
          var skusData = data.items ? data.items : data;

          for (var i = 0; i < skusData.length; i++) {
            if (skusData[i].parentProducts[0] && !skusData[i].parentProducts[0].active) {
              inactiveProducts.push(skusData[i].repositoryId);
              productActive = false;
            }
          }

          if (productActive) {
            // Check for the main item.
            for (var i = 0; i < skusData.length; i++) {
              var skuData = $.extend(true, {}, skusData[i]);
              if (skuData.repositoryId == item.catalogRefId) {
                // Set the product data to the parent product of the sku.
                product = skuData.parentProducts[0];
                // Get the child SKU.
                var childSku = skuData;
                // Remove the parent product.
                delete childSku[ccConstants.PARENT_PRODUCTS];
                // Set it to the product.
                product.childSKUs = [childSku];
                // Set the selected options.
                if (skuData.productVariantOptions && skuData.productVariantOptions.length > 0) {
                  product.selectedOptions = skuData.productVariantOptions[0];
                }
                /* This needs to be discussed. From INT ViewModel cannot get the selected add-on
                 * product data, hence this code might not be useful
                if (item.selectedAddOnProducts && item.selectedAddOnProducts.length > 0) {
                  product.selectedAddOnProducts = item.selectedAddOnProducts;
                }*/
                // Add some proper data.
                product.orderQuantity = parseInt(item.quantity);
                product.itemTotal = item.amount;
                product.price = item.externalPrice;
                product.catalogRefId = item.catalogRefId;
                if (self.isConfigurableItem(item) && 
                    (item.configuratorId != undefined && 
                        item.configuratorId != null && 
                        item.configuratorId != '')) {
                  product.configuratorId = item.configuratorId;
                }
                product.externalData = item.externalData;
                product.actionCode = item.actionCode;
                product.externalRecurringCharge = item.externalRecurringCharge;
                product.externalRecurringChargeFrequency = item.externalRecurringChargeFrequency;
                product.externalRecurringChargeDuration = item.externalRecurringChargeDuration;
                product.assetId = item.assetId;
                product.serviceId = item.serviceId;
                product.customerAccountId = item.customerAccountId;
                product.billingAccountId = item.billingAccountId;
                product.serviceAccountId = item.serviceAccountId;
                product.activationDate = item.activationDate;
                product.deactivationDate = item.deactivationDate;
                break;
              }
            }
            //create the tree structure for n level child items
            if (self.isConfigurableItem(item)) {
              product.childItems = self.createChildItemTree(skusData, item);
            }
            // At this stage perform a stock check for all the SKUs and sub-SKUs to make sure
            // they are available.
            var availabilityModel = new ConfigurableProductAvailabilityModel(product, self.catalogId());
            var contextObj = {};
            contextObj[ccConstants.ENDPOINT_KEY] = ccConstants.ENDPOINT_PRODUCTS_AVAILABILITY;
            contextObj[ccConstants.IDENTIFIER_KEY] = "stockStatsForItem";
            var filterKey = self.storeConfiguration.getFilterToUse(contextObj);
            if (filterKey) {
              availabilityModel[ccConstants.FILTER_KEY] = filterKey;
            }
            self.adapter.loadJSON('getStockStatuses', '0', availabilityModel,
              function(data) {
                // List of out of stock products
                var outOfStockProducts = [];
                // Check if all the products are in stock
                var productsInStock = true;
                for (var i = 0; i < data.length; i++) {
                  // Set the flag to false when one of the items is out of stock
                  if (!(data[i].stockStatus == 'IN_STOCK' || data[i].stockStatus == 'PREORDERABLE' || data[i].stockStatus == 'BACKORDERABLE')) {
                    outOfStockProducts.push(data[i].catRefId);
                    productsInStock = false;
                  }
                }
                // All good. Go ahead.
                if (productsInStock) {
                  // If product to add is in the cart then simply increase the quantity.
                  var cookieData = self.getCookieDataAndCompare();
                  // Check if an item with the same configurator id exists. If so, call the reconfigure event.
                  var cartItem = self.getCartItemForReconfiguration(product.id, product.childSKUs[0].repositoryId, product.configuratorId);
                  if (cartItem !== null) {
                    // Pushing a cart event if it is reconfiguration
                    self.events.push(new CartEvent(CART_EVENT_RECONFIGURE, 1, product));
                  } else {
                    // Else push the add event
                    self.events.push(new CartEvent(CART_EVENT_ADD, 1, product));
                  }
                  if (cookieData && !self.isMatchingCookieData()) {
                    self.getLocalData(cookieData);
                    if (cookieData.items.length == 0) {
                      self.addItem(product);
                    }
                  } else {
                    self.addItem(product);
                  }
                  // Set the success and failure callbacks for the pricing calls now.
                  // Register the success callback of this method to the pricing success.
                  // Need to empty out success callback when the error callback is given
                  // so as to not wait for the success in the next round of pricing.
                  var cb = {
                    "pricingsuccess": function(data) {
                      // Perform the success callbacks and then unset.
                      if (cb && (typeof success === "function")) {
                        success(product);
                        cb = null;
                      }
                    },
                    "pricingfailure": function(data) {
                      // Perform the failure callback and then unset.
                      if (cb) {
                        sendError(item, createErrorBlock(ccConstants.PRODUCT_ADD_TO_CART_PRICING_ERROR, '', data.message));
                        cb = null;
                      }
                    }
                  };
                  self.setCallbackFunctions(cb);
                } else {
                  // Add the error block as product is out of stock.
                  var errors = [];
                  for (var i = 0; i < outOfStockProducts.length; i++) {
                    var options = {
                      "sku": outOfStockProducts[i]
                    };
                    var error = {
                      "errorCode": ccConstants.PRODUCT_ADD_TO_CART_OUT_OF_STOCK,
                      "catRefId": outOfStockProducts[i],
                      "errorMessage": CCi18n.t('ns.common:resources.skuOutOfStockError', options)
                    };
                    errors.push(error);
                  }

                  sendError(product, errors);
                }
              },
              function(data) {
                // Throw the failure callback.
               sendError(item, createErrorBlock(ccConstants.PRODUCT_ADD_TO_CART_INVENTORY_ERROR, '', data.message));
              }
            );
          } else {
            // Add the error block as product is inactive.
            var errors = [];
            for (var i = 0; i < inactiveProducts.length; i++) {
              var options = {
                "sku": inactiveProducts[i]
              };
              var error = {
                "errorCode": ccConstants.CREATE_ORDER_SKU_NOT_FOUND,
                "catRefId": inactiveProducts[i],
                "errorMessage": CCi18n.t('ns.common:resources.skuNotFoundError', options)
              };
              errors.push(error);
            }
          sendError(item, errors);
          }
        },
        function(data) {
          // Throw the failure callback
          sendError(item, createErrorBlock(ccConstants.PRODUCT_ADD_TO_CART_GET_SKU_ERROR, '', data.message));
        }
      );
    };


    //a utility method to validate and add multiple items to cart at once.
    
    //Method to validate active flag , not for individual sale state, configurable product and stock status
    CartViewModel.prototype.addItemsToCart = function(items, success, error,addToCartFromQuickOrder) {
      var self = this;

      // Check if the currency is same as the current site's pricelist group.
      // TODO

      // Get the list of sku ids for the item and child items.
      var skuIds = [];
      var numOfItems = items.length;
      var item;
      for(var i=0; i< numOfItems; i++){
        item = items[i];
        // Add the main sku id.
        if(item.catalogRefId){
          skuIds.push(item.catalogRefId);
        }
        else if(item.catRefId){
          skuIds.push(item.catRefId);
        }
        if (item.childItems) {
          for (var j = 0; j < item.childItems.length; j++) {
            // Add the child item sku ids.
            if(item.childItems[j].catalogRefId){
              skuIds.push(item.childItems[j].catalogRefId);
            }
            else if(item.childItems[j].catRefId){
              skuIds.push(item.childItems[j].catRefId);
            }
          }
        }
      }

      var errors = [];
      // Error block generation function
      function createErrorBlock(errorCode, catRefId, errorMessage) {
        var errorBlock = [
          {
            "errorCode": errorCode,
            "catRefId": catRefId,
            "errorMessage": errorMessage
          }
        ];
        return errorBlock;
      }

      // Error block sender function
      function sendError(errors) {
        var errorBlock = [];
        for (var i = 0; i < errors.length; i++) {
          var err = {
            "errorCode": errors[i].errorCode,
            "catRefId": errors[i].catRefId,
            "errorMessage": errors[i].errorMessage
          };
          errorBlock.push(err);
        }
        if (typeof error === "function") {
          error(errorBlock);
        }
      }

      if(skuIds.length > 0){
        var id = new Array(self.catalogId(), skuIds, true, SiteViewModel.getInstance().selectedPriceListGroup().id);
        // Call the listProducts endpoint to get the product details for the item.
        // and the sub-items
        var params = {};
        var contextObj = {};
        contextObj[ccConstants.ENDPOINT_KEY] = ccConstants.ENDPOINT_PRODUCTS_LIST_SKUS;
        contextObj[ccConstants.IDENTIFIER_KEY] = "skuListing";
        var filterKey = self.storeConfiguration.getFilterToUse(contextObj);
        if (filterKey) {
          params[ccConstants.FILTER_KEY] = filterKey;
        }
        self.adapter.loadJSON('sku', id, params,
          function(data) {
            var products = [];
            var product;
            var childItems = [];
            var inactiveProducts = [];
            var configurableProducts = [];
            var productActive = true;
            var hasConfigurableProduct = false;
            var notForIndividualSale = false;
            var skusData = data.items || data;
            if(data.deletedSkus && data.deletedSkus.length > 0){
              var displayName = [];
              for(var k = 0; k < data.deletedSkus.length; k++){
        	    for(var t=0; t<items.length; t++){
        	      if((items[t].catalogRefId == data.deletedSkus[k]) || (items[t].catRefId == data.deletedSkus[k])){
        	        inactiveProducts.push({
                    displayName: items[t].displayName ||  data.deletedSkus[k]
                    });
        	      }
        	    }
              }
            }
            if(skusData.length == 0){
              sendError(createErrorBlock(ccConstants.NONE_OF_THE_ITEMS_ADDED, '', CCi18n.t('ns.common:resources.noneOfTheItemsCanBeAdded')));
            }
            for (var i = 0; i < skusData.length; i++) {
              if (skusData[i].parentProducts[0] && !skusData[i].parentProducts[0].active) {
                inactiveProducts.push({
                  displayName: skusData[i].parentProducts[0].displayName,
                  SKUId: skusData[i].repositoryId
                } );
                productActive = false;
              } else if (skusData[i] && skusData[i].parentProducts[0] && skusData[i].parentProducts[0].notForIndividualSale) {
          	    inactiveProducts.push({
                  displayName: skusData[i].parentProducts[0].displayName
                } );
                notForIndividualSale = true;
              }

              if (skusData[i] && skusData[i].configurable) {
              	configurableProducts.push(skusData[i]);
              	hasConfigurableProduct = true;
              }
            }

            var item;
            var numOfItems = items.length;
            // Check for the main item.
            for (var i = 0; i < skusData.length; i++) {
              for(var j = 0; j < numOfItems; j++){
                item = items[j];
                // Get the sku data and the selected options
                var skuData = skusData[i];
                // Check if the repository id of the data is same as the
                // catalogRefId of the item.
                var catRefId = item.catalogRefId;
                if(!catRefId){
               	  catRefId = item.catRefId;
                }
                if(!skuData.listPrice && addToCartFromQuickOrder){
                  inactiveProducts.push({
                    displayName: skuData.parentProducts[0].displayName
                  } );
                  break;
                }
                if ((skuData.repositoryId == catRefId)  && (skuData.listPrice || !addToCartFromQuickOrder)) {
                  // Set the product data to the parent product of the sku.
                  product = skuData.parentProducts[0];
                  if(product.active &&  !product.notForIndividualSale){

                    // Get the child SKU.
                    var childSku = skuData;
                    // Remove the parent product.
                    delete childSku[ccConstants.PARENT_PRODUCTS];
                    // Set it to the product.
                    product.childSKUs = [childSku];
                    // Set the selected options.
                    if (skuData.productVariantOptions && skuData.productVariantOptions.length > 0) {
                      product.selectedOptions = skuData.productVariantOptions[0];
                    }
                    // Add some proper data.
                    product.orderQuantity = parseInt(item.orderQuantity);
                    if(!product.orderQuantity){
                      if(!(item.quantityDesired == undefined)) {
                       product.orderQuantity = parseInt(item.quantityDesired());
                      }
                      else {
                        product.orderQuantity = parseInt(item.quantity);
                      }
                    }
                    product.itemTotal = item.amount;
                    product.catalogRefId = item.catalogRefId;
                    if(!product.catalogRefId){
                      product.catalogRefId = item.catRefId;
                    }
                    if (item.configurationId) {
                      product.configuratorId = item.configurationId;
                    }
                    // If there are sub-items on the product add child items
                    if (item.childItems) {
                      product.childItems = item.childItems;
                    }
                  products.push(product);
                }
              }
            }
          }

          if(products.length == 0){
            sendError(createErrorBlock(ccConstants.NONE_OF_THE_ITEMS_ADDED, '', CCi18n.t('ns.common:resources.noneOfTheItemsCanBeAdded')));
            return;
          }
          // At this stage perform a stock check for all the SKUs and sub-SKUs to make sure
          // they are available.
          var availabilityModel = new ConfigurableProductsAvailabilityModel(products, self.catalogId());
          var contextObj = {};
          contextObj[ccConstants.ENDPOINT_KEY] = ccConstants.ENDPOINT_PRODUCTS_AVAILABILITY;
          contextObj[ccConstants.IDENTIFIER_KEY] = "stockStatsForItem";
          var filterKey = self.storeConfiguration.getFilterToUse(contextObj);
          if (filterKey) {
            availabilityModel[ccConstants.FILTER_KEY] = filterKey;
          }
          //rest call to retrieve stock status
          self.adapter.loadJSON('getStockStatuses', '0', availabilityModel,
            function(data) {
              // List of out of stock products
              var outOfStockProducts = [];
              // Check if all the products are in stock
              var productsInStock = true;
              for (var i = 0; i < data.length; i++) {
                // Set the flag to false when one of the items is out of stock
                if (!(data[i].stockStatus == 'IN_STOCK' || data[i].stockStatus == 'PREORDERABLE' || data[i].stockStatus == 'BACKORDERABLE')) {
                  outOfStockProducts.push(data[i]);
                  productsInStock = false;
                }
              }
              for(var i=0;i<products.length;i++){
                for(var j=0;j<outOfStockProducts.length;j++){
                  if(products[i].catalogRefId == outOfStockProducts[j].catRefId){
                    outOfStockProducts[j].displayName = products[i].displayName;
                    products.splice(i,1);
                    i--;
                    break;
                  }
                  if (products[i].childItems && products[i].childItems.length > 0) {
                    for(var l=(products[i].childItems.length - 1); l>=0; l--) {
                      if(products[i].childItems[l].catRefId == outOfStockProducts[j].catRefId) {
                        outOfStockProducts[j].displayName = products[i].childItems[j].displayName;
                        products[i].childItems.splice(l, 1);
                      }
                    }
                    if(products[i].childItems && products[i].childItems.length == 0) {
                      products.splice(i, 1);
                      i--;
                      break;
                    }
                  }
                }
              }
              if(products.length == 0){
                sendError(createErrorBlock(ccConstants.NONE_OF_THE_ITEMS_ADDED, '', CCi18n.t('ns.common:resources.noneOfTheItemsCanBeAdded')));
                return;
              }
              // All good. Go ahead.
              // If product to add is in the cart then simply increase the quantity.
              var cookieData = self.getCookieDataAndCompare();
              self.events.push(new CartEvent(CART_EVENT_ADD_MULTIPLE_ITEMS, 1, products));
              if (cookieData && !self.isMatchingCookieData()) {
                self.getLocalData(cookieData);
                if (cookieData.items.length == 0) {
                  self.addItems(products);
                }
              }
              else {
                self.addItems(products);
              }
              // Set the success and failure callbacks for the pricing calls now.
              // Register the success callback of this method to the pricing success.
              // Need to empty out success callback when the error callback is given
              // so as to not wait for the success in the next round of pricing.
              var cb = {
                "pricingsuccess": function(data) {
                  // Perform the success callbacks and then unset.
                 if (cb && (typeof success === "function")) {
                    success(products);
                    cb = null;
                  }
                },
                "pricingfailure": function(data) {
                 // Perform the failure callback and then unset.
                   if (cb) {
                     sendError(createErrorBlock(ccConstants.PRODUCT_ADD_TO_CART_PRICING_ERROR, '', data.message));
                     cb = null;
                   }
                 }
              };
              self.setCallbackFunctions(cb);
              if (!productsInStock) {
                // Add the error block as product is out of stock.
                var displayName = outOfStockProducts[0].displayName;
                var skuIdsOutOfStock= outOfStockProducts[0].catRefId;
                for (var i = 1; i < outOfStockProducts.length; i++) {
                  displayName = displayName + " ," + outOfStockProducts[i].displayName;
                  skuIdsOutOfStock= skuIdsOutOfStock+"," + outOfStockProducts[i].catRefId;
                }  
                var options = {
                  "displayName": displayName
                };
                var error = {
                  "errorCode": ccConstants.PRODUCT_ADD_TO_CART_OUT_OF_STOCK,
                  "catRefId": skuIdsOutOfStock,
                  "errorMessage": CCi18n.t('ns.common:resources.outOfStockError', options)
                };
                errors.push(error);

                sendError(errors);
              }
            },
            function(data) {
              // Throw the failure callback.
              sendError(createErrorBlock(ccConstants.PRODUCT_ADD_TO_CART_INVENTORY_ERROR, '', data.message));
            }
          );
          // Add the error block as product is inactive.
          if(inactiveProducts && (inactiveProducts.length > 0)){
            var options = {};
            displayName = inactiveProducts[0].displayName;
            var skuIdsInactive = inactiveProducts[0].SKUId;
            for(var i = 1; i<inactiveProducts.length; i++){
              displayName = displayName + inactiveProducts[i].displayName;
              skuIdsInactive = skuIdsInactive + ',' +  inactiveProducts[i].SKUId;
            }
            var options = {
                "displayName": displayName
              };
            var error = {
              "errorCode": ccConstants.CREATE_ORDER_SKU_NOT_FOUND,
              "catRefId": skuIdsInactive,
              "errorMessage": CCi18n.t('ns.common:resources.productNotFoundError', options)
            };
            errors.push(error);
          }

          //throw error for configurable products
          if(hasConfigurableProduct && configurableProducts[0].parentProducts && configurableProducts[0].parentProducts[0]) {
            var skuIdsConfigurable = configurableProducts[0].repositoryId;
            displayName = configurableProducts[0].parentProducts[0].displayName;
            for (var i = 1; i < configurableProducts.length; i++) {
              displayName = displayName + "," + configurableProducts[i].parentProducts[0].displayName;
              skuIdsConfigurable = configurableProducts[i].repositoryId;
            }
            var options = {
              "displayName": displayName
            };
            var error = {
              "errorCode": ccConstants.CONFIGURABLE_PRODUCTS_NOT_ALLOWED_FAILURE_CODE,
              "catRefId": skuIdsConfigurable,
              "errorMessage": CCi18n.t('ns.common:resources.configurableProductError', options)
            };
            errors.push(error);
          }

          if(errors.length > 0){
            sendError(errors);
          }
        },
        function(data) {
          // Throw the failure callback
          sendError(createErrorBlock(ccConstants.PRODUCT_ADD_TO_CART_GET_SKU_ERROR, '', data.message));
        }
      );
    }
    else{
      sendError(createErrorBlock(ccConstants.NONE_OF_THE_ITEMS_ADDED, '', CCi18n.t('ns.common:resources.noneOfTheItemsCanBeAdded')));
    }
   };

    
    CartViewModel.prototype.requestQuote = function(note, orderId, success, error) {
      var self = this;
      var input = {};
      // At this point we dont really need anything else other than the order id
      // and the note as they should already be persistent on the logged in user's
      // incomplete cart
      if (note) input.note = note;
      if (orderId) input.orderId = orderId;
      self.adapter.persistCreate('requestQuote', '0', self.addDynamicProperties(input), null, success, error);
    };
    
    CartViewModel.prototype.rejectQuote = function(note, orderId, success, error) {
      var self = this;
      var input = {};
      if (note) input.note = note;
      if (orderId) input.orderId = orderId;
      self.adapter.persistCreate('rejectQuote', '0', input, null, success, error);
    };
    
    /**
     * This adds dynamic properties to the order
     * @private
     * @function
     * @name OrderViewModel#addDynamicProperties
     * @param {Object} orderModel
     * @returns {Object} The updated order model
     */
    CartViewModel.prototype.addDynamicProperties = function(order) {
      var self = this;
      for ( var i = 0; i < self.dynamicProperties().length; i++) {
        var dynPropItem = self.dynamicProperties()[i];
        var dynPropId = dynPropItem.id();
        var dynPropValue = null;
        if (dynPropItem.value != null) {
          dynPropValue = dynPropItem.value();
        }
        order[dynPropId] = dynPropValue;
      }
      return order;
    };

    /**
     * Helper Model for sending cart info in correct format for pricing.
     *
     * @private
     * @class Represents cart pricing data.
     * @name CartPricingModel
     * @property {CartViewModel} cart The Cart object that needs pricing.
     */
    function CartPricingModel(cart) {
      this.shoppingCart = new Object();
      this.shoppingCart.items = cart.items();
      this.shoppingCart.coupons = cart.coupons();
      if (!cart.mergeCart() && cart.currentOrderId()) {
        this.id = cart.currentOrderId();
      }

      if (cart.giftWithPurchaseOrderMarkers && cart.giftWithPurchaseOrderMarkers.length) {
        this.giftWithPurchaseOrderMarkers = cart.giftWithPurchaseOrderMarkers;
      }
      this.combineLineItems = cart.combineLineItems;
      this.payments = [];
	    cart.populateDynamicProperties(this);
    }

    /**
     * Helper Model for tracking.
     *
     * @private
     * @class Represents a cart event.
     * @name CartEvent
     * @property {string} type, ADD, UPDATE, DELETE
     * @property {number} quantity, the quantity associated with the cart event
     * @property {Object} product, the product data associated with the cart event
     */
    function CartEvent(type, quantity, data) {
      this.type = type;
      this.quantity = quantity;
      if(type == CART_EVENT_COUPON_ADD || type == CART_EVENT_COUPON_DELETE) {
        this.coupon = data;
      } else if(type === CART_EVENT_COUPONS_ADD){
        this.coupons = data;
      } else if(type === CART_EVENT_ADD_MULTIPLE_ITEMS){
        this.products = data;
      } else {
        this.product = data;
      }
    }
    
    /**
     * Helper Model for sending product and sub-product info in correct format for addItemToCart
     *
     * @private
     * @class Represents product availability information.
     * @name CartAvailabilityModel
     * @property {CartViewModel} cart
     */
    function ConfigurableProductAvailabilityModel(product, catalogId) {
      this.operation= "availability";
      this.products = new Array();
      this.catalogId = catalogId;
      // Add the main item.
      this.products.push(product.id + ":" + product.catalogRefId);
      // Add the sub items
      this.getProductSkuFromChild = function (product) {
        for (var i = 0; i < product.childItems.length; i++) {
          var prodSkuCombo = product.childItems[i].id;
          var skuId = product.childItems[i].catalogRefId;
          if(skuId)
            prodSkuCombo = prodSkuCombo + ":" + skuId;
          this.products.push(prodSkuCombo);
          if (product.childItems[i].childItems && product.childItems[i].childItems.length > 0) {
            this.getProductSkuFromChild(product.childItems[i]);
          }
        }
      };
      if (product.configuratorId && product.childItems && product.childItems.length > 0) {
        this.getProductSkuFromChild(product);
      }
      // Add the add-on items
      this.getProductSkuFromAddons = function (product) {
        for (var i = 0; i<product.selectedAddOnProducts.length; i++) {
          for(var j=0; j<product.selectedAddOnProducts[i].addOnOptions.length; j++) {
            var currentAddon = product.selectedAddOnProducts[i].addOnOptions[j];
            var prodSkuCombo = currentAddon.product.repositoryId + ":" + currentAddon.sku.repositoryId;
            this.products.push(prodSkuCombo);
            if(currentAddon.product.selectedAddOnProducts && currentAddon.product.selectedAddOnProducts.length > 0) {
              this.getProductSkuFromAddons(currentAddon.product);
            }
          }
        }
      };
      if (product.selectedAddOnProducts && product.selectedAddOnProducts.length > 0) {
        this.getProductSkuFromAddons(product);
      }
      $.unique(this.products);
      this.products = this.products.join(",");
    }

    /**
     * Helper Model for sending product and sub-product info of multiple products in correct format for addItemToCart
     *
     * @private
     * @class Represents product availability information.
     * @name CartAvailabilityModel
     * @property {CartViewModel} cart
     */
    function ConfigurableProductsAvailabilityModel(products, catalogId) {
      this.operation= "availability";
      this.products = new Array();
      this.catalogId = catalogId;
      var product;
      for(var i = 0; i < products.length; i++){
        product = products[i];
        // Add the main item.
        this.products.push(product.id + ":" + product.catalogRefId);
        // Add the sub items
        if (product.childItems) {
          for (var j = 0; j < product.childItems.length; j++) {
            var prodSkuCombo = product.childItems[j].productId;
            var skuId = product.childItems[j].catRefId;
            if(skuId)
              prodSkuCombo = prodSkuCombo + ":" + skuId;
            this.products.push(prodSkuCombo);
          }
        }
      }
      this.products = this.products.join(",");
    }

    /**
     * Returns the singleton instance of CartViewModel. Create it if it doesn't exist.
     *
     * @param {Object} pAdapter
     * @param {Object} pShoppingCartData
     * @param {Object} pParams some additional params (server data).
     */
    CartViewModel.getInstance = function(pAdapter, pShoppingCartData, pParams, pUser) {
      if(!CartViewModel.singleInstance) {
        CartViewModel.singleInstance = new CartViewModel(pAdapter, pShoppingCartData, pUser, pParams);
        CartViewModel.singleInstance.isPricingRequired(true);
        CartViewModel.singleInstance.getItemDynamicPropertiesMetadata(ccConstants.ENDPOINT_COMMERCE_ITEM_TYPE_PARAM);
      }

      if(pShoppingCartData && pShoppingCartData.items) {
        CartViewModel.singleInstance.updatedFromRepository = true;
        CartViewModel.singleInstance.getLocalData(pShoppingCartData);
      }

      if (pParams) {
        CartViewModel.singleInstance.setContext(pParams);
      }

      return CartViewModel.singleInstance;
    };

    /**
     * fetches order details and populates cart. 
     * renders these details on cart page.
     */
    CartViewModel.prototype.loadTemplateOrderItems = function(orderId) {
      var self = this;
      if ((self.user()) && (self.user().loggedIn() && (!self.user().isUserSessionExpired())) ) {
        var data = {};
        var contextObj = {};
        contextObj[ccConstants.ENDPOINT_KEY] = ccConstants.ENDPOINT_GET_ORDER;
        contextObj[ccConstants.IDENTIFIER_KEY] = "templateOrder";
        var filterKey = self.storeConfiguration.getFilterToUse(contextObj);
        if (filterKey) {
          data[ccConstants.FILTER_KEY] = filterKey;
        }
        ccRestClient.request(ccConstants.ENDPOINT_GET_ORDER, data,
          function (order) {
            // We will allow this for orders in template,
            // pending_approval_template and failed_approval_template state.
            var state = order.state;
            if (state == ccConstants.TEMPLATE || state == ccConstants.PENDING_APPROVAL_TEMPLATE
                || state == ccConstants.SCHEDULED_ORDER_STATE_REJECTED || state == ccConstants.PENDING_PAYMENT_TEMPLATE) {
              self.mergeItems(order);
              self.markDirty();
              $.Topic(pubsub.topicNames.LOADED_ORDER_SHIPPING_ADDRESS)
                .publish(order.shippingAddress);
              $.Topic(pubsub.topicNames.POPULATE_SHIPPING_METHODS)
                .publish(order.shippingMethod.value);
              self.shippingMethod(order.shippingMethod.value);
              self.cartUpdated();
              self.user().validateAndRedirectPage("/cart");
            }
            else {
              // If not go 404
              notifier.sendError('scheduledOrder', "Invalid order state.", true);
            }
          },
          function (data) {
            // If not go 404
            navigation.goTo(self.contextData.global.links['404'].route);
          },
          orderId);
      }
      else {
        navigation.doLogin(navigation.getPath(), self.contextData.global.links['home'].route);
      }
    };
    
    /**
     * fetches order details and populates cart. 
     * renders these details on cart page.
     */
    CartViewModel.prototype.loadOrderItems = function(order) {
    	var self = this;
    	self.mergeItems(order);
    	self.getProductData();
   	 	$.Topic(pubsub.topicNames.LOADED_ORDER_SHIPPING_ADDRESS)
   	 	.publish(order.shippingAddress);
   	 	$.Topic(pubsub.topicNames.POPULATE_SHIPPING_METHODS)
   	 	.publish(order.shippingMethod.value);
   	 	self.shippingMethod(order.shippingMethod.value);
        self.user().validateAndRedirectPage("/cart");
    };
    
    /*
     * Sets the application variable.
     * @function
     * @name CartViewModel#setApplication
     * @param {string} pApplication application name.
     */
    CartViewModel.setApplication = function(pApplication) {
      application = pApplication;
    };
    return CartViewModel;
  }

);

