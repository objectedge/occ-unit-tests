/**
 * @fileoverview Defines how to map JSON to a layout view model including
 * dealing with any widget properties that should cause a retreival
 * of data
 */
define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'pageLayout/layout-mapping',

  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['knockout'],

  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (ko, LayoutViewModel) {
    "use strict";

    //------------------------------------------------------------------
    //Class definition & member variables (the constructor)
    //------------------------------------------------------------------
    /**
       Creates an LayoutMapping to build a page structure from JSON.
       @private
       @name LayoutMapping
       @param {LayoutContainer} layoutContainer The layoutContainer object,
       passed to provide helper functions and viewModels to the mapping.
       @class LayoutMapping is the mapping configuration object used to map a a JSON layout to a set of
       view models. This mapping will convert any regions or widgets to the appropriate view models.
     */
    function LayoutMapping(layoutContainer) {
      var self = this;
      
      this.ignore = ["data"];
      this.regions = {
        create: function (regionOptions) {
          var ii, jj, region;

          //For each region property create a new RegionViewModel
          //Map the model using the same mapping for sub-regions.
          region = new layoutContainer.RegionViewModel();
          ko.mapping.fromJS(regionOptions.data, self, region);

          // May be some further processing of metadata required
          region.handleMetadata();

          return region;
        }
      };
     
      this.widget = {
        create: function (widgetOptions) {
              var widget=null, cacheResult;
          if(widgetOptions.data.id) {
            // check if we have a cached widget instance with this id
            cacheResult = layoutContainer.widgetCache.get('widget',widgetOptions.data.id);
                if (cacheResult !== undefined && cacheResult.hit !== undefined && cacheResult.hit) {
                 // use the cached result
                  widget = cacheResult.result;
                } else {
              //Create a new WidgetViewModel based on the JSON
                  widget = new layoutContainer.WidgetViewModel(layoutContainer.basePath);
                  ko.mapping.fromJS(widgetOptions.data, self, widget);
              layoutContainer.initializeWidget(widget, true);
              // save in cache for later
              layoutContainer.widgetCache.set('widget',widgetOptions.data.id,widget);
            }
          }
          return widget;
        }
      };
      
      this.widgets = {
        create: function (widgetOptions) {
          return self.widget.create(widgetOptions);
        }
      };

      return(this);
    }

    return LayoutMapping;
  }
);

