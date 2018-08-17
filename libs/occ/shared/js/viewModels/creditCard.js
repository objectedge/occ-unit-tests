define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'viewModels/creditCard',
  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['knockout', 'ccConstants', 'CCi18n', 'koMapping'],
  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (ko, ccConstants, CCi18n, koMapping) {
    'use strict';
    
    function CreditCard() {
      var self = this;
      // Generic payment data
      self.paymentMethodType = ccConstants.CARD_PAYMENT_TYPE;
      self.type = ccConstants.CARD_PAYMENT_TYPE;
      self.amount = ko.observable();
      self.billingAddress = ko.observable(undefined);
      // credit card specific data
      self.nameOnCard = ko.observable();
      self.cardType = ko.observable();
      self.cardNumber = ko.observable(); 
      self.cardCVV = ko.observable();
      self.expiryMonth = ko.observable();
      self.expiryYear = ko.observable();
      
      //Submit order has endMonth and endYear prop. Mapping based on operation will be complicated. Hence duplicating the keys.
      self.endMonth = ko.observable();
      self.endYear = ko.observable();

      //Pointer to trigger validations of payment fields
      self.triggerValidations = ko.observable(true);

      self.seqNum = null;
      // credit card meta data
      self.cardIINPattern = ko.observable('[0-9]');
      self.cardNumberLength = ko.observable('16');
      self.cvvLength = ko.observable('3');
      self.startDateRequired = ko.observable(false);
//      Object.defineProperty(self, 'cardIINPattern', {value: ko.observable('[0-9]'), enumerable: false});
//      Object.defineProperty(self, 'cardNumberLength', {value: ko.observable('16'), enumerable: false});
//      Object.defineProperty(self, 'cvvLength', {value: ko.observable('3'), enumerable: false});
//      Object.defineProperty(self, 'startDateRequired', {value: ko.observable(false), enumerable: false});
      self.message = ko.observable();
      self.maskedNumber = ko.observable();
      self.paymentGroupId = null;
//      Object.defineProperty(self, 'message', {value: ko.observable(), enumerable: false, writable: true});
//      Object.defineProperty(self, 'maskedNumber', {value: ko.observable(), enumerable: false});
//      Object.defineProperty(self, 'paymentGroupId', {value: null, enumerable: false, writable: true});
      self.gatewayName = null;
      self.uiIntervention = null;
      self.isEdit = ko.observable(false);
      self.isCardPaymentDisabled = ko.observable(false);
      Object.defineProperty(self, 'gatewayName', {value: null, enumerable: false, writable: true});
      Object.defineProperty(self, 'uiIntervention', {value: null, enumerable: false, writable: true});
      
      /**
       * Method to create additional properties for the creditCard
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
       * @returns {Object} New Object containing credit card data.
       */
      self.toJSON = function() {
        var oldOptions = koMapping.defaultOptions().ignore;
        koMapping.defaultOptions().ignore = ["cardIINPattern", "cardNumberLength", "cvvLength", 
          "startDateRequired", "message", "maskedNumber", "paymentGroupId", "gatewayName", 
          "uiIntervention", "isAmountRemaining", "paymentMethod", "paymentState", "isCardPaymentDisabled",
          "triggerValidations","isEdit"];
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
        self.maskedNumber(self.cardNumber().replace(regex, replaceWithSymbol));
      };

      /**
       * Apply validations for payment fields based on the given conditions
       */
      self.conditionsApply = function () {
         return (self.triggerValidations() && self.paymentMethodType == ccConstants.CARD_PAYMENT_TYPE && !self.isCardPaymentDisabled());
      },

      self.nameOnCard.extend({
        required: {
          params: true,
          onlyIf: self.conditionsApply,
          message: CCi18n.t('ns.common:resources.nameOnCardRequired')
        }
      });
      self.cardType.extend({  
        required: {
          params: true,         
          onlyIf: self.conditionsApply,
          message: CCi18n.t('ns.common:resources.cardTypeRequired')
        }
      });
      self.cardNumber.extend({
        required: {
          params: true,
          onlyIf: self.conditionsApply,
          message: CCi18n.t('ns.common:resources.cardNumberRequired')
        },
        maxLength: {
          params:  ccConstants.CYBERSOURCE_CARD_NUMBER_MAXIMUM_LENGTH,
          message: CCi18n.t('cardNumberMaxLength',{maxLength:ccConstants.CYBERSOURCE_CARD_NUMBER_MAXIMUM_LENGTH})
        },
        creditcard: {
          params: {
            iin: self.cardIINPattern,
            length: self.cardNumberLength
          },
          onlyIf: self.conditionsApply,
          message: CCi18n.t('ns.common:resources.cardNumberInvalid')
        }
      });
      self.cardCVV.extend({
        required: {
          params: true,
          onlyIf: self.conditionsApply,
          message: CCi18n.t('ns.common:resources.cardCVVRequired')
        },
        minLength: {
          params: 3,
          message: CCi18n.t('ns.common:resources.cardCVVNumberMinLength')
        },
        maxLength: {
          params: 4,
          message: CCi18n.t('ns.common:resources.cardCVVNumberMaxLength')
        },
        number: {
          param: true,
          message: CCi18n.t('ns.common:resources.cardCVVNumberInvalid')
        },
        cvv: {
          params: self.cvvLength,
          onlyIf: self.conditionsApply,
          message: CCi18n.t('ns.common:resources.cardCVVInvalid')
        }
      });
      self.expiryMonth.extend({
        required: {
          params: true,
          onlyIf: self.conditionsApply,
          message: CCi18n.t('ns.common:resources.endMonthRequired')
        },
        endmonth: {
          params: self.expiryYear,
          message: CCi18n.t('ns.common:resources.endMonthInvalid')
        }
      });
      self.expiryYear.extend({
        required: {
          params: true,
          onlyIf: self.conditionsApply,
          message: CCi18n.t('ns.common:resources.endYearRequired')
        }
      });
      
      /**
       * Method to reset the credit card payment object data 
       * Clears the data and errors associated with this object.
       */
        self.resetPaymentDetails = function(keepValidations) {
          self.nameOnCard(null);
          self.cardType(null);
          self.cardNumber(null);
          self.cardCVV(null);
          self.expiryMonth(null);
          self.expiryYear(null);
          if (self.nameOnCard.isModified) {
            self.nameOnCard.isModified(false);
          }
          if (self.cardType.isModified) {
            self.cardType.isModified(false);
          }
          if (self.cardNumber.isModified) {
            self.cardNumber.isModified(false);
          }
          if (self.cardCVV.isModified) {
            self.cardCVV.isModified(false);
          }
          if (self.expiryMonth.isModified) {
            self.expiryMonth.isModified(false);
          }
          if (self.expiryYear.isModified) {
            self.expiryYear.isModified(false);
          }
          self.isCardPaymentDisabled(false);
          if(keepValidations===undefined||keepValidations===null||keepValidations===false){
            self.nameOnCard.extend({validatable: false});
            self.cardType.extend({validatable: false});
            self.cardNumber.extend({validatable: false});
            self.cardCVV.extend({validatable: false});
            self.expiryMonth.extend({validatable: false});
            self.expiryYear.extend({validatable: false});
          }
        };
        
        /**
         * Method to reset the credit card payment object pin 
         */
          self.resetCardCvv = function() {
          	self.cardCVV(null);
          }
        
        /**
         * Force all relevant member observables to perform their
         * validation now & display the errors (if any)
         */
        self.validatePaymentData = function() {
          self.nameOnCard.isModified(true);
          self.cardType.isModified(true);
          self.cardNumber.isModified(true);
          self.cardCVV.isModified(true);
          self.expiryMonth.isModified(true);
          self.expiryYear.isModified(true);
          return(self.isValid());
        };

        /**
         * Determine whether this credit card details has any fields which are
         * marked as modified.
         *
         * @function
         * @name isModified
         * @returns {boolean} true if the credit card details are modified, otherwise false.
         */
        self.isModified = function () {

          return (self.nameOnCard.isModified() ||
                  self.cardType.isModified() ||
                  self.cardNumber.isModified() ||
                  self.cardCVV.isModified() ||
                  self.expiryMonth.isModified() ||
                  self.expiryYear.isModified());
        };

        /**
         * Resets modified properties of all credit card fields to false.
         *
         * @name resetModified
         * @function
         */
        self.resetModified = function() {
          self.nameOnCard.isModified(false);
          self.cardType.isModified(false);
          self.cardNumber.isModified(false);
          self.cardCVV.isModified(false);
          self.expiryMonth.isModified(false);
          self.expiryYear.isModified(false);
        };
        
        /**
         * Determine whether the payment object is valid by checking
         * the field level validation of all the fields present
         * @return boolean Returns true if all fields are valid, otherwise return false
         */   
        self.isValid = function() {
          return (self.nameOnCard.isValid()
                  && self.cardType.isValid()
                  && self.cardNumber.isValid()
                  && self.cardCVV.isValid()
                  && self.expiryMonth.isValid()
                  && self.expiryYear.isValid());
        };
        
    };
    
    return CreditCard;
});
