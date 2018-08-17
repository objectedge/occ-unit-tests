/**
* @fileoverview Address Class
* (Will Be) Configurable per Locale. 
 * 
 */

/*global define */
define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'viewModels/address',
  
  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['knockout', 'ccConstants', 'koValidate', 'ccKoValidateRules', 'storeKoExtensions', 'ccLogger', 'ccRestClient', 'viewModels/dynamicPropertyMetaContainer'],
    
  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (ko, CCConstants, koValidate, rules, storeKoExtensions, log, ccRestClient, DynamicPropertyMetaContainer) {

    'use strict';
    
    //------------------------------------------------------------------
    // Class definition & member variables
    //------------------------------------------------------------------
    /** 
     * Creates a new Address view model.
     * 
     * @class Represents a customer's address, typically used for shipping and billing.
     * @name Address
     * 
     * @param {string} id Identifier for the address.
     * @param {string} errorMsg Error message (not used).
     * @param {Object} widget Owning widget for this address view.
     * @param {string[]} countries List of available countries for country selection.
     * @param {string} defaultCountryCode Abbreviation of default selected country.
     * 
     * @property {observable<string>} alias Address alias
     * @property {observable<string>} prefix Title or name prefix
     * @property {observable<string>} firstName First part of name
     * @property {observable<string>} middleName Middle part of name
     * @property {observable<string>} lastName Last part of name
     * @property {observable<string>} suffix Qualifications or name suffix
     * @property {observable<string>} country Address country
     * @property {observable<string>} postalCode Zip or Postal Code
     * @property {observable<string>} address1 First line of address
     * @property {observable<string>} address2 Second line of address
     * @property {observable<string>} address3 Third line of address
     * @property {observable<string>} city Address city
     * @property {observable<string>} state State/Province/Region
     * @property {observable<string>} county Address county
     * @property {observable<string>} phoneNumber Contact telephone number
     * @property {observable<string>} jobTitle Job title
     * @property {observable<string>} companyName Name of company
     * @property {observable<string>} type AddressType (nick name) of the address
     * @property {observable<string>} faxNumber Fax number
     * @property {observable<string>} selectedCountry Country as selected from dropdown
     * @property {observable<string>} selectedState State as selected from dropdown
     * @property {observableArray<string>} countryList List of available countries for dropdown
     * @property {observableArray<string>} stateList List of available states/regions for dropdown
     */
    function Address(id, errorMsg, widget, countries, defaultCountryCode) {
      var self = this;
      
      if (!id || id === "") {
        log.error('Address ID not set');
        throw new Error('Address ID not set');
      }
      
      // Address Fields
      // All have to be initialised to empty string 
      // in order to be picked up in the JSON
      self.alias        = ko.observable('');
      self.prefix       = ko.observable('');
      self.firstName    = ko.observable('');
      self.middleName   = ko.observable('');
      self.lastName     = ko.observable('');
      self.suffix       = ko.observable('');
      
      self.country      = ko.observable('');
      self.postalCode   = ko.observable('');
      self.address1     = ko.observable('');
      self.address2     = ko.observable('');
      self.address3     = ko.observable('');
      self.city         = ko.observable('');
      self.state        = ko.observable('');
      self.county       = ko.observable('');
      
      self.phoneNumber  = ko.observable('');
      
      self.email        = ko.observable();
      
      self.jobTitle     = ko.observable('');
      self.companyName  = ko.observable('');
      self.faxNumber    = ko.observable('');
      
      self.type         = ko.observable('');
      self.repositoryId = '';
      self.dynamicPropertyMetaInfo = DynamicPropertyMetaContainer.getInstance();
      self.isDefaultBillingAddress = ko.observable(false);
      self.isDefaultShippingAddress = ko.observable(false);
      self.computedDefaultBilling = ko.computed(
        function() {
          return self.isDefaultBillingAddress() && (self.saveAddressTo() === CCConstants.ORDER_ACCOUNT);
        }, self);

      self.computedDefaultShipping = ko.computed(
          function() {
            return self.isDefaultShippingAddress() && (self.saveAddressTo() === CCConstants.ORDER_ACCOUNT);
          }, self);
      
      // Postal Code Patterns
      self.postalCodePattern = ko.observable('');
      
      self.US_POSTAL_CODE_PATTERN       = "^[0-9]{5}([ -][0-9]{4})?$";
      self.CANADA_POSTAL_CODE_PATTERN   = "^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}[0-9]{1}[a-zA-Z]{1} *[0-9]{1}[a-zA-Z]{1}[0-9]{1}$";
      self.DEFAULT_POSTAL_CODE_PATTERN  = "^[0-9a-zA-Z]{1,}([ -][0-9a-zA-Z]{1,})?$";
                                          
      // Helpers
      self.stateList          = ko.observableArray();
      self.selectedCountry    = ko.observable();
      self.selectedState      = ko.observable();
      self.state_ISOCode      = ko.observable();
      
      // This list will be useful for both shipping and billing countries.
      self.countriesList      = ko.observableArray();
      self.countriesList(countries);
      self.defaultCountryCode = ko.observable(defaultCountryCode);
      
      // This flag is used by the client to track default address selection.
      self.isDefaultAddress   = ko.observable(false);
      
      // Flag to determine if the address is getting saved to account so to run only required validation.
      self.saveToAccount = ko.observable(false);

      self.saveAddressTo = ko.observable(CCConstants.PROFILE);

      // To track invalid value in any profile
      self.invalidTracker = ko.observable();

      // Validation
      // In time, the required boolean should be set based on the locale
      self.alias.extend({
        maxLength: {
          params: CCConstants.CYBERSOURCE_ALIAS_MAXIMUM_LENGTH,
          message: widget.translate('maxlengthValidationMsg', {
              fieldName: widget.translate('aliasText'),
              maxLength:CCConstants.CYBERSOURCE_ALIAS_MAXIMUM_LENGTH
            })
        }
      });
      self.prefix.extend({ required: false});
      self.firstName.extend({ 
        required: {params: true,message: widget.translate('firstNameRequired') }, 
        maxLength: {params: CCConstants.CYBERSOURCE_FIRSTNAME_MAXIMUM_LENGTH, 
                    message: widget.translate('maxlengthValidationMsg',{fieldName: widget.translate('firstNameText'),maxLength:CCConstants.CYBERSOURCE_FIRSTNAME_MAXIMUM_LENGTH}) }});
      
      self.middleName.extend({ required: false});
      
      self.lastName.extend({ 
        required: {params: true,message: widget.translate('lastNameRequired') },
        maxLength: {params: CCConstants.CYBERSOURCE_LASTNAME_MAXIMUM_LENGTH,
                    message: widget.translate('maxlengthValidationMsg',{fieldName: widget.translate('lastNameText'),maxLength:CCConstants.CYBERSOURCE_LASTNAME_MAXIMUM_LENGTH}) }});
               
      self.suffix.extend({ required: false});

      self.country.extend({ required: { params: true, message: widget.translate('countryRequired') } });
      self.address1.extend({ 
        required: {params: true, message: widget.translate('addressLine1Required') }, 
        maxLength: {params: CCConstants.CYBERSOURCE_ADDRESS_MAXIMUM_LENGTH, 
                    message: widget.translate('maxlengthValidationMsg',{fieldName: widget.translate('addressLine1Text'),maxLength:CCConstants.CYBERSOURCE_ADDRESS_MAXIMUM_LENGTH}) } });
      self.address2.extend({ required: false,
              maxLength: {params: CCConstants.CYBERSOURCE_ADDRESS_MAXIMUM_LENGTH, 
                          message: widget.translate('maxlengthValidationMsg',{fieldName: widget.translate('addressLine2Text'),maxLength:CCConstants.CYBERSOURCE_ADDRESS_MAXIMUM_LENGTH}) } });
      self.address3.extend({ required: false,
        maxLength: {params: CCConstants.CYBERSOURCE_ADDRESS_MAXIMUM_LENGTH, 
                    message: widget.translate('maxlengthValidationMsg',{fieldName: widget.translate('addressLine3Text'),maxLength:CCConstants.CYBERSOURCE_ADDRESS_MAXIMUM_LENGTH}) } });
      self.city.extend({ 
        required: {params: true,message: widget.translate('cityRequired') },
        maxLength: {params: CCConstants.CYBERSOURCE_CITY_MAXIMUM_LENGTH,
                    message: widget.translate('maxlengthValidationMsg',{fieldName: widget.translate('cityText'),maxLength:CCConstants.CYBERSOURCE_CITY_MAXIMUM_LENGTH}) } });
      self.state.extend({ required: { params: true, onlyIf: function () { return self.stateList().length > 0; }, message: widget.translate('stateRequired') } });
      self.county.extend({required: false,
        maxLength: {params: CCConstants.CYBERSOURCE_CITY_MAXIMUM_LENGTH,
                    message: widget.translate('maxlengthValidationMsg',{fieldName: widget.translate('countyText'),maxLength:CCConstants.CYBERSOURCE_CITY_MAXIMUM_LENGTH}) } });
      
      self.type.extend({ required:{ params: true, onlyIf: function() {return self.saveToAccount();}, message: widget.translate('nickNameRequiredText') },       
        maxLength: { params:  CCConstants.ACCOUNT_NICKNAME_MAXIMUM_LENGTH, message: widget.translate('maxlengthValidationMsg',{fieldName: widget.translate('nickNamePlaceHolderText'),maxLength: CCConstants.ACCOUNT_NICKNAME_MAXIMUM_LENGTH}) } });
      
      
      // Validation for US & Canadian zip codes.
      self.postalCode.extend({ required: { params: true, message: widget.translate('zipCodeRequired') },
                               maxLength: {params: CCConstants.CYBERSOURCE_POSTAL_CODE_MAXIMUM_LENGTH,
                                                    message: widget.translate('maxlengthValidationMsg',{fieldName: widget.translate('zipCodeText'),maxLength:CCConstants.CYBERSOURCE_POSTAL_CODE_MAXIMUM_LENGTH}) },
                               observablePattern: { params: self.postalCodePattern, onlyIf: function () { return (self.postalCodePattern() != ''); }, message: widget.translate('zipCodeInvalid')}});
      
      // Very basic checking for phone numbers as there are so many different valid patterns
      self.phoneNumber.extend({ required:{ params: true, onlyIf: function() {return self.saveToAccount();}, message: widget.translate('phoneNumberRequiredText') },
                                pattern: { params: "^[0-9()+ -]+$", message: widget.translate('phoneNumberInvalid')},
                                maxLength: { params:  CCConstants.CYBERSOURCE_PHONE_NUMBER_MAXIMUM_LENGTH,message: widget.translate('maxlengthValidationMsg',{fieldName: widget.translate('phoneNumberText'),maxLength: CCConstants.CYBERSOURCE_PHONE_NUMBER_MAXIMUM_LENGTH}) } });
      
      self.jobTitle.extend({ required: false});
      self.companyName.extend({ required:{ params: true, onlyIf: function() {return self.saveToAccount();}, message: widget.translate('companyNameRequiredText') }});
      self.faxNumber.extend({ required: false});  
      
      self.isDefaultAddress.extend({ required: true});
      self.isDefaultBillingAddress.extend({ required: true});
      self.isDefaultShippingAddress.extend({ required: true});
      
      // These are not configuration options
      self.alias.isData       = true;
      self.prefix.isData      = true;
      self.firstName.isData   = true;
      self.middleName.isData  = true;
      self.lastName.isData    = true;
      self.suffix.isData      = true;
      
      self.country.isData     = true;
      self.postalCode.isData  = true;
      self.address1.isData    = true;
      self.address2.isData    = true;
      self.address3.isData    = true;
      self.city.isData        = true;
      self.state.isData       = true;
      self.county.isData      = true;
      
      self.phoneNumber.isData = true;
      
      self.jobTitle.isData    = true;
      self.companyName.isData = true;
      self.faxNumber.isData   = true;
            
      // Switch Format based on stateList retrieved
      self.stateIsDropDown    = ko.computed(function() {
        if (self.stateList().length > 0) {
          return true;
        } 
        return false;
      }, self);  
      
        
      /*
       * Listen for changes to selectedCountry
       * 
       * Please note that the country and the state list
       * are not loaded in the address.js anymore since
       * it is already present in the context data.
       * Only the selected country and the country name
       * are provided to the address.js.
       */ 
      self.selectedCountry.subscribe(function(newValue) {
        if ((self.selectedCountry() === undefined) || 
           (self.selectedCountry() === '')) {
          self.country('');
          self.postalCodePattern('');
        } else {
          for (var i=0; i<self.countriesList().length; i++) {
            if (self.countriesList()[i].countryCode == self.selectedCountry()) {
              self.country(self.countriesList()[i].displayName);
            }
          }
        }
        // reset state if one has been selected
        if ((self.selectedState() !== undefined) &&
           (self.selectedState() !== '')) {
          // needs to be null rather than empty string
          // or knockout resets to dropdown value
          self.selectedState(null);
        }
        // Update State List
        self.stateList([]);
        for (var i=0; i<self.countriesList().length; i++) {
          if (self.countriesList()[i].countryCode === self.selectedCountry()) {
            self.stateList(self.countriesList()[i].regions);
            // Postal code pattern match. Currently hardcoded
            // into the JS file. Maybe the pattern can be sent
            // from the repository.
            if (self.selectedCountry() === CCConstants.UNITED_STATES) {
              self.postalCodePattern(self.US_POSTAL_CODE_PATTERN);
            }
            
            else if (self.selectedCountry() === CCConstants.CANADA) {
              self.postalCodePattern(self.CANADA_POSTAL_CODE_PATTERN);
            }
            else {
              self.postalCodePattern(self.DEFAULT_POSTAL_CODE_PATTERN);
            }
          }
        }
      });

   // JET component ojSelect expects value to be an array, even though for single selections.
      self.computedCountry = ko.computed({
        read: function () {
          var country = this.selectedCountry();
          if (country) {
            return [country];
          } else {
            return [];
          }
        },
        write: function (pValue) {
          if (pValue.length === 1) {
            this.selectedCountry(pValue[0]);
            computeStateOptionsFromCountry.call(this, pValue[0]);
          } else {
            this.selectedCountry(null);
          }
        },
        owner: this
      });

      self.computedState = ko.computed({
        read: function () {
          var selectedState = this.selectedState();
          if (selectedState) {
            return [selectedState];
          } else {
            return [];
          }
        },
        write: function (pValue) {
          if (pValue.length === 1) {
            this.selectedState(pValue[0]);
            this.state(this.selectedState());
          } else {
            this.selectedState(null);
          }
        },
        owner: this
      });

      /**
       * Private function that computes states given a country. It also sets the country name on address object.
       * @param pCountry
       * @private
       */
      function computeStateOptionsFromCountry(pCountry) {
        var self = this;
        var countryOptions = self.countriesList();
        self.country(pCountry);
        self.selectedCountry(pCountry);
        var totalCountries = countryOptions.length;
        for (var i = 0; i < totalCountries; i++) {
          if (countryOptions[i].countryCode === pCountry) {
            if (countryOptions[i].regions.length > 0) {
              self.computedState([]);
              self.stateList(countryOptions[i].regions);
            }else {
              self.computedState([]);
              return self.stateList([]);
            }
            break;
          }
        }
      }

      /*
       * Listen for changes to selectedState.
       */
      self.selectedState.subscribe(function(newValue) {
        if (!self.selectedState()) {
          self.state('');
          self.state_ISOCode('');
          self.selectedState('');
        } else {
          for (var i = 0; i < self.stateList().length; i++) {
            if (self.stateList()[i].abbreviation === self.selectedState()) {
              self.state(self.stateList()[i].displayName);
              self.state_ISOCode(self.stateList()[i].regionCode);
              break;
            }
          }
        }
      });
      
      /*
       * Listen for changes to postalCode.
       */
      self.postalCode.subscribe(function(newValue) {
        // Perform Address Lookup
        
      });
      
      /**
       * Determine whether two addresses are similar based on their
       * values. Only considers data fields, not helpers.
       * 
       * @name Address#compare
       * @function
       * @param {Address} other Address to compare against.
       * @returns {boolean} <code>true</code> if addresses are similar, 
       * otherwise <code>false</code>.
       */
      self.compare = function (other) {
        return (self.alias() === other.alias() &&
                self.prefix() === other.prefix() &&
                self.firstName() === other.firstName() &&
                self.middleName() === other.middleName() &&
                self.lastName() === other.lastName() &&
                self.suffix() === other.suffix() &&
                self.address1() === other.address1() &&
                self.address2() === other.address2() &&
                self.address3() === other.address3() &&
                self.city() === other.city() &&
                self.state() === other.state() &&
                self.postalCode() === other.postalCode() &&
                self.country() === other.country() &&
                self.county() === other.county() &&
                self.phoneNumber() === other.phoneNumber() &&
                self.jobTitle() === other.jobTitle() &&
                self.companyName() === other.companyName() &&
                self.faxNumber() === other.faxNumber());
      };
      
      self.compareTo = function (other) {
          return (self.alias() === other.alias() &&
                //  self.prefix() === other.prefix() &&
                //self.firstName() === other.firstName() &&
                //self.middleName() === other.middleName() &&
                //self.lastName() === other.lastName() &&
                //self.suffix() === other.suffix() &&
                  self.address1() === other.address1() &&
                  self.address2() === other.address2() &&
                  self.address3() === other.address3() &&
                  self.city() === other.city() &&
                  self.state() === other.state() &&
                  self.postalCode() === other.postalCode() &&
                  self.country() === other.country() &&
                  self.county() === other.county() &&
                  self.phoneNumber() === other.phoneNumber() &&
                  self.jobTitle() === other.jobTitle() &&
                  self.companyName() === other.companyName() &&
                  self.faxNumber() === other.faxNumber());
        };
      
      /**
       * Determine whether this address has any fields which are
       * marked as modified.
       *
       * @function
       * @name Address#isModified
       * @returns {boolean} true if the address is modified, otherwise false.
       */
      self.isModified = function () {

        return (self.alias.isModified() || 
                self.firstName.isModified() || 
                self.lastName.isModified() ||
                self.address1.isModified() ||
                self.address2.isModified() ||
                self.address3.isModified() ||
                self.county.isModified() ||
                self.city.isModified() ||
                self.state.isModified() ||
                self.postalCode.isModified() ||
                self.phoneNumber.isModified() ||
                self.country.isModified() ||
                self.isDefaultAddress.isModified() ||
                self.isDefaultBillingAddress.isModified() ||
                self.isDefaultShippingAddress.isModified() ||
                self.companyName.isModified());
      };
      
      /**
       * Determine whether this address has fields empty or not.
       *
       * @function
       * @name Address#isEmpty
       * @returns {boolean} true if the address is empty, otherwise false.
       */
      self.isEmpty = function () {

          return (self.alias() == "" &&
                  self.firstName() == "" &&
                  self.lastName() == "" &&
                  self.address1() == "" &&
                  self.address2() == "" &&
                  self.city() == "" &&
                  self.state() == "" &&
                  self.postalCode() == "");
        };
      
        self.isValidForSelfRegistration = function(){         
          return(self.address1.isValid()    &&
          self.address2.isValid()    &&
          self.address3.isValid()    &&
          self.city.isValid()        &&
          self.state.isValid()       &&
          self.postalCode.isValid()  &&
          self.country.isValid()     &&
          self.phoneNumber.isValid() &&
          self.companyName.isValid());
        };
      /**
       * Determine whether or not the current Address object is valid
       * based on the validity of its component parts. This will not
       * cause error messages to be displayed for any observable values
       * that are unchanged and have never received focus on the 
       * related form field(s).
       * 
       * @name Address#isValid
       * @function
       * @returns {boolean} <code>true</code> if address is valid, otherwise
       * <code>false</code>.
       */
      self.isValid = function() {
        return (self.alias.isValid()       &&
                self.prefix.isValid()      &&
                self.firstName.isValid()   &&
                self.middleName.isValid()  &&
                self.lastName.isValid()    &&
                self.suffix.isValid()      &&
                self.address1.isValid()    &&
                self.address2.isValid()    &&
                self.address3.isValid()    &&
                self.city.isValid()        &&
                self.state.isValid()       &&
                self.postalCode.isValid()  &&
                self.country.isValid()     &&
                self.phoneNumber.isValid() &&
                self.jobTitle.isValid()    &&
                self.companyName.isValid() &&
                self.faxNumber.isValid()   &&
                self.type.isValid());
      };
      
      /**
       * Determine whether or not the country, state and postalCode is valid
       * based on the validity of its component parts.
       * 
       * @name Address#validateForShippingMethod 
       * @function
       * @returns {boolean} <code>true</code> if address is a valid shipping 
       * address, otherwise <code>false</code>.
       */
      self.validateForShippingMethod = function() {
        return (self.country.isValid()   &&
            self.state.isValid()  &&
            self.postalCode.isValid());
      };
      
      /**
       * Force all relevant member observables to perform their
       * validation now & display the errors (if any).
       * 
       * @name Address#validateNow
       * @function
       * @returns {boolean} <code>true</code> if address is valid after forcing 
       * validation, otherwise <code>false</code>.
       */
      self.validateNow = function() {
        self.alias.isModified(true);
        self.prefix.isModified(true);
        self.firstName.isModified(true);
        self.middleName.isModified(true);
        self.lastName.isModified(true);
        self.suffix.isModified(true);
        self.address1.isModified(true);
        self.address2.isModified(true);
        self.address3.isModified(true);
        self.city.isModified(true);
        self.state.isModified(true);
        self.postalCode.isModified(true);
        self.country.isModified(true);
        self.county.isModified(true);
        self.phoneNumber.isModified(true);
        self.jobTitle.isModified(true);
        self.companyName.isModified(true);
        self.faxNumber.isModified(true);
        self.type.isModified(true);
        
        return(self.isValid());
      };
      
      /**
       * Clears the data and errors associated with this object.
       * 
       * @name Address#reset
       * @function
       */
      self.reset = function() {
        self.alias('');
        self.firstName('');
        self.lastName('');
        self.address1('');
        self.address2('');
        self.address3('');
        self.city('');
        self.county('');
        self.selectedState('');
        self.state('');
        self.postalCode('');
        self.selectedCountry('');
        self.country('');
        self.phoneNumber('');
        self.companyName('');
        self.email(null);
        self.isDefaultAddress(false);
        self.isDefaultBillingAddress(false);
        self.isDefaultShippingAddress(false)
        self.alias.isModified(false);
        self.firstName.isModified(false);
        self.lastName.isModified(false);
        self.address1.isModified(false);
        self.address2.isModified(false);
        self.address3.isModified(false);
        self.county.isModified(false)
        self.city.isModified(false);
        self.state.isModified(false);
        self.postalCode.isModified(false);
        self.country.isModified(false);
        self.phoneNumber.isModified(false);
        self.isDefaultAddress.isModified(false);
        self.selectedCountry(self.defaultCountry());
      };
      
      /**
       * Copy this Address data to target Address object.
       * 
       * @name Address#copyTo
       * @function
       * @param {Address} target Target object whose contents will be replaced.
       * @returns {Address} Target address with updated contents.
       */
      self.copyTo = function(target) {
        
        var mapping = {'ignore':['invalidTracker', 'saveToAccount', 'saveAddressTo']};
        var copy = ko.mapping.toJS(self, mapping);
        var jsonStringifyAddress = JSON.stringify(copy);
        ko.mapping.fromJS(JSON.parse(jsonStringifyAddress),self.listOfCopyToIgnoreProperties(),target);
        target.alias(self.alias() || '');
        target.prefix(self.prefix() || '');
        target.firstName(self.firstName() || '');
        target.middleName(self.middleName() || '');
        target.lastName(self.lastName() || '');
        target.suffix(self.suffix() || '');
        
        target.address1(self.address1() || '');
        target.address2(self.address2() || '');
        target.address3(self.address3() || '');
        target.city(self.city() || '');
        target.postalCode(self.postalCode() || '');
        target.county(self.county() || '');
        target.email(ko.utils.unwrapObservable(self.email));


        // Set selectedCountry & selectedState rather than
        // country and state directly or KO can get
        // a bit confused and reset the values
        target.selectedCountry(self.selectedCountry());
        target.selectedState(self.selectedState());
        
        target.phoneNumber(self.phoneNumber() || '');
        
        target.jobTitle(self.jobTitle() || '');
        target.companyName(self.companyName() || '');
        target.faxNumber(self.faxNumber() || '');
        target.repositoryId = self.repositoryId;
        target.isDefaultAddress(self.isDefaultAddress() || false);
        target.isDefaultBillingAddress(self.isDefaultBillingAddress() || false);
        target.isDefaultShippingAddress(self.isDefaultShippingAddress() || false);
        target.type(self.type() || '');
        target.__ko_mapping__.ignore=[];
      
        return target;
      };
      
      /**
       * Create a JSON representation of the contents of this address obj
       * only retaining address data and removing static fields.
       * 
       * @name Address#toJSON
       * @function
       * @returns JSON representation of address data. 
       */
      self.toJSON = function() {
        /** Get a clean copy
        * Agent was using invalidTracker for OJET validations.
        * But this had reference to all the OJET element in the form and 
        * hence causing the delay in the toJS() function execution
        * There will be no impact if the invalidTracker is not in the object being passed.
        * It will be handled by the mapping function.
        */
        var mapping = {'ignore':['invalidTracker', 'saveToAccount', 'saveAddressTo'],
                       'include': ["address1","address2","address3","alias","city","companyName","country","countryName",
                                   "county","faxNumber","firstName","isDefaultAddress","jobTitle","lastName","middleName",
                                   "phoneNumber","postalCode","prefix","suffix","regionName","repositoryId","state",
                                   "selectedState","selectedCountry","isDefaultBillingAddress","isDefaultShippingAddress","isDefaultAddress","toJSON","state_ISOCode"]};
        var copy = ko.mapping.toJS(this, mapping);
        
        if(!copy.email) {
          copy.email = null;
        }
        
        // Remove what shouldn't be sent 
        delete copy.countryList;
        delete copy.stateList;
        delete copy.stateIsDropDown;
        delete copy.postalCodePattern;
        delete copy.US_POSTAL_CODE_PATTERN;
        delete copy.CANADA_POSTAL_CODE_PATTERN;
        delete copy.DEFAULT_POSTAL_CODE_PATTERN;        
        delete copy.countriesList;

        return copy;
      };
      
      /**
       * @name Address#listOfCopyToIgnoreProperties
       * @function
       * the list of properties to ignore while copying dynamic properties to address object
       */
      self.listOfCopyToIgnoreProperties = function() {
       var ignoreProperties = {
        'ignore': ["alias","prefix","firstName","lastName","middleName","suffix","address1","address2",
                   "address3","city","postalCode","county","email","selectedState","selectedCountry","phoneNumber",
                   "jobTitle","companyName","faxNumber","repositoryId","isDefaultAddress","isDefaultBillingAddress",
                   "isDefaultShippingAddress","type","computedCountry","computedState"]
       }
      return ignoreProperties;
      }
      
      /**
       * @name Address#listOfCopyFromIgnoreProperties
       * @function
       * the list of properties to ignore while copying dynamic properties to address object
       */
      self.listOfCopyFromIgnoreProperties = function() {
       var ignoreProperties = {
        'ignore': ["address1","address2","address3","alias","city","companyName","country","countryName",
                    "county","faxNumber","firstName","isDefaultAddress","jobTitle","lastName","middleName",
                    "phoneNumber","postalCode","prefix","suffix","regionName","repositoryId","state",'invalidTracker',
                    "computedCountry","computedState"]
       }
      return ignoreProperties;
      }

      /**
       * Copy contents of another Address object into this Address.
       * As with CopyTo, allow state and country to be populated based on the
       * values of selectedState and selectedCountry or knockout might get
       * confused.
       * 
       * (Also the developer might get confused by what they see in the app!)
       * 
       * @name Address#copyFrom
       * @function 
       * @param {Address} data Source address from which data is copied.
       * @param {Country[]} countries List of Country objects providing
       * <code>&#123;countryCode, displayName&#125;</code>, and used to populate
       * the selectedCountry, country, selectedState, and state fields.
       */
      self.copyFrom = function(data, countries) {
        self = this;
        var states;
        var countryFound = false;
        ko.mapping.fromJS(data,self.listOfCopyFromIgnoreProperties(),self);
        self.alias(data.alias || '');
        self.firstName(data.firstName || '');
        self.middleName(data.middleName || '');
        self.lastName(data.lastName || ''); 
        self.address1(data.address1 || '');
        self.address2(data.address2 || '');
        self.address3(data.address3 || '');
        self.city(data.city || '');
        self.county(data.county || '');
        self.postalCode(data.postalCode || '');
        self.phoneNumber(data.phoneNumber || '');
        self.prefix(data.prefix || '');
        self.suffix(data.suffix || '');
        if(ko.isObservable(self.email)){
          self.email(data.email);
        }
        self.repositoryId = data.repositoryId;

        if (data.selectedCountry) {
          self.selectedCountry(data.selectedCountry); 
        } else {
        if(countries){
          $.each(countries, function(index, obj) {
            if (obj.countryCode === data.country) {
              countryFound = true;
              self.selectedCountry(obj.countryCode);
              states = obj.regions;
              return false;
            }
          });
          if(countryFound === false){
            self.selectedCountry('');
          }
        }
        }
        if (data.selectedState) {
          self.selectedState(data.selectedState);
        } else {
          if (states) {
            $.each(states, function(index, obj) {
              if (obj.abbreviation === data.state) {
                self.selectedState(obj.abbreviation);
                self.state_ISOCode(obj.regionCode);
                return false;
              }
            });
          }
        }
        self.jobTitle(data.jobTitle || '');
        self.companyName(data.companyName || '');
        self.faxNumber(data.faxNumber || '');
        self.isDefaultAddress(data.isDefaultAddress || false);
        self.isDefaultBillingAddress(data.isDefaultBillingAddress || false);
        self.isDefaultShippingAddress(data.isDefaultShippingAddress || false);
        self.type(data.type || '');
        self.__ko_mapping__.ignore=[];
      };
      
      /**
       * Resets modified properties of all fields to false.
       * 
       * @name Address#resetModified
       * @function
       */
      self.resetModified = function() {
        self.alias.isModified(false);
        self.companyName.isModified(false);
        self.firstName.isModified(false);
        self.lastName.isModified(false);
        self.address1.isModified(false);
        self.address2.isModified(false);
        self.city.isModified(false);
        self.state.isModified(false);
        self.postalCode.isModified(false);
        self.country.isModified(false);
        self.phoneNumber.isModified(false);
        self.isDefaultAddress.isModified(false);
        self.isDefaultBillingAddress.isModified(false);
        self.isDefaultShippingAddress.isModified(false);
      };
      
     /**
      * Default country will be the first one in the countries list.
      * 
      * @name Address#defaultCountry
      * @function
      * @returns {string} The value of the <code>defaultCountryCode</code> 
      * property if set.
      * If not set, the first country code in the <code>countriesList</code> 
      * property will be returned.
      * Also, if the <code>countriesList</code> is empty, the function will
      * return 'undefined'.
      */
      self.defaultCountry = function() {
        if (self.countriesList() && (self.countriesList().length > 0 )) {
          if (self.defaultCountryCode() !== null) {
            for (var i in self.countriesList()){
              if (self.defaultCountryCode() === self.countriesList()[i].countryCode) {
                return self.defaultCountryCode();
              }
            } 
          }         
          return self.countriesList()[0].countryCode;         
        }
      };

      self.selectedCountry(self.defaultCountry());

      /**
       * This method populates address dynamic property meta data into
       * dynamic property meta container view model.
       *
       * @function
       * @name Address#populateDynamicPropertyMetaData
       */
      self.populateDynamicPropertiesMetaData = function() {
        var self = this;
        var params = {};
        params[CCConstants.PARENT] = CCConstants.ENDPOINT_CONTACT_INFO_TYPE;
        if (self.dynamicPropertyMetaInfo && self.dynamicPropertyMetaInfo.dynamicPropertyMetaCache &&
          !self.dynamicPropertyMetaInfo.dynamicPropertyMetaCache.hasOwnProperty(CCConstants.ENDPOINT_CONTACT_INFO_TYPE)) {

          ccRestClient.request(CCConstants.ENDPOINT_GET_ITEM_TYPE, params,
            //success callback
            function(dynamicPropData){
              self.dynamicPropertyMetaInfo.intializeDynamicProperties(dynamicPropData.specifications, CCConstants.ENDPOINT_CONTACT_INFO_TYPE);
            },
            //error callback
            function(dynamicPropData) {
            },
            CCConstants.ENDPOINT_CONTACT_INFO_TYPE);
        }
      };

      return self;
  }
    
    return Address;
});

