/**
 * @fileoverview CCStoreUtils Class
 *
 * It has utility methods used in storefront
 *
 * Usage:
 *
 * 1) Include in the proper require.js main module with the following
 * line:
 *
 * ccStoreUtils: '/shared/js/ccLibs/cc-store-utils-1.0'
 *
 * 2) include in the module as follows:
 *
 * define(
 *   [... 'ccStoreUtils' ...]
 *   function( ... StoreUtils ...)
 * )
 *
 * 4) invoke as follows:
 *  StoreUtils.fromJS(serverData, parentObject, copyOnly, observeArray, ignoreArray, includeArray);
 *
 */
define (
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'ccStoreUtils',

  //--------------------------------------------------------------------
  // DEPENDENCIES
  //--------------------------------------------------------------------
  ['knockout'],

  //--------------------------------------------------------------------
  // MODULE DEFINITION
  //--------------------------------------------------------------------
  function (ko) {
    "use strict";

    /**
     * Creates a storeUtils object.
     * @private
     * @name CCStoreUtils
     * @class CCStoreUtils
     */
    function CCStoreUtils() {
    }

    /**
     * This method maps JSON data to a viewModel
     * @param data -  The data which will be populated in parentObject
     * @param parentObject - Observable properties created will be associated with this object
     * @param copyOnly - A boolean value. If set to true, it will not create any observable.
     * @param observeArray - An array of properties that will be created as observable and associated
     *                         with the parentObject
     * @param ignoreArray - An array of properties that will not be mapped to parentObject
     * @param includeArray - An array of properties that should be a part of JSON Object (while creating
     *                       JSON Object from viewModel, using ko.mapping.toJS) even though they were not
     *                       part of data, that constructed the parentObject.
     */
    CCStoreUtils.prototype.fromJS = function (data, parentObject, copyOnly, observeArray, ignoreArray, includeArray) {
      var copyArray = [];

      if (copyOnly) {
        for (var key in data) {
          copyArray.push(key);
        }
      }

      if (!copyOnly && observeArray && observeArray.length > 0) {
        for (var key in data) {
          if (data[key] instanceof Object && !(data[key] instanceof Array)) {
            copyArray.push(key);
          }
        }
      }

      var mapping = {
        copy: copyArray,
        observe: observeArray,
        ignore: ignoreArray,
        include : includeArray
      }

      ko.mapping.fromJS(data, mapping, parentObject);
    };

    return new CCStoreUtils();
  }
);

define("shared/ccLibs/cc-store-utils-1.0", function(){});

