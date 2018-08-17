/**
 * @fileoverview Price List Group View Model.
 *  * 
 * 
 * @typedef {Object} PaymentDetails
 */
/*global define */
define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'pageLayout/site',

  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['knockout', 'ccRestClient', 'ccConstants', 'jquery', 'storageApi', 'pageViewTracker', 'pageLayout/currency'],

  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function(ko, ccRestClient, CCConstants, $, storageApi, pageViewTracker, currencyViewModel) {
  
    "use strict";

    function SiteViewModel(pAdapter, data, pContextData) {

      if (SiteViewModel.singleInstance) {
        throw new Error("Cannot instantiate more than one SiteViewModel, use getInstance(pAdapter, data, pParams)");
      }
      
      var self = this;
      self.currencyViewModel = currencyViewModel.getInstance();
      // Provide price list group object to all widgets.
      self.selectedPriceListGroup = ko.observable(data ? data.priceListGroup.defaultPriceListGroup : null);
      self.activePriceListGroups = ko.observableArray([]);
      self.siteSecondaryCurrency = ko.observable(null);
      self.siteSecondaryCurrencyCode = null;
      self.priceListGroupDeferred = $.Deferred();
      if (self.selectedPriceListGroup()) {
        self.priceListGroupDeferred.resolve();
      }

      self.exchangeRate = ko.observable(null);
      self.payShippingInSecondaryCurrency = ko.observable(false);
      self.payTaxInSecondaryCurrency = ko.observable(false);

      self.siteLoadedDeferred = $.Deferred();
      self.siteSecondaryInfoLoaded = $.Deferred();

      // No-Image Image Source
      var noImageSrc = '/img/no-image.jpg';

      if (data && data.siteInfo && data.siteInfo.noimage) {
        noImageSrc = data.siteInfo.noimage
      }

      self.getCurrency = function(currencyCode) {
        return self.currencyViewModel.currencyMap[currencyCode];
      };

      self.setSiteSecondaryCurrency = function() {
        self.siteSecondaryCurrency(self.getCurrency(self.siteSecondaryCurrencyCode));
      };
      $.when(self.currencyViewModel.siteCurrenciesLoaded, self.siteSecondaryInfoLoaded).done(function() {
        self.setSiteSecondaryCurrency();
        self.siteLoadedDeferred.resolve();
      });

      self.noImageSrc = ko.observable(noImageSrc);
      //var data = {};
      if(data != null){
      ccRestClient.request(CCConstants.ENDPOINT_SITES_GET_SITE, {},
        function(data) {
          self.siteSecondaryCurrencyCode = data.secondaryCurrency;
          self.exchangeRate(data.exchangeRate?data.exchangeRate:null);
          self.payShippingInSecondaryCurrency(data.payShippingInSecondaryCurrency?data.payShippingInSecondaryCurrency:false);
          self.payTaxInSecondaryCurrency(data.payTaxInSecondaryCurrency?data.payTaxInSecondaryCurrency:false);          
          self.siteSecondaryInfoLoaded.resolve();
        },
        function(errorData) {
          console.log("site failed")
        },
      data.siteInfo.id);
      }

      self.updateSiteSecondaryCurrencyCode = function(newSecondaryCurrencyCode) {
        if (newSecondaryCurrencyCode && newSecondaryCurrencyCode != self.siteSecondaryCurrencyCode) {
          self.siteSecondaryCurrencyCode = newSecondaryCurrencyCode;
          self.setSiteSecondaryCurrency();
        }
      }
      return (self);
    };

    /**
     * Returns the current site locale
     * @function
     * @name SiteViewModel.getCurrentLocale
     */
    SiteViewModel.prototype.getCurrentLocale = function() {
      var storedLocale = ccRestClient.getStoredValue(CCConstants.LOCAL_STORAGE_USER_CONTENT_LOCALE);
      if(storedLocale != null) {
         return JSON.parse(storedLocale)[0].name
      } else {
         return $(':root').attr('lang');
      }
    }

    SiteViewModel.prototype.setContextData = function(data) {
      var self = this;
      // Populating view model with server data.
      for (var key in data) {
        self[key] = data[key];
      }
      
      if (self.selectedPriceListGroup() || data.priceListGroup) {
        var isActive = false;
        var storedPriceListGroupId = JSON.parse(ccRestClient.getStoredValue(CCConstants.LOCAL_STORAGE_PRICELISTGROUP_ID));
        // Check whether the selected price list group is still active
        for (var i =  0; i < self.priceListGroup.activePriceListGroups.length; i++) {
          if (storedPriceListGroupId && storedPriceListGroupId == self.priceListGroup.activePriceListGroups[i].id) {
            self.selectedPriceListGroup(self.priceListGroup.activePriceListGroups[i]);
            isActive = true;
            break;
          }
        }
        if (data.priceListGroup && !isActive) { // If the selected price list group is not active then set default price list group
          self.selectedPriceListGroup(data.priceListGroup.defaultPriceListGroup);
        }
        if (self.priceListGroupDeferred.state() === "pending") {
          self.priceListGroupDeferred.resolve();
        }
      }
      if(data.priceListGroup) {
        self.activePriceListGroups(data.priceListGroup.activePriceListGroups);
      }

      if (data && data.hasOwnProperty('siteInfo') && data.siteInfo.hasOwnProperty('noimage')) {
        self.noImageSrc(data.siteInfo.noimage ? data.siteInfo.noimage : '/img/no-image.jpg');
      }
      
    };

    /**
     * This method initializes the visitor service by loading the configured java script asynchronously.
     * @param {Object} [data] Additional data.
     */
    SiteViewModel.initializeVisitorService = function(data) {
      if (data && data.visitorServiceHost && data.tenantId && data.oracleUnifiedVisitHost) {
         window.OracleUnifiedVisit = {
          accountId : data.tenantId + "_" + data.siteInfo.id,
          host : data.visitorServiceHost,
          handle : function() {
            window.ATGSvcs && ATGSvcs.visitIDsLoaded && ATGSvcs.visitIDsLoaded();
            storageApi.getInstance().setItem(CCConstants.VISITOR_ID,
                window.OracleUnifiedVisit.visitorId());
            storageApi.getInstance().setItem(CCConstants.VISIT_ID,
                window.OracleUnifiedVisit.visitId());
            pageViewTracker.handleVisitDetails();
          }
        };

        require([data.oracleUnifiedVisitHost]);
      }
    };

    /**
     * Return the single instance of PriceListGroup. Create it if it doesn't exist.
     * 
     * @function
     * @name PriceListGroup.getInstance
     * @param {RestAdapter} pAdapter The REST adapter.
     * @param {Object} [data] Additional data.
     * @return {PaymentDetails} Singleton instance.
     */
    SiteViewModel.getInstance = function(pAdapter, data, pParams) {
      if(!SiteViewModel.singleInstance) {
        SiteViewModel.singleInstance = new SiteViewModel(pAdapter, data, pParams);
        // We don't need the trackings for development
        // SiteViewModel.initializeVisitorService(data);
      }
      
      if (data) {
        SiteViewModel.singleInstance.setContextData(data);
      }
      
      return SiteViewModel.singleInstance;
    };

    return SiteViewModel;

  }
);

