/**
 * @fileoverview Defines the widgetViewModel that represents a piece of
 * content & functionality for the page.
 */
define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'pageLayout/widget',

  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------

  ['knockout', 'CCi18n', 'ccDate', 'ccNumber', 'pubsub', 'ccConstants', 'viewModels/messageHandler', 'jquery', 'navigation'],

  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------

  function(ko, CCi18n, ccDate, ccNumber, PubSub, CCConstants, MessageHandler, $, navigation) {

    "use strict";

    //-----------------------------------------------------------------
    // Class definition & member variables (the constructor)
    //-----------------------------------------------------------------
    /**
      The WidgetViewModel is a view model representing a widget object. Each widget displays or
      interacts with page data and fills a region. A WidgetViewModel may represent a widget definition, a default widget object
      that can be instantiated & loaded, or a widget instance, the instantiation of a widget with configuration and data.
      @name WidgetViewModel
      @param {string} basePath The url path to where widgets are stored.
      @property {observable<string>} id The id of the widget instance.
      @property {observable<string>} typeId The id refering to what type of widget definition this is.
      @property {observable<boolean>} initialized Whether or not this widget has been initialized. True means initialized.
      @property {observable<string>} basePath The url path to where widgets are stored.
      @property {observable<string>} rootPath The url path to the files specific to this widget.
      @property {observable<string>} imagePath The url path to where this widget's images are located.
      @property {observable<string>} templatePath The url path to where the widget's templates are located.
      @property {observable<string>} jsPath The url path to where the widget's javascript is located.
      @property {observable<string>} i18nresources The name of the i18n namespace for this widget, e.g. 'productlisting',
      which would translate into a locale specific resource file, where the string properties would located, ie 'locales/en/ns.productlisting.json'
      @property {observable<Object>} resources The loaded resources for the current locale.
      @property {observable<string>} locale Widget locale.
      @property {observable<Object>} customTranslations Custom translations for the widget.
      @property {observable<string>} widgetId Widget ID.
      @property {observable<integer>} numberOnPage Number of instances of this widget on the page.
      @property {observable<boolean>} isPreview Widget preview mode?
      @property {observable<Object>} elements Element view models keyed by element name
      @property {computedObservable<boolean>} isShared Is the widget used on multiple pages?
      @property {computedObservable<boolean>} contextDataLoaded Is the context data loaded yet for this widget?
      @property {Object[]} historyStack The list of browser URL history entries.
      @class Represents a widget.
     */
    function WidgetViewModel(basePath) {
      var self = this;
      this.basePath = basePath;
      // flag to tell us if this widget has completed initialization
      this.initialized = ko.observable(false);
      // Used to make sure we don't
      // start processing actions
      // until the widget is initialized
      this.deferredInit = $.Deferred();

      //the id of the widget instance
      this.id = ko.observable();

      //the id of the widget definition
      this.typeId = ko.observable();

      //Various paths derived from the basePath
      //and widget typeId
      this.rootPath = ko.observable();
      this.imagePath = ko.observable();
      this.templatePath = ko.observable();
      this.jsPath = ko.observable();
      this.i18nresources = ko.observable();
      this.resources = ko.observable();
      this.locale = ko.observable();
      this.customTranslations = ko.observable();
      this.widgetId = ko.observable();
      this.numberOnPage = ko.observable();
      this.isPreview = ko.observable();

      this.elements = {};

      this.isShared = ko.computed(function() {
        var updatedIsShared;

        if (this.numberOnPage && this.numberOnPage() > 1) {
          updatedIsShared = true;
        }
        else if (this.pageIds && this.pageIds().length > 1) {
          updatedIsShared = true;
        }
        else {
          updatedIsShared = false;
        }

        return updatedIsShared;
      }, this);

      // Need to know when all the data for the widget has arrived.
      this.contextDataLoaded = ko.observable(false);

      /**
       * Set up something that will wait for the page to load then tell our observable.
       * @private
       * @function WidgetViewModel#pageReady
       */
      this.pageReady = function() {
        this.contextDataLoaded(true);
        //CCSF-1027 - to hide the modal and the backdrop when the widget loaded
        if (this.links && navigation.isPathEqualTo(this.links().checkout.route)) {
          $('#CC-headermodalpane').modal('hide');
          $('body').removeClass('modal-open');
          $('.modal-backdrop').remove();
        }
      };

      $.Topic(PubSub.topicNames.PAGE_READY).subscribe(self.pageReady.bind(self));

      this.historyStack = [];
      this.prevHistoryLength = 0;
      this.newHistoryLength = 0;

      /**
       * Update the history stack in session storage.
       * @private
       * @function WidgetViewModel#updateHistoryStackArray
       * @param {Object} The new hash object.
       */
      this.updateHistoryStackArray = function(obj) {
        var historyStackData;
        if (history.length === 1) {
          try{
          window.sessionStorage.removeItem(CCConstants.SESSION_STORAGE_HISTORY_STACK);
          } catch(pErr){}
        }
        try {
          historyStackData = window.sessionStorage.getItem(CCConstants.SESSION_STORAGE_HISTORY_STACK);
        }
        catch(pError) {
        }
        if (historyStackData && !self.historyStack.length) {
          self.historyStack = JSON.parse(historyStackData);
        }
        self.prevHistoryLength = self.newHistoryLength;
        self.newHistoryLength = history.length;
        // In case of page refresh oldHash is undefined. So check the case if page is not refreshed. Update historyStack only if page is not refreshed.
        if (obj.oldHash != undefined) {
          if (self.links && self.links().hasOwnProperty(404)) {
            if (self.historyStack.length) {
              var lastPage = self.historyStack[self.historyStack.length - 1];
              if (obj.newHash === lastPage.oldHash && obj.oldHash === lastPage.newHash && self.prevHistoryLength === self.newHistoryLength) {
                self.historyStack.pop();
              }
              else {
                //check if the old and new hash is not already pushed in sessionStorage, because this function executes multiple times.
                //Also check if we are not going out of order i.e the old hash to be inserted should match the new hash of last stack element.
                if ((self.historyStack[self.historyStack.length - 1].oldHash != obj.oldHash || self.historyStack[self.historyStack.length - 1].newHash != obj.newHash)
                    && (self.historyStack[self.historyStack.length - 1].newHash == obj.oldHash)) {
                  self.historyStack.push(obj);
                }
              }
            }
            else {
              self.historyStack.push(obj);
            }
            try {
              window.sessionStorage.setItem(CCConstants.SESSION_STORAGE_HISTORY_STACK, JSON.stringify(self.historyStack));
            }
            catch(pError) {
            }
          }
        }
      };

      $.Topic(PubSub.topicNames.UPDATE_HASH_CHANGES).subscribe(self.updateHistoryStackArray);

      function loadI18N(i18nresources) {
        var customTranslations, elementResources;

        if (self.localeResources) {
          for (var bundleLocale in self.localeResources) {
            var unwrappedBundle = ko.toJS(self.localeResources[bundleLocale]['resources']);

            if (self.customTranslations()) {
              // Add custom translations now, so they are available to CCi18n
              // when parameter replacement is required.
              customTranslations = ko.toJS(self.customTranslations());

              // Only merge Text Snippet custom resources at this point
              // Save element resources for later because i18n doesn't like their key format
              elementResources = self.mergeTextSnippetResources(unwrappedBundle, customTranslations);
            }

            CCi18n.addResourceBundle(bundleLocale,
              self.localeResources[bundleLocale]['namespace'](), {
                'resources': unwrappedBundle
              }
            );

            // Use dummy interpolation settings to avoid inadvertent
            // interpolation prior to calling widget.translate for individual
            // resource strings.
            var objResources = CCi18n.t('ns.' + self.i18nresources() +
              ':resources', {
                returnObjectTrees: true,
                interpolation: {
                    prefix: "##",
                    suffix: "##"
                }
              });

            // now can merge in the element resources
            $.extend(objResources, elementResources);

            self.resources(objResources);
          }
        }

        // allow for case where widget has no default translations, but
        // has been configured with elements that have custom translations
        // Don't need to worry about phased merge in this case.
        if (self.customTranslations() && !self.resources()) {
          customTranslations = ko.toJS(self.customTranslations());
          self.resources(customTranslations);
        }

        if (self.resources() && self.resourcesLoaded) {
          self.resourcesLoaded(self);
        }
      }

      /**
       * Custom Translations include 2 distinct sets of resources
       *   1) Custom values for the existing resource keys (i.e. Text Snippets)
       *   2) Resource values for element instances, with custom key names
       *
       * NB: In future, group 1 may also include custom keys.
       *
       * Unfortunately, i18next doesn't play well with the element resource keys
       * as they have a '.' in the key name, e.g. "text.100008"
       *
       * Therefore, this method only merges resources where the key does not
       * contain a '.' character.
       *
       * All unmerged custom resources are returned in a single object.
       *
       * @param defaultTranslations object containing default resources
       * @param customTranslations object containing all custom
       * @returns object containing unmerged custom resources
       */
      this.mergeTextSnippetResources = function(defaultTranslations, customTranslations) {
        var unmergedResources = {};

        if(defaultTranslations
            && (typeof(defaultTranslations) ===  "object")
            && customTranslations
            && (typeof(customTranslations) ===  "object")) {

          for(var resource in customTranslations) {
            // make sure its not a prototype property
            if(customTranslations.hasOwnProperty(resource)) {
              if (resource.indexOf('.') ===  -1) {
                // 'safe' key - merge the value
                defaultTranslations[resource] = customTranslations[resource];
              } else {
                // 'unsafe' key - don't merge
                unmergedResources[resource] = customTranslations[resource];
              }
            }
          }
        }

        return unmergedResources;
      };

      this.localeSubscription = this.locale.subscribe(function(locale) {
        var self = this;
        CCi18n.setLocaleOnce(locale.replace("_", "-"), function() {
          // unsubscribe from locale to reduce the number of events fired
          self.localeSubscription.dispose();
          self.deferUntilAllPropertiesSet(self, function() {
            loadI18N(self.i18nresources());
          });
        });
      }, this);

      //When typeId is populated, set the paths
      this.typeId.subscribe(function(type) {
        this.rootPath(this.basePath + 'widget/' + type);
        this.imagePath(this.rootPath() + '/images');
        this.jsPath(this.rootPath() + '/js');
        this.widgetId(type);
      }, this);

      /**
       * This function maps the given widget relative path to an absolute path
       * which can be used for making http requests.
       * @function WidgetViewModel#absoluteUrl
       * @param {string} relativeUrl The relative url to be translated.
       */
      this.absoluteUrl = function(relativeUrl) {
        var result = relativeUrl;
        if (this.assetMappings) {
          result = this.assetMappings[relativeUrl];
        }
        return result;
      };

      /**
       * This function maps the given widget relative path to an absolute path
       * that may be passed to the template binding.
       * which can be used for making http requests.
       * @function WidgetViewModel#templateAbsoluteUrl
       * @param {string} relativeUrl The relative url to be translated.
       */
      this.templateAbsoluteUrl = function(relativeUrl) {
        var result = relativeUrl;
        if (this.assetMappings) {
          result = this.assetMappings[relativeUrl]();
        }
        return result;
      };

      /**
       * This function maps any notification template to an absolute path
       * that has to be passed in the template based notifications in order to
       * render them in the notifications panel.
       * @function WidgetViewModel#notificationTemplateUrl
       * @param notificationName
       */
      this.notificationTemplateUrl = function(notificationName) {
        var templatePath = "/templates/";
        // Add the template name and suffix it with .template
        templatePath += notificationName + ".template";
        // Now return the absolute URL for use.
        return this.absoluteUrl(templatePath)();
      };

      /**
       * This function can be called with a set of previous locale name and
       * current locale name to redirect the user to a locale based URL.
       * @function WidgetViewModel#redirectToLocalizedURL
       * @param {string} selectedLocaleName Selected locale name.
       * @param {string} previousLocaleName Previous locale name.
       */
      this.redirectToLocalizedURL = function(selectedLocaleName, previousLocaleName) {
        var url = navigation.getLocaleBasedUrl(selectedLocaleName);
        window.location.assign(url);
      };

      /**
       * This function should be used in cases where a string is set via the
       * javascript, e.g. in the widget view model.
       *
       * NB: For strings loaded in templates, use the widgetLocaleText binding
       *
       * Handles translation tasks where the required resource string
       * may already be in the resources array.
       *
       * @function WidgetViewModel#translate
       * @param {string} key The name of the resource item
       * @param {Object} options Options that will be passed through to CCi18n.t
       * @param {boolean} checkCommon Whether or not the common resource bundle
       * should be checked if not match for the key was found in the widget's
       * own resource bundle. Defaults to true.
       * @param {string} customKey Identifier Key for text that has been
       * customized in Site Studio / Admin. If specified, this key will
       * be used to check the custom translations, added to resources(),
       * before using the normal, static key value
       */
      this.translate = function(key, options, checkCommon, customKey) {

        var result = '', defaultValue = key, fullKey = '';

        if (self.resources()) {
          if (customKey && self.resources()[customKey] != null && self.resources()[customKey] != 'null') {
            // For now take custom translation 'as is'
            // i.e. no replacements / formatters
            return self.resources()[customKey];
          }

          if (self.resources()[key]) {
            result = self.resources()[key];
            // presence of '__' could indicate replacements are required
            // i.e. this could be a formatter string
            if (result.indexOf('__') === -1) {
              return result;
            }
          }
        }

        if (options) {
          if (options.defaultValue) {
            defaultValue = options.defaultValue;
            options.defaultValue = undefined;
          }
        } else {
          options = {};
        }

        if (checkCommon === undefined) {
          checkCommon = true;
        }

        result = ''; // reset after self.resources checks

        if (self.i18nresources() && self.i18nresources() !== '') {

          fullKey = 'ns.' + self.i18nresources() + ':resources.' + key;

          // defaultValue not passed in options, so the fullKey is returned
          // if the value isn't found, because the translated string just might
          // be the same as the defaultValue string supplied.
          result = CCi18n.t(fullKey, options);
        }

        if (result === fullKey) {
          // No match in widget resources or they could both
          // be empty string if no widget resources exist

          if (checkCommon) {
            // Restore the defaultValue
            options.defaultValue = defaultValue;

            // try the common resources
            result = CCi18n.t('ns.common:resources.' + key,
              options);
          } else {
            result = defaultValue;
          }
        }
        return result;
      };

      return (this);
    }

    /**
     * This function is invoked during widget initialization.
     * It is called after all properties on the widget
     * have been set for the given page context.
     * Any deferred initialization can happen at this point.
     * @function WidgetViewModel#allPropertiesSet
     * @param {WidgetViewModel} widget The widget on which all properties have been set.
     */
    WidgetViewModel.prototype.allPropertiesSet = function(widget) {
      widget.deferredInit.resolveWith(widget);
    };

    /**
     * Defers calling the given function until all widget properties are
     * set.
     * @function WidgetViewModel#deferUntilAllPropertiesSet
     * @param {WidgetViewModel} widget The WidgetViewModel on which calls are to be deferred.
     * @param {function} f The function to be called when all widget properties are set.
     */
    WidgetViewModel.prototype.deferUntilAllPropertiesSet = function(widget, f) {
      widget.deferredInit.done(f);
    };

    /**
     * Method to allow the widget to indicate if it needs re-initialised based on the most up to date data for it.
     * @function WidgetViewModel#requiresRefresh
     * @param {WidgetViewModel} pNewWidgetData The new widget data.
     * @returns {boolean} true if the list of page IDs on the new widget data is a different length than the current list.
     */
    WidgetViewModel.prototype.requiresRefresh = function(pNewWidgetData) {

      if (this.pageIds() && pNewWidgetData.pageIds()) {
        if (this.pageIds().length !== pNewWidgetData.pageIds().length) {
          return true;
        }
      }

      return false;
    };

    /**
     * Checks if widget is active on the current page and so is about to be rendered.
     * @function WidgetViewModel#isActiveOnPage
     * @param {Object} pageData The page data.
     * @returns {boolean} true if the current widget appear on the page specified.
     */
    WidgetViewModel.prototype.isActiveOnPage = function(pageData) {

      if (this.global && this.global()) {
        return true;
      }

      // Adding a check against page ids, rather than name, to handle multiple pages of the same type
      if (pageData && this.pageIds().indexOf(pageData.pageRepositoryId) != -1) {
        return true;
      }

      return false;
    };

    /**
     * Returns a curried version of maybeFireBeforeAppear which allows for specifying an extjsDeferred
     * @param  {[Object]} pageData      page parameters for widget
     * @param  {[Deferred]} extjsDeferred JQuery Deferred resolved after extjs is loaded and set on the parent widget
     */
    WidgetViewModel.prototype.maybeFireBeforeAppearExtJSDeferred = function(extjsDeferred) {
      return function(pageData, widget) {
        this.maybeFireBeforeAppear(pageData, widget, extjsDeferred);
      };
    };

     /**
      * This function is responsible for calling with "beforeAppear"
      * function at the right time. That is it will invoke that function on the WidgetViewModel
      * just before the widget is about to be rendered on a given page. It will also call beforeAppear
      * on the "extension" object if that object contains a function called "beforeAppear"
      * @function WidgetViewModel#maybeFireBeforeAppear
      * @param {Object} pageData The page data.
      */
    WidgetViewModel.prototype.maybeFireBeforeAppear = function(pageData, widget, extjsDeferred) {
      // Test if current pageid is in the set of all pages on which
      // this widget is assigned
      if (!widget)
        widget = this;

      if (widget.isActiveOnPage(pageData)) {
        var defer = $.Deferred();
        // setup done callback
        defer.done(function (pageData) {
          widget.beforeAppear(pageData);
          // register our done callback after we call beforeAppear
          if (extjsDeferred) {
            extjsDeferred.done(function() {
              widget.callExtJSBeforeAppear(widget);
            });
          }
        });
        if (!widget.initialized()) {
          var subscription = widget.initialized.subscribe(function(newValue) {
            if (newValue) {
              // ok, it's initialized. Continue with propagating the notification.
              defer.resolveWith(widget, [pageData]);
              subscription.dispose(); // don't do this again
            }
          });
        } else {
          // widget is initialized, so resolve right away
          defer.resolveWith(widget, [pageData]);
        }
      }
    };

    /**
     * Tests if the given widget has an extjs extension with a beforeAppear
     * function and if so, calls that function
     * @param  {[type]} widget The widget potentially containing an extjs beforeAppear
     */
    WidgetViewModel.prototype.callExtJSBeforeAppear = function (widget) {
      if (widget.__cc__extjs && widget.hasBeforeAppear(widget.__cc__extjs) ) {
        widget.__cc__extjs.beforeAppear.call(widget);
      }
    };

    /**
     * Does this widget instance have the 'beforeAppear' function defined?
     * @function WidgetViewModel#hasBeforeAppear
     * @returns {boolean} true if the widget has the 'beforeAppear' function defined.
     */
    WidgetViewModel.prototype.hasBeforeAppear = function() {
      var result = false;

      if ('beforeAppear' in this && typeof this.beforeAppear === 'function') {
        result = true;
      }

      return result;
    };

    /**
     * Useful to format dates directly in the JS files without calling the actual JS file.
     * @function WidgetViewModel#ccDate
     * @param {string} pDate The date to format.
     * @param {string} pCustomInputFormat Date format, if it's a non ISO8601 format.
     * @param {string} pCustomOutputFormat Custom output format, if one of the predefined formats does not meet requirements.
     * @param {string} pFormatName one of CCDate.formats : time, short, medium, long, full, default.
     * @see ccDate#formatDateAndTime
     * @returns {string} The formatted date and time.
     */
    WidgetViewModel.prototype.ccDate = function(pDate, pCustomInputFormat, pCustomOutputFormat, pFormatName) {
      return ccDate.formatDateAndTime(pDate, pCustomInputFormat, pCustomOutputFormat, pFormatName);
    };

    /**
     * Useful to format numbers directly in the JS files without calling the actual JS file.
     * @function WidgetViewModel#ccNumber
     * @param {string|number} number The number to format.
     * @see ccNumber#formatNumber
     * @returns {string} The formatted number.
     */
    WidgetViewModel.prototype.ccNumber = function(number) {
      return ccNumber.formatNumber(number);
    };

    /**
     * Format a price value, using a specified number of fractional digits.
     * @function WidgetViewModel#formatPrice
     * @param {number} price The price to format.
     * @param {number} fractionalDigits The number of fractional digits.
     * @returns {string} The formatted price.
     */
    WidgetViewModel.prototype.formatPrice = function(price, fractionalDigits) {
        //var price = widget.cart().subTotal().toFixed(widget.site().selectedPriceListGroup().currency.fractionalDigits);
        price = price.toFixed(fractionalDigits);
        var priceSplit = price.split(".");
        var formattedPrice = ccNumber.formatNumber(priceSplit[0], true);
        if (fractionalDigits === 0) {
          //we do not need a decimal separator in the price     if there are no fractional digits
          formattedPrice = formattedPrice.substring(0, formattedPrice.length-3);
        } else {
          //we need a decimal separator in the price as there are fractional digits
          formattedPrice = formattedPrice.substring(0, formattedPrice.length-2);
          formattedPrice = formattedPrice + priceSplit[1];
        }
        return formattedPrice;
    };
    WidgetViewModel.prototype.messageBox = MessageHandler.getInstance();

    /**
     * Called to do any validation that the widget may have.
     * The Widget instance is expected to provide a method appropriately
     * called validate() if it wants to be validated as part of a widget stack.
     */
    WidgetViewModel.prototype.checkForValidation = function() {

      if (this.validate) {
        return this.validate();
      } else {
        return true;
      }
    }

    return WidgetViewModel;
  }
);

