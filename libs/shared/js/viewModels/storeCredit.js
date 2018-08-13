define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'viewModels/storeCredit',
  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['knockout', 'ccConstants', 'CCi18n', 'koMapping'],
  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (ko, CCConstants, CCi18n, koMapping) {
    'use strict';
    
    function StoreCredit() {
      var self = this;
      // Generic payment data
      self.paymentMethodType = CCConstants.STORE_CREDIT_PAYMENT_TYPE;
      self.type = CCConstants.STORE_CREDIT_PAYMENT_TYPE;
      self.amount = ko.observable();
      self.storeCreditNumber = ko.observable();
      self.triggerValidations = ko.observable(true);
      self.billingAddress = ko.observable(undefined);
      self.storeCreditNumber.extend({required: false});

      self.seqNum = null;
      self.message = ko.observable();
      self.paymentGroupId = null;

      self.gatewayName = null;
      self.uiIntervention = null;
      self.isStoreCreditPaymentDisabled = ko.observable(false);
      Object.defineProperty(self, 'gatewayName', {value: null, enumerable: false, writable: true});
      Object.defineProperty(self, 'uiIntervention', {value: null, enumerable: false, writable: true});
      
      /**
       * Method to create additional properties for the storeCredit
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
       * @returns {Object} New Object containing store card data.
       */
      self.toJSON = function() {
        var oldOptions = koMapping.defaultOptions().ignore;
        koMapping.defaultOptions().ignore = [ "message", "maskedNumber", "paymentGroupId", "gatewayName", 
          "uiIntervention", "isAmountRemaining", "paymentMethod", "paymentState", "isStoreCreditPaymentDisabled",
          "triggerValidations"];
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
        if(self.storeCreditNumber()) {
          self.maskedNumber(self.storeCreditNumber().replace(regex, replaceWithSymbol));
        }
      };

      /**
       * Apply validations for payment fields based on the given conditions
       */
      self.conditionsApply = function () {
         return (self.triggerValidations() && self.paymentMethodType == CCConstants.STORE_CREDIT_PAYMENT_TYPE && !self.isStoreCreditPaymentDisabled());
      },

      /**
       * Method to reset the store card payment object data 
       * Clears the data and errors associated with this object.
       */
        self.resetPaymentDetails = function() {
          self.storeCreditNumber(null);
        };

        /**
         * Force all relevant member observables to perform their
         * validation now & display the errors (if any)
         */
        self.validatePaymentData = function() {
          if (self.storeCreditNumber()) {
            self.storeCreditNumber.isModified(true);
            return(self.isValid());
          }
          return true;
        };

        /**
         * Determine whether this store credit details has any fields which are
         * marked as modified.
         * 
         * @function
         * @name isModified
         * @returns {boolean} true if the store credit details are modified,
         *          otherwise false.
         */
        self.isModified = function() {
          return (self.storeCreditNumber.isModified());
        };

        /**
         * Resets modified properties of all storeCredit fields to false.
         *
         * @name resetModified
         * @function
         */
        self.resetModified = function() {
          self.storeCreditNumber.isModified(false);
        };

        /**
         * Determine whether the payment object is valid by checking
         * the field level validation of all the fields present
         * @return boolean Returns true if all fields are valid, otherwise return false
         */   
        self.isValid = function() {
          return (self.storeCreditNumber.isValid());
        };
    };

    return StoreCredit;
});
