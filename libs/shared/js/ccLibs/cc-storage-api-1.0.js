define(["knockout","xDomainProxy"],function(e,o){"use strict";function t(){if(t.singleInstance)throw new Error("Cannot instantiate more than one StorageApi, use getInstance()");var e=this;e.data={},e.validSyncSessionKeyPrefixes=["oauth_token_secret"];try{e.storage=window.localStorage,e.sessionStorage=window.sessionStorage}catch(e){}if(e.sessionStorageSupported=!1,e.localStorageSupported=!1,e.isIE=function(){return!(!navigator.userAgent.match(/Trident/)&&!navigator.userAgent.match(/Edge/))},e.isIE())try{e.sessionStorage=window.localStorage}catch(e){}e.url=o.urlHostnamePortPortionOnly(document.URL),e.isSessionStorageSynced=!1,e.hasLocalStorageSupport=function(){try{var o=new Date,t="test-"+o.toUTCString();e.storage.setItem(t,t);var r=e.storage.getItem(t);if(t===r)return e.storage.removeItem(t),!0}catch(e){}return!1},e.hasSessionStorageSupport=function(){if(e.isIE())return!1;try{var o=new Date,t="test-"+o.toUTCString();e.sessionStorage.setItem(t,t);var r=e.sessionStorage.getItem(t);if(t===r)return e.sessionStorage.removeItem(t),!0}catch(e){}return!1},e.localStorageSupported=e.hasLocalStorageSupport(),e.saveToLocalStorage=function(o,t){try{e.storage.setItem(o,t);var r={};return r[o]=t,!0}catch(e){}return!1},e.readFromLocalStrorage=function(o){try{return e.storage.getItem(o)}catch(e){}return null},e.saveToSessionStorage=function(o,t){try{e.sessionStorage.setItem(o,t);var r={};return r[o]=t,window.localStorage.setItem("sendSessionStorage",JSON.stringify(r)),!0}catch(e){}return!1},e.readFromSessionStorage=function(o){try{var t=e.sessionStorage.getItem(o);return t}catch(e){}return null},e.hasCookiesSupport=function(){try{return window.navigator&&window.navigator.cookieEnabled}catch(e){return!1}},e.saveToCookies=function(e,o,t){try{var r=new Date;r.setTime(r.getTime()+24*t*60*60*1e3);var n="; expires="+r.toUTCString(),a="; path=/";return document.cookie=e+"="+o+n+a,!0}catch(e){}return!1},e.saveToSessionCookies=function(e,o){try{var t="; path=/";return document.cookie=e+"="+o+t,!0}catch(e){}return!1},e.readFromCookies=function(e){try{var o=null;if(""!==document.cookie){var t=document.cookie.split("; ");if(void 0!==t)for(var r=0;r<t.length;r++){var n=t[r].split("="),a=n[0],s=n[1];if(a==e){o=s;break}}}return o}catch(e){}return null},e.saveToMemory=function(o,t){t=e.encodeData(t),e.data[o]=t},e.readFromMemory=function(o){return e.data.hasOwnProperty(o)?e.decodeData(e.data[o]):null},e.removeFromMemory=function(o){e.data[o]="",delete e.data[o]},e.removeItem=function(o){try{var t=null;return e.localStorageSupported&&(t=e.readFromLocalStrorage(o)),t?(e.saveToLocalStorage(o,""),e.storage.removeItem(o)):e.hasCookiesSupport()&&e.readFromCookies(o)?e.saveToCookies(o,"",-1):e.removeFromMemory(o),!0}catch(e){}return!1},e.setItem=function(o,t){try{var r=!1;return e.localStorageSupported&&(r=e.saveToLocalStorage(o,t)),!r&&e.hasCookiesSupport()&&(t=e.encodeData(t),r=e.saveToCookies(o,t,365)),r||saveToMemory(o,t),!0}catch(e){}return!1},e.getItem=function(o){var t=null;return e.localStorageSupported&&(t=e.readFromLocalStrorage(o)),!t&&e.hasCookiesSupport()&&(t=e.decodeData(e.readFromCookies(o))),null===t&&(t=e.readFromMemory(o)),t},e.removeSessionItem=function(o){try{var t=null;return e.sessionStorageSupported&&(t=e.readFromSessionStrorage(o)),t?(e.saveToSessionStorage(o,""),e.sessionStorage.removeItem(o)):e.removeSessionCookieItem(o),!0}catch(e){}return!1},e.setSessionItem=function(o,t){try{var r=!1;return e.sessionStorageSupported&&(r=e.saveToSessionStorage(o,t)),r||e.setSessionCookieItem(o,t),!0}catch(e){}return!1},e.getSessionItem=function(o){var t=null;return e.sessionStorageSupported&&(t=e.readFromSessionStrorage(o)),null===t&&(t=e.getSessionCookieItem(o)),t},e.removeSessionCookieItem=function(o){e.hasCookiesSupport()&&e.readFromCookies(o)?e.saveToSessionCookies(o,""):(e.data[o]="",delete e.data[o])},e.setSessionCookieItem=function(o,t){var r=!1;t=e.encodeData(t),e.hasCookiesSupport()&&(r=e.saveToSessionCookies(o,t)),r||(e.data[o]=t)},e.getSessionCookieItem=function(o){var t=null;return e.hasCookiesSupport()&&(t=e.decodeData(e.readFromCookies(o))),null===t&&(t=e.decodeData(e.data[o])),t},e.encodeData=function(e){try{e&&(e=encodeURIComponent(JSON.stringify(e)))}catch(e){}return e},e.decodeData=function(e){try{if(e)return e=JSON.parse(decodeURIComponent(e))}catch(e){}return null},e.initSyncing=function(t){if(!e.localStorageSupported||!e.sessionStorageSupported)return void(t&&t());var r=function(r){r||(r=window.event);var n=o.urlHostnamePortPortionOnly(r.url);if(n==e.url&&r.newValue)if("getSessionStorage"==r.key){var a=JSON.stringify(e.sessionStorage);window.localStorage.setItem("sendSessionStorage",a)}else if("sendSessionStorage"==r.key){var a=JSON.parse(r.newValue);for(var s in a){for(var i=!1,c=0;c<e.validSyncSessionKeyPrefixes.length&&0==i;c++){var u=e.validSyncSessionKeyPrefixes[c];0===s.lastIndexOf(u,0)&&(i=!0)}i&&e.sessionStorage.setItem(s,a[s])}t&&!e.isSessionStorageSynced&&t(),e.isSessionStorageSynced=!0}};window.addEventListener?window.addEventListener("storage",r,!1):window.attachEvent("onstorage",r);var n=new Date,a="test-"+n.toUTCString();try{window.localStorage.setItem("getSessionStorage",a)}catch(e){}}}return t.getInstance=function(){return t.singleInstance||(t.singleInstance=new t),t.singleInstance},t});
//# sourceMappingURL=cc-storage-api-1.0.js.map