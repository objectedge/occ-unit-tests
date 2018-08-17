define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'viewModels/cash',
  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['knockout', 'ccConstants', 'koMapping'],
  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (ko, ccConstants, koMapping) {
    'use strict';
    
    function Cash() {
      var self = this;
      
      self.paymentMethodType = ccConstants.CASH_PAYMENT_TYPE;
      self.type = ccConstants.CASH_PAYMENT_TYPE;
      self.amount = ko.observable();
      self.billingAddress = ko.observable(undefined);
      
      self.seqNum = null;
      self.message = ko.observable();
      self.paymentGroupId = null;
      self.isEdit = ko.observable(false);
//      Object.defineProperty(self, 'message', {value: ko.observable(), enumerable: false, writable: true});
//      Object.defineProperty(self, 'paymentGroupId', {value: null, enumerable: false, writable: true});
      
      /**
       * Method to create additional properties for the cash
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
       * @returns {Object} New Object containing cash data.
       */
      self.toJSON = function() {
        var oldOptions = koMapping.defaultOptions().ignore;
        koMapping.defaultOptions().ignore = ["message", "paymentGroupId", "gatewayName", "isAmountRemaining",
                                             "paymentMethod", "paymentState", "uiIntervention","isEdit"];
        var copy = koMapping.toJS(self);
        koMapping.defaultOptions().ignore = oldOptions;
        return copy;
      };
      
      /**
       * @function
       * @name resetPaymentDetails
       * @class cash
       * Clears the data and errors associated with this object.
       */
      self.resetPaymentDetails = function() {
        // There is no cash specific fields that can be reset
      };
      
      /**
       * Force all relevant member observables to perform their
       * validation now & display the errors (if any)
       */
      self.validatePaymentData = function() {
        return true;
      };
      
    };
    
    return Cash;
});
