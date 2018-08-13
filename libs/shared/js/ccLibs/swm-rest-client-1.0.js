//----------------------------------------
/**
 * This library handles making rest calls to jersey style endpoints running on a
 * SWM server.
 * 
 * After creating an instance of the SWMRestClient() class, the init method
 * must be called.
 * 
 * To make a request, just call the request() method.
 */
/*global window: false,  XMLHttpRequest: false, navigator: false, logger */
define(
// -------------------------------------------------------------------
// PACKAGE NAME
// -------------------------------------------------------------------
'swmRestClientConstructor',

// -------------------------------------------------------------------
// DEPENDENCIES
// -------------------------------------------------------------------
[ 'jquery', 'ccRestClient', 'ccLogger', 'storageApi', 'pageLayout/site'],

// -------------------------------------------------------------------
// MODULE DEFINITION
// -------------------------------------------------------------------
function($, ccRestClient, log, storageApi, SiteViewModel) {

  "use strict";

  // ----------------------------------------
  /**
   * Constructor
   */
  function SWMRestClient(pCommonSuccessCallback, pCommonErrorCallback) {
    var self = this;

    self.isInitialized = false;
    self.usingCCAuthentication = false;
    self.isSynced = false;
    self.unauthorizedCount = 0;
    self.cors = ("withCredentials" in new XMLHttpRequest());
    self.corsFrameReady = false;
    self.ccsyncInProgress = false;
    self.ccsyncBlockedCallQue = {"items" : []};

    self.refreshTimeoutID = null;
    
    self.siteid = "";
    self.ccsiteid = "";
    self.apiuserid = "";
    self.apiuserauth = "";
    try {
      storageApi.getInstance().removeItem("social.ccsyncprofileid");
      storageApi.getInstance().removeItem("social.ccsyncapiuserid");
    }
    catch(pError) {
      // safari in private browsing mode does not allow
      // setting stored values
    }
    
    self.ccrestapi = ccRestClient;
    self.tenantid = "";
    self.swmhost = "";
    self.isPreview = false;
    self.currentRequestId = 0; //for xdomain
    
    self.commonSuccessCallback = pCommonSuccessCallback;
    self.commonErrorCallback = pCommonErrorCallback;
    
    self.doRefresh = function() {
      if (self.usingCCAuthentication) {
        var successFunc = function() { };
        var errorFunc =  function(pResult) {};
        self.refresh(successFunc, errorFunc);
        ccRestClient.storeRequestWasMade = true;
      }
    };
    
    self.stackedPostMessages = {"items" : []};
    self.setCorsFrameReady = function() {
      self.corsFrameReady = true;
      if (self.stackedPostMessages && self.stackedPostMessages.items.length > 0 ){
        for (var i = 0; i < self.stackedPostMessages.items.length; i++) {
          self.proxyFrame.postMessage(self.stackedPostMessages.items[i].msgObj, self.swmhost);  
        }
        self.stackedPostMessages = {"items" : []};
      }
    };
  }

  SWMRestClient.GET = "GET";
  SWMRestClient.POST = "POST";
  SWMRestClient.JSON = "json";
  SWMRestClient.REQUEST_JSON_CONTENT_TYPE = "application/json";
  SWMRestClient.REQUEST_FORM_URL_ENCODED = "application/x-www-form-urlencoded";
  SWMRestClient.SWM_CCSYNC_ENDPOINT = "/swm/rs/v1/users/cc";
  SWMRestClient.SWM_REFRESH_ENDPOINT = "/swm/rs/v1/users/refresh";
  SWMRestClient.AUTH_HEADER_NAME = "Authorization";
  SWMRestClient.CC_TENANTID_HEADER_NAME = "X-CCTenantId";
  SWMRestClient.CC_SITEID_HEADER_NAME = "X-CCSiteId";
  SWMRestClient.CC_ISPREVIEW_HEADER_NAME = "X-CCIsPreview";
  SWMRestClient.ACCEPT_LANGUAGE_HEADER_NAME = "Accept-Language";
  SWMRestClient.SWM_ACCESS_TOKEN = "access_token";
  SWMRestClient.AUTH_HEADER_PREFIX = "Bearer ";
  SWMRestClient.JWT_BEARER_GRANT_TYPE = "urn:ietf:params:oauth:grant-type:jwt-bearer";
  SWMRestClient.TOKEN_REFRESH_TIMEOUT = 5000;
  
  //Cross Domain iframe constants
  SWMRestClient.IFRAME_ELEMENT = "iframe";
  SWMRestClient.ZERO = "0";
  SWMRestClient.IFRAME_STYLE = "width: 0; height: 0; border: none;";
  SWMRestClient.IFRAME_NAME = "swm_iframe";
  SWMRestClient.ID_ATTRIBUTE = "id";
  SWMRestClient.NAME_ATTRIBUTE = "name";
  SWMRestClient.WIDTH_ATTRIBUTE = "width";
  SWMRestClient.HEIGHT_ATTRIBUTE = "height";
  SWMRestClient.BORDER_ATTRIBUTE = "border";
  SWMRestClient.STYLE_ATTRIBUTE = "style";
  SWMRestClient.SRC_ATTRIBUTE = "src";
  SWMRestClient.MAX_INT = 4294967295;

  SWMRestClient.prototype.setSWMHost = function(pHost) {
    this.swmhost = pHost;
  };
  
  SWMRestClient.prototype.init = function(pTenantID, isPreview, pLocale) {
    var self = this;
    self.tenantid = pTenantID;
    self.isPreview = (isPreview == true ? "true" : "false");
    self.locale = pLocale;
    self.ccsiteid = SiteViewModel.getInstance()['siteInfo'].id;

    if (!self.cors && !self.isInitialized) {
      self.crossDomainUrl = self.swmhost + "/swm/pm/?tenantId=" + pTenantID + "&isPreview=" + self.isPreview; 
      self.eventHandlerMap = {};
      
      self.eventHandlerMap["initializedSWMFrame"] = {
        success: self.setCorsFrameReady,
        error: self.setCorsFrameReady
      };
      self.initXDomainMessageListener();
      
      // create proxy frame for cross domain requests
      var proxyFramResponse = self.createCrossDomainIFrame();
      if(proxyFramResponse != null) {
        self.proxyFrame = proxyFramResponse.contentWindow;
      }
      
    }
    //swm rest client finished initialization
    self.isInitialized = true;
  };

  /**
   * create iframe for https cross domain requests
   */
  SWMRestClient.prototype.createCrossDomainIFrame = function() {
    
    var self = this;
    var iframeName = SWMRestClient.IFRAME_NAME;
    var iframe = document.createElement(SWMRestClient.IFRAME_ELEMENT);

    iframe.setAttribute(SWMRestClient.ID_ATTRIBUTE, iframeName);
    iframe.setAttribute(SWMRestClient.NAME_ATTRIBUTE, iframeName);
    iframe.setAttribute(SWMRestClient.WIDTH_ATTRIBUTE, SWMRestClient.ZERO);
    iframe.setAttribute(SWMRestClient.HEIGHT_ATTRIBUTE, SWMRestClient.ZERO);
    iframe.setAttribute(SWMRestClient.BORDER_ATTRIBUTE, SWMRestClient.ZERO);
    iframe.setAttribute(SWMRestClient.STYLE_ATTRIBUTE, SWMRestClient.IFRAME_STYLE);
    iframe.setAttribute(SWMRestClient.SRC_ATTRIBUTE, self.crossDomainUrl);

    var iframeId = null;
    try {
      document.body.appendChild(iframe);
      window.frames[iframeName].name = iframeName;

      iframeId = document.getElementById(iframeName);
    }
    catch(pError) {
    }

    return iframeId;
  };
  
  SWMRestClient.prototype.initXDomainMessageListener = function() {
    var self = this;

    // listen for messages returing from the proxy
    window.addEventListener("message", function(event) {
      var origin = event.origin;
      
      /* only allow swm origin calls */
      if(origin !== self.swmhost) {
        return;
      }
            
      var data;
      if (typeof event.data == 'string') {
        data = JSON.parse(event.data);
      } else {
        data = event.data;
      }

      var id = data.id;
      var success = data.success;
      var payload = data.payload;
      var handler = self.eventHandlerMap[id];
      if(handler) {
        if(success) {
          handler.success(payload);
        } else {
          handler.error(JSON.stringify(payload));
        }
      }
    }, false);
    
  };

  
  /**
   * send proxy request
   */
  SWMRestClient.prototype.proxyRequest = function(pMethod, pUrl, pData, pSuccessCallback, pErrorCallback, pJSONParams) {
    
    var self = this;
     // increment the request id
    if(self.currentRequestId >= SWMRestClient.MAX_INT) {
      self.currentRequestId = 0;
    } else {
      self.currentRequestId++;
    }
  
    var requestId = self.currentRequestId;
    self.eventHandlerMap[requestId] = {
      success: pSuccessCallback,
      error: pErrorCallback
    };
  
    // replace {siteid} token, if necessary since this was returned by ccsync
    var uri = pUrl.replace("{siteid}", self.siteid);
    uri = self.swmhost + self.insertParamsIntoUri(uri, pJSONParams);
    
    if (uri.indexOf(SWMRestClient.SWM_REFRESH_ENDPOINT) == -1 &&
        uri.indexOf(SWMRestClient.SWM_CCSYNC_ENDPOINT) == -1) {
      if (self.refreshTimeoutID == null) {
        self.refreshTimeoutID = setTimeout(self.doRefresh, SWMRestClient.TOKEN_REFRESH_TIMEOUT);
      }
      else
      {
        clearTimeout(self.refreshTimeoutID);
        self.refreshTimeoutID = setTimeout(self.doRefresh, SWMRestClient.TOKEN_REFRESH_TIMEOUT);
      }
    }
    
    
    var isCCSync = (pUrl.indexOf(SWMRestClient.SWM_CCSYNC_ENDPOINT) === 0);

    var reqContentType = (isCCSync ? SWMRestClient.REQUEST_FORM_URL_ENCODED : SWMRestClient.REQUEST_JSON_CONTENT_TYPE);
    var reqData = (pData ? (isCCSync ? pData : JSON.stringify(pData)) : "");
    
    // send the message
    var messageObj = {};
    messageObj.id = requestId;
    messageObj.pMethod = pMethod;
    messageObj.pUrl = uri;
    messageObj.pData = reqData;
    messageObj.pIsPreview = self.isPreview;
    messageObj.pTenantId = self.tenantid;
    messageObj.pCCSiteId = self.ccsiteid;
    messageObj.pLocale = self.locale;
    messageObj.pApiuserauth = self.apiuserauth;
    messageObj.pAssertion = self.ccrestapi.tokenSecret;
    
    if (self.corsFrameReady){
      self.proxyFrame.postMessage(JSON.stringify(messageObj), self.swmhost);  
    } 
    else {
      self.stackedPostMessages.items.push({"msgObj" : JSON.stringify(messageObj)});
    }
    
  };
  
  
  /**
   * Make a ccsync request which authenticates the CC/SWM user.
   */
  SWMRestClient.prototype.syncCCUser = function(pSuccessCallback, pErrorCallback) {
    var self = this;

    var syncSuccessCB = function(result) {
      self.isSynced = true;
      self.siteid = result.siteId;
      self.apiuserid = result.userId;
      self.apiuserauth = result.access_token;
      
      try {
        storageApi.getInstance().setItem("social.ccsyncprofileid", self.ccrestapi.profileId);
        storageApi.getInstance().setItem("social.ccsyncapiuserid", result.userId);
      }
      catch(pError) {
        // safari in private browsing mode does not allow setting stored values
      }
      
      if (pSuccessCallback) {
        pSuccessCallback(result);
      }
    };
    
    var syncErrorCB = function(err) {
      self.isSynced = false;
      if (self.refreshTimeoutID != null) {
        clearTimeout(self.refreshTimeoutID);
      }
      if (pErrorCallback){
        pErrorCallback(err);  
      }
    };

    
    if (!this.cors) {
      this.proxyRequest(SWMRestClient.POST, 
        SWMRestClient.SWM_CCSYNC_ENDPOINT + '/{ccprofileid}',
        'grant_type=' + encodeURIComponent(SWMRestClient.JWT_BEARER_GRANT_TYPE) + 
        '&assertion=' + encodeURIComponent(self.ccrestapi.tokenSecret),
        syncSuccessCB, syncErrorCB, {'ccprofileid':self.ccrestapi.profileId});
    } 
    else {
      this.corsRequest(SWMRestClient.POST, 
        SWMRestClient.SWM_CCSYNC_ENDPOINT + '/{ccprofileid}',
        'grant_type=' + encodeURIComponent(SWMRestClient.JWT_BEARER_GRANT_TYPE) + 
        '&assertion=' + encodeURIComponent(self.ccrestapi.tokenSecret), 
        syncSuccessCB, syncErrorCB, {'ccprofileid':self.ccrestapi.profileId});
    }
    
  };
  
  //----------------------------------------
  /**
   * oauth refresh method
   */
  SWMRestClient.prototype.refresh = function(pSuccessCallback, pErrorCallback) {
    var self = this;

    var successFunc = function(result) {
      self.isSynced = true;
      self.apiuserauth = result.access_token;
      if (pSuccessCallback) {
        pSuccessCallback(result);
      }
    };
    var errorFunc = function(pResult) {
      // TODO handle expiry
    };

    if(self.apiuserauth) {
      if (!self.cors){
        self.proxyRequest(SWMRestClient.POST, SWMRestClient.SWM_REFRESH_ENDPOINT,
            {}, successFunc, errorFunc);
      }
      else {
        self.corsRequest(SWMRestClient.POST, SWMRestClient.SWM_REFRESH_ENDPOINT,
            {}, successFunc, errorFunc);  
      }
    } else {
      errorFunc();
    }
  };
  
  /**
   * Clears authentication storage.
   */
  SWMRestClient.prototype.clear = function() {
    var self = this;
    self.usingCCAuthentication = false;
    self.isSynced = false;
    self.siteid = "";
    self.apiuserid = "";
    self.apiuserauth = "";
    try {
      storageApi.getInstance().removeItem('social.ccsyncprofileid');
      storageApi.getInstance().removeItem('social.ccsyncapiuserid');
    }
    catch(pError) {
      // safari in private browsing mode does not allow setting stored values
    }
  };
  
  /**
   * Makes a SWM REST request.
   */
  SWMRestClient.prototype.request = function(pMethod, pUrl, pData,
      pSuccessCallback, pErrorCallback, pJSONParams) {
    
    var self = this;
    var reqSuccessCB = pSuccessCallback;
    var reqErrorCB = pErrorCallback;
    
    if (self.swmhost == "" || !self.isInitialized) {
      // caller will always have to make sure client is initialized!
      log.warn("rest client not initialized properly");
      return;
    }

    // detect whether user is logged into CC
    if (self.ccrestapi.profileId != null && self.ccrestapi.tokenSecret != null) {
      self.usingCCAuthentication = true;
    }
      
    var ccsyncprofileid = storageApi.getInstance().getItem("social.ccsyncprofileid");
    var ccsyncapiuserid = storageApi.getInstance().getItem("social.ccsyncapiuserid");
      
    if ((ccsyncprofileid && self.ccrestapi.profileId !== ccsyncprofileid) || (ccsyncapiuserid && self.apiuserid !== ccsyncapiuserid)) {
      // if the ccrestapi.profileid no longer matches the profileid that we ccsynced on, 
      // then another user may have logged into cc, so we invalidate the swm authorization
      // so that the swm authorization belongs to the new user and refresh the user as well

      // if the apiuserid no longer matches the apiuserid that we ccsynced on, this
      // could indicate that a user may have logged into another tab and we need the
      // original tab to reflect the currently logged in user, so we invalidate the 
      // swm authorization and refresh the user
      self.clear();
      
      // respond with code that indicates swm is unauthorized, and should be refreshed
      var jsonStr = '{"o:errorCode":"401.99"}';
      self.commonErrorCallback(jsonStr);
      return;
    }
    if ((self.apiuserid !== ccsyncapiuserid) || (self.ccrestapi.profileId !== ccsyncprofileid)){
      self.isSynced = false;
    }
    if (self.usingCCAuthentication && !self.isSynced) {
      var successCB = function(result) {
        // successful sync; now call the original request
        self.ccsyncInProgress = false;
        if (!self.cors){
          self.proxyRequest(pMethod, pUrl, pData, reqSuccessCB, reqErrorCB, pJSONParams);
        } 
        else {
          self.corsRequest(pMethod, pUrl, pData, reqSuccessCB, reqErrorCB, pJSONParams);  
        }
        
        // now call the requests in Que, that were blocked by CCSYNC
        self.ccsyncBlockedCallQueExecution();
      };
      var errorCB = function(err) {
        self.ccsyncInProgress = false;
        if (self.refreshTimeoutID != null) {
          clearTimeout(self.refreshTimeoutID);
        }
        if (reqErrorCB) {
          reqErrorCB(err); 
        }    
      };
      
      if (!self.ccsyncInProgress) {
        self.ccsyncInProgress = true;
        self.syncCCUser(successCB, errorCB);  
      }
      else {
        self.ccsyncBlockedCallQue.items.push({
          "pMethod" : pMethod, 
          "pUrl" : pUrl, 
          "pData" : pData, 
          "pSuccessCallback" : pSuccessCallback, 
          "pErrorCallback" : pErrorCallback, 
          "pJSONParams" : pJSONParams
        });
      }
      
    }
    else {
      if (!self.cors) {
        this.proxyRequest(pMethod, pUrl, pData, pSuccessCallback, pErrorCallback, pJSONParams);
      } 
      else {
        this.corsRequest(pMethod, pUrl, pData, pSuccessCallback, pErrorCallback, pJSONParams);  
      }      
    }
  };

  
  SWMRestClient.prototype.ccsyncBlockedCallQueExecution = function() {
    var self = this;
    if ( self.ccsyncBlockedCallQue.items.length > 0 ) {
      for (var i=0; i<self.ccsyncBlockedCallQue.items.length; i++){
        if (!self.cors){
          self.proxyRequest(self.ccsyncBlockedCallQue.items[i].pMethod, 
              self.ccsyncBlockedCallQue.items[i].pUrl, 
              self.ccsyncBlockedCallQue.items[i].pData, 
              self.ccsyncBlockedCallQue.items[i].pSuccessCallback, 
              self.ccsyncBlockedCallQue.items[i].reqErrorCB, 
              self.ccsyncBlockedCallQue.items[i].pJSONParams);
        } 
        else {
          self.corsRequest(self.ccsyncBlockedCallQue.items[i].pMethod, 
              self.ccsyncBlockedCallQue.items[i].pUrl, 
              self.ccsyncBlockedCallQue.items[i].pData, 
              self.ccsyncBlockedCallQue.items[i].pSuccessCallback, 
              self.ccsyncBlockedCallQue.items[i].reqErrorCB, 
              self.ccsyncBlockedCallQue.items[i].pJSONParams);  
        }
      }
      // Done processing que, need to clear it. 
      self.ccsyncBlockedCallQue = {"items" : []};
    }
  };
    
  /**
   * make a rest request
   */
  SWMRestClient.prototype.corsRequest = function(pMethod, pUrl, pData,
      pSuccessCallback, pErrorCallback, pJSONParams) {
    var self = this;
    var method = pMethod;

    // replace {siteid} token, if necessary since this was returned by ccsync
    var uri = pUrl.replace("{siteid}", self.siteid);
    uri = self.swmhost + self.insertParamsIntoUri(uri, pJSONParams);

    if (uri.indexOf(SWMRestClient.SWM_REFRESH_ENDPOINT) == -1 &&
        uri.indexOf(SWMRestClient.SWM_CCSYNC_ENDPOINT) == -1) {
      if (self.refreshTimeoutID == null) {
        self.refreshTimeoutID = setTimeout(self.doRefresh, SWMRestClient.TOKEN_REFRESH_TIMEOUT);
      }
      else
      {
        clearTimeout(self.refreshTimeoutID);
        self.refreshTimeoutID = setTimeout(self.doRefresh, SWMRestClient.TOKEN_REFRESH_TIMEOUT);
      }
    }
      
    // setup success callback which includes wrapper so that all success events
    // can share a common handler in addition to their own success handler
    var successFunc = function(pResult) {
      
      // if this isn't a ccsync, then reset unauthorized to prevent endless loops
      if (pUrl.indexOf(SWMRestClient.SWM_CCSYNC_ENDPOINT) == -1) {
        self.unauthorizedCount = 0;
      }
      
      var wrappedSuccessCallback = function(response, status) {
        self.commonSuccessCallback(response, status);
        pSuccessCallback(response, status);
      };
      wrappedSuccessCallback(pResult.data, pResult.textStatus);
    };

    var errorFunc = function(pResult) {

      var wrappedErrorCallback = function(response, status, errorThrown) {
        self.commonErrorCallback(response, status, errorThrown);  
        pErrorCallback(response, status, errorThrown);
      };

      // if the cc user is logged in but an unauthorized was returned,
      // resync and retry the request (but only once)
      if (self.usingCCAuthentication) {
        try {
          var errJSON = JSON.parse(pResult.jqXHR.responseText);
          if (self.unauthorizedCount <= 1 && errJSON['status'] === 401 && 
              pUrl.indexOf(SWMRestClient.SWM_CCSYNC_ENDPOINT) == -1) {
            self.isSynced = false;
            self.unauthorizedCount++;
            self.request(pMethod, pUrl, pData, pSuccessCallback, pErrorCallback, pJSONParams);
          }
          else
          {
            wrappedErrorCallback(pResult.jqXHR.responseText, pResult.jqXHR.status, pResult.errorThrown);
          }
        }
        catch(e) {}
      }
      else
      {
        wrappedErrorCallback(pResult.jqXHR.responseText, pResult.jqXHR.status, pResult.errorThrown);
      }
    };

    // ie caching fix, adds a timestamp parameter to query string
    if (method === SWMRestClient.GET) {
      uri = self.fixIECaching(uri);
    }

    var isCCSync = (pUrl.indexOf(SWMRestClient.SWM_CCSYNC_ENDPOINT) === 0);

    var reqContentType = (isCCSync ? SWMRestClient.REQUEST_FORM_URL_ENCODED : SWMRestClient.REQUEST_JSON_CONTENT_TYPE);
    var reqData = (pData ? (isCCSync ? pData : JSON.stringify(pData)) : "");

    var obj = {};
    obj = {
      dataType : SWMRestClient.JSON,
      contentType : reqContentType,
      type : method,
      url : uri,
      data : reqData,
      processData : false,
      success : function(data, textStatus, jqXHR) {
        successFunc({
          data : data,
          textStatus : textStatus,
          jqXHR : jqXHR
        });
      },
      error : function(jqXHR, textStatus, errorThrown) {
        errorFunc({
          jqXHR : jqXHR,
          textStatus : textStatus,
          errorThrown : errorThrown
        });
      }
    };
      
    var headers = {};
    headers[SWMRestClient.CC_ISPREVIEW_HEADER_NAME] = self.isPreview;
    headers[SWMRestClient.ACCEPT_LANGUAGE_HEADER_NAME] = self.locale;
    if (isCCSync) {
      headers[SWMRestClient.CC_TENANTID_HEADER_NAME] = self.tenantid;
      headers[SWMRestClient.CC_SITEID_HEADER_NAME] = self.ccsiteid;
    }
    else if (self.apiuserauth && self.apiuserauth.length > 0) {
      headers[SWMRestClient.AUTH_HEADER_NAME] = SWMRestClient.AUTH_HEADER_PREFIX + self.apiuserauth;
    }

    obj["headers"] = headers;
    $.ajax(obj);
  };

  /**
   * insert params into uri
   */
  SWMRestClient.prototype.insertParamsIntoUri = function(pUri, pJSONParams) {
    
    var uri = pUri;
    for (var key in pJSONParams) {
      if (pJSONParams.hasOwnProperty(key)) {
        uri = uri.replace("{"+ key + "}", encodeURIComponent(pJSONParams[key]));
      }
    }
    
    return uri;
  };

  /**
   * Fix for IE to prevent caching of GET requests.
   */
  SWMRestClient.prototype.fixIECaching = function(url) {
    if (url && navigator.appName == "Microsoft Internet Explorer") {
      url += (url.indexOf("?") !== -1 ? "&" : "?") + "__ie__fix__=" + new Date().getTime();
    }
    return url;
  };


  // ----------------------------------------
  /**
   * get a timestamp
   */
  SWMRestClient.getTimestamp = function(pOffset) {
    var current = new Date() / 1000;
    var offset = parseInt(pOffset, 10);
    var withOffset = current + offset;
    
    return parseInt(+withOffset, 10);
  };

  return SWMRestClient;
});

