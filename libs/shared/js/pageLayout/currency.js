/**
 * @fileoverview Currency View Model.
 *  *
 *
 * @typedef {Object} currency
 */
/*global define */
define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'pageLayout/currency',

  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['jquery', 'ccConstants', 'ccRestClient'],

  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function($, ccConstants, ccRestClient) {

    "use strict";

    function CurrencyViewModel() {

      if (CurrencyViewModel.singleInstance) {
        throw new Error("Cannot instantiate more than one CurrencyViewModel, use getInstance()");
      }

      var self = this;
      self.siteCurrenciesLoaded = $.Deferred();
      self.availableCurrencies = [];
      self.currencyMap = {};
      self.setAvailableCurrencies = function(){
        self.availableCurrencies.forEach(function (currencyMap) {
          self.currencyMap[currencyMap['currencyCode']] = currencyMap;
        });
        self.siteCurrenciesLoaded.resolve();
      }

      self.fetchCurrenciesSuccess = function (pResult) {
        if (pResult) {
          self.availableCurrencies = pResult.items;
        } else {
          self.availableCurrencies = [];
        }
        self.setAvailableCurrencies();
      };

      self.fetchCurrenciesFailure = function () {
        console.log("currencies loading failed");
      };

      self.fetchCurrencies = function () {
        var url = ccConstants.ENDPOINT_CURRENCIES_LIST_CURRENCIES;
        var data = {};
        ccRestClient.request(url, data, self.fetchCurrenciesSuccess, self.fetchCurrenciesFailure);
      }();

      return this;
    };

    /**
     * Return the single instance of CurrencyViewModel. Create it if it doesn't exist.
     *
     * @function
     * @name CurrencyViewModel.getInstance
     * @return {PaymentDetails} Singleton instance.
     */
    CurrencyViewModel.getInstance = function() {
      if(!CurrencyViewModel.singleInstance) {
        CurrencyViewModel.singleInstance = new CurrencyViewModel();
      }
      return CurrencyViewModel.singleInstance;
    };

    return CurrencyViewModel;

  }
);

