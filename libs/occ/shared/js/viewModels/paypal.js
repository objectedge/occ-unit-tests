define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'viewModels/paypal',
  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['knockout', 'ccConstants', 'koMapping'],
  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (ko, ccConstants, koMapping) {
    'use strict';
    
    function Paypal() {
      var self = this;
      
      self.paymentMethodType = ccConstants.PAYPAL_PAYMENT_TYPE;
      self.type = ccConstants.PAYPAL_PAYMENT_TYPE;
      self.amount = ko.observable();
      self.billingAddress = ko.observable(undefined);
      
      self.seqNum = null;
      
      self.message = ko.observable();
      self.paymentGroupId = null;
      self.isEdit = ko.observable(false);
//      Object.defineProperty(self, 'message', {value: ko.observable(), enumerable: false, writable: true});
//      Object.defineProperty(self, 'paymentGroupId', {value: null, enumerable: false, writable: true});
      
      /**
       * Method to create additional properties for the paypal
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
       * @returns {Object} New Object containing paypal data.
       */
      self.toJSON = function() {
        var oldOptions = koMapping.defaultOptions().ignore;
        koMapping.defaultOptions().ignore = ["message", "isEdit"];
        var copy = koMapping.toJS(self);
        koMapping.defaultOptions().ignore = oldOptions;
        return copy;
      };
      
      /**
       * Force all relevant member observables to perform their
       * validation now & display the errors (if any)
       */
      self.validatePaymentData = function() {
      	return true;
      };
      
    };
    
    /**
     * @function
     * @name resetPaymentDetails
     * @class paypal
     * Clears the data and errors associated with this object.
     */
    self.resetPaymentDetails = function() {
      // There is no paypal specific fields that can be reset
    };
    
    return Paypal;
});
