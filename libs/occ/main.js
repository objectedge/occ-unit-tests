/**
 * @fileoverview The require.js main file for the storefront
 */
/*jslint plusplus: true */
require.config({

  /**
   * Base URL for JavaScript references.
   * @ignore
   */
  baseUrl: 'js',

  /**
    * Packages for CommonJS modules.
    * http://requirejs.org/docs/api.html#packages
    * @ignore
    */
  packages: [
    "packageAce",
    {
      name: "packageAce",
      location: "/shared/js/libs/ace",
      main: "ace"
    }
  ],

  /**
   * Shim for any modules with dependencies that we need to explicitly define.
   * @ignore
   */
  shim: {
    'jqueryui': {
      deps: ['jquery']
    },

    'jquerymobile': {
      deps: ['jquery']
    },

    'jquery': {
      deps: [],
      exports: '$'
    },

    'trafficCop': {
      deps: ['jquery']
    },

    'infuser': {
      deps: ['jquery', 'trafficCop']
    },

    'spectrumColorPicker': {
      deps: ['jquery']
    },

    'bootstrapDatePicker': {
      deps: ['jquery']
    },

    'bootstrapTimePicker': {
      deps: ['jquery']
    },

    'bootstrap': {
      deps: ['jquery']
    },

    'bstypeahead': {
      deps: ['jquery']
    },

    'tagsInput': {
      deps: ['jquery']
    },

    'chosen': {
      deps: ['jquery']
    },

    'imagesloaded': {
      deps: ['jquery']
    },
    'facebook' : {
      exports: 'FB'
    }
  },

  /**
   * paths to resolve the reference names names on the left will be used for
   * requires/depends parameters.
   * @ignore
   */
  paths : {
    // 3rd party libs
    // jquery
    jqueryui : '/shared/js/libs/jquery-ui-1.12.1.custom.min',
    jquerymswipe : '/shared/js/libs/jquery.mobile.swipe-1.4.5.min',
    i18next : '/shared/js/libs/i18next.3.5.0.min',
    i18nextBackend: '/shared/js/libs/i18nextXHRBackend.1.2.1',
    tagsInput : '/shared/js/libs/jquery.tagsinput-1.3.5',
    chosen : '/shared/js/libs/chosen.jquery-1.4.2.min',

    // knockout, mapping, and templates
    koMapping : '/shared/js/libs/knockout.mapping-2.4.1.min',
    koValidate : '/shared/js/libs/knockout.validation-2.0.3',
    trafficCop: '/shared/js/libs/TrafficCop-modified',
    infuser: '/shared/js/libs/infuser',

    // bootstrap for most UI controls
    bootstrap : '/shared/js/libs/bootstrap.3.1.1',
    bootstrapDatePicker: '/shared/js/libs/bootstrap-datepicker',
    bootstrapDatePickerLocales: '/shared/js/libs/locales',
    bootstrapTimePicker: '/shared/js/libs/bootstrap-timepicker',
    bootstrapSlider: '/shared/js/libs/bootstrap-slider',
    spectrumColorPicker: '/shared/js/libs/spectrum-1.7.0',
    bstypeahead: '/shared/js/libs/bootstrap3-typeahead',

    // crossroads, etc,. for routing
    crossroads : '/shared/js/libs/crossroads-0.12.0.min',
    hasher : '/shared/js/libs/hasher-1.2.0',
    ccURLPatterns: '/shared/js/ccLibs/cc-url-patterns',

    // Moment library for date and time formatting
    moment : '/shared/js/libs/moment-2.10.3',
    // Moment language bundles are stored in this path
    momentLangs : '/shared/js/libs/moment',

    // Oracle-CC libs
    ccStoreConfiguration : '/shared/js/ccLibs/cc-store-configuration-1.0',
    profiletools: '/shared/js/ccLibs/profile-tools-1.0',
    ccConstants : '/shared/js/ccLibs/cc-constants',
    koExtensions : '/shared/js/ccLibs/ko-extensions',
    storageApi : '/shared/js/ccLibs/cc-storage-api-1.0',
    ccOAuthTimeout : '/shared/js/ccLibs/cc-oauth-timeout',
    ccPreviewBar : '/shared/js/ccLibs/cc-preview-bar',
    ccRestClientConstructor : '/shared/js/ccLibs/cc-rest-client-1.0',
    ccRestClient : '/shared/js/ccLibs/storefront-rest-client',
    koExternalTemplate: '/shared/js/ccLibs/koExternalTemplateEngine-amd-2.0.5-modified',
    ccKoExtensions: '/shared/js/ccLibs/cc-ko-extensions',
    ccKoErrorWrapper: '/shared/js/ccLibs/cc-ko-error-wrapper',
    xDomainProxy: '/shared/js/ccLibs/xdomain-proxy',
    pubsub: '/shared/js/ccLibs/pubsub-1.0',
    pubsubImpl: '/shared/js/ccLibs/pubsub-impl',
    routing: '/shared/js/ccLibs/routing-3.0',
    notifier: '/shared/js/ccLibs/notifier-1.0',
    notifications: '/shared/js/ccLibs/notifications-1.0',
    storeKoExtensions: '/shared/js/ccLibs/store-ko-extensions',
    ccLogger: '/shared/js/ccLibs/ccLogger-1.0',
    CCi18n : '/shared/js/ccLibs/cc-i18n',
    ccKoValidateRules: '/shared/js/ccLibs/cc-ko-validate-rules',
    paginated: '/shared/js/ccLibs/paginated',
    ccPaginated: '/shared/js/ccLibs/cc-paginated',
    spinner: '/shared/js/ccLibs/spinner-1.0',
    placeholderPatch : '/shared/js/ccLibs/cc-placeholder',
    imagesloaded : '/shared/js/libs/imagesloaded.pkgd-3.1.8',
    ccDate : '/shared/js/ccLibs/cc-date-format-1.0',
    ccNumber : '/shared/js/ccLibs/cc-number-format-1.0',
    ccPasswordValidator : '/shared/js/ccLibs/cc-password-validator',
    swmRestClientConstructor: '/shared/js/ccLibs/swm-rest-client-1.0',
    swmRestClient: '/shared/js/ccLibs/swm-storefront-rest-client',
    swmKoValidateRules: '/shared/js/ccLibs/swm-ko-validate-rules',
    ccResourceLoader: '/shared/js/ccLibs/cc-resource-loader',
    navigation : '/shared/js/ccLibs/cc-navigation-1.0',
    ccNavState : '/shared/js/ccLibs/cc-nav-state',
    facebook: '//connect.facebook.net/en_US/sdk',
    facebook: ['//connect.facebook.net/en_US/sdk', '/shared/js/ccLibs/load-facebookjs-error-handler-1.0'],
    facebookjs : '/shared/js/ccLibs/facebook_sdk',
    pinitjs : '/shared/js/ccLibs/pinit_sdk',
    imageZoom : '/shared/js/ccLibs/image-zoom',
    ccImageZoom : '/shared/js/ccLibs/cc-image-zoom-2.0',
    pageViewTracker : '/shared/js/ccLibs/pageViewTracker-1.0',
    currencyHelper : '/shared/js/ccLibs/currency-helper',
    profileHelper: '/shared/js/ccLibs/profile-helper',
    ccEETagProcessor : '/shared/js/ccLibs/cc-ee-tag-processor-1.0',
    viewportHelper : '/shared/js/ccLibs/viewport-helper',
    parentOrganisation: '/shared/js/ccLibs/parentOrganisation',
    ccClientErrorCodes: '/shared/js/ccLibs/cc-client-error-codes',
    sfExceptionHandler : '/shared/js/ccLibs/sf-exception-handler',
    ccStoreServerLogger : '/shared/js/ccLibs/cc-store-server-logger-1.0',
    ccStoreUtils : '/shared/js/ccLibs/cc-store-utils-1.0',
    dateTimeUtils : '/shared/js/ccLibs/date-time-utils',
    numberFormatHelper : '/shared/js/ccLibs/number-format-helper',
    ccStoreConfiguration : '/shared/js/ccLibs/cc-store-configuration-1.0',

    // OracleJET v2.0.2
    hammerjs: '/js/oraclejet/js/libs/hammer/hammer-2.0.4.min',
    jquery: '/js/oraclejet/js/libs/jquery/jquery-2.1.3.min',
    'jqueryui-amd': '/js/oraclejet/js/libs/jquery/jqueryui-amd-1.11.4.min',
    knockout: '/js/oraclejet/js/libs/knockout/knockout-3.4.0',
    ojdnd: '/js/oraclejet/js/libs/dnd-polyfill/dnd-polyfill-1.0.0.min',
    ojs: '/js/oraclejet/js/libs/oj/v2.0.2/min',
    ojL10n: '/js/oraclejet/js/libs/oj/v2.0.2/ojL10n',
    ojtranslations: '/js/oraclejet/js/libs/oj/v2.0.2/resources',
    ojswitch: '/js/oraclejet/js/libs/oj/v2.0.2/ojswitch',
    promise: '/js/oraclejet/js/libs/es6-promise/promise-1.0.0.min',
    signals: '/js/oraclejet/js/libs/js-signals/signals.min',
    template: '/js/oraclejet/js/libs/require/text',
    customElements: '/js/oraclejet/js/libs/webcomponents/CustomElements',

    // Dynamic paths to make naming/referencing modules easier
    pageLayout: '/shared/js/pageLayout',
    viewModels: '/shared/js/viewModels',
    shared: '/shared/js'
  },

  // wait 45 seconds before giving up loading a script
  // extended from 7 (default) to permit all dependencies to load
  waitSeconds: 45
});

