/**
 * @fileoverview Defines a CartItem of the cart.
 */

/*global define */
define('viewModels/cart-item',['require','knockout','pubsub','CCi18n','jquery','ccConstants','pageLayout/site','currencyHelper','koMapping','viewModels/shipping-group-relationship','viewModels/cart-item-external-data','ccStoreConfiguration'],function (require) {
    'use strict';

    var ko = require('knockout');
    var pubsub = require('pubsub');
    var CCi18n = require('CCi18n');
    var $ = require('jquery');
    var ccConstants = require('ccConstants');
    var SiteViewModel = require('pageLayout/site');
    var currencyHelper = require('currencyHelper');
    var koMapping = require('koMapping');
    var ShippingGroupRelationship = require('viewModels/shipping-group-relationship');
    var CartItemExternalData = require('viewModels/cart-item-external-data');
    var CCStoreConfiguration = require('ccStoreConfiguration');

    /**
     * Map the legacy CartItem argument signature (individual argument list), to the new CartItem argument signature (a 
     * single config object).
     * 
     * @private
     */
    function argumentsToConfig () {
      return {
        productId: arguments[0],
        productData: arguments[1],
        quantity: arguments[2],
        catRefId: arguments[3],
        selectedOptions: arguments[4],
        currency: arguments[5],
        discountInfo: arguments[6],
        rawTotalPrice: arguments[7], 
        externalPrice: arguments[8],
        externalPriceQuantity: arguments[9],
        configuratorId: arguments[10],
        childItems: arguments[11],
        commerceItemId: arguments[12],
        unpricedExternalMessage: arguments[13],
        externalData: arguments[14],
        actionCode: arguments[15],
        lineAttributes: arguments[16],
        backOrderQuantity: arguments[17],
        preOrderQuantity: arguments[18],
        externalRecurringCharge: arguments[19],
        externalRecurringChargeFrequency: arguments[20],
        externalRecurringChargeDuration: arguments[21],
        addOnItem: arguments[22],
        shopperInput: arguments[23],
        configurablePropertyId: arguments[24],
        configurationOptionId: arguments[25]
      };
    }

    /**
     * The CartItem (view model) class is the client representation of a Commerce Item.
     *
     * @class
     * @param {Object} config The initial data from which to initialize the CartItem properties.
     * @property {string} productID Product ID of the current item
     * @property {observable<Object>} productData Product Data associated wtih the current item
     * @property {observable<number>} quantity the number of items
     * @property {string} catRefId SKU id of the item
     * @property {observable<number>} itemTotal Total cost of the item.
     * @property {observable<boolean>} stockStatus Whether the item is current available.
     * @property {observable<number>} updatableQuantity The number of items actually available to purchase after 
     *    adjustments to stock level.
     * @property {observable<number>} rawTotalPrice
     * @property {observableArray<ShippingGroupRelationship>} shippingGroupRelationships The collection of 
     *    ShippingGroupRelationships instances for a this cart item. By default, there is one 
     *    ShippingGroupRelationship instance per cart items, meaning that each cart item will be associated to at 
     *    least one shipping group. 
     * @property {string} configuratorId the configurator id needed for reconfiguration and price calculation for 
     *    configurable items.
     * @property {CartItem[]} childItems the array of child items.
     * @property {string} commerceItemId the commerce item id for the item.
     * @property {observableArray<CartItemExternalData>} externalData - The list of dynamic externalData associated
     *    with this cart item.
     * @property {observable<string>} actionCode - The action code associated with the cart item.
     * @property {observable<string>} externalRecurringCharge - The recurring charge value e.g. "10.00".
     * @property {observable<string>} externalRecurringChargeFrequency - The frequency of the recurring charge e.g. "Monthly".
     * @property {observable<string>} externalRecurringChargeDuration - The duration of the recurring charge e.g. "12 months".
     * @property {observableArray<DynamicProperty>} lineAttributes the array of dynamicProperty Objects for commerceItem.
     * @property {observable<number>} backOrderableQuantity the number of items backordered
     * @property {observable<number>} preOrderableQuantity the number of items preordered
     * @property {boolean} addOnItem Flag to indicate if the cart item coresponds to a add-on product
     * @property {array} shopperInput The ShopperInputs array
     * @property {string} configurablePropertyId The id of ConfigurableProperty
     * @property {string} configurationOptionId The id of ConfigurationOption
     */
    function CartItem (config) {
      var self = this;

      // If the method was called using the old argument signature, i.e. list of arguments instead of a single 
      // config object.
      if (arguments.length > 1 && typeof arguments[0] !== 'object') {
        // Map legacy arguments to config object.
        return CartItem.call(this, argumentsToConfig.apply(undefined, arguments));
      }

      var original
      // Default args.

      config = config || {};
      var externalData = config.externalData || [];
      var productData = config.productData || {};

      // Properties.

      self.productId = config.productId;
      self.productData = ko.observable(config.productData);
      self.quantity = ko.observable(config.quantity);
      self.repositoryId = "";
      self.availabilityDate = ko.observable(productData.availabilityDate || null);
      self.catRefId = config.catRefId;
      self.itemTotal = ko.observable(0);
      self.expanded = ko.observable(false);
      self.stockStatus = ko.observable(true);
      self.stockState = ko.observable(productData.stockState || '');
      self.orderableQuantityMessage = ko.observable();
      self.updatableQuantity = ko.observable(config.quantity);
      self.commerceItemQuantity = ko.observable(config.quantity);
      self.orderableQuantity = ko.observable();
      self.backOrderableQuantity = ko.observable(config.backOrderQuantity);
      self.preOrderableQuantity = ko.observable(config.preOrderQuantity);
      self.selectedOptions = config.selectedOptions;
      self.selectedSkuProperties = [];
      self.discountInfo = ko.observable(config.discountInfo);
      self.rawTotalPrice = ko.observable(config.rawTotalPrice);
      self.detailedItemPriceInfo = ko.observableArray();
      self.detailedRecurringChargeInfo = ko.observableArray();
      self.externalPrice = ko.observable(config.externalPrice);
      self.externalPriceQuantity = ko.observable(config.externalPriceQuantity);
      self.externalData = ko.observableArray(externalData.map(function (data) {
        return new CartItemExternalData(data);
      }));
      self.addOnItem = false;
      if(config.addOnItem) {
        self.addOnItem = config.addOnItem;
      }
      self.shopperInput = undefined;
      if(config.shopperInput) {
        self.shopperInput = config.shopperInput;
      }
      self.configurablePropertyId = undefined;
      if(config.configurablePropertyId) {
        self.configurablePropertyId = config.configurablePropertyId;
      }
      self.configurationOptionId = undefined;
      if(config.configurationOptionId) {
        self.configurationOptionId = config.configurationOptionId;
      }
      self.actionCode = ko.observable(config.actionCode);
      self.externalRecurringCharge = ko.observable(config.externalRecurringCharge);
      self.externalRecurringChargeFrequency = ko.observable(config.externalRecurringChargeFrequency);
      self.externalRecurringChargeDuration = ko.observable(config.externalRecurringChargeDuration);
      self.assetId = ko.observable(config.assetId);
      self.serviceId = ko.observable(config.serviceId);
      self.customerAccountId = ko.observable(config.customerAccountId);
      self.billingAccountId = ko.observable(config.billingAccountId);
      self.serviceAccountId = ko.observable(config.serviceAccountId);
      self.activationDate = ko.observable(config.activationDate);
      self.deactivationDate = ko.observable(config.deactivationDate);
      self.isPersonalized = ko.observable(false);
      self.shippingGroupRelationships = ko.observableArray([new ShippingGroupRelationship(self, config.quantity)]).extend({
        validation: [
          {
            validator: function (value) {
              if (value) {
                var shippingGroupRelationsQuantitiesSum = value.reduce(function (sum, shippingGroupRelationship) {
                  return sum += parseFloat(shippingGroupRelationship.quantity());
                }, 0);

                return !(shippingGroupRelationsQuantitiesSum > self.quantity());
              }
            },
            message: CCi18n.t('ns.common:resources.quantityAllocationExceeded')
          },
          {
            validator: function (value) {
              var shippingGroupRelationsQuantitiesSum = value.reduce(function (sum, shippingGroupRelationship) {
                return sum += parseFloat(shippingGroupRelationship.quantity());
              }, 0);

              return !(shippingGroupRelationsQuantitiesSum < self.quantity());
            },
            message: CCi18n.t('ns.common:resources.quantityNotFullyAllocated')
          }]
      }).isModified(true);
      //Initializing and injecting default values of custom properties at order line item level
      if(config.lineAttributes) {
        for(var i = 0; i< config.lineAttributes().length; i++) {
          self[config.lineAttributes()[i].id()] = ko.observable(config.lineAttributes()[i].value());
        }
      }
      self.displayName = ko.observable(productData.displayName || '');
      self.configuratorId = config.configuratorId;
      self.childItems = config.childItems;
      self.invalid = false;
      self.isGWPChoicesAvaliable = ko.observable(false);
      // If gift product, add 'giftWithPurchaseSelections' to the cart item
      if (productData.giftProductData) {
        self.giftWithPurchaseSelections = [
          {
            "giftWithPurchaseIdentifier": productData.giftProductData.giftWithPurchaseIdentifier,
            "promotionId": productData.giftProductData.promotionId,
            "giftWithPurchaseQuantity": productData.giftProductData.giftWithPurchaseQuantity
          }
        ];
      }
      // This will be set  when the first price call goes in.
      self.commerceItemId = config.commerceItemId;
      self.updatableQuantity.extend({
        required: {params: true, message: CCi18n.t('ns.common:resources.quantityRequireMsg')},
        digit: {params: true, message: CCi18n.t('ns.common:resources.quantityNumericMsg')},
        trigger: {value: '0', message: CCi18n.t('ns.common:resources.removeItemMsg')}
      });
      self.originalPrice = ko.observable(0);
      self.currentPrice = ko.observable(0);

      self.priceListGroupId = ko.observable(SiteViewModel.getInstance().selectedPriceListGroup().id);
      self.priceChangedMessage = ko.computed(function () {
        return CCi18n.t('ns.common:resources.productPriceChanged', {
          originalPrice: currencyHelper.handleFractionalDigits(self.originalPrice(), config.currency ? '' : config.currency.fractionalDigits),
          currency: config.currency === undefined ? '' : config.currency.symbol
        });
      });
      self.unpricedExternalMessage = ko.observable(config.unpricedExternalMessage || '');
      self.isUnpricedError = ko.observable(self.unpricedExternalMessage().length > 0 ? true : false);
      self.unpricedErrorMessage = ko.computed(function () {
        var message = '';

        if (self.childItems && self.childItems.length > 0) {
          message = CCi18n.t('ns.common:resources.configurableProductNoPrice', {
            message: self.unpricedExternalMessage()
          }); 
        }
        else {
          message = CCi18n.t('ns.common:resources.noPrice');
        }

        return message;
      });
      self.productPriceChanged = ko.observable(false);
      self.productPriceChanged.extend({
        trigger: { value: true, message: self.priceChangedMessage}
      });

      // Subscriptions.

      if (CCStoreConfiguration.getInstance().resetShippingGroupRelationships !== false) {
        $.Topic(pubsub.topicNames.CART_UPDATE_QUANTITY_SUCCESS).subscribe(self.resetShippingGroupRelationships.bind(self));
      }

      // Methods.

      /**
       * Sets the unpricedExternalMessage for the item
       */
      self.setUnpricedError = function (unpricedMessage) {
        self.isUnpricedError(true);
        self.unpricedExternalMessage(unpricedMessage ? unpricedMessage : "");
      };

      /**
       * Clears the unpricedExternalMessage for the item
       */
      self.clearUnpricedError = function () {
        self.isUnpricedError(false);
        self.unpricedExternalMessage("");
      };

      /**
       * Set the actual item quantity back to the initial quantity.
       *
       * @function
       * @name CartItem#revertQuantity
       */
      self.revertQuantity = function () {
        self.updatableQuantity(self.quantity());
      };

      /**
       * Replace spaces in the give data parameter with dashes.
       *
       * @function
       * @name CartItem.removeSpaces
       * @param {string} data The string to modify.
       * @returns {string} New string with the spaces replaced by dashes.
       */
      self.removeSpaces = function (data) {
        if (data) {
          return data.replace(/\s+/g, '-');
        }
        else {
          return '';
        }
      };
      
      /**
       * Returns the localized string containing the option name and the option value for a selected option.
       * This function also determines whether or not to append a coma (,) at the end of the string by looping
       * through the selectedOptions array and checks if there is any non-null option value after the selected option.
       * 
       * @function
       * @name CartItem.optionText
       * @param {number} index The index of the selected option.
       * @returns {string} Localized string containing the option name and the option value.
       */
      self.optionText = function (index) {
        var selectedOption = self.selectedOptions[index];

        for (var i = index + 1; i < self.selectedOptions.length; i++) {
          var nextOption = self.selectedOptions[i];

          if (nextOption.optionValue) {
            return CCi18n.t('ns.common:resources.optionHasNext', {
              optionName: selectedOption.optionName,
              optionValue: selectedOption.optionValue
            });
          }
        }

        return CCi18n.t('ns.common:resources.optionLast', {
          optionName: selectedOption.optionName,
          optionValue: selectedOption.optionValue
        });
      }

      /**
       * Convert an observable object into a plain javascript object (freeze values), and remove fields
       * that aren't relevant to pricing calculations.
       *
       * @function
       * @name CartItem#toJSON
       * @returns {Object} New Object containing cart item data.
       */
      self.toJSON = function () {
        var oldOptions = koMapping.defaultOptions().ignore;

        koMapping.defaultOptions().ignore = [
          "productData",
          "itemTotal",
          "updatableQuantity",
          "productPriceChanged",
          "originalPrice",
          "priceChangedMessage",
          "isGWPChoicesAvaliable",
          "giftData",
          "unpricedErrorMessage",
          "unpricedExternalMessage",
          "isUnpricedError",
          "isPersonalized",
          "currentPrice",
          "shippingGroupRelationships"
        ];

        var copy = koMapping.toJS(self);

        koMapping.defaultOptions().ignore = oldOptions;

        return copy;
      };

      /**
       * Add validation functions to updatable quantity field to ensure it lies between the maximum orderable
       * quantity and greater than zero, and there is available stock.
       *
       * @private
       * @function
       * @name CartItem#addLimitsValidation
       * @param {boolean} stockStatus Whether the item is in stock.
       * @param {number} orderableQuantity How many of item are available to order.
       */
      self.addLimitsValidation = function (stockStatus, orderableQuantity, stockData, isPreOrderBackOrderEnabled) {
        var orderLimit;
        self.orderableQuantity = orderableQuantity;
        self.stockStatus(stockStatus);
        if(stockData){
          orderLimit = stockData.orderLimit
          self.availabilityDate(stockData.availabilityDate);
        }
        self.updatableQuantity.rules.remove(function (item) {return item.rule == "max";});
        self.updatableQuantity.rules.remove(function (item) {return item.rule == "maxItemQuantity";});

        if (
          orderableQuantity !== null && 
          !isNaN(orderableQuantity) && 
          orderableQuantity > 0
        ) {
          var insufficientStockMsg = CCi18n.t('ns.common:resources.insufficientStockMsg', {
           stockLimit: orderLimit?orderLimit:orderableQuantity
          });

          self.updatableQuantity.extend({
            maxItemQuantity:{params: {orderableQuantity: orderableQuantity,
            totalQuantity:self.getItemQuantityInCart, orderLimit:orderLimit}, message: insufficientStockMsg}
          });
        }
        else {
          var outOfStockMsg = CCi18n.t('ns.common:resources.outOfStockMsg');

          self.updatableQuantity.extend({
            max: {params: 0, message: outOfStockMsg}
          });
        }

        var partialMsg = "";
        if(isPreOrderBackOrderEnabled && stockData && stockData.inStockQuantity > 0 && self.updatableQuantity() > stockData.inStockQuantity) {
          if (stockData.backOrderableQuantity > 0) {
            partialMsg = CCi18n.t('ns.common:resources.partialBackOrderMsg', {stockLimit: stockData.inStockQuantity});
          }
          else if(stockData.preOrderableQuantity > 0) {
            partialMsg = CCi18n.t('ns.common:resources.partialPreOrderMsg', {stockLimit: stockData.inStockQuantity});
          }
        }

        self.orderableQuantityMessage(partialMsg);
        if(stockData){
          self.stockState(stockData.stockStatus);
        }
        //added this to trigger the validations on load of page.
        self.updatableQuantity.isModified(true);
      };

      /**
       * Add checks and validation functions to updatable quantity field of a configured
       * item to make sure the quantity is within the values that makes sure that the 
       * main item as well as the child items are in stock.
       * 
       * @private
       * @function
       * @name CartItem#addConfigurableStockValidation
       * @param {Object} stockData the stock related data of all the skus present
       *                 in the cart.
       */
      self.addConfigurableStockValidation = function (stockData, isPreOrderBackOrderEnabled) {
        var maxOrderableQuantity = 0;
        var orderLimit = 0;
        var stockStatus = false;
        var availabilityDate = null;
        var stockState = null;

        // Main item
        for (var i = 0; i < stockData.length; i++) {
          if (
            self.productId === stockData[i].productId && 
            self.catRefId === stockData[i].catRefId
          ) {
            if (
              stockData[i].stockStatus === 'IN_STOCK' || 
              (
                isPreOrderBackOrderEnabled && 
                (
                  stockData[i].stockStatus === 'BACKORDERABLE' || 
                  stockData[i].stockStatus === 'PREORDERABLE'
                )
              )
            ) {
              if (
                stockData[i].orderableQuantity !== null && 
                !isNaN(stockData[i].orderableQuantity) && 
                stockData[i].orderableQuantity > 0
              ) {
                var partialMsg = "";

                stockStatus = true;
                availabilityDate = stockData[i].availabilityDate;
                stockState = stockData[i].stockStatus;
                maxOrderableQuantity = stockData[i].orderableQuantity;
                orderLimit = stockData[i].orderLimit;

                if (
                  isPreOrderBackOrderEnabled && 
                  stockData[i].inStockQuantity > 0 && 
                  self.updatableQuantity() > stockData[i].inStockQuantity
                ) {
                  if (stockData[i].backOrderableQuantity > 0) {
                    partialMsg = CCi18n.t('ns.common:resources.partialBackOrderMsg', {
                      stockLimit: stockData[i].inStockQuantity
                    });
                  }
                  else if (stockData[i].preOrderableQuantity > 0) {
                    partialMsg = CCi18n.t('ns.common:resources.partialPreOrderMsg', {
                      stockLimit: stockData[i].inStockQuantity
                    });
                  }
                }
              } 
              else {
                stockStatus = false;
              }
            } 
            else {
              stockStatus = false;
            }
            break;
          }
        }

        // Now add a check for all the child items and the quantity. If one of the child
        // items can be added less than the maxOrderableQuantity, then update the 
        // maxOrderableQuantity with that value.
        if (
          self.childItems &&
          stockStatus
        ) {
          for (var i = 0; i < self.childItems.length; i++) {
            var productId = self.childItems[i].productId;
            var catRefId = self.childItems[i].catRefId;
            var quantity = ko.utils.unwrapObservable(self.childItems[i].quantity);

            for (var j = 0; j < stockData.length; j++) {
              if (
                productId === stockData[j].productId && 
                catRefId === stockData[j].catRefId
              ) {
                if (
                  stockData[j].stockStatus === 'IN_STOCK'|| 
                  (
                    isPreOrderBackOrderEnabled && 
                    (
                      stockData[j].stockStatus === 'BACKORDERABLE' || 
                      stockData[j].stockStatus === 'PREORDERABLE'
                    )
                  )
                ) {
                  if (
                    stockData[j].orderableQuantity !== null && 
                    !isNaN(stockData[j].orderableQuantity) && 
                    stockData[j].orderableQuantity > 0
                  ) {
                    // Get the current quantity and floor the max orderable
                    // accordingly.
                    var orderableQuantity = Math.floor(stockData[j].orderableQuantity/quantity);

                    maxOrderableQuantity = (maxOrderableQuantity > orderableQuantity) ? orderableQuantity : maxOrderableQuantity;
                    orderLimit = (orderLimit>stockData[j].orderLimit)?stockData[j].orderLimit:orderLimit;
                    stockStatus = true;
                  }
                  else {
                    stockStatus = false;
                  }
                }
                else {
                  stockStatus = false;
                }
                break;
              }
            }
            if (!stockStatus) {
              // If one of the product is out of stock, break it out.
              break;
            }
          }
        }

        self.stockStatus(stockStatus);
        self.availabilityDate(availabilityDate);
        self.stockState(stockState);
        self.orderableQuantityMessage(partialMsg);
        self.updatableQuantity.rules.remove(function (item) {return item.rule == "max";});
        self.updatableQuantity.rules.remove(function (item) {return item.rule == "maxItemQuantity";});

        if (
          stockStatus &&
          maxOrderableQuantity > 0
        ) {
          var insufficientStockMsg = CCi18n.t('ns.common:resources.insufficientStockMsg', {
            stockLimit: (maxOrderableQuantity>orderLimit)?orderLimit:maxOrderableQuantity
          });

          self.updatableQuantity.extend({
            maxItemQuantity:{params: {orderableQuantity:maxOrderableQuantity,
            totalQuantity:self.getItemQuantityInCart, orderLimit:orderLimit, childItems:self.childItems}, message: insufficientStockMsg}
          });
        }
        else {
          var outOfStockMsg = CCi18n.t('ns.common:resources.configurableProductOutOfStockMsg');

          self.updatableQuantity.extend({
            max: {params: 0, message: outOfStockMsg}
          });
        }

        self.updatableQuantity.isModified(true);
      };

      /**
       * Populates custom property values for a given cartItem
       * with the relevant key-value pairs.
       *
       * @function
       * @name CartItem#populateItemDynamicProperties
       * @param {observableArray<Object>} customProps The object array specifying custom property key value pairs
       */
      self.populateItemDynamicProperties = function (customProps) {
        for (var key in customProps) {
          self[key](customProps[key]());
        }
      };
    }

    /**
     * <p>
     *   Determines if it is possible to add another shipping group relationship instance (i.e. associate/split the 
     *   cart item with another shipping group). The maximum number of shipping group relationship instances is equal 
     *   to the cart item quantity, beyond which it is not possible to split the cart item any further (as there would
     *   be more associations than cart items available).
     * </p>
     *
     * @function
     * @return {boolean} true if it is possible to add another shipping group relationship instance, false otherwise.
     */
    CartItem.prototype.canAddShippingGroupRelationship = function () {
      // Can have at most this.quantity() shipping group relationships.
      var canAddShippingGroupRelationship = this.quantity() > this.shippingGroupRelationships().length;

      return canAddShippingGroupRelationship;
    };

    /**
     * <p>
     *   In order to ship the same cart item (SKU) to several different addresses (shipping groups), it is necessary
     *   to create several associations (shipping group relationships) between a cart item and shipping group. This 
     *   method creates additional shipping group relationship instances, allowing multiple associations per single 
     *   cart item. The maximum number of shipping group relationship instances is equal to the cart item quantity, 
     *   beyond which it is not possible to split the cart item any further (as there would be more associations than
     *   cart items available).
     * </p>
     *
     * @function
     */
    CartItem.prototype.addShippingGroupRelationship = function () {
      // Can have at most this.quantity() shipping group relationships.
      if (this.canAddShippingGroupRelationship()) {
        // Add a new shipping group relationships.
        this.shippingGroupRelationships.push(new ShippingGroupRelationship(this, 1));

        // The sum of the shipping group relationship quantities should equal the cart item quantity. 
        // As a new quantity has been added, the other quantities must be adjusted.
        // 
        // Find the first shiping group with quantity > 1 and decrement by 1.
        var shippingGroupRelationshipForQuantityAdjusment = ko.utils.arrayFirst(this.shippingGroupRelationships(), function (shippingGroupRelationship) {
          return shippingGroupRelationship.quantity() > 1;
        });

        shippingGroupRelationshipForQuantityAdjusment.addQuantity(-1);
      }
    };

    /**
     * <p>
     *   Remove a ShippingGroupRelationship instance from the cart item's shippingGroupRelationships array.
     * </p>
     *
     * @function
     * @param {ShippingGroupRelationship} shippingGroupRelationship The instance to be removed.
     */
    CartItem.prototype.removeShippingGroupRelationShip = function (shippingGroupRelationship) {
      // Must have at least 1 shipping group relationship.
      if (this.shippingGroupRelationships().length > 1) {
        // Remove the shipping group relationship.
        this.shippingGroupRelationships.remove(shippingGroupRelationship);

        // The sum of the shipping group relationship quantities should equal the cart item quantity.
        // As a quantity has been removed that quantity must be redistributed.
        var firstShippingGroupRelationship = this.shippingGroupRelationships()[0];

        firstShippingGroupRelationship.addQuantity(shippingGroupRelationship.quantity());
      }
    };

    /**
     * <p>
     *   Resets the shippingGroupRelationship array to its initial state. The purpose for this method is as follows.
     *   The quantity of cart item and the sum of the quantities of the associated shipping group relationships must 
     *   be the same. Changes to quantities that cause the values to diverge must be handled.
     * </p>
     * <ul>
     *   <li>
     *     Scenario 1 - Changes to shipping group relationship quantities that cause a mismatch are handled by form
     *     validation.
     *   </li>
     *   <li>
     *     Scenario 2 - Changes to the cart item quantity that causes a mismatch must trigger a reset of the shipping 
     *     group relationships array to its initial state.
     *   </li>
     * </ul>
     * <p>
     *   This method handle scenario 2.
     * </p>
     *
     * @private
     * @function
     */
    CartItem.prototype.resetShippingGroupRelationships = function () {
      // If the cart is modified reset the shipping group relationships to the default state.
      if (this.shippingGroupRelationships().length < 1) {
        this.shippingGroupRelationships(new ShippingGroupRelationship(this, this.quantity()));
      }
      else {
        // Sync the quantity.
        this.shippingGroupRelationships()[0].quantity(this.quantity());
        // Remove all relationship but the first.
        this.shippingGroupRelationships.splice(1, this.shippingGroupRelationships().length);
      }
    };

    return CartItem;
  });

