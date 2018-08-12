define(["xDomainProxy","ccConstants","jquery","pubsub","storageApi","viewportHelper","ccStoreConfiguration"],function(e,t,r,o,n,i,a){"use strict";function s(n,i){var a=this;a.profileId=null,a.profileRoles=null,a.tokenSecret=null,a.endpointRegistry=null,a.loggedIn=!1,a.initComplete=!1,a.initCompleteCallbacks=[],a.initCompleteCallbacksDone=!1,a.storageSyncCallbacks=[],a.storageSyncDone=!1,a.loginUpdateCallbacks=[],a.logoutUpdateCallbacks=[],a.loginAdminUpdateCallbacks=[],a.logoutAdminUpdateCallbacks=[],a.iframeLoadCompleteCallbacks=[],a.initIframeLoadComplete=!1,a.initIframeLoadCompleteDone=!1,a.profileType=n,a.previewMode=!1,a.allowSiteSwitchingOnProduction=!1,a.initFailed=!1,a.disableLoginErrorRedirect=!1,a.commonErrorCallback=i,a.url=e.urlHostnamePortPortionOnly(document.URL),a.urlProtocol=e.urlProtocolOnly(document.URL),a.NULL=s.NULL,a.currentRequestId=0,a.storeRequestWasMade=!1,a.etagCache=[],a.handleSessionExpiry=function(){r.Topic(o.topicNames.USER_SESSION_EXPIRED).publish()},a.isRefreshRequired=!1,a.lastPublishedTimeStamp=null,a.isNotStore=!(!window.isPreviewMode&&a.profileType==t.PROFILE_TYPE_STOREFRONT),a.external=!1}return s.NULL="cc-rest-null",s.LOCAL_STORAGE_TOKEN="oauth_token_secret",s.LOCAL_STORAGE_LAST_UPDATE="oauth_last_update",s.LOCAL_STORAGE_EXPIRES=";expires=",s.LOCAL_STORAGE_LIFE_DAYS=1,s.TOKEN_FRESH_TIME=36e5,s.HTTP_UNAUTHORIZED_ERROR="401",s.DELETE="delete",s.ADMIN_LOGOUT_SERVICE_PATH="/ccadminui/v1/logout",s.ADMIN_REFRESH_SERVICE_PATH="/ccadminui/v1/refresh",s.ADMIN_ENDPOINT_REGISTRY_SERVICE_PATH="/ccadminui/v1/registry",s.ADMIN_VERIFY_SERVICE_PATH="/ccadminui/v1/verify",s.ADMIN_LOGIN_SCREEN_URL="/occs-admin",s.LOGOUT_SERVICE_PATH="/ccstoreui/v1/logout",s.REFRESH_SERVICE_PATH="/ccstoreui/v1/refresh",s.ENDPOINT_REGISTRY_SERVICE_PATH="/ccstoreui/v1/registry",s.VERIFY_SERVICE_PATH="/ccstoreui/v1/verify",s.SAML_AUTHN_REQUEST_SERVICE_URL="/ccstoreui/v1/samlAuthnRequest?encode=true",s.AGENT_LOGOUT_SERVICE_PATH="/ccagentui/v1/logout",s.AGENT_REFRESH_SERVICE_PATH="/ccagentui/v1/refresh",s.AGENT_ENDPOINT_REGISTRY_SERVICE_PATH="/ccagentui/v1/registry",s.AGENT_VERIFY_SERVICE_PATH="/ccagentui/v1/verify",s.AGENT_LOGIN_SCREEN_URL="/occs-agent",s.LOCAL_STORAGE_LOGIN_KEY="cc.login.update.",s.LOCAL_STORAGE_LOGOUT_KEY="cc.logout.update.",s.INPUT_ELEMENT="input",s.IFRAME_ELEMENT="iframe",s.ZERO="0",s.IFRAME_STYLE="width: 0; height: 0; border: none;",s.IFRAME_NAME="https_iframe",s.ID_ATTRIBUTE="id",s.NAME_ATTRIBUTE="name",s.WIDTH_ATTRIBUTE="width",s.HEIGHT_ATTRIBUTE="height",s.BORDER_ATTRIBUTE="border",s.STYLE_ATTRIBUTE="style",s.SRC_ATTRIBUTE="src",s.MAX_INT=4294967295,s.LOCALE_HINT="localeHint",s.HINT_BROWSER="browser",s.HINT_ASSET_LANGUAGE_OPTIONAL="assetLanguageOptional",s.HINT_ASSET_LANGUAGE_REQUIRED="assetLanguageRequired",s.BEFORE_SEND_NOT_SUPPORTED="Before-send callback not supported for proxy requests.",s.LAST_PUBLISHED_TIME_STAMP="lastPublishedTimeStamp",s.prototype.initProxy=function(t,r){var o=this,n=t,i=r;n||(n=location.port),i||(i=location.port),o.crossDomainURL=e.getCrossDomainURL(o.profileType,e.HTTPS_PROTOCOL,i,!0),o.crossDomainURLNoPath=e.getCrossDomainURL(o.profileType,e.HTTPS_PROTOCOL,i,!1),o.proxy=new e(o.profileType,n,i)},s.prototype.registerInitFailCallback=function(e){var t=this;t.initFailCallback=e,t.initFailed&&t.initFailCallback()},s.prototype.registerStorageSyncCallback=function(e){var t=this;t.storageSyncDone?e():t.storageSyncCallbacks.push(e)},s.prototype.registerInitCallback=function(e){var t=this;t.initComplete?e():t.initCompleteCallbacks.push(e)},s.prototype.registerLoginUpdateCallback=function(e){var t=this;t.loginUpdateCallbacks.push(e)},s.prototype.registerLogoutUpdateCallback=function(e){var t=this;t.logoutUpdateCallbacks.push(e)},s.prototype.registerLoginAdminUpdateCallback=function(e){var t=this;t.loginAdminUpdateCallbacks.push(e)},s.prototype.registerLogoutAdminUpdateCallback=function(e){var t=this;t.logoutAdminUpdateCallbacks.push(e)},s.prototype.init=function(r,o,i){var a=this,s=function(){if(!a.initCompleteCallbacksDone){a.initComplete=!0;for(var e=0;e<a.initCompleteCallbacks.length;e++)a.initCompleteCallbacks[e]();a.initCompleteCallbacks.length=0,a.initCompleteCallbacksDone=!0}},l=function(){a.refresh(s,s)},u=function(){for(var e=0;e<a.storageSyncCallbacks.length;e++)a.storageSyncCallbacks[e]();a.storageSyncDone=!0};n.getInstance().initSyncing(function(){a.reloadStoredValueAuth(),a.proxy&&a.refresh(u,u)}),a.reloadStoredValueAuth(),a.registerAsLoginLogoutEventListener();var E=function(){if(a.urlProtocol!=e.HTTPS_PROTOCOL&&a.crossDomainRequestsEnabled===!0){a.useIframe=!0,a.eventHandlerMap={},a.eventHandlerMap[e.IFRAME_INIT_COMPLETE_EVENT]={success:l,error:l},a.initXDomainMessageListener();var t=a.createCrossDomainIFrame();null!=t&&(a.proxyFrame=t.contentWindow)}else a.useIframe=!1,l()};window.urlLocale?a.setStoredValue(t.LOCAL_STORAGE_USER_CONTENT_LOCALE,window.urlLocale):a.clearStoredValue(t.LOCAL_STORAGE_USER_CONTENT_LOCALE);var T=function(e){e=e.replace(/[\[]/,"\\[").replace(/[\]]/,"\\]");var t=new RegExp("[\\?&]"+e+"=([^&#]*)"),r=t.exec(location.search);return null===r?"":decodeURIComponent(r[1].replace(/\+/g," "))};if(a.previewMode||a.allowSiteSwitchingOnProduction){var c=T(t.URL_SITE_PARAM);c&&a.setStoredValue(t.LOCAL_STORAGE_SITE_ID,c)}else window.siteId&&a.setStoredValue(t.LOCAL_STORAGE_SITE_ID,window.siteId);var p=function(){if(null==a.endpointRegistry){var e=function(e){a.initProxy(e.httpPort,e.httpsPort),E()},t=function(e){var t=JSON.parse(e);"401"==t.status&&a.redirectToAdminLoginScreen(),null!=a.initFailCallback&&a.initFailCallback(),a.initFailed=!0};a.requestEndpointRegistry(e,t)}else E()},_=function(){if(a.profileType==t.PROFILE_TYPE_STOREFRONT&&!a.previewMode){var e=function(e){"401"==e.status&&a.redirectToAdminLoginScreen()};a.request(t.ENDPOINT_GET_MERCHANT_TIMEZONE,{},function(e){},e)}};if(r){if(i){var d=i;"string"==typeof i&&(d=JSON.parse(i)),a.endpointRegistry=d.endpointMap,a.crossDomainRequestsEnabled=d.crossDomainRequestsEnabled,a.profileType==t.PROFILE_TYPE_STOREFRONT&&a.initializeLastPublishedTimeStamp()}window.isPreviewMode&&(a.previewMode=window.isPreviewMode),a.initProxy(location.port,location.port),l()}else p(),o||_()},s.prototype.initXDomainMessageListener=function(){var e=this;window.addEventListener("message",function(t){var r=t.origin;if(r==e.crossDomainURLNoPath){var o;o="string"==typeof t.data?JSON.parse(t.data):t.data;var n=o.id,i=o.success,a=o.payload,s=e.eventHandlerMap[n];s&&(i?s.success(a):s.error(a))}},!1)},s.prototype.proxyRequest=function(e,t,r,o,n){var i=this;i.currentRequestId>=s.MAX_INT?i.currentRequestId=0:i.currentRequestId++;var a=i.currentRequestId;i.eventHandlerMap[a]={success:r,error:o};var l={};l.id=a,l.target=e,l.payload=t,i.proxyFrame.postMessage(JSON.stringify(l),i.crossDomainURL,n)},s.prototype.proxyRequestRequired=function(e){var t=this;return!(!e||e.httpsRequired!==!0||"https"==t.urlProtocol)},s.prototype.login=function(e,t,r,o){var n={user:e,password:t};this.loginInternal(n,r,o)},s.prototype.mfaLogin=function(e,t,r,o,n){var i={user:e,password:t,totp_code:r};this.loginInternal(i,o,n)},s.prototype.samlLogin=function(e,t,r){var o=this,n={samlResponse:e};o.loginInternal(n,t,r)},s.prototype.loginInternal=function(n,i,a){var l=this,u=function(t){l.tokenSecret=t[e.OAUTH_ACCESS_TOKEN_PARAM],l.parseAndStoreClaims(),l.storeToken(l.tokenSecret),l.loggedIn=!0,i()},E=function(e){l.loggedIn=!1,e?a(e):r.Topic(o.topicNames.USER_NETWORK_ERROR).publish([{message:"failure"}])},T={};l.previewMode?(l.resetAdminPreviewToken(),T.tokenSecret=l.tokenSecret):l.clearSessionStoredValue(s.LOCAL_STORAGE_TOKEN,t.PROFILE_TYPE_LAYOUT_PREVIEW),null!=n.samlResponse?l.doSamlLogin(n.samlResponse,u,E,T):n.totp_code&&null!==n.totp_code?l.doMFALogin(n.user,n.password,n.totp_code,u,E,T):l.doLogin(n.user,n.password,u,E,T)},s.prototype.doLogin=function(e,t,r,o,n){var i=this;i.useIframe&&i.proxyRequestRequired({httpsRequired:!0})?i.proxyRequest("login",{user:e,password:t},r,o):i.proxy.loginRequest(e,t,r,o,n)},s.prototype.doMFALogin=function(e,t,r,o,n,i){var a=this;a.useIframe&&a.proxyRequestRequired({httpsRequired:!0})?a.proxyRequest("login",{user:e,password:t},o,n):a.proxy.mfaLoginRequest(e,t,r,o,n,i)},s.prototype.doSamlLogin=function(e,t,r,o){var n=this;n.useIframe&&n.proxyRequestRequired({httpsRequired:!0})?n.proxyRequest("login",{samlResponse:e},t,r):n.proxy.samlLoginRequest(e,t,r,o)},s.prototype.generateSamlAuthnRequest=function(t,r){var o=this;o.authenticatedRequest(s.SAML_AUTHN_REQUEST_SERVICE_URL,{},t,r,e.POST)},s.prototype.logout=function(r,o){var n=this,i=s.LOGOUT_SERVICE_PATH;n.profileType==t.PROFILE_TYPE_ADMIN?i=s.ADMIN_LOGOUT_SERVICE_PATH:n.profileType==t.PROFILE_TYPE_AGENT&&(i=s.AGENT_LOGOUT_SERVICE_PATH);var a=function(){n.clearStoredValues(),n.clearValues(),n.loggedIn=!1,n.resetAdminPreviewToken()},l=function(e){a(),r()},u=function(e){a(),o(e)};n.authenticatedRequest(i,{},l,u,e.POST)},s.prototype.verify=function(r,o){var n=this,i=function(){n.loggedIn=!0,r()},a=function(e){n.clearStoredValues(),n.clearValues(),n.resetAdminPreviewToken(),o(e)},l=s.VERIFY_SERVICE_PATH;n.profileType==t.PROFILE_TYPE_ADMIN?l=s.ADMIN_VERIFY_SERVICE_PATH:n.profileType==t.PROFILE_TYPE_AGENT&&(l=s.AGENT_VERIFY_SERVICE_PATH),n.tokenSecret?n.authenticatedRequest(l,{},i,a,e.POST):a()},s.prototype.refresh=function(r,o){var n=this,i=s.REFRESH_SERVICE_PATH;n.profileType==t.PROFILE_TYPE_ADMIN||n.profileType==t.PROFILE_TYPE_LAYOUT_PREVIEW?i=s.ADMIN_REFRESH_SERVICE_PATH:n.profileType==t.PROFILE_TYPE_AGENT&&(i=s.AGENT_REFRESH_SERVICE_PATH);var a=function(t){n.tokenSecret=t[e.OAUTH_ACCESS_TOKEN_PARAM],n.parseAndStoreClaims(),n.storeToken(n.tokenSecret),n.loggedIn=!0,r(t)},l=function(e){e&&(n.handleSessionExpiry(),n.clearStoredValues(),n.clearValues(),n.resetAdminPreviewToken()),o(e)};if(n.external&&n.tokenSecret){var u=this.readToken();u||n.clearValues()}n.tokenSecret?n.authenticatedRequest(i,{},a,l,e.POST,!1,!0):l()},s.prototype.registerAsLoginLogoutEventListener=function(){var r=this,o=function(o){o||(o=window.event);var n=e.urlHostnamePortPortionOnly(o.url);if(n==r.url)if(o.key==r.getStoredValueName(s.LOCAL_STORAGE_TOKEN)){var i=!1;if(o.newValue&&(i=!0,r.tokenSecret=o.newValue,r.parseAndStoreClaims()),i){r.loggedIn=!0;for(var a=0;a<r.loginUpdateCallbacks.length;a++)r.loginUpdateCallbacks[a]()}else{r.clearValues();for(var l=0;l<r.logoutUpdateCallbacks.length;l++)r.logoutUpdateCallbacks[l]()}}else if(r.previewMode&&o.key==r.getStoredValueName(s.LOCAL_STORAGE_TOKEN,t.PROFILE_TYPE_ADMIN))if(!o.newValue&&o.oldValue)for(var l=0;l<r.logoutAdminUpdateCallbacks.length;l++)r.logoutAdminUpdateCallbacks[l]();else for(var a=0;a<r.loginAdminUpdateCallbacks.length;a++)r.loginAdminUpdateCallbacks[a]()};window.addEventListener?window.addEventListener("storage",o,!1):window.attachEvent("onstorage",o)},s.prototype.reloadStoredValueAuth=function(){var e=this.readToken();return e?(this.tokenSecret=e,this.parseAndStoreClaims(),this.checkPreviewWhenLoggedIn(),!0):this.resetAdminPreviewToken()},s.prototype.checkPreviewWhenLoggedIn=function(){return this.resetAdminPreviewToken(!0)},s.prototype.resetAdminPreviewToken=function(e){var r=this;e=e&&"boolean"==typeof e;var o=r.getStoredValueName(s.LOCAL_STORAGE_TOKEN,t.PROFILE_TYPE_ADMIN),i=r.getSessionStoredValue(o);return!(!i||r.profileType!=t.PROFILE_TYPE_STOREFRONT&&r.profileType!=t.PROFILE_TYPE_LAYOUT_PREVIEW||!r.isNotStore)&&(e||(r.tokenSecret=i),r.previewMode||(r.registerLoginAdminUpdateCallback(function(){r.resetAdminPreviewToken()}),r.registerLogoutAdminUpdateCallback(function(){r.clearStoredValues(),r.clearValues(),r.loggedIn=!1,n.getInstance().removeItem("user"),r.redirectToAdminLoginScreen()})),r.previewMode=!0,!0)},s.prototype.getAjaxConfig=function(e,t,r,o,n,i,a,s,l){var u=null,E=function(e,t){return t.beforeSend=l,u=t,!1};return this.request(e,t,r,o,n,i,a,s,E),u},s.prototype.request=function(e,r,o,n,i,a,s,l,u,E){var T=!0;this.profileType==t.PROFILE_TYPE_ADMIN&&(T=!1),this.requestWithSite(e,T,r,o,n,i,a,s,l,u,null,E)},s.prototype.requestWithSite=function(r,o,i,l,u,E,T,c,p,_,d,R){var S=this,A=function(){var A=S.registryLookup(r),I="GET",O=!1,L=r,f={};null!=A&&(O=A.authRequired,I=A.method,null!=L&&L.charAt(0)!=e.SLASH&&(L=A.url)),L=S.insertParamsIntoUri(L,[E,T,c,p]);var g=!1;S.useIframe&&S.proxyRequestRequired(A)&&(g=!0);var P=function(r){if(r&&r[e.ETAG_PROPERTY])try{var o=JSON.parse(e.decodeBase64(r[e.ETAG_PROPERTY]));o&&o.user&&(r.etag_lastModifiedBy=o.user),S.etagCache[L]=r[e.ETAG_PROPERTY]}catch(e){console.log("ETAG parse error: ",e)}if(r&&r[e.LAST_PUBLISHED_TIME_PROPERTY]){var i=r[e.LAST_PUBLISHED_TIME_PROPERTY];if(null!=S.lastPublishedTimeStamp&&S.lastPublishedTimeStamp<i){var s=n.getInstance().getItem(t.LAST_REFRESH_TIME);if(a.getInstance().refreshAfter()&&0!=a.getInstance().refreshAfter()&&null!=s){var u=a.getInstance().refreshAfter(),E=new Date(s);E.setSeconds(E.getSeconds()+u);var T=new Date;(T.toDateString()!==E.toDateString()||T.toDateString()===E.toDateString()&&T.getTime()>E.getTime())&&(S.lastPublishedTimeStamp=i,n.getInstance().setItem(t.LAST_REFRESH_TIME,new Date),S.isRefreshRequired=!0)}else S.lastPublishedTimeStamp=i,n.getInstance().setItem(t.LAST_REFRESH_TIME,new Date),S.isRefreshRequired=!0}}l(r)};if(!O&&S.loggedIn&&(O=!0),f=S.updateHeaderWithLocaleHint(A),f=S.updateHeaderWithPriceListGroupId(f),f=S.updateHeaderWithSelectedOrganization(f),f=S.updateHeaderWithAgentContext(f),f=S.updateHeaderWithViewport(f),f=S.updateHeaderWithShopperContext(f),f=S.updateHeaderWithSiteId(f,!1,o,d),f=S.updateHeaderWithVisitId(f),f=S.updateHeaderWithVisitorId(f),null!=A&&"PUT"===A.method&&S.etagCache[L]&&(f[e.ETAG]=S.etagCache[L],delete S.etagCache[L],A.useOptimisticLock&&(f["If-Match"]=f[e.ETAG])),1==O){var h=function(e){return e&&(e.status!=s.HTTP_UNAUTHORIZED_ERROR&&e.errorCode!==t.ERRORCODE_INVALID_SITE_ID||(S.clearStoredValues(),S.clearValues(),S.handleSessionExpiry()),e.errorCode===t.ERRORCODE_INVALID_SITE_ID)?(localStorage.clear(),window.location.reload(!0),!1):void u(e)};S.authenticatedRequest(L,i,P,h,I,g,null,f,_,R)}else S.unauthenticatedRequest(L,i,P,u,I,null,f,_)};S.registerInitCallback(A)},s.prototype.updateHeaderWithLocaleHint=function(o,n,i){var a=r.extend({},n),l=i||!1;if(!o)return a;if(!l&&a[e.ASSET_LANGUAGE_HEADER_NAME])return a;var u=o[s.LOCALE_HINT];if(!u)return a;var E;if(u===s.HINT_ASSET_LANGUAGE_OPTIONAL||u===s.HINT_ASSET_LANGUAGE_REQUIRED){var T=JSON.parse(this.getStoredValue(t.LOCAL_STORAGE_USER_CONTENT_LOCALE));T&&T[0]?E=T[0].name:u===s.HINT_ASSET_LANGUAGE_REQUIRED&&(E="en")}return E&&E.length>0&&(a[e.ASSET_LANGUAGE_HEADER_NAME]=E),a},s.prototype.updateHeaderWithPriceListGroupId=function(o,n){var i=r.extend({},o),a=n||!1;if(!a&&i[e.PRICE_LIST_GROUP_ID])return i;var s;return s="string"==typeof this.getStoredValue(t.LOCAL_STORAGE_PRICELISTGROUP_ID)?JSON.parse(this.getStoredValue(t.LOCAL_STORAGE_PRICELISTGROUP_ID)):this.getStoredValue(t.LOCAL_STORAGE_PRICELISTGROUP_ID),s&&(i[e.PRICE_LIST_GROUP_ID]=s),i},s.prototype.updateHeaderWithSelectedOrganization=function(o,i){var a=this,s=r.extend({},o),l=i||!1;if(!l&&s[e.ORGANIZATION_ID])return s;var u;return u="string"==typeof a.getStoredValue(t.LOCAL_STORAGE_ORGANIZATION_ID)?JSON.parse(a.getStoredValue(t.LOCAL_STORAGE_ORGANIZATION_ID)):a.getStoredValue(t.LOCAL_STORAGE_ORGANIZATION_ID),a.profileType===t.PROFILE_TYPE_AGENT&&(u=n.getInstance().readFromMemory(t.LOCAL_STORAGE_ORGANIZATION_ID)),u&&(s[e.ORGANIZATION_ID]=u),s},s.prototype.updateHeaderWithAgentContext=function(o,i){var a=r.extend({},o),s=i||!1;if(!s&&a[e.AGENT_CONTEXT])return a;var l=n.getInstance().readFromMemory(t.LOCAL_STORAGE_AGENT_CONTEXT);return"string"==typeof l&&(l=JSON.parse(l)),l&&(a[e.AGENT_CONTEXT]=l),a},s.prototype.updateHeaderWithViewport=function(t,o){var n=r.extend({},t),a=o||!1;if(!a&&n[e.VIEWPORT_HEADER_NAME])return n;var s=i.viewportDesignation();return s&&(n[e.VIEWPORT_HEADER_NAME]=s),n},s.prototype.updateHeaderWithShopperContext=function(o,i){var a=this,s=r.extend({},o),l=i||!1;if(!l&&s[e.XSTATEDATA])return s;if(a.profileType==t.PROFILE_TYPE_STOREFRONT||a.profileType==t.PROFILE_TYPE_AGENT){var u;u=n.getInstance().getItem(t.LOCAL_STORAGE_SHOPPER_CONTEXT),u&&(s[e.XSTATEDATA]=u)}return s},s.prototype.updateHeaderWithSiteId=function(o,i,a,s){var l=this,u=r.extend({},o),E=i||!1,T=a||!1;if(!E&&u[e.SITE_ID])return u;var c;return(l.allowSiteSwitchingOnProduction||l.previewMode||T)&&(c=s?s:!l.previewMode&&window.siteId?window.siteId:l.getStoredValue(t.LOCAL_STORAGE_SITE_ID),c&&(u[e.SITE_ID]=c)),l.profileType===t.PROFILE_TYPE_AGENT&&(c=n.getInstance().readFromMemory(t.LOCAL_STORAGE_SITE_ID),c&&(u[e.SITE_ID]=c)),u},s.prototype.updateHeaderWithVisitId=function(r){var o=window.localStorage.getItem(t.VISIT_ID);return null!=o&&(r[e.VISIT_ID]=o),r},s.prototype.updateHeaderWithVisitorId=function(r){var o=window.localStorage.getItem(t.VISITOR_ID);return null!=o&&(r[e.VISITOR_ID]=o),r},s.prototype.requestWithoutAssetLocale=function(t,r,o,n,i,a,l,u){var E=this,T=function(){var T,c,p=E.registryLookup(t),_="GET",d=!1,R=t;null!=p&&(d=p.authRequired,_=p.method,null!=R&&R.charAt(0)!=e.SLASH&&(R=p.url)),R=E.insertParamsIntoUri(R,[i,a,l,u]);var S=!1;E.useIframe&&E.proxyRequestRequired(p)&&(S=!0);var A=function(e){o(e)};if(!d&&E.loggedIn&&(d=!0),T=E.updateHeaderWithLocaleHint(p),T=E.updateHeaderWithViewport(T),c=p[s.LOCALE_HINT],c&&c!==s.HINT_ASSET_LANGUAGE_OPTIONAL||delete T[e.ASSET_LANGUAGE_HEADER_NAME],1==d){var I=function(e){e&&e.status==s.HTTP_UNAUTHORIZED_ERROR&&(E.clearStoredValues(),E.clearValues(),E.handleSessionExpiry()),n(e)};E.authenticatedRequest(R,r,A,I,_,S,null,T)}else E.unauthenticatedRequest(R,r,A,n,_,null,T)};E.registerInitCallback(T)},s.prototype.authenticatedRequest=function(e,t,r,o,n,i,a,s,l,u){var E=this;if(E.storeRequestWasMade=!0,E.external&&E.tokenSecret){var T=this.readToken();T||E.clearValues()}var c={tokenSecret:E.tokenSecret},p=function(e){var t=e;null!=t&&t.items&&t.autoWrap&&(t=t.items),r(t)},_=function(e,t){E.previewMode&&401==t&&!a&&E.redirectToAdminLoginScreen(),null!=E.commonErrorCallback&&c.tokenSecret===E.tokenSecret&&E.commonErrorCallback(e,t),o(e,t)};E.doAuthRequest(e,t,p,_,c,n,i,s,l,u)},s.prototype.doAuthRequest=function(e,t,r,o,n,i,a,l,u,E){var T=this;if(a){if(u)throw s.BEFORE_SEND_NOT_SUPPORTED;T.proxyRequest("auth",{url:e,data:t,clientProps:n,method:i},r,o,l)}else T.proxy.request(e,t,r,o,i,n,l,u,E)},s.prototype.unauthenticatedRequest=function(e,t,r,o,n,i,a,l){var u=this;u.storeRequestWasMade=!0;var E=function(e){var t=e;null!=t&&t.items&&t.autoWrap&&(t=t.items),r(t)},T=function(e,t){null!=u.commonErrorCallback&&u.commonErrorCallback(e,t),o(e,t)};if(i){if(l)throw s.BEFORE_SEND_NOT_SUPPORTED;u.proxyRequest("noauth",{url:e,data:t,method:n},r,T,a)}else u.proxy.request(e,t,E,T,n,null,a,l)},s.prototype.requestEndpointRegistry=function(o,n){var i=this,a=function(e){i.endpointRegistry=e.endpointMap,i.crossDomainRequestsEnabled=e.crossDomainRequestsEnabled,i.profileType==t.PROFILE_TYPE_STOREFRONT&&i.initializeLastPublishedTimeStamp(),o(e)},l=function(e){n(e)},u=s.ENDPOINT_REGISTRY_SERVICE_PATH;i.profileType==t.PROFILE_TYPE_ADMIN?u=s.ADMIN_ENDPOINT_REGISTRY_SERVICE_PATH:i.profileType==t.PROFILE_TYPE_AGENT&&(u=s.AGENT_ENDPOINT_REGISTRY_SERVICE_PATH);var E=null,T={dataType:e.JSON,type:e.GET,url:u,processData:!1,success:function(e,t,r){a(e)},error:function(e,t,r){var o=e.responseText;if(""!==o)try{o=JSON.parse(o)}catch(e){}l(e.responseText)}};i.profileType&&!i.previewMode&&(E={},E[e.PROFILE_TYPE_HEADER_NAME]=i.profileType),i.tokenSecret&&(null==E&&(E={}),E[e.AUTH_HEADER_NAME]=e.AUTH_HEADER_PREFIX+i.tokenSecret),E&&(T.headers=E),r.ajax(T)},s.prototype.initializeLastPublishedTimeStamp=function(){var e=this,t=function(t){t&&t.hasOwnProperty(s.LAST_PUBLISHED_TIME_STAMP)&&(e.lastPublishedTimeStamp=t[s.LAST_PUBLISHED_TIME_STAMP])},r=function(e){};e.request("getLastPublishedTime",null,t,r)},s.prototype.registryLookup=function(t){var r=this;if(null==this.endpointRegistry)return null;var o=e.convertUrl(t);if(null==o)return null;for(var n=null,i=o.length;i>0&&null==n;i--){var a=null,s=o.slice(0,i);if(a=s.join(e.EMPTY_STRING),n=r.endpointRegistry[a],null==n)for(var l=0;l<s.length&&null==n;l++){for(var u=0;u<l;u++){var E=s.length-1-u;1==E?s[E]=e.CURLY_BRACES:s[E]=e.SLASH+e.CURLY_BRACES}a=s.join(e.EMPTY_STRING),n=r.endpointRegistry[a]}}return n},s.prototype.insertParamsIntoUri=function(t,r){for(var o=t,n=0;n<r.length;n++)r[n]&&(o=o.replace(e.CURLY_BRACES,r[n]));return o},s.prototype.getStoredValueName=function(t,r){var o=this,n=r;return n||(n=o.profileType),n?t+e.DASH+n:t},s.prototype.storeToken=function(e){var t=this,r=t.getStoredValueName(s.LOCAL_STORAGE_TOKEN);t.setSessionStoredValue(r,e)},s.prototype.readToken=function(){var e=this,t=e.getStoredValueName(s.LOCAL_STORAGE_TOKEN),r=null;return r=e.getSessionStoredValue(t)},s.prototype.clearStoredValues=function(){var e=this;e.clearSessionStoredValue(s.LOCAL_STORAGE_TOKEN),e.profileType!==t.PROFILE_TYPE_LAYOUT_PREVIEW&&e.clearSessionStoredValue(s.LOCAL_STORAGE_TOKEN,t.PROFILE_TYPE_LAYOUT_PREVIEW)},s.prototype.clearValues=function(){var e=this;e.tokenSecret=null,e.profileId=null,e.loggedIn=!1,e.external=!1},s.prototype.setStoredValue=function(e,t){var r=this,o=r.getStoredValueName(e);try{n.getInstance().setItem(o,t)}catch(e){}},s.prototype.getStoredValue=function(e){var t=this,r=t.getStoredValueName(e),o=null;try{o=n.getInstance().getItem(r)}catch(e){}return o},s.prototype.clearStoredValue=function(e){var t=this.getStoredValueName(e);void 0!==t&&null!==t&&n.getInstance().removeItem(t)},s.prototype.setSessionStoredValue=function(e,t){try{n.getInstance().setSessionItem(e,t)}catch(e){}},s.prototype.getSessionStoredValue=function(e){var t=null;try{t=n.getInstance().getSessionItem(e)}catch(e){}return t},s.prototype.clearSessionStoredValue=function(e,t){var r=this.getStoredValueName(e,t);void 0!==r&&null!==r&&n.getInstance().removeSessionItem(r)},s.prototype.parseAndStoreClaims=function(){var r=this,o=e.parseClaimsFromAccessToken(r.tokenSecret);null!=o&&(r.profileId=o[t.TOKEN_PROFILEID_PROPERTY],r.profileLogin=o[t.TOKEN_SUBJECT_PROPERTY],r.profileRoles=o[t.TOKEN_ROLES_PROPERTY])},s.prototype.insertAuthHeadersAsQueryParams=function(e,t){return e},s.prototype.createCrossDomainIFrame=function(){var e=this,t=s.IFRAME_NAME+"_"+e.profileType,r=e.crossDomainURL,o=document.createElement(s.IFRAME_ELEMENT);o.setAttribute(s.ID_ATTRIBUTE,t),o.setAttribute(s.NAME_ATTRIBUTE,t),o.setAttribute(s.WIDTH_ATTRIBUTE,s.ZERO),o.setAttribute(s.HEIGHT_ATTRIBUTE,s.ZERO),o.setAttribute(s.BORDER_ATTRIBUTE,s.ZERO),o.setAttribute(s.STYLE_ATTRIBUTE,s.IFRAME_STYLE),o.setAttribute(s.SRC_ATTRIBUTE,r);var n=null;try{document.body.appendChild(o),window.frames[t].name=t,n=document.getElementById(t)}catch(e){}return n},s.prototype.redirectToAdminLoginScreen=function(){var e=this;e.disableLoginErrorRedirect||(window.top!==window.self&&e.profileType==t.PROFILE_TYPE_LAYOUT_PREVIEW?window.top.location.href=s.ADMIN_LOGIN_SCREEN_URL:document.location.href=s.ADMIN_LOGIN_SCREEN_URL)},s.prototype.generateAuthUrl=function(t,r,o){var n,i=this,a=i.registryLookup(t),s=t;return null!=a&&(n=a.authRequired,s=a.url),s=i.insertParamsIntoUri(s,r),s=e.addQueryParams(s,o),n&&(s=i.insertAuthHeadersAsQueryParams(s,!0)),s},s});
//# sourceMappingURL=cc-rest-client-1.0.js.map