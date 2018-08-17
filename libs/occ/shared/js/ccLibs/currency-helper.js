/*global $ */

define('currencyHelper',
['knockout', 'ccRestClient', 'ccConstants', 'numberFormatHelper', 'pubsub'],

function(ko, ccRestClient, ccConstants, numberFormatHelper, PubSub) {
  "use strict";

  /**
   * Creates a CurrencyHelper
   */
  function CurrencyHelper() {
    var self = this;
    this.currencyObject = ko.observable(null);
    this.currencyMapObject = ko.observable(null);
    this.setFractionalDigits = ko.observable(null);

    /**
     * Currencies
     */
    this.currencies = ko.observableArray([]);
    this.currenciesLoaded = false;

    /**
     * Price list groups
     */
    this.priceListGroups = ko.observableArray([]);
    this.defaultPriceListGroup = null;
    this.priceListGroupsLoaded = false;

    // pubsub subscribe to trigger refresh on price list group
    this.getCurrencyMapCurrenciesBinding = this.getCurrencyMapCurrencies.bind(this);
    $.Topic(PubSub.topicNames.PRICE_LIST_GROUP_UPDATE).subscribe(this.getCurrencyMapCurrenciesBinding);
    $.Topic(PubSub.topicNames.ADMIN_CONTENT_LANGUAGE_CHANGED).subscribe(this.getCurrencyMapCurrenciesBinding);

    return (this);
  }

  // Constants
  CurrencyHelper.prototype.DECIMAL_NUMBER_FORMAT = "decimal";

  /**
   * REST call to retrive currency data
   */
  CurrencyHelper.prototype.getCurrency = function(pSuccessCallback, pErrorCallback) {
    var url = ccConstants.ENDPOINT_CURRENCIES_LIST_CURRENCIES;
    var data = {};
    if(pSuccessCallback == null ) {
      pSuccessCallback = this.getCurrencySuccess.bind(this);
    }
    if(pErrorCallback == null) {
      pErrorCallback = this.getCurrencyError.bind(this);
    }
    ccRestClient.request(url, data, pSuccessCallback, pErrorCallback);
  };

  /**
   * Success function for getCurrency()
   * @param {Object} result : REST call response
   */
  CurrencyHelper.prototype.getCurrencySuccess = function(response) {
    this.currencyObject(response.selectedCurrency);
    this.checkCurrencySymbol();
  };

  /**
   * Error function for getCurrency()
   * @param {Object} result : REST call response
   */
  CurrencyHelper.prototype.getCurrencyError = function(response) {
    throw "Not Implemented";
  };

  CurrencyHelper.prototype.getCurrencies = function(successFunc) {
    var url = ccConstants.ENDPOINT_CURRENCIES_LIST_CURRENCIES;
    var data = {sort: "currencyCode:asc"};
    ccRestClient.request(url, data, successFunc, this.getCurrenciesError.bind(this));
  };

  CurrencyHelper.prototype.getCurrenciesError = function(response) {
    throw "Not Implemented";
  };

  CurrencyHelper.prototype.getPriceListGroups = function(successFunc) {
    var url = ccConstants.ENDPOINT_LIST_PRICE_LIST_GROUPS;
    var data = {includeDeleted: "true"};
    ccRestClient.request(url, data, successFunc, this.getPriceListGroupsError.bind(this));
  };

  CurrencyHelper.prototype.getPriceListGroupsError = function(response) {
    throw "Not Implemented";
  };

  CurrencyHelper.prototype.getPLGCurrencies = function(currenciesFunc) {
    this.getCurrencies(function(result) {
      this.currencies(result.items);
      this.currenciesLoaded = true;
      if (this.priceListGroupsLoaded) {
        this.formatCurrenciesForList(currenciesFunc);
      }
    }.bind(this));

    this.getPriceListGroups(function(result) {
      this.priceListGroups(result.items);
      this.defaultPriceListGroup = result.defaultPriceListGroup;
      this.priceListGroupsLoaded = true;
      if (this.currenciesLoaded) {
        this.formatCurrenciesForList(currenciesFunc);
      }
    }.bind(this));
  };

  /**
   * Find only those currencies used by price list groups
   * Pass the results to a callback function
   */
  CurrencyHelper.prototype.formatCurrenciesForList = function(currenciesFunc) {
    var formattedCurrencies = [];

    var priceListGroups = this.priceListGroups();

    var displayList = [];
    var i, j; // Loop iterators
    processPLGs: for (i = 0; i < priceListGroups.length; i++) {
      var currency = {};
      currency.repositoryId = priceListGroups[i].currency.repositoryId;
      currency.currencyCode = priceListGroups[i].currency.currencyCode;
      // Check this currency hasn't already been added from another Price List Group
      for (j = 0; j < displayList.length; j++) {
        if (displayList[j].repositoryId === priceListGroups[i].currency.repositoryId) {
          continue processPLGs; // jump back to the parent for(...) loop
        }
      }
      // Currency isn't yet in the display list. Also, we want to show values like "USD - US Dollar"
      // The listPLG endpoint uses asset locale so won't match browser's locale.
      // Currency endpoint doesn't have this issue. So get the display value from that instead... first,
      // get a default.

      currency.selectListDisplayName = priceListGroups[i].currency.currencyCode + " - " + priceListGroups[i].currency.displayName;
      currency.fractionalDigits = priceListGroups[i].currency.fractionalDigits;
      if (currency.repositoryId === this.defaultPriceListGroup.locale) {
        currency.isDefault = true;
      }
      for (j = 0; j < this.currencies().length; j++)
        if (this.currencies()[j].currencyCode === priceListGroups[i].currency.currencyCode)
          currency.selectListDisplayName = priceListGroups[i].currency.currencyCode + " - " + this.currencies()[j].displayName;
      displayList.push(currency);
    }
    // Sort by the display names
    displayList.sort(function (a, b) {
      return a.selectListDisplayName.localeCompare(b.selectListDisplayName);
    });

    currenciesFunc(displayList);
  };

  /**
   * Alphanumeric check on currency symbol
   * For alphanumeric currency symbols, add a space
   */
  CurrencyHelper.prototype.checkCurrencySymbol = function() {
    if(this.currencyObject().symbol.match(/^[0-9a-zA-Z]+$/)) {
      this.currencyObject().symbol = this.currencyObject().symbol + ' ';
    }
  };


  /**
   * Adjust the currency display based on the current currencies fractionalDigits
   * @param {String} number: The value to be formatted
   */
  CurrencyHelper.prototype.handleFractionalDigits = function(number, setFractionalDigits) {
    var fractionalDigits;

    // if the currencyObject() has no data, default to a fractional precision of 2
    if(typeof setFractionalDigits === 'number') {
      fractionalDigits = setFractionalDigits;
    } else {
      if(!this.currencyObject()) {
        fractionalDigits = 2;
      } else {
        fractionalDigits = this.currencyObject().fractionalDigits;
      }
    }

    if(number === null || number ==='') {
      return number;
    }

    return Number(number).toFixed(fractionalDigits);
  };
  

  /**
   * Adjust the currency display based on the current currencies fractionalDigits and locale using Jet converter
   * @param {String} number: The value to be formatted
   */
  CurrencyHelper.prototype.handleFractionalDigitsAndLocale = function(number) {
    var fractionalDigits;

    if(this.setFractionalDigits() !== null) {
      fractionalDigits = this.setFractionalDigits();
    } else {
      // if the currencyObject() has no data, default to a fractional precision of 2
      if (!this.currencyObject()) {
        fractionalDigits = 2;
      } else {
        fractionalDigits = this.currencyObject().fractionalDigits;
      }
    }

    if (number == null || number === '') {
      return number;
    }
    number = numberFormatHelper.formatNumber(number, fractionalDigits, this.DECIMAL_NUMBER_FORMAT);
    return number;
  };

  /**
   * Endpoint call to get the priceGroupList
   **/
  CurrencyHelper.prototype.getCurrencyMapCurrencies = function() {
    var data = {};
    data.defaultFirst = true;
    ccRestClient.request(
      ccConstants.ENDPOINT_LIST_PRICE_LIST_GROUPS,
      data,
      this.getCurrencyMapCurrenciesSuccess.bind(this),
      this.getCurrencyMapCurrenciesError.bind(this)
    );
  };

  /**
   * Success function for getCurrencyMapCurrencies()
   * @param {Object} pResult : REST call response
   **/
  CurrencyHelper.prototype.getCurrencyMapCurrenciesSuccess = function(pResult) {
    // make the default price list group id more easily accessible within viewModels
    pResult['defaultPriceListGroupId'] = pResult.defaultPriceListGroup.id;

    $.each(pResult.items, function(ii){
      pResult.items[ii]['isDefaultPriceListGroup'] = pResult.items[ii].id === pResult.defaultPriceListGroup.id;
    });

    this.currencyMapObject(pResult);
  };

  /**
   * Error function for getCurrencyMapCurrencies()
   * @param {Object} pResult : REST call response
   **/
  CurrencyHelper.prototype.getCurrencyMapCurrenciesError = function(pResult) {};

  /**
   * return the model
   **/
  return new CurrencyHelper();
});
