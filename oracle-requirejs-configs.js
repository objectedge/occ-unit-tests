var getOracleRequireJSConfigs = function () {
	return {
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

    paths: {
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
    }
  };
}

if(typeof module !== 'undefined') {
	module.exports = getOracleRequireJSConfigs();
}
