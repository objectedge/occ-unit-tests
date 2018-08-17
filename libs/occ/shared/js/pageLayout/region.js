/**
 * @fileoverview Defines a RegionViewModel that represents a portion of
 * a page.
 */
define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'pageLayout/region',

  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['jquery', 'knockout', 'viewportHelper', 'pubsub'],

  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function ($, ko, viewportHelper, PubSub) {

    "use strict";

    //-----------------------------------------------------------------
    // Class definition & member variables
    //-----------------------------------------------------------------
    /**
       Creates a region view model.
       @private
       @name RegionViewModel
       @property {observableArray<RegionViewModel>} regions The regions contained by this region.
       @property {observableArray<WidgetViewModel>} widgets The widgets contained by this region.
       @property {observable<integer>} width The width (in bootstrap rows) of this region.
       @property {observable<string>} name The name of this region.
       @property {computedObservable<string>} widthClass The width of the region as a bootstrap class name.
       @property {computedObservable<boolean>} globalWidgetsOnly Does this region contain global widgets only?
       @class The RegionViewModel represents a particular region on a page that may or may not contain a widget.
       Each region contains either other regions or a widget. Regions also contain data on how they are displayed through
       properties like name & width.
     */
    function RegionViewModel() {
      var self = this;
      self.regions = ko.observableArray();
      self.widgets = ko.observableArray();
      self.width = ko.observable();
      self.offset = ko.observable();
      self.name = ko.observable('defaultName');
      self.metadata = ko.observable();
      // This variable will hold the various region ids the current region is similar to.
      self.similarRegions = new Object();

     /*
      * Returns the appropriate bootstrap class name used to
      * specify the width in columns of this region.
      */
      self.widthClass = ko.computed(function() {
        return viewportHelper.getWidthClass(self.width(), self.offset());
      },self);

      /*
      * Does this region contain global widgets only?
      */
      self.globalWidgetsOnly = ko.computed(function() {
        for(var i=0; i<self.widgets().length; i++) {
          if(!self.widgets()[i].global()) {
            return false;
          }
        }
        return true;
      },self);

      /**
       * Called when a user clicks "Next" in a widget stack.
       * @return pCallback
       */
      self.nextTab = function() {
        return self.validateWidgets();
      };

      /**
       * Called when a user clicks "Previous" in a widget stack.
       * @return pCallback
       */
      self.previousTab = function() {
        return true;
      };

      /**
       * Make sure all the widgets we "own" are OK - if so, return true.
       */
      self.validateWidgets = function() {

        var passed = true;

        for (var index in self.widgets()) {
          if (!self.widgets()[index].checkForValidation()) {
            passed = false;
          }
        }

        return passed;
      };

      /**
       * If the region has meta data, inform interested parties
       * Only need to do this once (if at all), so a method makes
       * more sense than adding a subscribe on the observable.
       */
      self.handleMetadata = function() {
        if (self.metadata()) {
          var plainMetaData = ko.toJS(self.metadata);
          $.Topic(PubSub.topicNames.REGION_METADATA_CHANGED).publish(plainMetaData);
        }
      }

      return(this);
    }

    return RegionViewModel;
  }
);