// Allow SiteStudio to configure paths as required
var paths = { layoutContainer : 'pageLayout/layout-container' };

if(typeof(configurePaths) === 'function') {
  configurePaths(paths);
}

if (typeof container === 'undefined') {
  var container;
}

define('loadMain', [], function () {
  return {
    load: function (defaultRoute, doneCallback) {
      require(['shared/store-libs'], function() {
        require(
          ['jquery',
           'ccConstants',
           'spinner',
           'pubsub',
           'profiletools',
           'knockout',
           'koValidate',
           'ccKoValidateRules',
           paths.layoutContainer,
           'pageLayout/rest-adapter',
           'pageLayout/api-builder',
           'routing',
           'CCi18n',
           'ccDate',
           'ccEETagProcessor',
           'ccRestClient',
           'ccOAuthTimeout',
           'viewportHelper',
           'ccPreviewBar',
           'shared/store-loader',
           'ccResourceLoader!APPLICATION_JS',
           'jquerymswipe'],
      
          function ($, CCConstants, Spinner, PubSub, ProfileTools, ko, koValidate,
                     rules, LayoutContainer, MyRestAdapter, APIBuilder, Routing, CCi18n, ccDate,
                     ccEETagProcessor, ccRestClient, CCOAuthTimeout, viewportHelper, CCPreviewBar, jquerymswipe) {
            "use strict";
            
            if(PubSub.topics) {
              for(var topic in PubSub.topics) {
                delete PubSub.topics[topic];
              }
            }

            if(document.getElementById("oracle-cc")) {
              ko.cleanNode(document.getElementById("oracle-cc"));
            }

            // Check to see if we are in the Design Studio preview
            if (container === CCConstants.CONTAINER_DESIGN_STUDIO) {
              // We are in the Design Studio preview so set up the loading spinner
              var spinnerVisible = false;
              var pageReady = false;
      
              // Event fired when page is changed
              $.Topic(PubSub.topicNames.PAGE_CHANGED).subscribe(function() {
                if (!spinnerVisible && !pageReady) {
                  Spinner.createWithTimeout({
                    parent: 'body',
                    posTop: '200px'
                  }, 10000,
                  function() {
                    $('.modal-backdrop').remove();
                  });
      
                  $('.cc-spinner').css('z-index', '20000');
      
                  // Signal that the spinner must be removed when the page is loaded
                  spinnerVisible = true;
                }
      
                // Reset pageReady to initial state
                pageReady = false;
              });
      
              // Event fired when new page is ready
              $.Topic(PubSub.topicNames.PAGE_READY).subscribe(function() {
                if (spinnerVisible) {
                  Spinner.destroyWithoutDelay('body');
      
                  // Reset spinnerVisible and pageReady to initial state
                  spinnerVisible = false;
                  pageReady = false;
                }
                else {
                  // Signal that page is ready and there is no need to show the spinner
                  pageReady = true;
                }
              });
              // Make sure that the EE libs do not work in DS
              ccEETagProcessor.enabled = false;
            }
            
            //---------------------------------------------------------------
            // Check if this is a SAML login
            //---------------------------------------------------------------
            function processSamlResponse(rawSamlResponse) {
              var data;
              ccRestClient.samlLogin(rawSamlResponse, handleSamlLoginSuccess, handleSamlLoginError, data);
            }
            
            function handleSamlLoginSuccess(pResult) {
              var path = ccRestClient.getSessionStoredValue("SSO_RETURN_URL");
              if (path == null) {
                path = "/";
              }
              window.location.assign(path);
            }
            
            function handleSamlLoginError(pResult) {
              var path = ccRestClient.getSessionStoredValue("SSO_RETURN_URL");
              if (path == null) {
                path = "/";
              }
              window.location.assign(path);
            }
            
            function processSamlResponseCallback() {
              processSamlResponse(getSamlResponse());
            }
            
            if (typeof getSamlResponse === 'function' && getSamlResponse() != null && getSamlResponse().length >0) {
              // This is a SAML login.  Register a callback and stop further processing.
              ccRestClient.registerInitCallback(processSamlResponseCallback);
              return;
            }
            
            function processAgentAuthToken () {
                ccRestClient.storeToken(getAgentAuthToken());
                ccRestClient.setStoredValue("cc-agent-redirect-url", getAgentRedirectUrl());
                window.location.assign("/");
            }
            
            if (typeof getAgentAuthToken === 'function' && getAgentAuthToken() != null && getAgentAuthToken().length > 0) {
                ccRestClient.registerInitCallback(processAgentAuthToken);
            }
            
      
            //---------------------------------------------------------------
            // CONFIGURE VIEW MODEL PATHS
            //---------------------------------------------------------------
            var adapter = new MyRestAdapter('/ccstore/v1/'),
                basePath = "/",
                layoutContainer = new LayoutContainer(adapter,basePath),
                masterViewModel = new layoutContainer.LayoutViewModel(),
                routing = new Routing(defaultRoute),
                ccOAuthTimeout = new CCOAuthTimeout(ccRestClient);
      
            layoutContainer.masterViewModel(masterViewModel);
            
            // Initialize the EE tag library
            ccEETagProcessor.init();
      
            // Change the default template suffix for storefront
            infuser.defaults.templateSuffix = '';
            // Configuration Options for Validation Plugin
            // See https://github.com/ericmbarnard/Knockout-Validation/wiki/Configuration
            var options = {};
            options.errorsAsTitle = false;
            options.insertMessages = false;
            options.decorateElement = true;
            options.errorElementClass = "invalid";
      
            // Initialize Validation Plugin
            ko.validation.init(options);
      
            // set the i18next and load the common name space
            var i18nOptions = {
              compatibilityJSON: 'v1',
              compatibilityAPI: 'v1',
              ns : {
                namespaces : ['ns.common','ns.ccformats'],
                defaultNs : ['ns.common']
              },
              fallbackLng : ['en'],
              useLocalStorage : false,
              useCookie : false,
              debug : false,
              contextSeparator: ":",
              resGetPath: '/ccstoreui/v1/resources/__ns__?locale=__lng__',
              backend: {
                ajax: CCi18n.ajax
              }
            };
      
            // initialise i18next with the options at some point in the future
            // after we know the correct locale. Otherwise we'll end up
            // loading resource bundles twice. Once at init and once again
            // at setLocale time. Better to just wait and do the init
            // when we know what the locale is (this comes from the server)
      
            CCi18n.deferInit(i18nOptions, function() {
      
              // Initialize preview message
              masterViewModel.previewMessage(
                CCi18n.t('ns.common:resources.previewMessage'));
              masterViewModel.oboShopperName(
                CCi18n.t('ns.common:resources.fullName', {'firstName': masterViewModel.data.global.user.firstName,'lastName': masterViewModel.data.global.user.lastName}));
              masterViewModel.sharedWidgetMessage(
                CCi18n.t('ns.common:resources.sharedWidget'));
              masterViewModel.oboShopperMessage(CCi18n.t('ns.common:resources.shoppingAsText'));
              masterViewModel.displayErrorMessage(
                CCi18n.t('ns.common:resources.displayError'));
              if (masterViewModel.pageChangeMessage() == "") {
                if (masterViewModel.dataForPageChangeMessage().page.category) {
                     masterViewModel.pageChangeMessage(CCi18n.t(
                       'ns.common:resources.categoryPageLoadedText',
                        {
                           collection: masterViewModel.dataForPageChangeMessage().page.category.displayName
                        }));
                } else if (masterViewModel.dataForPageChangeMessage().page.product) {
                    masterViewModel.pageChangeMessage(CCi18n.t(
                      'ns.common:resources.productPageLoadedText',
                      {
                        product: masterViewModel.dataForPageChangeMessage().page.product.displayName
                      }));
                } else if (masterViewModel.dataForPageChangeMessage().page.repositoryId === "userSpacesPage") {
                    masterViewModel.pageChangeMessage(CCi18n.t('ns.common:resources.wishlistPageLoadedText'));
                }  else if (masterViewModel.dataForPageChangeMessage().repositoryId != "searchResultsPage") {
                     masterViewModel.pageChangeMessage(CCi18n.t(
                       'ns.common:resources.pageLoadedText',
                       {
                          page: masterViewModel.dataForPageChangeMessage().page.repositoryId
                       }));
                }
              }
            });
      
      
            /**
             * Returns true if the given regions refer to widgets with different typeIds.
             * This is *not* an object comparison, it's only comparing the typeId property
             * of the widget contained in each region.
             **/
            function regionsDiffer(regionA,regionB) {
              if (!regionA || !regionB) return true;
      
              if(regionA.widgets()) {
                if(regionB.widgets()) {
                  if(regionA.widgets().length !== regionB.widgets().length) {
                    return true;
                  }
      
                  if(regionA.width() !== regionB.width()) {
                    return true;
                  }
      
                  for(var i = 0; i < regionA.widgets().length; i++) {
                    if(ko.utils.unwrapObservable(regionA.widgets()[i].id) !== ko.utils.unwrapObservable(regionB.widgets()[i].id)) {
                      return true;
                    }
                  }
      
                  return false;
                }
                return true;
              }
      
              if(regionB.widgets()) {
                return true;
              }
      
              return false;
            }
      
            /**
             * Returns the index of the given region in the given list of regions
             */
            function findRegion(region,regionsList) {
              var result = -1;
              for (var i = 0; i < regionsList.length; i++) {
                if (!regionsDiffer(region,regionsList[i])) {
                  result = i;
                  break;
                }
              }
              return result;
            }
      
            var host = window.location.protocol + "//" + window.location.host;
            /**
             * Updates observables containing SEO rel tags data.
             *
             * @param {args} server JSON response
             * @param {data} PAGE_LAYOUT_UPDATED event data
             */
            var handleLayoutUpdate = function(args, data) {
              var route;
      
              // the server decides which pages should contain the canonical tag
              // locale and potential context root returned from server
              if (args.canonicalRoute) {
                var canonicalRoute = args.canonicalRoute;
                
                if (ko.isObservable(canonicalRoute)){
                    canonicalRoute  = ko.utils.unwrapObservable(canonicalRoute)
                }
      
                route = host + canonicalRoute;
              }
      
              masterViewModel.canonicalRoute(route);
              masterViewModel.agentReturnUrl = ccRestClient.getStoredValue("cc-agent-redirect-url");
              masterViewModel.alternates(args.alternates);
              // the pagination values are calculated in ProductListingViewModel
              // but need to be cleared here for pages without pagination
              masterViewModel.nextPageNo(null);
              masterViewModel.prevPageNo(null);
              masterViewModel.currPageNo('');
              masterViewModel.paginationDone(false);
              
              masterViewModel.isObo(masterViewModel.data.global.agentId != null);
              
            };
            
            /**
             * Updates observables containing SEO pagination data.
             *
             * @param {data} PAGE_PAGINATION_CALCULATED event data
             */
            var handlePaginationCalculated = function(data) {
              masterViewModel.nextPageNo(data.nextPageNo);
              masterViewModel.prevPageNo(data.prevPageNo);
              masterViewModel.currPageNo(data.currPageNo);
      
              if (masterViewModel.paginationDone() !== true) {
                masterViewModel.paginationDone(true);
              } else {
                masterViewModel.paginationDone.valueHasMutated();
              }
            };
      
            // Updates the master view model when we new layout has been loaded
            // Favors keeping references to the same RegionViewModel
            // object when possible (ex: header and footer on all pages)
            // so that the knckout foreach binding can detect and
            // optimize to avoid redrawing the entire page
            var updateMetadata = function(args) {
              masterViewModel.title(args.title());
              masterViewModel.keywords(args.keywords());
              masterViewModel.description(args.description());
              masterViewModel.metaTags(args.metaTags());
              masterViewModel.isPreview(args.isPreview());
              masterViewModel.noindex(args.noindex());
              viewportHelper.layoutViewports(args.viewports ? args.viewports() : "");
            };
      
            $.Topic(PubSub.topicNames.PAGE_LAYOUT_UPDATED).subscribe(handleLayoutUpdate);
            $.Topic(PubSub.topicNames.PAGE_PAGINATION_CALCULATED).subscribe(handlePaginationCalculated);
            $.Topic(PubSub.topicNames.PAGE_METADATA_CHANGED).subscribe(updateMetadata);
      
            masterViewModel.name = ko.observable('Master View Model');
      
            masterViewModel.itemBeforeRemove = function (dom,index,removed) {
              //$(dom).fadeOut(500, function() { $(dom).remove(); });
              $(dom).remove();
            };
      
            masterViewModel.itemAfterAdd = function (dom, index, added) {
              // $(dom).fadeIn();
            };
      
            masterViewModel.afterRender = function (inserted, dataItem) {};
      
            masterViewModel.previewBar = CCPreviewBar.getInstance();
      
            APIBuilder.widgetBuilder(layoutContainer.WidgetViewModel, layoutContainer);
            APIBuilder.regionBuilder(layoutContainer.RegionViewModel, layoutContainer);
      
            // Register Common Component Instances
            layoutContainer.WidgetViewModel.prototype.profileTools = new ProfileTools();
      
            ko.applyBindings(masterViewModel, document.getElementById("oracle-cc"));
            
            doneCallback(ko, layoutContainer, masterViewModel);
            if (typeof(waitForRenderComplete) === 'function') {
              waitForRenderComplete(ko, layoutContainer, masterViewModel);
            }
          } // require/function
        ); // require
      });
    },
    clear: function (doneCallback) {

    }
  }
});



define("js/main", function(){});

