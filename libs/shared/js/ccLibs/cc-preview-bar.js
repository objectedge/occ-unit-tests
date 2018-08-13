//----------------------------------------
/**
 * @fileoverview This library handles the preview bar along with the debug menu
 *
 * If we're in preview mode, the preview bar is loaded from custom knockout
 * binding.
 *
 * The debug menu currently contains one option - Minify JS.
 *
 * This uses oracle jet components.
 *
 * If the minify js switch (default to true) is set to 'false' then subsequent
 * page context changes will bring back non-minified javascript.
 *
 *
 */
define(
  'ccPreviewBar',['storageApi', 'ccConstants', 'ccRestClient', 'pubsub', 'CCi18n',
   'knockout', 'jquery'],

 function(storageApi, CCConstants, CCRestClient, PubSub, CCi18n, ko, $) {

  'use strict';

  /**
   * @var {string} MIN_JS local storage key for minify javascript flag
   * @var {string} MINIFY_SWITCH DOM element id of Minification switch
   * @var {string} MENU_CLOSE_TIMEOUT Close menu x ms after mouse out
   */
  var EVENT_NS = ".previewBar";
  var MIN_JS = "min_js_preview";
  var MINIFY_SWITCH_ID = "#previewMinifySwitch";
  var DEBUG_MENU_ID = "#previewDebugToolsMenu";
  var MINIFY_MENU_OPTION_ID = "#previewMinifyOption";
  var DEBUG_MENU_BUTTON_ID = "#previewMenuButton";

  /**
   * Constructor for CCPreviewBar object
   *
   * object is a singleton
   */
  function CCPreviewBar() {
    if (CCPreviewBar.singleInstance) {
      throw new Error(
          "Cannot instantiate more than one CCPreviewBar, use getInstance()");
    }

    var self = this;


    /**
     * @property {observable<boolean>} isMinifyJs status of the minify JS switch
     * @property {string} cssPath Jet CSS for preview bar debug menu
     * @property {string} templateUrl path to preview bar template for knockout
     * @property {string} templateName name of preview bar template for knockout
     * @property {observable<string>} Currently selected site (bound to site election drop down.)
     * @property {Deferred} ojLoaded resolved when the jet modules are loaded,
     *                               then we render the preview bar template
     * @var {boolean} savedMinifyJs copy of isMinifyJs flag - used to trigger page
     *                reload if switch has been flipped
     * @var {boolean} justFocused true if we are in the process of opening the menu
     */
    this.isMinifyJs = ko.observable();
    this.cssPath = '/shared/css/oj-preview-bar.css';
    this.templateUrl = '/shared/templates';
    this.templateName = 'preview-bar.template';
    this.selectedSite = ko.observable();

    // Init these with placeholders, i18n will take over shortly.
    this.debugMenuButtonText = ko.observable("Debug Tools");
    this.minifyJsText = ko.observable("Minify JavaScript");
    this.siteSelectionLabel = ko.observable("Site Selection");

    this.ojLoaded = $.Deferred();

    this.sites = null;
    this.currentSiteId = null;

    var savedMinifyJs;
    var justFocused = false;

    /**
     * @property {observable<boolean>} isDisableMMinifyJs disable minification flag
     *                                 - always false if not in preview mode.
     */
    this.isDisableMinifyJs = ko.computed(function() {
      // Always return false if we aren't in preview mode
      return (CCRestClient.previewMode && !self.isMinifyJs());
    });

    /**
     * Write the minification switch to local storage.
     *
     * @function
     * @name      CCPreviewBar#storeMinifyJs
     */
    this.storeMinifyJs = function (event, data) {
      if (data.option !== "rawValue" && data.option !== "value" || data.previousValue === undefined) {
        return;
      }
      storageApi.getInstance().setSessionItem(MIN_JS, self.isMinifyJs());
    };

    /**
     * Read the minification value from local storage and set the observable.
     *
     * @function
     * @name      CCPreviewBar#initDebugMenu
     */
    this.initDebugMenu = function() {
      if (CCRestClient.previewMode) {
        var minifyJsFlag = storageApi.getInstance().getSessionItem(MIN_JS);
        if (minifyJsFlag === "true" || minifyJsFlag === true || minifyJsFlag === null) {
          this.isMinifyJs(true);
        } else {
          this.isMinifyJs(false);
        }
        savedMinifyJs = this.isMinifyJs();
      }
    };

    /**
     * Read current site value from local storage or default to default site.
     *
     * @function
     * @name      CCPreviewBar#initSiteSelection
     */
    this.initSiteSelection = function (pLayoutData) {
      if (CCRestClient.previewMode) {
        var sites = pLayoutData.data.global.multisite;

        // Keep note of the sites
        self.sites = sites;

        // ojCombobox doesn't implicitly validate that the new value is in
        // the options list so create a Validator to do it for them.
        // See: http://www.oracle.com/webfolder/technetwork/jet/jsdocs/oj.Validator.html
        self.validateSiteSelection = {
          Init: function () {},
          getHint: function () {},
          validate: function (newVal) {
            var checkSites = sites.filter(function (site) {
              return newVal[0] === site.id;
            });

            // Return false? No, throw an error! Incidentally, returning false == returning true.
            if (checkSites.length > 0) {
              return true;
            } else {
              throw new Error(CCi18n.t('ns.common:resources.siteSelectionNoMatchesError'));
            }
          }
        }

        var siteId = CCRestClient.getStoredValue(CCConstants.LOCAL_STORAGE_SITE_ID);
        if (siteId) {
          // If the site id from local storage doesn't match that from the URL, change the URL to match,
          // and refresh the page
          var urlSiteId = self.getURLParameter(window.location.search, CCConstants.URL_SITE_PARAM);
          var checkUrlSite = sites.filter(function (site) {
            return urlSiteId === site.id;
          });

          if (!urlSiteId || urlSiteId == '') {
            // If no site specified in URL, use the one in local storage
            self.selectedSite(siteId);
            self.currentSiteId = siteId;
            self.refreshPageWithNewSite(siteId);
          }
          else if (siteId !== urlSiteId && checkUrlSite.length > 0) {
            // Sites are different - change local storage to match URL
            CCRestClient.setStoredValue(CCConstants.LOCAL_STORAGE_SITE_ID, urlSiteId);
            self.selectedSite(urlSiteId);
            self.currentSiteId = urlSiteId;
          }
          else {
            self.selectedSite(siteId);
            self.currentSiteId = siteId;
          }

        } else {
          var defaultSite = sites.filter(function (site) {
            return site.defaultSite;
          });

          if (defaultSite.length > 0) {
            self.selectedSite(defaultSite[0].id);
            self.currentSiteId = defaultSite[0].id;
          }
        }

        // Unsubscribe from layout loaded events
        $.Topic(PubSub.topicNames.PAGE_LAYOUT_LOADED).unsubscribe(self.initSiteSelection);
      }
    };

    /**
     * Clear the local storage value on admin logout.
     *
     * @function
     * @name      CCPreviewBar#clearMinJsFlag
     */
    this.clearMinJsFlag = function() {
      storageApi.getInstance().removeSessionItem(MIN_JS);
    };

    /**
     * If we've flipped the minification switch, we navigate to the given url
     * by reloading the page. Don't do this if we're checking out.
     *
     * @function
     * @name      CCPreviewBar#maybeRefreshPage
     */
    this.maybeRefreshPage = function(path) {
      if (path == "/payment" || path.substring(0,14) == "/confirmation/") { return; }

      if (savedMinifyJs !== null && savedMinifyJs != self.isMinifyJs()) {
        this.refreshPage(path);
      }
    };

    this.refreshPage = function (path) {
      if (!CCRestClient.previewMode) { return; }

      var url =  window.location.origin + (path.charAt(0) === '/' ? path : '/' + path);
      window.location.assign(url);
    };

    /**
     * Focus the switch when we open the menu.
     *
     * @function
     * @name      CCPreviewBar#focusSwitch
     */
    this.focusSwitch = function(event) {
      // Keyboard only
      // Negative or zero pageX and pageY means artificially generated click event - i.e. keydown
      if (event.originalEvent && ((event.originalEvent.type === "click" &&
                                   event.originalEvent.pageX <= 0 &&
                                   event.originalEvent.pageY <= 0) ||
                                   event.originalEvent.type === "keydown")) {
        $(MINIFY_SWITCH_ID + " + div.oj-switch-container").find("div.oj-switch-thumb").focus();
        justFocused = true;
      }
    };

    /**
     * Attach event handlers to switch, to allow correct focus path:
     * - Capture a keyup as part of the menu open, as opposed to an actual
     *   select on the switch  and prevent menu close in this case.
     * - Capture keydown on switch, and prevent menu close for enter or space.
     *
     * Called by afterRender functionality for preview bar template.
     *
     * @function
     * @name      CCPreviewBar#maybeClose
     */
    this.attachEventHandlers = function() {
      $(MINIFY_SWITCH_ID + " + div.oj-switch-container").find("div.oj-switch-thumb").on('keyup' + EVENT_NS, function(event) {
        if (event.keyCode === CCConstants.KEY_CODE_ENTER && justFocused) {
          justFocused = false;
          return false;
        } else {
          justFocused = false;
          return true;
        }
      }).on('keydown' + EVENT_NS, function(event) {
        justFocused = false;
        if (event.keyCode === CCConstants.KEY_CODE_ENTER || event.keyCode === CCConstants.KEY_CODE_SPACE) {
          event.stopPropagation();
          event.preventDefault();
        }
        return true;
      });

      var focusedElement;
      $('#oj-combobox-input-previewBarSiteSelection').on('focus', function (e) {
        if (focusedElement === this) return;
        focusedElement = this;
        setTimeout(function () { focusedElement.select(); }, 50);
      });
    };

    /**
     * Get the value of a URL parameter.
     * @param sourceURL The source url.
     * @param key The parameter key.
     * @returns The value of the parameter, or null if not found.
     */
    this.getURLParameter = function(sourceURL, key) {

      if (sourceURL && sourceURL !== '') {
        var returnURL = sourceURL.split("?")[0],
          param,
          paramsArr = [],
          queryString = sourceURL.split("?")[1];

        if (queryString !== "") {
          paramsArr = queryString.split("&");
          for (var i = paramsArr.length - 1; i >= 0; i -= 1) {
            param = paramsArr[i].split("=")[0];
            if (param === key) {
              return paramsArr[i].split("=")[1];
            }
          }
        }
      }

      return null;
    }

    /**
     * Remove a query parameter key/value pair from a URL.
     * @param key The query parameter key to be removed.
     * @param sourceURL The source URL.
     * @returns The
     */
    this.removeParamFromURL = function(key, sourceURL) {

      // If no query params, just return the unmodified url
      if (sourceURL.indexOf("?") === -1) {
        return sourceURL;
      }

      var returnURL = sourceURL.split("?")[0],
        param,
        paramsArr = [],
        queryString = sourceURL.split("?")[1];

      if (queryString !== "") {
        paramsArr = queryString.split("&");
        for (var i = paramsArr.length - 1; i >= 0; i -= 1) {
          param = paramsArr[i].split("=")[0];
          if (param === key) {
            paramsArr.splice(i, 1);
          }
        }

        // Put the query parameters back into the URL
        if (paramsArr.length > 0) {
          returnURL = returnURL + "?" + paramsArr.join("&");
        }
      }
      return returnURL;
    }

    this.changeSiteCallBack = function (event, data) {
      if (data.option === 'value') {
        var currentSiteId = CCRestClient.getStoredValue(CCConstants.LOCAL_STORAGE_SITE_ID);
        var newSiteId = data.value[0];

        if (newSiteId !== currentSiteId) {
          CCRestClient.setStoredValue(CCConstants.LOCAL_STORAGE_SITE_ID, newSiteId);
          self.refreshPageWithNewSite(newSiteId);
        }
      }
    };

    /**
     * Refresh the page with a new site id.
     * @param pNewSiteId The new site id.
     */
    this.refreshPageWithNewSite = function(pNewSiteId) {
      // Refresh the page, making sure to replace the occsite query parameter from the URL with the new site ID
      var newSearch = self.removeParamFromURL(CCConstants.URL_SITE_PARAM,window.location.search);

      if (newSearch.indexOf('?') === -1) {
        newSearch += '?';
      }
      else {
        newSearch += '&';
      }
      newSearch += CCConstants.URL_SITE_PARAM + '=' + encodeURIComponent(pNewSiteId);

      // Replace the context root part of the site
      var newSite = null;
      var currentSite = null;

      for (var i=0; i<self.sites.length; i++) {
        if (self.sites[i].id === pNewSiteId) {
          newSite = self.sites[i];
        }
        if (self.sites[i].id === self.currentSiteId) {
          currentSite = self.sites[i];
        }
      }

      // Find context root of new site
      var newSiteContextRoot = newSite.productionURL.substring(newSite.productionURL.indexOf('/'));
      var currentSiteContextRoot = currentSite.productionURL.substring(currentSite.productionURL.indexOf('/'));

      self.refreshPage.call(self, window.location.pathname.replace(currentSiteContextRoot, newSiteContextRoot) + newSearch);
    };

    // Set up some subscriptions in preview mode only
    if (CCRestClient.previewMode) {
      // Reload the page if we navigate after flicking the minify switch
      $.Topic(PubSub.topicNames.HISTORY_PUSH_STATE).subscribe(this.maybeRefreshPage.bind(this));
      if (window.history && window.history.pushState) {
        window.addEventListener('popstate', function(event) {
          self.maybeRefreshPage.call(self, window.location.pathname + window.location.search);
        });
      }

      // Update translations once they load
      $.Topic(PubSub.topicNames.LOCALE_READY).subscribe(function(publish_data) {
        self.debugMenuButtonText(CCi18n.t('ns.common:resources.debugMenuButtonText'));
        self.minifyJsText(CCi18n.t('ns.common:resources.minifyJsText'));
        self.siteSelectionLabel(CCi18n.t('ns.common:resources.siteSelectionLabel'))
      });

      // Reset the minify flag to default if we log out
      CCRestClient.registerLogoutAdminUpdateCallback(this.clearMinJsFlag);

      // Load the minification from session storage
      this.initDebugMenu();
      $.Topic(PubSub.topicNames.PAGE_LAYOUT_LOADED).subscribe(this.initSiteSelection);

      // Load the Jet modules we need. Separate var or minification includes them
      // Once they've loaded, we can render the preview bar template
      var jetModules = ['ojs/ojcore', 'ojs/ojknockout', 'ojs/ojswitch',
                        'ojs/ojbutton' ,'ojs/ojmenu', 'ojs/ojselectcombobox'];
      require(jetModules, function() {
        self.ojLoaded.resolve();
      });
    }
  }

  /**
   * returns a singleton instance of the CCPreviewBar.
   *
   * @function
   * @name      CCPreviewBar#getInstance
   */
  CCPreviewBar.getInstance = function() {
    if (!CCPreviewBar.singleInstance) {
      CCPreviewBar.singleInstance = new CCPreviewBar();
    }

    return CCPreviewBar.singleInstance;
  };

  return CCPreviewBar;
});

