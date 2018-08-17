define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'viewModels/giftCard',
  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['knockout', 'ccConstants', 'CCi18n', 'pageLayout/site', 'koMapping'],
  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (ko, ccConstants, CCi18n, site, koMapping) {
    'use strict';
    
    function GiftCard() {
      var self = this;
      
      self.paymentMethodType = ccConstants.GIFT_CARD_PAYMENT_TYPE;
      self.type = ccConstants.GIFT_CARD_PAYMENT_TYPE;
      self.amount = ko.observable();
      self.billingAddress = ko.observable(undefined);
      
      // Meta data fields
      self.giftCardNumberMaxLength = ko.observable(19);
      self.giftCardPinMaxLength = ko.observable(4);
      self.isGiftCardPinRequired = ko.observable(true);
//      Object.defineProperty(self, 'giftCardNumberMaxLength', {value: ko.observable(19), enumerable: false, writable: true});
//      Object.defineProperty(self, 'giftCardPinMaxLength', {value: ko.observable(4), enumerable: false, writable: true});
//      Object.defineProperty(self, 'isGiftCardPinRequired', {value: ko.observable(true), enumerable: false, writable: true});
      self.message = ko.observable();
      self.paymentGroupId = null;
      self.maskedNumber = ko.observable();
      self.isGiftCardReApplied = ko.observable(false);
//      Object.defineProperty(self, 'message', {value: ko.observable(), enumerable: false, writable: true});
//      Object.defineProperty(self, 'paymentGroupId', {value: null, enumerable: false, writable: true});
//      Object.defineProperty(self, 'maskedNumber', {value: ko.observable(), enumerable: false});
      
      self.giftCardNumber = ko.observable();
      self.giftCardPin = ko.observable();
      self.isEdit = ko.observable(false);

      //Pointer to trigger validations of payment fields
      self.triggerValidations = ko.observable(true);

      self.seqNum = null;
      
      var siteVM = site.getInstance();
      for (var key in siteVM.extensionSiteSettings) {
        var setingsObject = siteVM.extensionSiteSettings[key];
        if (setingsObject[ccConstants.PAYMENT_METHOD_TYPES] &&
          setingsObject[ccConstants.PAYMENT_METHOD_TYPES].indexOf(ccConstants.GIFT_CARD_PAYMENT_TYPE) != -1 ) {
          if(setingsObject.giftCardMaxLength != undefined) {
            self.giftCardNumberMaxLength(setingsObject.giftCardMaxLength);
          }
          if (setingsObject.giftCardPinRequired != undefined && setingsObject.giftCardPinMaxLength != undefined) {
            self.isGiftCardPinRequired(setingsObject.giftCardPinRequired);
            self.giftCardPinMaxLength(setingsObject.giftCardPinMaxLength);
          }
          break;
        }
      }
      
      /**
       * Method to create additional properties for the giftCard
       * @param {Array} PropertyKeys - An array of strings, containing the keys for additional properties
       */
      self.createCustomProperties = function(PropertyKeys) {
        var extData = {};
        for(var key in PropertyKeys) {
          if(typeof PropertyKeys[key] === "string") {
            extData[PropertyKeys[key]] = "";
          }
        }
        self.customProperties = ko.mapping.fromJS(extData);
      };
      
      /**
       * Convert an observable object into a plain javascript object, and remove fields
       * that aren't relevant for payment processing API request
       *
       * @returns {Object} New Object containing gift card data.
       */
      self.toJSON = function() {
        var oldOptions = koMapping.defaultOptions().ignore;
        koMapping.defaultOptions().ignore = ["giftCardNumberMaxLength", "giftCardPinMaxLength", 
          "isGiftCardPinRequired", "message", "paymentGroupId", "maskedNumber", "balance", 
          "gatewayName", "isAmountRemaining", "maskedCardNumber", "paymentMethod", "paymentState", 
          "uiIntervention", "isGiftCardReApplied", "triggerValidations", "isEdit"];
        var copy = koMapping.toJS(self);
        koMapping.defaultOptions().ignore = oldOptions;
        return copy;
      };
      
      /**
       * Utility method to set the masked number based on the regex pattern
       * @param {String} regex The Regular Expression based on which masking will be applied
       * @param {String} replaceWithSymbol The masking symbol that will be applied
       * */
      self.setMaskedNumber = function(regex, replaceWithSymbol) {
        self.maskedNumber(self.giftCardNumber().replace(regex, replaceWithSymbol));
      };

      /**
       * Apply validations for payment fields based on the given conditions
       */
      self.conditionsApply = function () {
         return (self.triggerValidations() && self.paymentMethodType == ccConstants.GIFT_CARD_PAYMENT_TYPE);
      },

      self.giftCardNumber.extend({
        required: {
          params: true,
          onlyIf: self.conditionsApply,
          message: CCi18n.t('ns.common:resources.giftCardNumberRequired',{})
        },
        maxLength: {
          params: self.giftCardNumberMaxLength(),
          message: CCi18n.t('ns.common:resources.maxlengthValidationMsg',{maxLength:self.giftCardNumberMaxLength(), fieldName:CCi18n.t('ns.common:resources.giftCardNumberText',{})})
        }
      });
      self.giftCardPin.extend({
        required: {
          params: self.isGiftCardPinRequired(),
          onlyIf: self.conditionsApply,
          message: CCi18n.t('ns.common:resources.giftCardPinRequired',{})
        },
        maxLength: {
          params: self.giftCardPinMaxLength(),
          onlyIf: function () { return (self.paymentMethodType == ccConstants.GIFT_CARD_PAYMENT_TYPE); },
          message: CCi18n.t('ns.common:resources.maxlengthValidationMsg',{maxLength: self.giftCardPinMaxLength(), fieldName:CCi18n.t('ns.common:resources.giftCardPinText',{})})
        }
      });
      
      /**
       * @function
       * @name resetPaymentDetails
       * @class giftCard
       * Clears the data and errors associated with this object.
       */
      self.resetPaymentDetails = function() {
        self.giftCardNumber(null);
        self.giftCardPin(null);
        if (self.giftCardNumber.isModified) {
          self.giftCardNumber.isModified(false);
        }
        self.giftCardNumber.extend({validatable: false});
        if (self.giftCardPin.isModified) {
          self.giftCardPin.isModified(false);
        }
        self.giftCardPin.extend({validatable: false});
      };
      
      /**
       * @function
       * @name resetGiftCardPin
       * @class giftCard
       * Clears the gift card pin.
       */
      self.resetGiftCardPin = function() {
      	self.giftCardPin(null);
      };
      
      /**
       * Force all relevant member observables to perform their
       * validation now & display the errors (if any)
       */
      self.validatePaymentData = function() {
        self.giftCardNumber.isModified(true);
        self.giftCardPin.isModified(true);
        return(self.isValid());
      };
      
      /**
       * Determine whether the payment object is valid by checking
       * the field level validation of all the fields present
       * @return boolean Returns true if all fields are valid, otherwise return false
       */   
      self.isValid = function() {
        return (self.giftCardNumber.isValid()
                && self.giftCardPin.isValid());
      };
      
    };
    
    return GiftCard;

});
