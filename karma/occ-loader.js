define('occ-for-tests-laoder', [
  'jquery',
  'knockout',
  'pageLayout/layout-container',
  'pageLayout/rest-adapter',
  'pageLayout/api-builder',
  'pageLayout/user',
  'routing',
  'CCi18n',
  'ccRestClient',
  'ccOAuthTimeout',
  'shared/store-loader',
  'ccResourceLoader!APPLICATION_JS',],
($, ko, LayoutContainer, MyRestAdapter, APIBuilder, User, Routing, CCi18n,ccRestClient, CCOAuthTimeout) => {
  return {
    load: () => {
      return new Promise(resolve => {
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
            routing = new Routing(),
            ccOAuthTimeout = new CCOAuthTimeout(ccRestClient);

        layoutContainer.masterViewModel(masterViewModel);

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

        CCi18n.deferInit(i18nOptions, function() {});
        APIBuilder.widgetBuilder(layoutContainer.WidgetViewModel, layoutContainer);
        APIBuilder.regionBuilder(layoutContainer.RegionViewModel, layoutContainer);

        resolve(layoutContainer);
      });
    }
  };
});
