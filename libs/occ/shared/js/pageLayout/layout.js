/**
 * @fileoverview Defines a LayoutViewModel that contains the regions
 * and other data for the page.
 */

/*global define */
define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'pageLayout/layout',

  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['jquery', 'knockout', 'ccConstants', 'ccStoreConfiguration'],

  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function ($, ko, CCConstants, CCStoreConfiguration) {

    "use strict";

    //------------------------------------------------------------------
    // Class definition & member variables
    //------------------------------------------------------------------
    /**
     * Creates a layout view model. This view model manages the arrangement of drawable
     * screen components ({@link RegionViewModel|regions}) which may in turn contain widgets.
     *
     * @private
     * @class
     * @name LayoutViewModel
     * @property {observable<string>} layoutName The name of this layout.
     * @property {observablearray<RegionViewModel>} regions The list of regions managed by this layout.
     * @property {observable<string>} title Layout title.
     * @property {observable<string>} keywords Comma separated list of keywords.
     * @property {observable<string>} description Layout description.
     * @property {observable<string>} metaTags
     * @property {observable<boolean>} isPreview Whether we're rendering this layout as a preview.
     * @property {observable<string>} previewMessage Message to display when doing a preview render.
     * @property {observable<string>} sharedWidgetMessage Message to display if a contained widget is shared.
     * @property {observable<string>} displayErrorMessage Message to display in preview if a widget has rendering errors.
     * @property {observable<boolean>} containPage=true
     * @property {observable<boolean>} containHeader=false
     * @property {observable<boolean>} containMain=false
     * @property {observable<boolean>} containFooter=false
     * @property {observable<string>} pageChangeMessage
     * @property {observable<Object>} dataForPageChangeMessage
     * @property {observableArray} headerRows
     * @property {observableArray} bodyRows
     * @property {observableArray} footerRows
     * @property {observable<boolean>} noindex=false Indicates if a noindex meta tag should be added.
     */
    function LayoutViewModel() {
      var self = this;
      this.MAX_ROW_COLUMNS = 12;

      this.layoutName = ko.observable();
      this.regions = ko.observableArray([]);
      this.title = ko.observable();
      this.keywords = ko.observable();
      this.description = ko.observable();
      this.metaTags = ko.observable();
      this.isPreview = ko.observable();
      this.isObo = ko.observable(false);
      this.oboShopperName = ko.observable();
      this.previewMessage = ko.observable();
      this.oboShopperMessage = ko.observable();
      this.sharedWidgetMessage = ko.observable();
      this.displayErrorMessage = ko.observable();

      this.storeConfiguration = CCStoreConfiguration.getInstance();

      // page width option placeholders
      this.containPage = ko.observable(true);
      this.containHeader = ko.observable(false);
      this.containMain = ko.observable(false);
      this.containFooter = ko.observable(false);

      //message to alert change in url
      this.pageChangeMessage = ko.observable("");
      this.dataForPageChangeMessage = ko.observable();

      // Calculated rows of regions
      this.headerRows = ko.observableArray().extend({ deferred: true });
      this.bodyRows = ko.observableArray().extend({ deferred: true });
      this.footerRows = ko.observableArray().extend({ deferred: true });

      // SEO pagination and canonical tag
      this.canonicalRoute = ko.observable();
      this.alternates = ko.observableArray();
      this.prevPageNo = ko.observable();
      this.nextPageNo = ko.observable();
      this.currPageNo = ko.observable("");
      this.supportedLocales = ko.observableArray().extend({ deferred: true });
      this.paginationDone = ko.observable(false);
      this.noindex = ko.observable(false);

      // Don't add canonical tag to these pages
      var dontAddCanonical = [
        '/checkout','/cart','/wishlist_settings','/searchresults','/nosearchresults','/confirmation',
        '/error', '/signup', '/profile', '/orderhistory', '/orderdetails', '/payment', '/wishlist'
      ];

      var host = [window.location.protocol,"//",window.location.host].join("").toLowerCase();

      /**
       * Remove canonical tag if we need to.
       */
      var removeHeaderLink = function(rel) {
        var links = document.head.querySelectorAll('[rel="' + rel + '"]');
        var len = links.length;
        
        for (var i = 0; i < len; i++) { 
          document.head.removeChild(links[i]);
        }        
        return;      
      };        

      /**
       * Manually add or remove canonical tag when observable changes
       * Due to bug where search engines take the version with no href and a
       * data-bind tag and mistakenly index different customers together
       *
       * @param url - called once on viewModel load without raw route from repository
       *              and then again with locale processing and host added, from main.js
       */
      var addHeaderLink = function(url) {
        var rel = "canonical";
        
        // Don't handle this until we get called again with the host added
        if (url && (url.toLowerCase().indexOf(host) != 0)) {
          return;
        }

        if (!url || dontAddCanonical.indexOf(url.substring(host.length).toLowerCase()) >= 0) {
          removeHeaderLink(rel);
          return;
        }
      
        if (self.paginationDone()) {
          url = url + self.currPageNo();
        }

        // Add or replace canonical link. Just one.
        // Don't update the DOM unless we have to
      
        var links = document.head.querySelectorAll('[rel="' + rel + '"]');
        var len = links.length;
      
        if (len > 1) {
          // We have somehow got more than one canonical / prev / next link.
          // This should never happen, but ensure we only get one.
          removeHeaderLink(rel);
        }
      
        // Manipulate the DOM the least amount that we have to
        if (len === 1) {
          if (links[0].href !== url) {
            // console.log("Tag: Updating " + rel + " url: " + url)
            links[0].href = url;
          }
        } else {
          // console.log("Tag: Adding new " + rel + " url: " + url)
          var newLink = document.createElement('link');
          newLink.rel = rel;
          newLink.href = url;
          document.head.appendChild(newLink);
        }
      };

      /**
       * Ensure we update the pagination on the canonical tag
       */
      this.paginationDone.subscribe(function() {
        self.canonicalRoute.valueHasMutated();
      });

      /**
       * Manually manipulate the DOM when the observable changes. This is
       * necessary, because we don't know what url the user or search bot
       * uses to arrive at the site, so we don't know  for sure what's in index.jsp
       */
      this.canonicalRoute.subscribe(addHeaderLink);

      /**
       * Derived set of header regions in layout.
       * @readonly
       * @name LayoutViewModel#headerRegions
       */
      this.headerRegions = ko.observableArray();

      /**
       * Derived set of body regions in layout.
       * @readonly
       * @name LayoutViewModel#bodyRegions
       */
      this.bodyRegions = ko.observableArray();

      /**
       * Derived set of footer regions in layout.
       * @readonly
       * @name LayoutViewModel#footerRegions
       */
      this.footerRegions = ko.observableArray();

      /**
       * Build rows using regions after layout data loaded
       * Instead of computed variables, header, body, footer regions
       * and rows are calculated single time after the layout data loaded
       * @private
       * @function layout#buildRows
       */
      this.buildRows = function(){
        var previousHeaderRegions = this.headerRegions();
        var previousBodyRegions = this.bodyRegions();
        var previousFooterRegions = this.footerRegions();
        this.headerRegions([]);
        this.bodyRegions([]);
        this.footerRegions([]);
        var region;
        for(var i=0; i< this.regions().length; i++){
          region = this.regions()[i];
          if(ko.unwrap(region.type) === CCConstants.REGION_TYPE_HEADER){
            this.headerRegions.push(this.regions()[i]);
          }
          if(!ko.unwrap(region.type) || ko.unwrap(region.type) === CCConstants.REGION_TYPE_BODY){
            this.bodyRegions.push(this.regions()[i]);
          }
          if(ko.unwrap(region.type) === CCConstants.REGION_TYPE_FOOTER){
            this.footerRegions.push(this.regions()[i]);
          }
        }
        this.calculateRows.call(this.headerRows, this.headerRegions(), previousHeaderRegions);
        this.calculateRows.call(this.bodyRows, this.bodyRegions(), previousBodyRegions);
        this.calculateRows.call(this.footerRows, this.footerRegions(), previousFooterRegions);
      };

      /**
       * Calculate rows from the regions
       *
       * Why this method does not count the offset values
       * ------------------------------------------------
       * If a 2 column layout has widgets only in the right-hand region, then the region list will
       * contain both regions, with their respective widths *and* an offset value for the right
       * -hand region which is equal to the width of the left-hand region. Storefront will not
       * render the empty left-hand region, instead applying the offset value to the right-hand
       * region.
       * Therefore, if this method was to count both the empty region's width *and*
       * the offset value, it could incorrectly compute the region rows.
       *
       */
      this.calculateRows = function(regionsArray, previousRegionsArray) {
        var rowsArray = this, row = {}, currentWidth = 0, region, rowsArrayData = [];

        if (regionsArray.length === previousRegionsArray.length) {
          var arraysMatch = true;
          for (var i = 0; i < regionsArray.length; i++) {
            // contents of regions are checked elsewhere,
            // just check ID & width here
            if (regionsArray[i].id() !== previousRegionsArray[i].id()
              || regionsArray[i].width() !== previousRegionsArray[i].width()) {
              arraysMatch = false;
              break;
            }
          }

          if (arraysMatch) {
            // don't update the rows
            return;
          }
        }

        if (!ko.isObservable(rowsArray) || (rowsArray.removeAll === undefined)) {
          return;
        }

        rowsArrayData = rowsArray();
        // empty the array
        rowsArrayData.splice(0,rowsArrayData.length);

        // could make the row the obsrv Array directly
        // but this approach makes more sense in the templates
        row.regions = ko.observableArray().extend({deferred: true});

        for (var i = 0; i < regionsArray.length; i++) {
          region = regionsArray[i];
          if (currentWidth == self.MAX_ROW_COLUMNS
            || currentWidth + region.width() > self.MAX_ROW_COLUMNS) {
            rowsArrayData.push(row);
            row = {};
            row.regions = ko.observableArray().extend({ deferred: true });
            currentWidth = 0;
          }
          row.regions.push(region);
          currentWidth += region.width();
        }
        // add the last row
        rowsArrayData.push(row);
        // notify the observable that it has new data
        rowsArray.valueHasMutated();
      };


      /**
       * Allows subscribing to an array that is observable, with both the
       * current and previous values supplied to the callback method.
       *
       * @param target observable to watch
       * @param callback method to call when value changes
       * @param context value of 'this' for the callback
       */
      this.subscribeArrayChanged = function (target, callback, context) {
        if (!ko.isObservable(target)) {
          return;
        }

        var previousValue = target.peek();

        target.subscribe(function (currentValue) {
          var oldValue = previousValue;
          previousValue = $.extend(true, [], currentValue);
          callback.call(context, currentValue, oldValue);
        });
      };

      /**
       * Calculate rows for each section
       */
      // this.subscribeArrayChanged(this.headerRegions, this.calculateRows, this.headerRows);
      // this.subscribeArrayChanged(this.bodyRegions, this.calculateRows, this.bodyRows);
      // this.subscribeArrayChanged(this.footerRegions, this.calculateRows, this.footerRows);

      /**
       * Check if this LayoutViewModel contains a widget of the given type.
       *
       * @function
       * @name LayoutViewModel#hasWidgetType
       * @param {string} findType The widget type name to search for.
       * @returns {boolean} true if the layout contains a widget of type `findType', otherwise false.
       */
      this.hasWidgetType = function(findType) {
        var result = false;
        var region;
        if (self.regions()) {
          for (var i = 0; i < self.regions().length; i++) {
            region = self.regions()[i];
            if (region.widgets().length) {
              for (var j = 0; j < self.regions().length; j++) {
                var type = region.widgets()[j].typeId();
                if (type === findType) return true;
              }
            }
          }
        }
        return false;
      };

      /**
       * Formats hreflang value which is part of alternates object. Replaces '_' with '-'.
       *
       * @function
       * @name LayoutViewModel#hreflang
       * @param {string} hreflang The hreflang value to format.
       * @returns {string} formatted hreflang value.
       */
      this.formatHreflang = function (hreflang) {
        var hreflangVal = "";
        if (hreflang) {
          hreflangVal = ko.utils.unwrapObservable(hreflang);
          return hreflangVal.replace(/_/g, "-");
        }
        return hreflangVal;
      }

      return(this);
    }

    return LayoutViewModel;
  }
);

