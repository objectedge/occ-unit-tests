/**
 * @fileoverview Knockout validation rules for Cloud Commerce - Social.
 *
 */
/*global $ : false */
/*jslint sub : true */
define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'swmKoValidateRules',
    
  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['knockout', 'jqueryui', 'koValidate'],
    
  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (ko, jQueryUI, koValidate) {

    "use strict";

    /**
       Adds a multiple email addresses separated by a comma or semicolon validation rule to koValidate.
       @public
       @requires koValidate
       @name multiemail
       @memberof koValidation
       @param val the email addresses to be validated
       @param validate true or false
       @example
       self.inviteRecipients.extend({ multiemail: true });
       @example
       self.inviteRecipients.extend({ multiemail:{ params: true, message errorMsg } }
     */
    ko.validation.rules['multiemail'] = {
      validator: function (val, validate) {
        if (!validate) { 
          return true;
        }
  
        var isValid = true;
        if (!ko.validation.utils.isEmptyVal(val)) {
          // use the required: true property if you don't want to accept empty values
          var values = val.replace(/,/g,';').split(';');
          $(values).each(function (index) {
            isValid = ko.validation.rules['email'].validator($.trim(this), validate);
            return isValid; // short circuit each loop if invalid
          });
        }
        return isValid;
      },
      message: 'Please enter valid email addresses (separate multiple email addresses using a colon or semicolon).'
    };
  
    /**
      Adds a multiple email addresses separated by a comma or semicolon validation rule to koValidate.
      @public
      @requires koValidate
      @name multiemailmax
      @memberof koValidation
      @param val the email addresses to be validated
      @param max the maximum count of addresses allowed
      @example
      self.inviteRecipients.extend({ multiemail: true });
      @example
      self.inviteRecipients.extend({ multiemail:{ params: true, message errorMsg } }
    */
    ko.validation.rules['multiemailmax'] = {
      validator: function (val, max) {
        if (!max) { 
          return false;
        }
  
        if (!ko.validation.utils.isEmptyVal(val)) {
          // normalize colons with semicolon delimiter
          var valuesStr = val.trim().replace(/,/g,';');
          // tokenize values
          var values = valuesStr.split(';');
          // check count
          var count = values.length;
          // check for ending delimiter and adjust count
          if (valuesStr.charAt(valuesStr.length-1) == ';') {
            count = count-1;
          }
          // check for max
          if (count > max ) {
            return false; 
          }
        }
        return true;
      },
      message: 'Please limit the number of valid email addresses'
    };
    
    ko.validation.rules['uniquespacename'] = {
      validator: function(val, spaces) {
      // passed in spaces in an ko.observable array, to keep the values updated.
        var mySpacesArray = ko.utils.unwrapObservable(spaces);
        var valueTrimmed = val.trim().replace(/\s+/g, ' ');
        if (Array.isArray(mySpacesArray)){
          for (var i=0; i<mySpacesArray.length; i++) {
            var currSpaceNameUpper;
            if (typeof mySpacesArray[i].spaceNameFull === 'string') {
              currSpaceNameUpper = mySpacesArray[i].spaceNameFull.toUpperCase();
            }
            else {
              currSpaceNameUpper = mySpacesArray[i].spaceNameFull().toUpperCase();
            }
            
            if (currSpaceNameUpper == valueTrimmed.toUpperCase()) {
              return false;
            }
          }
        }
        return true;
      },
      message: 'Name must be unique'
    };

    ko.validation.rules['editSpaceNameUniqueRule'] = {
      validator: function(val, obj) {
        var valueTrimmed = val.trim().replace(/\s+/g, ' ');
        var valSpaceId = obj.currentSpaceId;
        var mySpaces = ko.utils.unwrapObservable(obj.spaces);
        if (Array.isArray(mySpaces)){
          for (var i=0; i<mySpaces.length; i++) {
            var spaceNameFullUpperString;
            if (typeof mySpaces[i].spaceNameFull === 'string') {
              spaceNameFullUpperString = mySpaces[i].spaceNameFull.toUpperCase();
            }
            else {
              spaceNameFullUpperString = mySpaces[i].spaceNameFull().toUpperCase();
            }
            if (spaceNameFullUpperString == valueTrimmed.toUpperCase()) {
              if(mySpaces[i].spaceid == valSpaceId){
                continue;
              }
              return false;
            }
          }
        }
        return true;
      },
      message: 'Name must be unique'
    };
    
    ko.validation.rules['badrequestinvalidemail'] = {
      validator: function(val) {
        return false;
      },
      message: 'Please type in valid email addresses for your recipients.'
    };
    
    ko.validation.rules['badrequestspacename'] = {
      validator: function(val) {
        return false;
      },
      message: 'Name must be unique'
    };
      
    // Register Extenders
    ko.validation.registerExtenders();
  }
);

