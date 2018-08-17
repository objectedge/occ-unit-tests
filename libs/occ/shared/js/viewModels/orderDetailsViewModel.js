define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'viewModels/orderDetailsViewModel',
  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['knockout', 'ccConstants', 'CCi18n','ccRestClient','notifier', 'ccStoreUtils'],
  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  //-------------------------------------------------------
  // View Model
  //-------------------------------------------------------

  /**
   * OrderDetailsViewModel. Order Details View Model,
   * used in populating Order Details and Return Item Details widget.
   * 
   * @public
   * @class
   * @name OrderDetailsViewModel
   * 
   * 
   * @property {string} approvalSystemMessages Approval System Message
   * @property {string} creationDate Creation Date		
   * @property {string} creationTime Creation Time
   * @property {string} id Order ID
   * @property {string} lastModifiedDate Last Modified Date
   * @property {string} orderLocale Order Locale
   * @property {string} orderProfileId Order Profile Id
   * @property {string} orderStatus Order Status
   * @property {string} organizationId Organization Id
   * @property {string} sourceSystem 
   * @property {string} state Order State
   * @property {string} submittedDate Order Submitted Date
   * @property {string} trackingNumber Tracking Number
   * @property {string} uuid
   * @property {Object} billingAddress Billing Address 
   * @property {Object} discountInfo   Discount Information
   * @property {Object} dynamicProperties
   * @property {Object} order Order Information
   * @property {Object} payments Payments
   * @property {Object} priceInfo 
   * @property {Object} priceListGroup Price List Group
   * @property {Object} shippingAddress Shipping Address
   * @property {Object} shippingGroup
   * @property {Object} shippingGroups
   * @property {Object} shippingMethod
   * @property {Object} taxPriceInfo Tax Price Info
   * @property {Object} trackingInfo
   * @property {observable<object>} getReturnhistoryInvoked Observable to track when Return history is invoked
   * @property {observable<Array>}  returnRequesthistoryArray Return requests containing return information
   */
  
  function (ko, ccConstants, CCi18n, CCRestClient, notifier, StoreUtils) {
    'use strict';
    
    function OrderDetailsViewModel(data) {
      var self = this;
      self.CCi18n = CCi18n;
      StoreUtils.fromJS(data, self, true);
      self.getReturnhistoryInvoked=ko.observable(false);
      self.returnRequesthistoryArray=ko.observableArray([]);
    }

    /**
     *  Fetches  the return history for the particular order.
     * @function OrderDetailsViewModel#getReturnhistory
     *  @parma {string} pOrderId Order Id
     */
    
    OrderDetailsViewModel.prototype.getReturnhistory= function(pOrderId,success,failure){
        var self=this;
        var data = {};
       CCRestClient.request(ccConstants.ENDPOINT_LIST_RETURN_REQUESTS, data,
                             function(data){self.getReturnhistorySuccess(data,success)}.bind(self),
                             function(data){self.getReturnhistoryFailure(data,failure)}.bind(self),pOrderId,"returnRequests");
    },
    /**
     * 'listReturnRequests' success callback function.
     *  Populates the viewModel with the data.
     * @function OrderDetailsViewModel#getReturnhistorySuccess
     * @param {Object} pResult listReturnRequests result object.
    */
    OrderDetailsViewModel.prototype.getReturnhistorySuccess=function(pResult,success){
      var self=this; 
      
      if(typeof(success) === "function"){
       	 success(pResult);
      }
    },
    /**
     * 'listReturnRequests' failure callback function.
     * @function OrderDetailsViewModel#getReturnhistoryFailure
     * @param {Object} pResult listReturnRequests result object.
    */
    OrderDetailsViewModel.prototype.getReturnhistoryFailure=function(pResult,failure){
      var self=this; 
        
      if(typeof(failure) === "function"){
        failure(pResult);
      } 
   },
   
   
   /**
    * Adds the data to the ViewModel with the listReturnRequest response.
    * @function OrderDetailsViewModel#populateReturnHistory
    * @param {Object} pResult listReturnRequest result object.
    */
    
   OrderDetailsViewModel.prototype.populateReturnHistory=function(pResult){
	 var self=this;
     self.returnRequesthistoryArray(pResult.items);
     var orderItems=self.order.items,returnItems,i,j,k;
     
     for(i=0;i<self.returnRequesthistoryArray().length;i++){
       returnItems=self.returnRequesthistoryArray()[i].returnItems;
         for(j=0;j<returnItems.length;j++){
           for(k=0;k<orderItems.length;k++){
             if(orderItems[k].productId == returnItems[j].productId && orderItems[k].catRefId == returnItems[j].catRefId ){
               returnItems[j].itemInfo=orderItems[k];
               break;
             }	   
    	   }
       }
     }
     
   }



   


    return OrderDetailsViewModel;
    
    
});
