/***
 * This view model can be used to hold the payments data and contains methods to invoke the add payments API.
 * This is a singleton object and can be accessed by using the getInstance method 
 **/
define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'viewModels/paymentsViewModel',
  
  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['knockout', 'ccConstants', 'ccRestClient', 'CCi18n', 'pageLayout/site', 'viewModels/cash', 'viewModels/creditCard', 
   'viewModels/giftCard', 'viewModels/invoice', 'viewModels/paypal', 'viewModels/payu', 'viewModels/loyalty', 'viewModels/storeCredit'],
  
  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (ko, CCConstants, ccRestClient, CCi18n, site, Cash, CreditCard, GiftCard, Invoice, Paypal, PayU, Loyalty, StoreCredit) {
    'use strict';
    
    function PaymentsViewModel() {
      if(PaymentsViewModel.singleInstance) {
        throw new Error("Cannot instantiate more than one PaymentsViewModel, use getInstance(data)");  
      }
      
      var self = this;
      
      // Place holder to store the Authorized payment groups
      self.completedPayments = ko.observableArray([]);
      // Place holder to store the payment groups that are yet to be processed
      self.pendingPayments = ko.observableArray([]);
      // Place holder to store the failed payment groups
      self.failedPayments = ko.observableArray([]);
      // The Balance amount due
      self.paymentDue = ko.observable();
      self.loyaltyPaymentDue = ko.observable();

      // Place holder to store the Authorized payments in case of historical orders
      self.historicalCompletedPayments = ko.observableArray([]);
      self.historicalCompletedLoyaltyPayments = ko.observableArray([]);
      
      // Cash Enabled Countries List
      self.cashEnabledCountries = [];
      // Scheduled Order Enabled Gateways
      self.scheduleOrderEnabledGateways = [];
      // Approval Enabled Gateways
      self.approvalEnabledGateways = [];
      // Is Generic Card Gateway
      self.isCardGatewayGeneric = false;
      // Is loyaltyPoints payment type is enabled
      self.isLoyaltyEnabled = ko.observable(false);
      // reference to loyalty view model
      //self.loyaltyViewModel = ko.observable(null);
      //Is card payment enabled
      self.isCardPaymentDisabled = ko.observable(false);
      //Is paypal payment disabled
      self.isPaypalDisabled      = ko.observable(false);
      // flag to display error msg when insufficient points
      //self.userHasInsufficientPoints = ko.observable(false);

      //Is store credit payment type is enabled
      self.isStoreCreditEnabled = ko.observable(false);


      // Scheduled Order enable variables
      self.isCardEnabledForScheduledOrder = ko.observable(false);
      self.isGiftCardEnabledForScheduledOrder = ko.observable(false);
      self.isInvoiceEnabledForScheduledOrder = ko.observable(false);
      self.isCashEnabledForScheduledOrder = ko.observable(false);
      self.isPayULEnabledForScheduledOrder = ko.observable(false);
      self.isPaypalEnabledForScheduledOrder = ko.observable(false);
      self.isLoyaltyEnabledForScheduledOrder = ko.observable(false);
      self.isStoreCreditEnabledForScheduledOrder = ko.observable(false);
      
      // Order Approval enable Variables
      self.isCardEnabledForApproval = ko.observable(false);
      self.isGiftCardEnabledForApproval = ko.observable(false);
      self.isInvoiceEnabledForApproval = ko.observable(false);
      self.isCashEnabledForApproval = ko.observable(false);
      self.isPayULEnabledForApproval = ko.observable(false);
      self.isPaypalEnabledForApproval = ko.observable(false);
      self.isLoyaltyEnabledForApproval = ko.observable(false);
      self.isStoreCreditEnabledForApproval = ko.observable(false);
      
      // Exclude fields map contains fields that are should be skipped 
      // while mapping the response payment group to the request payment data
      self.excludeFieldsMap = ['amount', 'cardNumber', 'cardType', 'giftCardNumber', 'seqNum', 'customPaymentProperties'];
      
      /**
       * Method to set cashEnabledCountries from siteViewModel
       */
      self.setCashEnabledCountries = function() {
        for(var key in site.getInstance().extensionSiteSettings) {
          var settingsObject = site.getInstance().extensionSiteSettings[key];
          if (settingsObject[CCConstants.PAYMENT_METHOD_TYPES] &&
            settingsObject[CCConstants.PAYMENT_METHOD_TYPES].split(",").indexOf(CCConstants.CASH_PAYMENT_TYPE) != -1 ) {
            if (settingsObject[CCConstants.SELECTED_COUNTRIES]) {
              self.cashEnabledCountries = settingsObject[CCConstants.SELECTED_COUNTRIES];
            }
          }
        }
      };
      
      /**
       * Method to set the payment related meta-data
       * */
      self.populatePaymentData = function(data, pUserData) {
        self.cardTypeList = ko.observableArray(data.cards);
        self.gateways = data.gateways;
        self.payULatamCountryList = data.payULatamCountryList;
        self.paymentMethods = ko.observableArray();
        
        //If it's a b2b user initialize with account specific payment methods
        if (pUserData().isB2BUser()) {
          var useAllPayment = pUserData().currentOrganization().derivedUseAllPaymentMethodsFromSite;
          if (useAllPayment == undefined || !useAllPayment) {
            var enabledTypesLength = data.enabledTypes.length;
            var organizationPaymentMethods =
              pUserData().currentOrganization().derivedPaymentMethods;
            var organizationEnabledTypes = [];
            for (var i=0; i<enabledTypesLength; i++) {
              for (var j=0; j < organizationPaymentMethods.length; j++) {
                if (data.enabledTypes[i] == organizationPaymentMethods[j]) {
                  organizationEnabledTypes.push(data.enabledTypes[i]);
                }
              }
            }
            self.enabledTypes = organizationEnabledTypes;       	  
          } else {
            self.enabledTypes = data.enabledTypes;           
          }
        } else {
          self.enabledTypes = data.enabledTypes;
        }

        if (self.enabledTypes &&
            self.enabledTypes.indexOf(CCConstants.CARD_PAYMENT_TYPE) < 0) {
          self.isCardPaymentDisabled(true);
        }

        if (self.enabledTypes &&
            self.enabledTypes.indexOf(CCConstants.PAYPAL_PAYMENT_TYPE) < 0) {
          self.isPaypalDisabled(true);
        } else {
          self.isPaypalDisabled(false);	
        }

        //Is store credit payment type enabled
        if (self.enabledTypes &&
            self.enabledTypes.indexOf(CCConstants.STORE_CREDIT_PAYMENT_TYPE) > 0) {
          self.isStoreCreditEnabled(true);
        }
        
        // Set Cash enabled countries List
        self.setCashEnabledCountries();
        self.scheduleOrderEnabledGateways = data.scheduledOrderEnabledGateways;
        self.approvalEnabledGateways = data.approvalEnabledGateways;
        self.isCardGatewayGeneric = data.isCardGatewayGeneric;
        
        for (var i=0; i<data.scheduledOrderEnabledGateways.length; i++) {
          if (data.scheduledOrderEnabledGateways[i] === CCConstants.CARD_PAYMENT_TYPE) {
            self.isCardEnabledForScheduledOrder(true);
          }

          if (data.scheduledOrderEnabledGateways[i] === CCConstants.GIFT_CARD_PAYMENT_TYPE) {
            self.isGiftCardEnabledForScheduledOrder(true);
          }

          if (data.scheduledOrderEnabledGateways[i] === CCConstants.INVOICE_PAYMENT_TYPE) {
            self.isInvoiceEnabledForScheduledOrder(true);
          }

          if (data.scheduledOrderEnabledGateways[i] === CCConstants.CASH_PAYMENT_TYPE) {
            self.isCashEnabledForScheduledOrder(true);
          }

          if (data.scheduledOrderEnabledGateways[i] === CCConstants.PAYULATAM_CHECKOUT_TYPE) {
            self.isPayULEnabledForScheduledOrder(true);
          }
          
          if (data.scheduledOrderEnabledGateways[i] === CCConstants.PAYPAL_PAYMENT_TYPE) {
            self.isPaypalEnabledForScheduledOrder(true);
          }
          
          if (data.scheduledOrderEnabledGateways[i] === CCConstants.LOYALTY_POINTS_PAYMENT_TYPE) {
            self.isLoyaltyEnabledForScheduledOrder(true);
          }

          if (data.scheduledOrderEnabledGateways[i] === CCConstants.STORE_CREDIT_PAYMENT_TYPE) {
            self.isStoreCreditEnabledForScheduledOrder(true);
          }
        }
        for (var i=0; i<data.approvalEnabledGateways.length; i++) {
          if (data.approvalEnabledGateways[i] === CCConstants.CARD_PAYMENT_TYPE) {
            self.isCardEnabledForApproval(true);
          }

          if (data.approvalEnabledGateways[i] === CCConstants.GIFT_CARD_PAYMENT_TYPE) {
            self.isGiftCardEnabledForApproval(true);
          }

          if (data.approvalEnabledGateways[i] === CCConstants.INVOICE_PAYMENT_TYPE) {
            self.isInvoiceEnabledForApproval(true);
          }

          if (data.approvalEnabledGateways[i] === CCConstants.CASH_PAYMENT_TYPE) {
            self.isCashEnabledForApproval(true);
          }

          if (data.approvalEnabledGateways[i] === CCConstants.PAYULATAM_CHECKOUT_TYPE) {
            self.isPayULEnabledForApproval(true);
          }
          
          if (data.approvalEnabledGateways[i] === CCConstants.PAYPAL_PAYMENT_TYPE) {
            self.isPaypalEnabledForApproval(true);
          }
          
          if (data.approvalEnabledGateways[i] === CCConstants.LOYALTY_POINTS_PAYMENT_TYPE) {
            self.isLoyaltyEnabledForApproval(true);
          }
          
          if (data.approvalEnabledGateways[i] === CCConstants.STORE_CREDIT_PAYMENT_TYPE) {
            self.isStoreCreditEnabledForApproval(true);
          }
        }
        
        // Converting the enabledTypes to a Map so that it can be used in drop downs
        for(var i=0; i < self.enabledTypes.length; i++) {
          // Since the cash in common resource file is already mapped to 'Cash Payment' need to 
          // handle this indirectly by creating another constant cashPaymentMethod which maps to 'Cash'
          if(self.enabledTypes[i] == CCConstants.CASH_PAYMENT_TYPE) {
            self.paymentMethods().push({name:CCi18n.t('ns.common:resources.cashPaymentMethod'), value:self.enabledTypes[i]});	
          } else if (self.enabledTypes[i] == CCConstants.LOYALTY_POINTS_PAYMENT_TYPE) {
            self.isLoyaltyEnabled(true);
          } else {
            self.paymentMethods().push({name:CCi18n.t('ns.common:resources.'+ self.enabledTypes[i]), value:self.enabledTypes[i]});
          }

        }
      };
      
      /**
       * Payment authorization details.
       * @param {string} pEmailAddress Email address.
       * @param {Address} pBillingAddress Billing address.
       * @param {Object} pPaymentDetails The payment details.
       * @param {Object} pPaymentGroupDetails The Payment group details
       * @param {Object} pOrderDetails The order details.
       */
      self.createPaymentAuthDetails = function(pEmailAddress, pBillingAddress,
          pPaymentDetails, pPaymentGroupDetails, pOrderDetails) {
      	
      	var paymentAuthDetails = {};
      	
      	paymentAuthDetails.emailAddress = pEmailAddress;
        paymentAuthDetails.billingAddress = pBillingAddress;
        paymentAuthDetails.paymentDetails = pPaymentDetails;
        
        pOrderDetails.payments = [];
        pOrderDetails.payments.push(ko.toJS(pPaymentGroupDetails));
        paymentAuthDetails.orderDetails = pOrderDetails;

        return paymentAuthDetails;
      }
      
      /**
       * Utility method to create the payment object based on the payment method type
       * @param {String} type - Type of the payment method
       * */
      self.createPaymentGroup = function(type) {
        var payment = null;
        switch (type) {
          case CCConstants.CARD_PAYMENT_TYPE:
            payment = new CreditCard();
            break;
            
          case CCConstants.GIFT_CARD_PAYMENT_TYPE:
            payment = new GiftCard();
            break;
            
          case CCConstants.CASH_PAYMENT_TYPE:
            payment = new Cash();
            break;
            
          case CCConstants.INVOICE_PAYMENT_TYPE:
            payment = new Invoice();
            break;
            
          case CCConstants.PAYPAL_PAYMENT_TYPE:
            payment = new Paypal();
            break;
            
          case CCConstants.PAYULATAM_CHECKOUT_TYPE:
            payment = new PayU();
            break;
            
          case CCConstants.LOYALTY_POINTS_PAYMENT_TYPE:
            payment = new Loyalty();
            break;
            
          case CCConstants.STORE_CREDIT_PAYMENT_TYPE:
            payment = new StoreCredit();
            break;
        }
        return payment;
      };
      
      /**
       * This method is used to process (partial) payments using the add payments API
       * @param {function} success - Success Call back function
       * @param {function} error - Error Call back function
       * @param {String} pOrderId - (optional) Order Id
       * @param {String} pUUID - UUID of the order. Mandatory for Anonymous flows in Store front context
       * @param {String} pProfileId - (optional) Profile Id of the shopper. For Store front, 
       * this is not required 
       * @param {String} pChannel - (optional) Channel 
       * @param {Object} pPayments - (optional) Payments array to be processed. If not passed, 
       * will take from the pendingPayments view model property 
       **/
      self.processPayments = function(success, error, pOrderId, pUUID, pProfileId, pChannel, pPayments) {
        var self = this;
        
        // Validate the input before processing the payments
        var tempValidationForPayment = null;
        if(pPayments) {
          tempValidationForPayment = pPayments;
        } else {
          tempValidationForPayment = self.pendingPayments();
        }
        for(var i=0; i<tempValidationForPayment.length; i++) {
        	if(!tempValidationForPayment[i].validatePaymentData()) {
        		// OOTB widget already validating the payment data while adding to pending
        		// payment array. Additional check in case merchant did not handle the widget
        		// validation properly
        		return;
        	}
        }
        
        // Request pay load for addPayment API
        var input = {};
        
        // Order Id
        if(pOrderId) {
          input["orderId"] = pOrderId;
        } 
        
        // order uuid
        if (pUUID) {
        	input["uuid"] = pUUID;
        }
        
        // Profile Id
        if(pProfileId) {
          input["profileId"] = pProfileId;
        }
        
        // Channel 
        if(pChannel) {
          input["channel"] = pChannel;
        }
        
        // Payments
        var tempPayments = [];
        if(pPayments && pPayments.length > 0) {
          tempPayments = self.preparePaymentsRequest(pPayments);
        } else if(self.pendingPayments() && self.pendingPayments().length > 0) {
          tempPayments = self.preparePaymentsRequest(self.pendingPayments());
        }
        input["payments"] = tempPayments;
        
        // Wrapper over the success call back where we are mapping the server payment group
        // response data to the request payment objects before calling the success call back
        var successHandler = function(data) {
          var requestPaymentsArray = [];
          if(pPayments) {
          	requestPaymentsArray = pPayments;
          } else {
          	requestPaymentsArray = self.pendingPayments();
          }
          
          // Map request to response
          for(var i=0; i<data.paymentResponses.length; i++) {
          	for(var j=0; j<requestPaymentsArray.length; j++) {
          		if(data.paymentResponses[i].seqNum == requestPaymentsArray[j].seqNum) {
          			
          			for(var key in data.paymentResponses[i]) {
                  if($.inArray(key, self.excludeFieldsMap) == -1) {
                  	if(ko.isObservable(requestPaymentsArray[j][key])) {
                  		requestPaymentsArray[j][key](data.paymentResponses[i][key]);
                  	} else {
                  		requestPaymentsArray[j][key] = data.paymentResponses[i][key];
                  	}
                  }
                }
          			break;
          		}
          	}
          }
          
          // call success function
          success(data);
        };
        
        // Invoke the add payment API
        ccRestClient.request(CCConstants.ADD_ORDER_PAYMENTS, input, successHandler, error);
      };
      
      /**
       * This method is used to inquire gift card balance add payments API. Multiple gift cards 
       * can be passed in the request
       * @param {function} success - Success Call back function
       * @param {function} error - Error Call back function
       * @param {String} pOrderId - Order Id
       * @param {Object} pPayments - Payments array to be processed
       **/
      self.inquireBalance = function(success, error, pPayments) {
        // Request pay load for addPayment API
        var input = {};
        
        input["op"] = CCConstants.INQUIRE_GIFT_CARD_BALANCE;
        
        // Gift card payments to which balance to be inquired
        var tempPayments = [];
        if(pPayments && pPayments.length > 0) {
          tempPayments = self.preparePaymentsRequest(pPayments);
        }
        input["payments"] = tempPayments;
        
        // Invoke the API
        ccRestClient.request(CCConstants.ADD_ORDER_PAYMENTS, input, success, error);
      };
      
      /**
       * Utility method to prepare payments JSON data from the payment view models
       * @param {Object} payments - Array of payments view models
       * @return {Object} Array of JSON payment data
       * */
      self.preparePaymentsRequest = function(payments) {
        var tempPayments = [];
        for(var i = 0; i < payments.length; i++) {
        	payments[i].seqNum = i.toString();
          var payment = {};
          var jsViewModel = null;
          if (payments[i].toJSON && $.isFunction(payments[i].toJSON)) {
            jsViewModel = payments[i].toJSON();
          } else {
            jsViewModel = payments[i];
          }
          //var jsViewModel = ko.mapping.toJS(payments[i]);
          for(var prop in jsViewModel) {
            if($.isFunction(jsViewModel[prop])) {
              continue;
            }
            payment[prop] = jsViewModel[prop];
          }
          tempPayments.push(payment);
        }
        return tempPayments;
      };
      
      /**
       * Utility method to reset the state of paymentsViewModel
       * */
      self.resetPaymentsContainer = function() {
        // Reset payment related data
        self.completedPayments([]);
        self.pendingPayments([]);
        self.failedPayments([]);
        self.historicalCompletedPayments([]);
        self.historicalCompletedLoyaltyPayments([]);
        self.paymentDue(0);
        self.loyaltyPaymentDue(0);
      };
      
      /**
       * Utility method to populate a view model from server data
       */
      self.populateViewModelWithServerData = function(viewModel, data) {
        if (data.paymentResponses && data.paymentResponses.length > 0) {
          for(var key in data.paymentResponses[0]) {
            viewModel[key] = data.paymentResponses[0][key];
          }
        }
      };
      
      /**
       * Finds whether there are minimum points required.
       */
      self.hasSufficientPoints = function(loyaltyViewModel, pointsType, minPtsRequired) {
        var hasPoints = false;
        if (loyaltyViewModel && loyaltyViewModel.selectedProgramDetails()
            && loyaltyViewModel.selectedProgramDetails().loyaltyPointDetails) {
          var loyaltyPointDetails = loyaltyViewModel.selectedProgramDetails().loyaltyPointDetails;
          for (var i = 0; i < loyaltyPointDetails.length; i++) {
            if (loyaltyPointDetails[i].pointsType && loyaltyPointDetails[i].pointsType == pointsType) {
              if (loyaltyPointDetails[i].pointsBalance && loyaltyPointDetails[i].pointsBalance >= minPtsRequired) {
                hasPoints = true;
                break;
              }
            }
          }
        }
        return hasPoints;
      };

      return self;
    }
    
    /**
     * Return the single instance of PaymentsViewModel. Create it if it doesn't exist.
     * @function
     * @name PaymentsViewModel.getInstance
     * @param {Object} [data] Additional data.
     * @return {PaymentsViewModel} Singleton instance.
     */
    PaymentsViewModel.getInstance = function(data, pUserData) {
      if(!PaymentsViewModel.singleInstance) {
        PaymentsViewModel.singleInstance = new PaymentsViewModel();
      }
      if (data) {
        PaymentsViewModel.singleInstance.populatePaymentData(data, pUserData);
      }
      return PaymentsViewModel.singleInstance;
    };
    
    return PaymentsViewModel;
    
});
