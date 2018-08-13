require(
  [
    // 'jquery',
    // 'ccConstants',
    // 'spinner',
    // 'pubsub',
    // 'profiletools',
    // 'knockout',
    // 'koValidate',
    // 'ccKoValidateRules',
    // 'pageLayout/layout-container',
    // 'pageLayout/rest-adapter',
    // 'pageLayout/api-builder',
    // 'routing',
    // 'CCi18n',
    // 'ccDate',
    // 'ccEETagProcessor',
    // 'ccRestClient',
    // 'ccOAuthTimeout',
    // 'viewportHelper',
    // 'ccPreviewBar',
    // 'shared/store-loader',
    // 'ccResourceLoader!APPLICATION_JS',
    // 'jquerymswipe'
  ],

  function ($, CCConstants, Spinner, PubSub, ProfileTools, ko, koValidate,
              rules, LayoutContainer, MyRestAdapter, APIBuilder, Routing, CCi18n, ccDate,
              ccEETagProcessor, ccRestClient, CCOAuthTimeout, viewportHelper, CCPreviewBar, jquerymswipe) {
    "use strict";

    // // Check to see if we are in the Design Studio preview
    // if (container === CCConstants.CONTAINER_DESIGN_STUDIO) {
    //   // We are in the Design Studio preview so set up the loading spinner
    //   var spinnerVisible = false;
    //   var pageReady = false;

    //   // Event fired when page is changed
    //   $.Topic(PubSub.topicNames.PAGE_CHANGED).subscribe(function() {
    //     if (!spinnerVisible && !pageReady) {
    //       Spinner.createWithTimeout({
    //         parent: 'body',
    //         posTop: '200px'
    //       }, 10000,
    //       function() {
    //         $('.modal-backdrop').remove();
    //       });

    //       $('.cc-spinner').css('z-index', '20000');

    //       // Signal that the spinner must be removed when the page is loaded
    //       spinnerVisible = true;
    //     }

    //     // Reset pageReady to initial state
    //     pageReady = false;
    //   });

    //   // Event fired when new page is ready
    //   $.Topic(PubSub.topicNames.PAGE_READY).subscribe(function() {
    //     if (spinnerVisible) {
    //       Spinner.destroyWithoutDelay('body');

    //       // Reset spinnerVisible and pageReady to initial state
    //       spinnerVisible = false;
    //       pageReady = false;
    //     }
    //     else {
    //       // Signal that page is ready and there is no need to show the spinner
    //       pageReady = true;
    //     }
    //   });
    //   // Make sure that the EE libs do not work in DS
    //   ccEETagProcessor.enabled = false;
    // }
    
    // //---------------------------------------------------------------
    // // Check if this is a SAML login
    // //---------------------------------------------------------------
    // function processSamlResponse(rawSamlResponse) {
    //   var data;
    //   ccRestClient.samlLogin(rawSamlResponse, handleSamlLoginSuccess, handleSamlLoginError, data);
    // }
    
    // function handleSamlLoginSuccess(pResult) {
    //   var path = ccRestClient.getSessionStoredValue("SSO_RETURN_URL");
    //   if (path == null) {
    //     path = "/";
    //   }
    //   window.location.assign(path);
    // }
    
    // function handleSamlLoginError(pResult) {
    //   var path = ccRestClient.getSessionStoredValue("SSO_RETURN_URL");
    //   if (path == null) {
    //     path = "/";
    //   }
    //   window.location.assign(path);
    // }
    
    // function processSamlResponseCallback() {
    //   processSamlResponse(getSamlResponse());
    // }
    
    // if (typeof getSamlResponse === 'function' && getSamlResponse() != null && getSamlResponse().length >0) {
    //   // This is a SAML login.  Register a callback and stop further processing.
    //   ccRestClient.registerInitCallback(processSamlResponseCallback);
    //   return;
    // }
    
    // function processAgentAuthToken () {
    //     ccRestClient.storeToken(getAgentAuthToken());
    //     ccRestClient.setStoredValue("cc-agent-redirect-url", getAgentRedirectUrl());
    //     window.location.assign("/");
    // }
    
    // if (typeof getAgentAuthToken === 'function' && getAgentAuthToken() != null && getAgentAuthToken().length > 0) {
    //     ccRestClient.registerInitCallback(processAgentAuthToken);
    // }
    

    // //---------------------------------------------------------------
    // // CONFIGURE VIEW MODEL PATHS
    // //---------------------------------------------------------------
    // var adapter = new MyRestAdapter('/ccstore/v1/'),
    //     basePath = "/",
    //     layoutContainer = new LayoutContainer(adapter,basePath),
    //     masterViewModel = new layoutContainer.LayoutViewModel(),
    //     routing = new Routing(),
    //     ccOAuthTimeout = new CCOAuthTimeout(ccRestClient);

    // layoutContainer.masterViewModel(masterViewModel);
    
    // // Initialize the EE tag library
    // ccEETagProcessor.init();

    // // Change the default template suffix for storefront
    // infuser.defaults.templateSuffix = '';
    // // Configuration Options for Validation Plugin
    // // See https://github.com/ericmbarnard/Knockout-Validation/wiki/Configuration
    // var options = {};
    // options.errorsAsTitle = false;
    // options.insertMessages = false;
    // options.decorateElement = true;
    // options.errorElementClass = "invalid";

    // // Initialize Validation Plugin
    // ko.validation.init(options);

    // // set the i18next and load the common name space
    // var i18nOptions = {
    //   compatibilityJSON: 'v1',
    //   compatibilityAPI: 'v1',
    //   ns : {
    //     namespaces : ['ns.common','ns.ccformats'],
    //     defaultNs : ['ns.common']
    //   },
    //   fallbackLng : ['en'],
    //   useLocalStorage : false,
    //   useCookie : false,
    //   debug : false,
    //   contextSeparator: ":",
    //   resGetPath: '/ccstoreui/v1/resources/__ns__?locale=__lng__',
    //   backend: {
    //     ajax: CCi18n.ajax
    //   }
    // };

    // // initialise i18next with the options at some point in the future
    // // after we know the correct locale. Otherwise we'll end up
    // // loading resource bundles twice. Once at init and once again
    // // at setLocale time. Better to just wait and do the init
    // // when we know what the locale is (this comes from the server)

    // CCi18n.deferInit(i18nOptions, function() {

    //   // Initialize preview message
    //   masterViewModel.previewMessage(
    //     CCi18n.t('ns.common:resources.previewMessage'));
    //   masterViewModel.oboShopperName(
    //     CCi18n.t('ns.common:resources.fullName', {'firstName': masterViewModel.data.global.user.firstName,'lastName': masterViewModel.data.global.user.lastName}));
    //   masterViewModel.sharedWidgetMessage(
    //     CCi18n.t('ns.common:resources.sharedWidget'));
    //   masterViewModel.oboShopperMessage(CCi18n.t('ns.common:resources.shoppingAsText'));
    //   masterViewModel.displayErrorMessage(
    //     CCi18n.t('ns.common:resources.displayError'));
    //   if (masterViewModel.pageChangeMessage() == "") {
    //     if (masterViewModel.dataForPageChangeMessage().page.category) {
    //           masterViewModel.pageChangeMessage(CCi18n.t(
    //             'ns.common:resources.categoryPageLoadedText',
    //             {
    //                 collection: masterViewModel.dataForPageChangeMessage().page.category.displayName
    //             }));
    //     } else if (masterViewModel.dataForPageChangeMessage().page.product) {
    //         masterViewModel.pageChangeMessage(CCi18n.t(
    //           'ns.common:resources.productPageLoadedText',
    //           {
    //             product: masterViewModel.dataForPageChangeMessage().page.product.displayName
    //           }));
    //     } else if (masterViewModel.dataForPageChangeMessage().page.repositoryId === "userSpacesPage") {
    //         masterViewModel.pageChangeMessage(CCi18n.t('ns.common:resources.wishlistPageLoadedText'));
    //     }  else if (masterViewModel.dataForPageChangeMessage().repositoryId != "searchResultsPage") {
    //           masterViewModel.pageChangeMessage(CCi18n.t(
    //             'ns.common:resources.pageLoadedText',
    //             {
    //               page: masterViewModel.dataForPageChangeMessage().page.repositoryId
    //             }));
    //     }
    //   }
    // });


    // /**
    //  * Returns true if the given regions refer to widgets with different typeIds.
    //  * This is *not* an object comparison, it's only comparing the typeId property
    //  * of the widget contained in each region.
    //  **/
    // function regionsDiffer(regionA,regionB) {
    //   if (!regionA || !regionB) return true;

    //   if(regionA.widgets()) {
    //     if(regionB.widgets()) {
    //       if(regionA.widgets().length !== regionB.widgets().length) {
    //         return true;
    //       }

    //       if(regionA.width() !== regionB.width()) {
    //         return true;
    //       }

    //       for(var i = 0; i < regionA.widgets().length; i++) {
    //         if(ko.utils.unwrapObservable(regionA.widgets()[i].id) !== ko.utils.unwrapObservable(regionB.widgets()[i].id)) {
    //           return true;
    //         }
    //       }

    //       return false;
    //     }
    //     return true;
    //   }

    //   if(regionB.widgets()) {
    //     return true;
    //   }

    //   return false;
    // }

    // /**
    //  * Returns the index of the given region in the given list of regions
    //  */
    // function findRegion(region,regionsList) {
    //   var result = -1;
    //   for (var i = 0; i < regionsList.length; i++) {
    //     if (!regionsDiffer(region,regionsList[i])) {
    //       result = i;
    //       break;
    //     }
    //   }
    //   return result;
    // }

    // var host = window.location.protocol + "//" + window.location.host;
    // /**
    //  * Updates observables containing SEO rel tags data.
    //  *
    //  * @param {args} server JSON response
    //  * @param {data} PAGE_LAYOUT_UPDATED event data
    //  */
    // var handleLayoutUpdate = function(args, data) {
    //   var route;

    //   // the server decides which pages should contain the canonical tag
    //   // locale and potential context root returned from server
    //   if (args.canonicalRoute) {
    //     var canonicalRoute = args.canonicalRoute;
        
    //     if (ko.isObservable(canonicalRoute)){
    //             canonicalRoute  = ko.utils.unwrapObservable(canonicalRoute)
    //     }

    //     route = host + canonicalRoute;
    //   }

    //   masterViewModel.canonicalRoute(route);
    //   masterViewModel.agentReturnUrl = ccRestClient.getStoredValue("cc-agent-redirect-url");
    //   masterViewModel.alternates(args.alternates);
    //   // the pagination values are calculated in ProductListingViewModel
    //   // but need to be cleared here for pages without pagination
    //   masterViewModel.nextPageNo(null);
    //   masterViewModel.prevPageNo(null);
    //   masterViewModel.currPageNo('');
    //   masterViewModel.paginationDone(false);
      
    //   masterViewModel.isObo(masterViewModel.data.global.agentId != null);
      
    // };
    
    // /**
    //  * Updates observables containing SEO pagination data.
    //  *
    //  * @param {data} PAGE_PAGINATION_CALCULATED event data
    //  */
    // var handlePaginationCalculated = function(data) {
    //   masterViewModel.nextPageNo(data.nextPageNo);
    //   masterViewModel.prevPageNo(data.prevPageNo);
    //   masterViewModel.currPageNo(data.currPageNo);

    //   if (masterViewModel.paginationDone() !== true) {
    //     masterViewModel.paginationDone(true);
    //   } else {
    //     masterViewModel.paginationDone.valueHasMutated();
    //   }
    // };

    // // Updates the master view model when we new layout has been loaded
    // // Favors keeping references to the same RegionViewModel
    // // object when possible (ex: header and footer on all pages)
    // // so that the knckout foreach binding can detect and
    // // optimize to avoid redrawing the entire page
    // var updateMetadata = function(args) {
    //   masterViewModel.title(args.title());
    //   masterViewModel.keywords(args.keywords());
    //   masterViewModel.description(args.description());
    //   masterViewModel.metaTags(args.metaTags());
    //   masterViewModel.isPreview(args.isPreview());
    //   masterViewModel.noindex(args.noindex());
    //   viewportHelper.layoutViewports(args.viewports ? args.viewports() : "");
    // };

    // $.Topic(PubSub.topicNames.PAGE_LAYOUT_UPDATED).subscribe(handleLayoutUpdate);
    // $.Topic(PubSub.topicNames.PAGE_PAGINATION_CALCULATED).subscribe(handlePaginationCalculated);
    // $.Topic(PubSub.topicNames.PAGE_METADATA_CHANGED).subscribe(updateMetadata);

    // masterViewModel.name = ko.observable('Master View Model');

    // masterViewModel.itemBeforeRemove = function (dom,index,removed) {
    //   //$(dom).fadeOut(500, function() { $(dom).remove(); });
    //   $(dom).remove();
    // };

    // masterViewModel.itemAfterAdd = function (dom, index, added) {
    //   // $(dom).fadeIn();
    // };

    // masterViewModel.afterRender = function (inserted, dataItem) {};

    // masterViewModel.previewBar = CCPreviewBar.getInstance();

    // APIBuilder.widgetBuilder(layoutContainer.WidgetViewModel, layoutContainer);
    // APIBuilder.regionBuilder(layoutContainer.RegionViewModel, layoutContainer);

    // // Register Common Component Instances
    // layoutContainer.WidgetViewModel.prototype.profileTools = new ProfileTools();

    // ko.applyBindings(masterViewModel, document.getElementById("oracle-cc"));

    // if (typeof(waitForRenderComplete) === 'function') {
    //   waitForRenderComplete(ko, layoutContainer, masterViewModel);
    // }
  } // require/function
); // require
  
  define("js/main", function(){});
