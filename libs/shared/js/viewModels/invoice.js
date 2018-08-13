define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'viewModels/invoice',
  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['knockout', 'ccConstants', 'CCi18n', 'koMapping'],
  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (ko, ccConstants, CCi18n, koMapping) {
    'use strict';
    
    function Invoice() {
      var self = this;
      
      self.paymentMethodType = ccConstants.INVOICE_PAYMENT_TYPE;
      self.type = ccConstants.INVOICE_PAYMENT_TYPE;
      self.amount = ko.observable();
      self.billingAddress = ko.observable(undefined);
      
      self.message = ko.observable();
      self.paymentGroupId = null;
      self.maskedNumber = ko.observable('');
      self.isEdit = ko.observable(false);
//      Object.defineProperty(self, 'message', {value: ko.observable(), enumerable: false, writable: true});
//      Object.defineProperty(self, 'paymentGroupId', {value: null, enumerable: false, writable: true});
//      Object.defineProperty(self, 'maskedNumber', {value: ko.observable(''), enumerable: false});
      
      self.PONumber = ko.observable();
      
      self.seqNum = null;
      
      self.PONumber.extend({ 
        maxLength: {params: ccConstants.PONUMBER_MAXIMUM_LENGTH, 
                    message: CCi18n.t('maxPOLengthValidationMsg', {maxLength: ccConstants.PONUMBER_MAXIMUM_LENGTH}) }});
      
      /**
       * Method to create additional properties for the invoice
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
       * @returns {Object} New Object containing invoice data.
       */
      self.toJSON = function() {
        var oldOptions = koMapping.defaultOptions().ignore;
        koMapping.defaultOptions().ignore = ["message", "paymentGroupId", "maskedNumber", "gatewayName", "isAmountRemaining",
                                             "paymentMethod", "paymentState", "uiIntervention", "isEdit"];
        var copy = koMapping.toJS(self);
        koMapping.defaultOptions().ignore = oldOptions;
        // Since billing address can have dynamic properties, removing the old
        // billing address from copy and adding the converted billing address
        if(self.billingAddress()) {
          delete copy.billingAddress;
          copy.billingAddress = self.billingAddress().toJSON();
        }
        return copy;
      };
      
      /**
       * Utility method to set the masked number based on the regex pattern
       * @param {String} regex The Regular Expression based on which masking will be applied
       * @param {String} replaceWithSymbol The masking symbol that will be applied
       * */
      self.setMaskedNumber = function(regex, replaceWithSymbol) {
        // PO number is not a mandatory field for invoice payment
        if(self.PONumber()) {
          self.maskedNumber(self.PONumber().replace(regex, replaceWithSymbol));
        }
      };
      
      /**
       * @function
       * @name resetPaymentDetails
       * @class invoice
       * Clears the data and errors associated with this object.
       */
      self.resetPaymentDetails = function() {
        self.PONumber(null);
        if (self.PONumber.isModified) {
          self.PONumber.isModified(false);
        }
        self.PONumber.extend({validatable: false});
      };
      
      /**
       * Force all relevant member observables to perform their
       * validation now & display the errors (if any)
       */
      self.validatePaymentData = function() {
        self.PONumber.isModified(true);
        return(self.isValid());
      };
      
      /**
       * Determine whether the payment object is valid by checking
       * the field level validation of all the fields present
       * @return boolean Returns true if all fields are valid, otherwise return false
       */   
      self.isValid = function() {
        return (self.PONumber.isValid());
      };
      
    };
    
    return Invoice;
});
