/**
 * @fileoverview pageViewTracker
 * this is for handling the page views
 * 
 */
/*global $, localStorage */
define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'pageViewTracker',
  
  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['knockout', 'ccRestClient', 'ccConstants', 'storageApi'],
    
  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (ko, ccRestClient, ccConstants, storageApi) {
  
    "use strict";
    
    /**
     * Helper Model for page view event.
     * currently this includes only page views count as part of the constructor.
     * can be extended to add visitId and VisitorId.
     */
    function PageViewEvent(pageViewsCount) {
      var self = this;
      self.pageViews = ko.observable(pageViewsCount);
    }

    function PageViewTracker() {
      var self = this;
      this.tenantId = ko.observable();
      this.visitId = ko.observable();
      this.visitorId = ko.observable();
      this.visitDetailsChanged = ko.observable(false);
      
      /**
       * This method creates a new page event.
       * currently this includes only page views.
       * can be extended to add visitId and VisitorId.
       */
      self.createPageViewEvent = function(pageViewsCount) {
        var pageViewEvent = new PageViewEvent(pageViewsCount);
        return pageViewEvent;
      };

      /**
       * Utility method to fetch the value of visitor ID
       */
      self.getVisitorId = function() {
          return storageApi.getInstance().getItem(ccConstants.VISITOR_ID);
      };

      /**
       * Utility method to fetch the value of visit ID
       */
      self.getVisitId = function() {
           return storageApi.getInstance().getItem(ccConstants.VISIT_ID);
      };
      

      /**
       *This function updates the visit details locally and then
       *persists them.
       */
      self.handleVisitDetails = function() {
        var self = this;
        
        if (self.visitorId || self.visitId) {
            var localVisitorId = self.getVisitorId();
            var localVisitId =  self.getVisitId();
            
            if (!localVisitorId || localVisitorId != self.visitorId()) {
            	self.visitorId(localVisitorId);
            	self.visitDetailsChanged(true);
            }
            if (!localVisitId || localVisitId != self.visitId()) {
        	  	self.visitId(localVisitId);	
        	  	self.visitDetailsChanged(true);
            }   
            if(self.visitDetailsChanged()){
            	self.persistVisitDetails(self.visitorId(),self.visitId());
            	self.visitDetailsChanged(false);
            }
          }
      };
      
      /**
       * This function sends visitorId and visitId to 
       *  Platform REST end-point.
       */
      self.persistVisitDetails = function(visitorId, visitId) {
        var inputData = {};
        inputData[ccConstants.VISITOR_ID] = visitorId;
        inputData[ccConstants.VISIT_ID] = visitId;
        var url = ccConstants.ENDPOINT_SAVE_VISIT_DETAILS;
        var successFunc = function(data) {};
        var errorFunc = function(data) {};

        ccRestClient.request(url, inputData, successFunc, errorFunc);
      };
      
      /**
       * This method triggers the page views end point to 
       * update the pageview count.
       */
      self.recordPageChange = function(pageViewEvent) {
        var self = this;
        
        var input = {pageViews: pageViewEvent.pageViews()};
        var url = ccConstants.ENDPOINT_RECORD_PAGEVIEWS_COUNT;
        var successFunc = function(data) {};
        var errorFunc = function(data) {};
        
        ccRestClient.request(url, input, successFunc, errorFunc);
      };
      
      return self;
    }
    
    
    return new PageViewTracker();
  }
);

