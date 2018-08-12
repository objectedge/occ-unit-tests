(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("ccLogger"), require("jquery"), require("pageLayout/site"), require("pubsub"));
	else if(typeof define === 'function' && define.amd)
		define(["ccLogger", "jquery", "pageLayout/site", "pubsub"], factory);
	else {
		var a = typeof exports === 'object' ? factory(require("ccLogger"), require("jquery"), require("pageLayout/site"), require("pubsub")) : factory(root["ccLogger"], root["jquery"], root["pageLayout/site"], root["pubsub"]);
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(window, function(__WEBPACK_EXTERNAL_MODULE_ccLogger__, __WEBPACK_EXTERNAL_MODULE_jquery__, __WEBPACK_EXTERNAL_MODULE_pageLayout_site__, __WEBPACK_EXTERNAL_MODULE_pubsub__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/app-level/oeFedexApi.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/app-level/oeFedexApi.js":
/*!*************************************!*\
  !*** ./src/app-level/oeFedexApi.js ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _jquery = __webpack_require__(/*! jquery */ "jquery");

var _jquery2 = _interopRequireDefault(_jquery);

var _pubsub = __webpack_require__(/*! pubsub */ "pubsub");

var _pubsub2 = _interopRequireDefault(_pubsub);

var _ccLogger = __webpack_require__(/*! ccLogger */ "ccLogger");

var _ccLogger2 = _interopRequireDefault(_ccLogger);

var _site = __webpack_require__(/*! pageLayout/site */ "pageLayout/site");

var _site2 = _interopRequireDefault(_site);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @fileoverview OE Fedex API
 *
 *  Exemple
    oeFedexAPI.validateAddress(address).then((success) => {
      ccLogger.info(success, 'SUCCESS')
    }).catch((error) => {
      ccLogger.info(error, 'ERROR')
    });
 *
 *  will return the object
 *  return of then: {"success":true,"totalAddresses":1,"addresses":[{"fullZipCode":"70146-5601","isPoBox":false}]}
 *  return of catch: {"success":false,"code":2,"message":"Missing required information"} *
 * @author rafael.mario@objetedge.com
 */

var oeFedexAPI = void 0;
var SSE_ENDPOINTS = 'oeSSEEndpoints';

exports.default = {
  onLoad: function onLoad() {
    _ccLogger2.default.info("[OE][Core] Loading OE FEDEX API");
    oeFedexAPI = this.oeFedexApi;
  },
  getSSEEndpoint: function getSSEEndpoint(key) {
    return _site2.default.getInstance().extensionSiteSettings[SSE_ENDPOINTS][key];
  },
  validateAddress: function validateAddress(address) {
    return new Promise(function (resolve, reject) {
      var url = oeFedexAPI.getSSEEndpoint('addressValidationEndpoint');
      _jquery2.default.ajax({
        type: "POST",
        ContentType: 'application/json',
        url: url,
        data: address,
        success: function success(res) {
          resolve(res);
        },
        error: function error(res) {
          reject(res.responseJSON);
        }
      });
    });
  }
};

/***/ }),

/***/ "ccLogger":
/*!***************************!*\
  !*** external "ccLogger" ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_ccLogger__;

/***/ }),

/***/ "jquery":
/*!*************************!*\
  !*** external "jquery" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_jquery__;

/***/ }),

/***/ "pageLayout/site":
/*!**********************************!*\
  !*** external "pageLayout/site" ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_pageLayout_site__;

/***/ }),

/***/ "pubsub":
/*!*************************!*\
  !*** external "pubsub" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_pubsub__;

/***/ })

/******/ });
});
//# sourceMappingURL=oeFedexApi.js.map