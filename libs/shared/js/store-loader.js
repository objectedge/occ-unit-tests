/**
 * Copied shared loader.js removing oj components, as they're not currently needed in storefront
 * and are causing optimized main.js to contain extra bloat.
 */
define('shared/store-loader',
       ['knockout',
        'koMapping',
        'koExternalTemplate',
        'bootstrap',
        'koExtensions',
        'ccKoExtensions',
        'ccKoValidateRules',
        'ccKoErrorWrapper'
       ],
  function (ko, koMapping) {
    "use strict";

    $.uiBackCompat = false;
    infuser.defaults.templateSuffix = '.template';

    /*
     * Trick to get ko.mapping to work as per documentation rather than having to
     * include koMapping everywhere
     */
    ko.mapping = koMapping;

    /**
     * Give us ES-5 bind functionality even if it is not available.
     * https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/bind
     */
    if (!Function.prototype.bind) {
      Function.prototype.bind = function (oThis) {
        if (typeof this !== "function") {
          // closest thing possible to the ECMAScript 5 internal IsCallable function
          throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }
        var aArgs = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            FNOP = function () {},
            fBound = function () {
              return fToBind.apply(this instanceof FNOP &&
                                   oThis ? this : oThis,
                                   aArgs.concat(Array.prototype.slice.call(arguments)));
            };

        FNOP.prototype = this.prototype;
        fBound.prototype = new FNOP();
        return fBound;
      };
    }
  }
);

