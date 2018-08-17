/**
 * @fileoverview PaymentAuthResponseViewModel Class
 * Calls the Payment Authorization  service.
 *
 */

/*global define */
define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'pageLayout/payment-auth-response',

  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['pubsub', 'ccConstants', 'ccLogger', 'ccStoreServerLogger', 'ccStoreConfiguration'],

  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (pubsub, CCConstants, log, StoreServerLogger, CCStoreConfiguration) {

    "use strict";

    var mGetAuthResponseListener;

    //------------------------------------------------------------------
    // Class definition & member variables
    //------------------------------------------------------------------
    /**
     * Create an PaymentAuthResponse view model.
     * 
     * @param {restAdapter} pAdapter rest adapter
     * @param {Object} pData data object
     *
     * @private
     * @class
     * @name PaymentAuthResponseViewModel
     * @property {restAdapter} adapter Internal rest adapter object.
     * @property {number} numOfRetries Number of times Payment Auth will attempt to retry.
     * @property {number} delay Time interval between retries.
     * @property {CCStoreConfiguration} storeConfiguration An instance of the cc-store-configuration containing store-configuration data.
     */
    function PaymentAuthResponseViewModel(pAdapter, pData) {
      var self = this;

      self.adapter = pAdapter;
      self.numOfRetries = pData.maxTries ? pData.maxTries : CCConstants.PAYMENT_AUTHORIZATION_DEFAULT_TRIES;

      self.delay = pData.interval ? pData.interval : CCConstants.PAYMENT_AUTHORIZATION_DEFAULT_INTERVAL;
      self.storeServerLog = StoreServerLogger.getInstance();
      self.storeConfiguration = CCStoreConfiguration.getInstance();

      if(mGetAuthResponseListener != undefined) {
        $.Topic(pubsub.topicNames.PAYMENT_GET_AUTH_RESPONSE).unsubscribe(mGetAuthResponseListener);
      }
      mGetAuthResponseListener = self.paymentAuthorizedRequest.bind(this);
      $.Topic(pubsub.topicNames.PAYMENT_GET_AUTH_RESPONSE).subscribe(mGetAuthResponseListener);

      return self;
    };
    
    /**
     * Wrapper for {@link PaymentAuthResponseViewMode#getPaymentAuthorization|getPaymentAuthorization} that bundles 
     * the required data into a JS object.
     * 
     * @function
     * @name PaymentAuthResponseViewModel#paymentAuthorizedRequest
     * @param {Object} data
     * @param {string} data.transationuuid
     * @param {string} data.orderid
     * @param {string} data.orderuuid
     * @param {string} data.gatewayname
     * @param {string} data.paymentGroupId
     */
    PaymentAuthResponseViewModel.prototype.paymentAuthorizedRequest = function (data) {

      var self = this;
      
      if (data[0].numOfRetries) {
        self.numOfRetries = data[0].numOfRetries;
      }
      if (data[0].delay) {
        self.delay = data[0].delay;
      }
      
      self.getPaymentAuthorization(data[0].transactionuuid, data[0].orderid, data[0].orderuuid, data[0].gatewayname, data[0].paymentGroupId);  

    };

    /**
     * Make a payment authorization check request.
     * 
     * @function
     * @name PaymentAuthResponseViewModel#getPaymentAuthorization
     * @param {string} pTransactionUuid Unique transaction ID
     * @param {string} pOrderId Order ID
     * @param {string} pOrderUUID Order UUID
     * @param {string} pGatewayName Name of payment gateway
     * @param {string} pPaymentGroupId Payment group ID
     */
    PaymentAuthResponseViewModel.prototype.getPaymentAuthorization = function(pTransactionUuid, pOrderId, pOrderUUID, pGatewayName, pPaymentGroupId) {

      var self = this;

      self.checkForAuthorization(pTransactionUuid, pOrderId, pOrderUUID, pGatewayName, 0, pPaymentGroupId);

    };

    /**
     * Call the paymentAuthResponse end-point, and continue retrying the call until maximum retries has been
     * reached.
     * 
     * @function
     * @name PaymentAuthResponseViewModel#checkForAuthorization
     * @param {string} pTransactionUuid - the unique transaction id.
     * @param {string} pOrderId - the order id.
     * @param {string} pOrderUUID - the order uuid
     * @param {string} pGatewayName - the gateway name.
     * @param {type} pTryCount - the current number of tries.
     */
    PaymentAuthResponseViewModel.prototype.checkForAuthorization = function(pTransactionUuid, pOrderId, pOrderUUID, pGatewayName, pTryCount, pPaymentGroupId){

      var self = this;

      /**
       * Wrap the authorization check into a function in order to recursively re-run on a timeout until
       * max retries has been reached.
       */
      function checkAndResubmit(){

        if (pTryCount <= self.numOfRetries){
          setTimeout( function(){ self.checkForAuthorization(pTransactionUuid, pOrderId, pOrderUUID, pGatewayName, (pTryCount + 1), pPaymentGroupId); }, self.delay);

        } else {
          var param = {
            orderId   : pOrderId,
          };
          self.storeServerLog.logError("paymentTimeOut",self.storeServerLog.getMessage("paymentTimeOut", param));
          var messageDetails = [{message: "fail", id: pOrderId, gatewayName: pGatewayName}];
          $.Topic(pubsub.topicNames.PAYMENT_AUTH_TIMED_OUT).publish(messageDetails);
        }
      }

      /**
       * Returns the latest authorization status for the payment group
       *
       * @param {Object} pAuthStatus an array of authorization responses
       */
      function getAuthorizationStatus(pAuthStatus) {
        var status;

        if(pAuthStatus.length > 0) {
          status = pAuthStatus[pAuthStatus.length - 1];
        }

        return status;
      }
      var params = {};
      var contextObj = {};
      contextObj[CCConstants.ENDPOINT_KEY] = CCConstants.ENDPOINT_GET_PAYMENT_GROUP;
      var filterKey = self.storeConfiguration.getFilterToUse(contextObj);
      if (filterKey) {
        params[CCConstants.FILTER_KEY] = filterKey;
      }

      self.adapter.loadJSON('paymentGroup', pPaymentGroupId, params,
        //success callback
        function (data) {

          if(data.stateAsString && data.orderStatus) {
            if(data.stateAsString === CCConstants.PAYMENT_GROUP_STATE_INITIAL) {
              checkAndResubmit();
            } else if(data.stateAsString === CCConstants.PAYMENT_GROUP_STATE_REMOVED) {
              var authStatus = getAuthorizationStatus(data.authorizationStatus);
              if(authStatus) {
                var messageDetails = [{message: "fail",  id: pOrderId, uuid: pOrderUUID, responsedata: authStatus, gatewayName: pGatewayName}];
                messageDetails[0].responsedata.reasonCode = CCConstants.PROCESS_COMPLETION_FAILED;
                $.Topic(pubsub.topicNames.PAYMENT_AUTH_DECLINED).publish(messageDetails);
                }
            } else if((data.stateAsString === CCConstants.PAYMENT_GROUP_STATE_AUTHORIZED) || 
            		(data.stateAsString === CCConstants.PAYMENT_GROUP_STATE_SETTLED)) {
                var authStatus = getAuthorizationStatus(data.authorizationStatus);
                if(authStatus) {
                  var messageDetails = [{message: "success", id: pOrderId, uuid: pOrderUUID, responsedata: authStatus, gatewayName: pGatewayName, orderState: data.orderStatus, paymentGroupId: data.id}];
                  if ((authStatus.authorizationDecision === CCConstants.PAYMENT_AUTHORIZATION_ACCEPT || authStatus.transactionSuccess == true) && data.orderStatus === CCConstants.SUBMITTED) {
                    $.Topic(pubsub.topicNames.ORDER_COMPLETED).publish(messageDetails);
                    $.Topic(pubsub.topicNames.PAYMENT_AUTH_SUCCESS).publish(messageDetails);
                  } else if(authStatus.authorizationDecision === CCConstants.PAYMENT_AUTHORIZATION_ACCEPT && data.orderStatus == CCConstants.FAILED) {
                      messageDetails[0].responsedata.reasonCode = CCConstants.PAYMENT_REVERSAL_FAILED;
                      messageDetails[0].message = "fail";
                      $.Topic(pubsub.topicNames.PAYMENT_AUTH_DECLINED).publish(messageDetails);
                  } else if((authStatus.authorizationDecision === CCConstants.PAYMENT_AUTHORIZATION_ACCEPT || authStatus.transactionSuccess == true) && data.orderStatus === CCConstants.PENDING_PAYMENT) {
                     messageDetails[0].orderState = data.orderStatus;
                    $.Topic(pubsub.topicNames.PAYMENT_AUTH_SUCCESS).publish(messageDetails);
                  } else {
                      checkAndResubmit();
                  }
                } 
            } else {
              var authStatus = getAuthorizationStatus(data.authorizationStatus);

              if(authStatus) {
                var messageDetails = [{message: "success",  id: pOrderId, uuid: pOrderUUID, responsedata: authStatus, gatewayName: pGatewayName, orderState: data.orderStatus, paymentGroupId: data.id}];

                if (authStatus.authorizationDecision === CCConstants.PAYMENT_AUTHORIZATION_ACCEPT) {
                  $.Topic(pubsub.topicNames.ORDER_COMPLETED).publish(messageDetails);
                  $.Topic(pubsub.topicNames.PAYMENT_AUTH_SUCCESS).publish(messageDetails);
                } else {
                  messageDetails[0].message = "fail";
                  $.Topic(pubsub.topicNames.PAYMENT_AUTH_DECLINED).publish(messageDetails);
               }
              }
            }
          }
          else {
            checkAndResubmit();
          }
        },
        //error callback
        function (data, ajaxOptions, thrownError) {

          // log the error
          if(data && data.message && data.message !== '') {
            // error message received, i18n occurs on server
            log.error("PaymentAuthResponseViewModel.checkForAuthorization - error -" + data.message);
          } else {
            // unknown error - use generic fail message
            log.error("PaymentAuthResponseViewModel.checkForAuthorization -unknown error returned");
          }

          // try again is it is inside the limit of tries.
          checkAndResubmit();
        }
      );
    };
    
    
    return PaymentAuthResponseViewModel;
});

