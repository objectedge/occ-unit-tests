/**
 * @fileoverview CCStoreServerLogger Class
 * 
 * It is used to log information to the server. This also types the
 * messages so they show up (as possible) as debug, info, warn and error messages.
 * 
 * Usage:
 * 
 * 1) Include in the proper require.js main module with the following
 * line:
 * 
 * ccStoreServerLogger: '/shared/js/ccLibs/cc-store-server-logger-1.0'
 * 
 * 2) include in the module as follows:
 * 
 * define(
 *   [... 'ccStoreServerLogger' ...]
 *   function( ... StoreServerLogger ...)
 * )
 * 
 * 3) Create a singleton instance for the library
 *    storeServerLog = StoreServerLogger.getInstance();
 * 
 * 4) invoke as follows:
 *  storeServerLog.logInfo("eventKey", "Your message here.", "eventID");
 *  storeServerLog.logWarning("eventKey", "Your message here.", "eventID");
 *  storeServerLog.logDebug("eventKey", "Your message here.", "eventID");
 *  storeServerLog.logError("eventKey", "Your message here.", "eventID");
 *  
 */
define (
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'ccStoreServerLogger',

  //--------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------
  ['knockout', 'pubsub', 'jquery', 'ccRestClient', 'ccConstants', 'storageApi', 'pageViewTracker'],

  //-------------------
  // MODULE DEFINITION
  //-----
  function (ko, PubSub, $, ccRestClient, CCConstants, storageApi, pageViewTracker) {
    "use strict";

    var DEFAULT_EVENTKEY = "UnstatedEvent";

    /**
     * Creates a storeServerLogger object.
     * @private
     * @name CCStoreServerLogger
     * @class CCStoreServerLogger
     */
    function CCStoreServerLogger() {
      if (CCStoreServerLogger.singleInstance) {
        throw new Error ("Cannot instantiate more than one CCStoreServerLogger. Use getInstance() method");
      }
      var self = this;
      self.loggingEnabled = true;
      var currentLogger = "";
      var currentPageId = "";
      var enabledLoggerList = [];
      var pagesToLog = [];
      /**
       * The existing logger list.
       * If a new logger is to be used, it must be present in this array
       */
      var loggerList = ["debug","info","warning","error"];

      /**
       * Object containing predefined events that can be logged, along with the eventIDs.
       */
      var eventsToLog = {
        "getPage"                : "0001",
        "paymentTimeOut"         : "0002",
        "createOrderFailure"     : "0003",
        "updateOrderFailure"     : "0004",
        "paymentGroupFailure"    : "0005",
        "orderSubmissionFailure" : "0006"
      };

      /**
       * An object that contains the messages that will be logged,
       * along with the event as its key, that invoked the getMessage function
       */
      var messageResource = {
        "getPage"                : "Landed on __pageId__ page",
        "paymentTimeOut"         : "Unable to Authorize payment due to time-out, while placing order for order ID __orderId__",
        "createOrderFailure"     : "Unable to create order due to error code __errorCode__",
        "updateOrderFailure"     : "Unable to update the order with order ID __orderId__ due to error code __errorCode__",
        "paymentGroupFailure"    : "Unable to place order for order ID __orderId__ as the payment state is found to be " +
                                   "__paymentState__ for the payment group ID __paymentGroupId__",
        "orderSubmissionFailure" : "Order Submission Failed for order with order ID __orderId__"
      };

      /**
       * An object that contains the logType that will be a part of logMessage.
       * It is mapped to the loglevel
       */
      var logLevelResource = {
        "error"   : "[ERROR]",
        "warning" : "[WARN]",
        "info"    : "[INFO]",
        "debug"   : "[DEBUG]"
      };

      /**
       * Saves the logger level to local storage
       * @param {String} logger - The logLevel to be stored in local storage
       */
      var setStoredLogLevel = function (logger) {
        try {
          storageApi.getInstance().setItem("logLevel", logger);
        } catch (pError) {
        }
      };

      /**
       * Get the logger level from local storage
       */
      var getStoredLogLevel = function () {
        var localData = null;
        try {
          localData = storageApi.getInstance().getItem("logLevel");
        } catch (pError) {
        }
        return localData;
      };

      /**
       * Called when the logLevel is changed
       * Sets the logger values, to follow hierarchy of loggers 
       * @param {String} newLogger - The new log level, that we want to use
       */
      var updatedLoggerList = function (newLogger) {
        var enabledLoggers = [];
        switch (newLogger) {
          case "debug" :
            enabledLoggers.push("debug");
          case "info" :
            enabledLoggers.push("info");
          case "warning" :
            enabledLoggers.push("warning");
          case "error" :
            enabledLoggers.push("error");
            break;
          default :
            enabledLoggers = enabledLoggerList;
        }
        return enabledLoggers;
      };

      /**
       * Sets the logger level to default ie info
       */
      self.setDefaultLogLevel = function () {
        if (currentLogger != "info") {
          currentLogger = "info";
          enabledLoggerList = updatedLoggerList(currentLogger);
          setStoredLogLevel(currentLogger);
        }
      };

      /**
       * Sets the loggerLevel to one of the available loggers
       * @param {String} logLevel - Sets the logLevel to the passed loggerLevel
       * and updates the value of enabledLoggerList accordingly
       */
      self.setLogLevel = function (logLevel) {
        if ((loggerList.indexOf(logLevel.toLowerCase()) > -1) &&
          currentLogger != logLevel.toLowerCase()) {
          currentLogger = logLevel.toLowerCase();
          enabledLoggerList = updatedLoggerList(currentLogger);
          setStoredLogLevel(logLevel);
        }
      };

      /**
       * If the Log Level is not stored in local storage, initialize enabledLoggerList to a default value
       * Else load the logger from local storage, and initialize the
       * enabledLoggerList array accordingly
       */
      if (!getStoredLogLevel()) {
        self.setDefaultLogLevel();
      } else {
        currentLogger = getStoredLogLevel().toLowerCase();
        enabledLoggerList = updatedLoggerList(currentLogger);
      }

      /**
       * Saves the array of pages to log to the local storage, in the form of comma-separated string
       * @param {Array} pageIdList - Array of pageIds, on which data should be logged
       */
      var setStoredPagesToLog = function (pageIdList) {
        try {
          storageApi.getInstance().setItem("pageIdListToLog", pageIdList);
        } catch (pError) {
        }
      };

      /**
       * Get the List of pages to log from local storage
       */
      var getStoredPagesToLog = function () {
        var localData = null;
        try {
          localData = storageApi.getInstance().getItem("pageIdListToLog");
          localData = localData.split(",");
        } catch (pError) {
        }
        return localData;
      };

      /**
       * Sets the list of pageIds, on which data should be logged
       * @param {Array} pageIdList - An array containing the list of pageId on which data should be logged
       */
      self.setPagesToLog = function (pageIdList) {
        if (pageIdList != null) {
          pagesToLog = pageIdList;
          setStoredPagesToLog(pagesToLog);
        }
      };

      /**
       * Adds a pageId to the list of pageIds, on which data should be logged
       * @param {String} pageId - PageId to be added to the list of pages,
       * for which logging is enabled
       */
      self.addPageIdToLog = function (pageId) {
        if(pagesToLog.indexOf(pageId) < 0) {
          pagesToLog.push(pageId);
          setStoredPagesToLog(pagesToLog);
        }
      };

      /**
       * Disable logging from the pageId. Data will not be logged on this page, anymore
       * @param {String} pageId - PageId to be removed from the list of pages,
       * for which logging should be enabled
       */
      self.disablePageIdToLog = function (pageId) {
        var self = this;
        if (pageId != null && (pagesToLog.indexOf(pageId) > -1)) {
          pagesToLog.splice(pagesToLog.indexOf(pageId), 1);
          self.setPagesToLog(pagesToLog);
        }
      };

      /**
       * If the pages to be logged is not stored in local storage, initialize data from
       * the array list provided here, else load the data from local storage and
       * initialize self.pagesToLog object accordingly
       */
      if (!getStoredPagesToLog()) {
        var pageIdList = ["checkout", "payment", "confirmation"];
        self.setPagesToLog(pageIdList);
      } else {
        pagesToLog = getStoredPagesToLog();
      }

      /**
       * Sends data to the server for logging
       * @param {String} loglevel - The log level trying to log the data
       * @param {Object} track - The data to be logged
       */
      var reportDataToServer = function (loglevel, track) {
        var inputData = {};
        var successFunc = function (param) {
        };
        var errorFunc = function(param) {
        };
        if (track != null && loglevel != null) {
          inputData = {logLevel : loglevel, messages : track };
          ccRestClient.request(CCConstants.ENDPOINT_LOGS_CREATE_LOG, inputData, successFunc, errorFunc);
        }
      };

      /**
       * This method creates Object, that will be logged to server and calls function to log data to server
       * @param {String} eventId - The eventId associated with the event
       * @param {String} messageData - The message to be logged to the server
       * @param {String} loglevel - The log level trying to log data
       */
      var logData = function (eventId, messageData, loglevel) {
        var logType = logLevelResource[loglevel];
        if (logType != null) {
          var visitorId = pageViewTracker.getVisitorId();
          var visitId = pageViewTracker.getVisitId();
          var logMessage = eventId + "-" + logType + " " + messageData + ", " + visitId + ", " + visitorId;
          var logObject = {LogData : logMessage};
          var track = [];
          track.push(logObject);
          reportDataToServer(loglevel, track);
        }
      };

      /**
       * Filter to identify if the passed parameters are valid, and should the data
       * be logged to server based on pageId, logLevel, and loggingEnabled flag.
       * If everything is good, it will call a function to log the data
       * Also generates an eventID based on eventKey
       * @param {String} eventKey - The key associated with the event
       * @param {String} loglevel - The type of logger that wants to log data
       * @param {String} messageData - The message to be logged
       * @param {String} eventID - The eventID for the event being logged
       * @param {Object} self - The object of this library
       */
      var log = function (eventKey, loglevel, messageData, eventID, self) {
        if (self.loggingEnabled && (enabledLoggerList.indexOf(loglevel) > -1) &&
         (pagesToLog.indexOf(currentPageId) > -1)) {
          if (messageData != null) {
            // This should never happen
            if (eventKey == null || eventKey == "") {
              eventKey = DEFAULT_EVENTKEY;
            }
            if (eventID == null) {
              eventID = eventsToLog[eventKey];
              if (eventID == null) {
                eventID = eventKey;
              }
            }
            logData(eventID, messageData, loglevel);
          }
        }
      };

      /**
       * Info logging method
       * @param {String} eventKey - The event to be logged on the server
       * @param {String} messageData - The message to be logged on the server
       * @param {String} eventID - The eventID for the event being logged
       */
      self.logInfo = function (eventKey, messageData, eventID) {
        var self = this;
        var loglevel = "info";
        log(eventKey, loglevel, messageData, eventID, self);
      };

      /**
       * Warning logging method
       * @param {String} eventKey - The event to be logged on the server
       * @param {String} messageData - The message to be logged on the server
       * @param {String} eventID - The eventID for the event being logged
       */
      self.logWarning = function (eventKey, messageData, eventID) {
        var self = this;
        var loglevel = "warning";
        log(eventKey, loglevel, messageData, eventID, self);
      };

      /**
       * Debug logging method
       * @param {String} eventKey - The event to be logged on the server
       * @param {String} messageData - The message to be logged on the server
       * @param {String} eventID - The eventID for the event being logged
       */
      self.logDebug = function (eventKey, messageData, eventID) {
        var self = this;
        var loglevel = "debug";
        log(eventKey, loglevel, messageData,eventID, self);
      };

      /**
       * Error logging method
       * @param {String} eventKey - The event to be logged on the server
       * @param {String} messageData - The message to be logged on the server
       * @param {String} eventID - The eventID for the event being logged
       */
      self.logError = function (eventKey, messageData, eventID) {
        var self = this;
        var loglevel = "error";
        log(eventKey, loglevel, messageData, eventID, self);
      };

      /**
       * Given the eventKey and parameters, it returns the string message
       * @param {String} eventKey - The key for the event that invoked the function
       * @param {Object} param - The parameters passed in, to replace values in messages
       * For example param = {errorCode : "12345" , orderId : "123"};
       */
      self.getMessage = function (eventKey, param) {
        var arg = "";
        if (eventKey != null) {
          var message = messageResource[eventKey];
          if (message != null) {
            for (var i = 0; i < Object.keys(param).length; i++) {
              arg = Object.keys(param)[i];
              message = message.replace("__" + arg + "__", param[arg]);
            }
          }
        }
        return message;
      };

      /**
       * Called when a new page-layout is loaded.
       * Sets the value of currentPageId
       * @param {Object} args - data returned when the page is loaded
       * @param {Object} eventData - Object containing pageId, which is used to set current pageID
       */
      var pageLoaded = function (args, eventData) {
        currentPageId = eventData.pageId;
      };

      $.Topic(PubSub.topicNames.PAGE_LAYOUT_LOADED).subscribe(pageLoaded);
    }

    /**
     * Method to return an instance of library.
     * If the instance is not available, create a new instance
     */
    CCStoreServerLogger.getInstance = function () {
      if (!CCStoreServerLogger.singleInstance) {
        CCStoreServerLogger.singleInstance = new CCStoreServerLogger();
      }
      return CCStoreServerLogger.singleInstance;
    };

    return CCStoreServerLogger;
  }
);

