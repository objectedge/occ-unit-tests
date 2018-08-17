/**
 * @fileoverview module will return the current navigation state for interested libraries/widgets.
 *
 * The initial navigation state is retrieved from the 'module' dependency, which is a special requirejs
 * dependency that can be used to get information about the current module, in this case, initial configuration.
 *
 * State includes fields for statusCode, referring url, pageId, context and slug, if available.
 *
 */
define(

  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'ccNavState',

  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['module', 'knockout', 'pubsub', 'ccConstants', 'navigation'],

  //-------------------------------------------------------------------
  // MODULE DEFINTIION
  //-------------------------------------------------------------------
  function(module, ko, PubSub, CCConstants, navigation) {

    'use strict';

    /**
     * Represents the current Navigation state.
     *
     * @public
     * @class NavStateViewModel
     *
     * @property {observable<string>} statusCode http return code of the last navigation.
     * @property {observable<string>} referrer the referring url that lead to the current page.
     * @property {observable<string>} slug the seoslug, if available for the current page.
     * @property {observable<string>} pageId the pageId, if available for the current page.
     * @property {observable<string>} pageContext the pageContext, if available for the current page.
     * @property {observable<string>} pageNumber the page number, if available for the current page.
     */
    function NavStateViewModel() {
      var self = this;

      self.statusCode = ko.observable();
      self.referrer = ko.observable();
      self.slug = ko.observable();
      self.pageId = ko.observable();
      self.pageNumber = ko.observable();
      self.pageContext = ko.observable();
      self.route = ko.observable();

      // Page changes is called on any url change, so lets capture that.
      $.Topic(PubSub.topicNames.PAGE_VIEW_CHANGED).subscribe(function(pEventData){

        if (pEventData.pageId != CCConstants.HTTP_NOT_FOUND) {
          self.statusCode(CCConstants.HTTP_OK);
          self.referrer(navigation.getPathWithLocale());
          self.pageId(pEventData.pageId);
          self.slug(pEventData.seoslug);
          self.pageContext(pEventData.contextId);
          self.pageNumber(pEventData.pageNumber);
        }
        else {
          self.statusCode(CCConstants.HTTP_NOT_FOUND);
        }
      });
    }

    /**
     * Maintains and returns a single instance of NavStateViewModel.
     */
    return (function(){

      var viewModel;

      if (NavStateViewModel.prototype._singleInstance != null) {
        viewModel = NavStateViewModel.prototype._singleInstance;
      }
      else {
        viewModel = new NavStateViewModel();

        // Grab the initial state from the initial 'ccNavState' module configuration.
        viewModel.statusCode(module.config().statusCode);
        viewModel.referrer(module.config().referrer);
        viewModel.slug(module.config().slug);
        viewModel.pageId(module.config().pageid)
        viewModel.pageNumber(module.config().pageNumber);
        viewModel.pageContext(module.config().pageContext);

        NavStateViewModel.prototype._singleInstance = viewModel;
      }

      return viewModel;
    })();
  }
);

