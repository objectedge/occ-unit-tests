/**
 * @fileoverview Handles exceptions on the client side
 */
/*global $ */

define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'sfExceptionHandler',
  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['knockout',
   'ccRestClient', 
   'ccConstants',
   'ccClientErrorCodes',
   'pubsub',
   'pageViewTracker'
  ],
    
  function(ko, ccRestClient, CCConstants, CCClientErrorCodes, PubSub, pageViewTracker) {
    "use strict";
    var self, errors = [], exceptionDebug = "",
    errorMessage = "", errorLine = "",
    errorUrl = "", errorCount= 0,
    errorCol = "", errorObj = null,
    maxErrors = 10, trackError,
    errorCode, clientErrorCode, endPointUrl,
    inputData ={}, exceptionProperty, uniqueErrorArray = [],
    uniqueErrorKey="";
       
    function ExceptionHandler(){
    }
  
    /**
     * Subscribes to the exception handler topics for try/catch and 
     * window.onerror functions
     */
    ExceptionHandler.prototype.subscribe = function() {
      self = this;
      self.logWindowOnErrorBinding = self.logWindowOnError.bind(self);
      self.logExceptionErrorBinding = self.logExceptionError.bind(self);     
      $.Topic(PubSub.topicNames.EXCEPTION_HANDLER)
      .subscribe(self.logExceptionErrorBinding);
      $.Topic(PubSub.topicNames.ONERROR_EXCEPTION_HANDLER)
      .subscribe(self.logWindowOnErrorBinding);
    };
    
    /**
     * Returns error codes based on the exception type
      */
    ExceptionHandler.prototype.getErrorCode = function(exception){
      if(exception){
        exception = exception.toLowerCase();
        if(exception === 'RangeError'.toLowerCase() || 
        exception === 'RangeError:'.toLowerCase()){
          errorCode =  CCClientErrorCodes.RANGE_ERROR;
        }else if(exception === 'TypeError'.toLowerCase() ||
         exception === 'TypeError:'.toLowerCase()){
          errorCode =  CCClientErrorCodes.TYPE_ERROR;
        }else if(exception === 'SyntaxError'.toLowerCase() ||
         exception === 'SyntaxError:'.toLowerCase()){
          errorCode =  CCClientErrorCodes.SYNTAX_ERROR;
        }else if(exception === 'ReferenceError'.toLowerCase() ||
         exception === 'ReferenceError:'.toLowerCase()){
          errorCode =  CCClientErrorCodes.REFERENCE_ERROR;
        }else if(exception === 'EvalError'.toLowerCase() ||
         exception === 'EvalError:'.toLowerCase()){
          errorCode =  CCClientErrorCodes.EVAL_ERROR;
        }else if(exception === 'URIError'.toLowerCase() ||
         exception === 'URIError:'.toLowerCase()){
          errorCode =  CCClientErrorCodes.URI_ERROR;
        }else{
          errorCode =  CCClientErrorCodes.GENERIC_ERROR;
        }
      }else{
        errorCode = CCClientErrorCodes.NO_SPECIFIED_ERROR;
      }
      return errorCode;    
    };
    
    /**
     * This function gets called if exception is published from a catch block
     * on topic PubSub.topicNames.EXCEPTION_HANDLER
     */
     ExceptionHandler.prototype.logExceptionError = function(exception) {
      self = this;
      self.errorCode = self.getErrorCode(exception.name);      
      self.errorUrl = location.href;
      self.errorLine= "";
      self.errorMessage = "";     
      var exceptionProperty;
      
      for (exceptionProperty in exception) {  
        if(exceptionProperty === "fileName"){
          self.errorUrl = exception[exceptionProperty];
        }else if(exceptionProperty === "lineNumber"){
          self.errorLine = exception[exceptionProperty];
        }      
      } 
      self.errorMessage = exception.toString();
      if(!self.errorLine && exception.line > 0){
        self.errorLine = exception.line;
      }
      self.sendErrorReport(self.errorMessage, self.errorLine, self.errorUrl,
         self.errorCode);
    };
    
    /**
     * This function gets called if exception is published from window.onerror
     *  method on topic ONERROR_EXCEPTION_HANDLER
     */
  
    ExceptionHandler.prototype.logWindowOnError = function(errorMessage, 
      errorUrl, errorLine, errorCol, errorObj) {
      self= this;
      var errorMessageWordsArray = errorMessage.split(" "),
       errorName, index, len;
      for (index = 0, len = errorMessageWordsArray.length; index < len;
        index+=1) {
        if (errorMessageWordsArray[index].indexOf("Error") >= 0) {
           errorName = errorMessageWordsArray[index];
           break;
        }   
      }
      
      self.errorCode = self.getErrorCode(errorName);
      if(!self.errorCode) {
        self.errorCode = " ";
      }
      if (!errorMessage) {
        self.errorMessage = " ";
      } else {
        self.errorMessage = errorMessage;
      }
      if (!errorUrl) {
        self.errorUrl = " ";
      } else {
        self.errorUrl = errorUrl;
      }
      if (!errorLine) {
        self.errorLine = " ";
      } else {
        self.errorLine = errorLine;
      }
      if (!errorCol) {
        self.errorCol = " ";
      } else {
        self.errorCol = errorCol;
      }
      if (errorObj) {
        self.errorObj = errorObj;
      }
      self.sendErrorReport(self.errorMessage, self.errorLine, self.errorUrl, self.errorCode,
          self.errorCol, self.errorObj);
    };
    /**
     * Returns an array with browser name - M[0] and version M[1]
     */
    navigator.findBrowserVersion= (function(){
      var N= navigator.appName, ua= navigator.userAgent, tem, M;
      M= ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
      if(M && (tem= ua.match(/version\/([\.\d]+)/i))!== null){ 
        M[2]= tem[1];
      }
      M= M? [M[1], M[2]]: [N, navigator.appVersion, '-?'];    
      return M;
      })();
      
    /**
     * Creates an error object to send to the server for logging purpose
     * Check for maxErrors ensures infinite loop doesn't occur
     * @param {Object} errorMessage
     * @param {Object} errorLine
     * @param {Object} errorUrl
     * @param {Object} errorCode
     * @param {Object} errorCol
     * @param {Object} errorObj
     */
    ExceptionHandler.prototype.sendErrorReport = function(errorMessage,
       errorLine, errorUrl, errorCode, errorCol, errorObj){
      // Get the visitor and visit id
      var localVisitorId = pageViewTracker.getVisitorId();
      var localVisitId = pageViewTracker.getVisitId();
      var browserUrl = window.location.href;
      // Adding null check
      var errorStack = null;
      if (errorObj) {
        errorStack = errorObj.stack;
      }
      if (typeof errorMessage !== "undefined" && errorCount < maxErrors) {
        errorCount+=1;
        trackError = {
          message: errorMessage,
          url: errorUrl,
          browserURL: browserUrl,
          line: errorLine,
          column: errorCol,
          osVersion: window.navigator.platform,
          locale : window.navigator.language,
          browserVersion : navigator.findBrowserVersion[0] + 
          " " + navigator.findBrowserVersion[1],
          time: (new Date()).toISOString(),
          clientErrorCode: errorCode,
          visitorId: localVisitorId,
          visitId: localVisitId,
          stack: errorStack
        };
        //To avoid sending duplicate errors to the server
        uniqueErrorKey = errorCode + "#" + browserUrl + "#" + errorUrl + "#" + errorLine + "#" + errorCol;
        if(uniqueErrorArray.indexOf(uniqueErrorKey) < 0){
          uniqueErrorArray.push(uniqueErrorKey);
          errors.push(trackError);
          this.reportErrorsToServer();
        }
        
      }
    };
    /**
     * Sends error object to the server for logging purpose.
     * Resets error count and error array
     */
    ExceptionHandler.prototype.reportErrorsToServer = function() {
      if(errors.length > 0) {
        endPointUrl=CCConstants.ENDPOINT_ERRORLOGS_CREATE_ERRORLOG;
        inputData ={};
        inputData = {clientSideErrors : errors };
        ccRestClient.request(endPointUrl, inputData, this.sendSuccess, 
          this.sendError);
        errors = [];
        errorCount = 0;
      }
    }; 
    
    /**
     * Gets called when sending error to the server is successful
    * @param {Object} param
     */
    ExceptionHandler.prototype.sendSuccess = function(param) {
    };
    /**
     * Gets called when sending error to the server is unsuccessful
    * @param {Object} param
     */
    ExceptionHandler.prototype.sendError = function(param) {
    };
    
    return ExceptionHandler;
 });

