/**
 * @fileoverview URL based pagination (Extension of existing pagination)
 * Provides an extended Pagination functionality that can
 * be used by different components to implement URL based pagination.
 * Standard formats for url is /1 or with ?page=1
 *
 */
define(
  //---------------------------------------------------------------------------
  // PACKAGE NAME
  //---------------------------------------------------------------------------
  'ccPaginated',
  //---------------------------------------------------------------------------
  // DEPENDENCIES
  //---------------------------------------------------------------------------
  [ 'knockout', 'pubsub', 'navigation', 'crossroads', 'ccConstants', 'ccNavState'],
  //---------------------------------------------------------------------------
  // MODULE DEFINITION
  //---------------------------------------------------------------------------
  function(ko, PubSub, navigation, crossroads, CCConstants, ccNavState) {

    "use strict";

    // ------------------------------------------------------------------------
    // View Model
    // ------------------------------------------------------------------------

    /**
     * Creates a paginated view model.
     *
     * @class The paginated view model used to implement pagination and
     *        sorting functionality.
     * @name ccPaginated
     * @private
     *
     * @property {boolean} active=false Active flag.
     * @property {integer} pageNumber=1 The current page number.
     * @property {observable<string>} pageId The page ID.
     * @property {observable<string>} contextId The context ID.
     * @property {observable<boolean>} paginationOnly Pagination only flag.
     * @property {observable<string>} seoslug SEO slug.
     * @property {observable<string>} previousHash Previous URL hash.
     * @property {observable<string>} currentHash Current URL hash.
     * @property {observable<boolean>} isMobileView Mobile view flag.
     * @property {observable<integer>} paginationType=0 Pagination type.
     * @property {integer} targetPage=1 Target page.
     * @property {boolean} clearOnLoad=false Clear on load?
     * @property {integer} itemsPerPage=40 Number of items per page.
     * @property {integer} blockSize=40 Number of items per block.
     * @property {integer} pageBatchSize=1 Page batch size.
     * @property {integer} pageWindowSize=5 Page window size.
     * @property {integer} startIndex=0 Start index.
     * @property {integer} lastIndex=4 Last index.
     * @property {integer} pageIndex=0 Page index.
     * @property {integer} middlePageOffset=0 Middle page offset.
     * @property {boolean} focusPage=false Is this page in focus.
     * @property {Object[]} pages The list of pages.
     * @property {boolean} scrollToTop=true Scroll to top of page?
     * @property {observableArray<Object>} sortOptions The list of sort options.
     * @property {observable<integer>} currentPage=0 Current page being displayed.
     * @property {observable<integer>} totalNumber=0 Total number of items.
     * @property {observableArray<Object>} data The raw data to be paginated.
     * @property {observable<string>} sortDirectiveProp='displayName' Sort directive property.
     * @property {observable<string>} sortDirectiveOrder='asc' Sort directive order - 'asc' or 'desc'.
     * @property {observable<integer>} totalNumberOfPages=0 Total number of pages.
     * @property {observable<integer>} pageStartIndex Start page index.
     * @property {observable<integer>} pageEndIndex End page index.
     * @property {observable<integer>} clickedPage=-1 Clicked page.
     *
     */
    function CCPaginated() {
      var self = this;
      self.active = false;
      self.pageNumber = 1;
      self.pageId = ko.observable("");
      self.contextId = ko.observable("");
      self.paginationOnly = ko.observable(false);
      self.seoslug = ko.observable("");
      self.previousHash = ko.observable("");
      self.currentHash = ko.observable("");
      self.isMobileView = ko.observable(false);
      // Pagination type handler.
      // 1 = ...page/<PageNumber>. This one needs a contextId as well to work
      // 2 = ...page?parameter&page=<PageNumber>
      self.paginationType = ko.observable(0);

      self.targetPage = 1;
      self.clearOnLoad = false;
      self.itemsPerPage = 40;
      self.blockSize = 40;
      self.pageBatchSize = 1;
      self.data = ko.observableArray().extend({ deferred: true });
      self.pageWindowSize = 5;
      self.startIndex = 0;
      self.lastIndex = self.pageWindowSize - 1;
      self.pageIndex = 0;
      self.middlePageOffset = 0;
      self.focusPage = false;

      self.pages = ko.computed(self.pagesFunction, self);

      self.scrollToTop = true;

      self.currentPage(1);
      self.firstPageIndex(1);
      self.totalNumber(0);

      self.sortDirectiveProp('displayName');
      self.sortDirectiveOrder('asc');
      self.totalNumberOfPages(0);

      self.clickedPage(-1);
      // Variable to support generic sort, instead of hard coding sort keys
      self.useGenericSort = false;
      /**
       * Possible sorting options. Each sorting option should have:
       * id: The property name to sort by.
       * displayText: The display name of the property.
       * order (observable): The asc/desc ordering of the property.
       */
      self.sortOptions = ko.observableArray([]);

      // observable to hold the selected results per page value
      self.selectedResultsPerPageOption = ko.observable();
      self.resultsPerPageOptions = ko.observableArray([]);
    }

    CCPaginated.prototype.currentPage = ko.observable(0);
    CCPaginated.prototype.totalNumber = ko.observable(0);
    CCPaginated.prototype.firstPageIndex = ko.observable(1);
    CCPaginated.prototype.data = ko.observableArray([]).extend({ deferred: true });

    CCPaginated.prototype.sortDirectiveProp = ko.observable('displayName');
    CCPaginated.prototype.sortDirectiveOrder = ko.observable('asc');
    CCPaginated.prototype.totalNumberOfPages = ko.observable(0);
    CCPaginated.prototype.pageStartIndex = ko.observable();
    CCPaginated.prototype.pageEndIndex = ko.observable();
    CCPaginated.prototype.clickedPage = ko.observable(-1);

    /**
     * Update the pagination based on the paginationType.
     * The function interpolates the URL based on the pageId, contextId,
     * pageNumber, parameters
     * @private
     * @function ccPaginated#updatePagination
     * @returns {string} The new URL, containing the pagination data.
     */
    CCPaginated.prototype.updatePagination = function(pageNumber) {
      var self = this;
      var url = "";
      if (CCConstants.ALLOW_HASHBANG) {
         url += CCConstants.URL_HASH_SIGN + CCConstants.URL_PREPEND_HASH;
      }
      if (this.paginationType() == 1) {
        url = ccNavState.route() + '/' + pageNumber;

        return navigation.getPathWithLocale(url);
      } else if (this.paginationType() == 2) {
        // Using the normal context routing
        var pageContextRoute = crossroads.addRoute('/searchresults?{parameters}');
        var parameters = "";
        var hasPageNumber = false;
        for (var key in this.parameters) {
          if (this.parameters.hasOwnProperty(key)) {
            if (key == "page") {
              this.parameters[key] = pageNumber;
              hasPageNumber = true;
            }
            parameters += key + "=" + this.parameters[key] + "&";
          }
        }
        parameters = parameters.substring(0, parameters.length - 1);
        if (!hasPageNumber) {
          parameters += "&page=" + pageNumber;
        }
        // Interpolate it to generate page number based URL
        url += pageContextRoute.interpolate({parameters: parameters});
        return navigation.getPathWithLocale(url);
      } else if (this.paginationType() == 3) {
        url = CCConstants.AGENT_BASE_CONTEXT + '/' + CCConstants.URL_HASH_SIGN + CCConstants.URL_PREPEND_HASH;
        // Using the normal context routing
        var pageContextRoute = crossroads.addRoute('/{pageId}/{contextId}?{parameters}');
        var parameters = "";
        var hasPageNumber = false;
        for (var key in this.parameters) {
          if (this.parameters.hasOwnProperty(key)) {
            if (key == "page") {
              this.parameters[key] = pageNumber;
              hasPageNumber = true;
            }
            parameters += key + "=" + this.parameters[key] + "&";
          }
        }
        parameters = parameters.substring(0, parameters.length - 1);
        if (!hasPageNumber) {
          if(parameters) {
            parameters += "&";
          }
          parameters += "page=" + pageNumber;
        }
        // Interpolate it to generate page number based URL
        url += pageContextRoute.interpolate({pageId: this.pageId(), contextId: this.contextId(), parameters: parameters});
        return navigation.getPathWithLocale(url);
      } else {
        return "";
      }
    };

    /**
     * Load the list of products.
     * @private
     * @function ccPaginated#load
     * @param {boolean} delayClear Delay setting the <code>currentPage</code>
     * and <code>totalNumberOfPages</code> properties until after the page
     * is retrieved?
     */
    CCPaginated.prototype.load = function(delayClear) {
      if (delayClear) {
        this.clearData();
        this.clearOnLoad = true;
      } else {
        this.clearData();
        if (this.pageNumber) {
          this.totalNumberOfPages(this.pageNumber);
          this.firstPageIndex(null);
          this.currentPage(this.pageNumber);
          this.firstPageIndex(1);
        }
      }
      this.getPage(this.pageNumber || this.currentPage() || 1);
    };

    /**
     * Function to clean the page URL and pagination data when
     * the view is changed.
     * @private
     * @function ccPaginated#cleanPage
     */
    CCPaginated.prototype.cleanPage = function() {

      if (this.paginationType() == 1) {
        url = ccNavState.route();

        navigation.goTo(url);
      } else if (this.paginationType() == 2) {
        // Using the normal context routing
        var pageContextRoute = crossroads.addRoute('/searchresults?{parameters}');
        var parameters = "";

        for (var key in this.parameters) {
          if (this.parameters.hasOwnProperty(key)) {
            if (key == "page") {
            } else {
              parameters += key + "=" + this.parameters[key] + "&";
            }
          }
        }
        parameters = parameters.substring(0, parameters.length - 1);

        url = pageContextRoute.interpolate({parameters: parameters});
        navigation.goTo(url);
      } else if (this.paginationType() == 3) {
        // Using the normal context routing
        var pageContextRoute = crossroads.addRoute('/{pageId}/{contextId}?{parameters}');
        var parameters = "";
        for (var key in this.parameters) {
          if (this.parameters.hasOwnProperty(key)) {
            if (key == "page") {
            } else {
            parameters += key + "=" + this.parameters[key] + "&";
            }
          }
        }
        parameters = parameters.substring(0, parameters.length - 1);
        // Interpolate it to generate page number based URL
        var url = pageContextRoute.interpolate({pageId: this.pageId(), contextId: this.contextId(), parameters: parameters});
        navigation.goTo(url);
      }
    };

    /**
     * The first page URL.
     * @private
     * @function ccPaginated#firstPage
     * @returns {string} The URL for page 1.
     */
    CCPaginated.prototype.firstPage = function() {
      return this.updatePagination(this.firstPageIndex());
    };

    /**
     * Take to the first page control.
     * @private
     * @function ccPaginated#goToFirstPageControls
     */
    CCPaginated.prototype.goToFirstPageControls = function() {
      this.initializeIndex();
      return true;
    };

    /**
     * The previous page URL based on the currentPage.
     * @private
     * @function ccPaginated#previousPage
     * @returns {string} The URL of the previous page.
     */
    CCPaginated.prototype.previousPage = function() {
      if (this.currentPage() > this.startIndex + 1) {
        return this.updatePagination(this.currentPage() - 1);
      } else {
        return this.updatePagination(this.currentPage());
      }
    };

    /**
     * The page URL for the given page number.
     * @function ccPaginated#goToPage
     * @param {Object} data The current context data that contains the pageNumber.
     * @private
     * @returns {string} The URL of the given page.
     */
    CCPaginated.prototype.goToPage = function(data) {
      return this.updatePagination(data.pageNumber);
    };

    /**
     * Gives the next page URL based on the currentPage.
     * @private
     * @function ccPaginated#nextPage
     * @returns {string} The URL of the next page, or the URL of the current
     * page, if this is the last page.
     */
    CCPaginated.prototype.nextPage = function() {
      if (this.currentPage() <  this.totalNumberOfPages()) {
        return this.updatePagination(this.currentPage() + 1);
      } else {
        return this.updatePagination(this.currentPage());
      }
    };

    /**
     * Gives the last page URL.
     * @private
     * @function ccPaginated#lastPage
     * @returns {string} The URL of the last page.
     */
    CCPaginated.prototype.lastPage = function() {
      return this.updatePagination(this.totalNumberOfPages());
    };

    /**
     * Increments the current page by one.
     * @private
     * @function ccPaginated#incrementPage
     */
    CCPaginated.prototype.incrementPage = function() {
      if(this.currentPage() <  this.totalNumberOfPages()) {
        this.getPage(this.currentPage() + 1);
      }
    };

    /**
     * Gets the specified page of results. Will fetch needed results if they
     * are not already loaded.
     * @param {integer} pageNumber The page number of results to get.
     * @private
     * @function ccPaginated#getPage
     */
    CCPaginated.prototype.getPage = function(pageNumber) {
      if (this.totalNumberOfPages() > 1) {
        this.adjustPageIndex(pageNumber);
      }
      this.adjustStartAndEndPageIndex(pageNumber);
      // Pagination for mobile views
      if(pageNumber !== this.currentPage() && pageNumber !== this.targetPage && this.isMobileView()) {
        $.Topic(PubSub.topicNames.RECORD_PAGINATION_PAGE_CHANGE).publish();
      }
      // Populate all missing items on the page
      if (pageNumber !== this.targetPage || this.targetPage === null || this.targetPage === undefined) {
        this.targetPage = pageNumber;
      }
      if (this.clearOnLoad) {
        this.fetchBlock(this.pageStartIndex());
        this.clickedPage(pageNumber);
        this.currentPage(pageNumber);
        return;
      }
      for (var i = this.pageStartIndex(); i < this.pageEndIndex(); i += 1) {
        if (typeof this.data()[i] === 'undefined') {
          if(pageNumber !== this.currentPage()) {
            this.targetPage = pageNumber;
          }
          this.fetchBlock(this.pageStartIndex());
          return;
        }
      }
      this.currentPage(pageNumber);
    };

    /**
     * Function to create a list of pages to display.
     * @private
     * @function ccPaginated#pagesFunction
     * @returns {Object[]} A list of 'page' objects, where each object contains
     * <code>&#123;{pageNumber, selected, focused}&#125;</code>
     */
    CCPaginated.prototype.pagesFunction = function() {
      var numberOfPages, numberOfFullPages, numberOfPartialPages, pages,
      pageNumber, selected, focused, i, offset = 1, pageIndex;
      if (this.clearOnLoad) {
        this.adjustStartAndEndPageIndex(this.pageNumber);
      }
      if (this.totalNumber()) {
        // Calculate the number of pages
        numberOfFullPages =
        (this.totalNumber() - (this.totalNumber() % this.itemsPerPage)) / this.itemsPerPage;
        numberOfPartialPages = (this.totalNumber() % this.itemsPerPage > 0 ? 1 : 0);
        numberOfPages = numberOfFullPages + numberOfPartialPages;
      } else {
        numberOfPages = 0;
      }
      this.prevTotalNumberOfPages = this.totalNumberOfPages();
      this.totalNumberOfPages(numberOfPages);
      this.adjustPageIndex(this.pageNumber);
      // Create the objects to represent the pages
      pages = [];
      for (i = this.startIndex; (i <= this.lastIndex && i < this.totalNumberOfPages()); i += 1) {
        pageNumber = i + 1;
        // Determine whether or not this page is currently selected
        selected = pageNumber === this.currentPage();
        focused = (this.focusPage) ? selected : false;
        pageIndex = Math.abs(pageNumber - i - offset);
        offset += 1;
        pages[pageIndex] =
          {pageNumber: pageNumber, selected: selected, focused: focused};
      }
      // Ignore the page focus the first time we enter a page
      if (!this.focusPage && pages.length > 0) {
        this.focusPage = true;
      }
      return pages;
    };

    /**
     * Adjust startIndex and lastIndex of the page slice depending on which page
     * is requested to be viewed.
     * @param {integer} pageNumber The page number to be viewed.
     * @private
     * @function ccPaginated#adjustPageIndex
     */
    CCPaginated.prototype.adjustPageIndex = function(pageNumber) {
      var pageOffset = Math.floor(this.pageWindowSize/2);
      if (pageNumber >= this.totalNumberOfPages()) {
        // Reset the page number to the last page
        if (pageNumber > this.totalNumberOfPages()) {
          pageNumber = this.totalNumberOfPages();
        }
        // Handle Last pages
        if (pageNumber == this.totalNumberOfPages()) {
          // Assign the last page index to max
          this.lastIndex = this.totalNumberOfPages() - 1;
          if (this.lastIndex < (this.pageWindowSize - 1)) {
            // Check if the last index size is less than the window size
            // If so set the start index to the first page
            this.startIndex = 0;
          } else {
            // Else set the start index to the previous 5th page
            this.startIndex = this.lastIndex - (this.pageWindowSize - 1);
          }
        }
      } else {
        // All the other pages
        if (pageNumber <= pageOffset) {
          // When the page number is less than or equal to the page offset size
          // Set the start index to the first element
          this.startIndex = 0;
          // Based on the total number of elements set the last index
          if (this.totalNumberOfPages() <= this.pageWindowSize) {
            this.lastIndex = this.totalNumberOfPages() - 1;
          } else {
            this.lastIndex = this.pageWindowSize - 1;
          }
        } else {
          // When the page number is greater than the page window size
          var pageOverflow = this.totalNumberOfPages() - pageNumber;
          if (pageOverflow >= pageOffset) {
            // When there are enough pages after the required page
            this.startIndex = (pageNumber - 1) - pageOffset;
            this.lastIndex = (pageNumber - 1) + pageOffset;
          } else {
            this.startIndex = (pageNumber - 1) - pageOffset - pageOverflow;
            this.lastIndex = (pageNumber - 1) + pageOffset - pageOverflow;
          }
          if (this.startIndex < 0){
            this.startIndex = 0;
          }
        }
      }
    };

    /**
     * Sorts the list of data. Will sort client side if possible, otherwise
     * data will be loaded from the server in the appropriate order.
     * @param {Object} sorting The sort criteria object.
     * @private
     * @function ccPaginated#sort
     */
    CCPaginated.prototype.sort = function(sorting) {
      var i, sortOrder, sortOptionId, missingData;

      // if the sort order isn't reversible, don't re-sort if the sort order is the same
      var a = this.sortDirectiveOrder();
      var b = sorting.order();
      if (sorting.notReversible && this.sortDirectiveOrder() == sorting.order()) {
        return;
      }

      if (sorting.maintainSortOrder && sorting.maintainSortOrder === true) {
        sortOrder = sorting.order();
      }
      else {
        if (sorting.id) {
          if (sorting.order() === "none" || sorting.order() === "desc") {
            sortOrder = "asc";
          } else {
            sortOrder = "desc";
          }
        }
      }

      this.sortDirectiveOrder(sortOrder);

      for (i = 0; i < this.sortOptions().length; i += 1) {
        if (this.sortOptions()[i] === sorting) {
          this.sortOptions()[i].order(sortOrder);
        } else if(!this.sortOptions()[i].maintainSortOrder){
          this.sortOptions()[i].order("none");
        }
      }

      this.sortDirectiveProp(sorting.id);

      if (this.paginationType() == 2 || this.paginationType() == 3) {
        if(this.useGenericSort) {
          var sortKey = sorting.id + ((sortOrder === 'desc') ? "|1" : "|0");
        } else {
          var sortKey = 'product.relevance';
          if (sorting.id === 'listPrice') {
            sortKey = 'sku.activePrice';
            sortKey = sortKey + ((sortOrder === 'desc') ? "|1" : "|0");
          }
        }
        this.parameters[CCConstants.SEARCH_SORT_ORDER] = encodeURIComponent(sortKey);
      }

      //If client does not have all the data, clear loaded data and use
      //server request to sort the data.
      if (this.data().length < this.totalNumber() || sorting.serverOnly) {
        this.clearOnLoad = true;
        this.cleanPage();
        this.initializeIndex();
        this.targetPage = 1;
        this.fetchBlock(0);
        return;
      }

      /* in case we paginated and skipped pages, check to see if any
       * items in the array are undefined, if we find one, empty the array */
      $.each(this.data(), function(ii, next) {
        if (!next) {
          missingData = true;
          return false;
        }
      });

      if (missingData) {
        this.clearOnLoad = true;
        this.targetPage = 1;
        this.fetchBlock(0);
        return;
      }

      //Client side sort.
      this.data.sort(this.sortFunction.bind(this));
      this.getPage(1);
    };

    /**
     * Client side sort function for a list of objects.
     * @param {Object} a First compare value.
     * @param {Object} b Second compare value.
     * @returns {integer} Returns 0 if equal, <1 if a should come first,
     * or >1 if a should come second.
     * @private
     * @function ccPaginated#sortFunction
     */
    CCPaginated.prototype.sortFunction = function (a, b) {
      var property, ii, aValue, bValue, order;
      order = this.sortDirectiveOrder() === "desc" ? -1 : 1;
      property = this.sortDirectiveProp() &&
                     this.sortDirectiveProp().split('.');
      aValue = a;
      bValue = b;

      for(ii = 0; ii < property.length; ii += 1) {
        if($.isArray(aValue)) {
          aValue = aValue[0];
        }

        if($.isArray(aValue)) {
          aValue = aValue[0];
        }

        aValue = aValue && aValue[property[ii]];

        if($.isArray(bValue)) {
          bValue = bValue[0];
        }

        bValue = bValue && bValue[property[ii]];

        if($.isArray(bValue)) {
          bValue = bValue[0];
        }
      }

      // If sort values are equal then default to name ascending
      if(aValue === bValue ||
      (typeof aValue === 'string' && aValue.toLowerCase() === bValue.toLowerCase())) {
        if(a.displayName && b.displayName){
          aValue = a.displayName && a.displayName.toString().toLowerCase();
          bValue = b.displayName && b.displayName.toString().toLowerCase();
        } else if(a.dateTime && b.dateTime){
          aValue = a.dateTime && a.dateTime.toLowerCase();
          bValue = b.dateTime && b.dateTime.toLowerCase();
          order = 1;
        }
      }

      if(aValue === bValue) {
        return 0;
      }

      if(isFinite(aValue) && isFinite(bValue)) {
        return (parseFloat(aValue) - parseFloat(bValue)) * order;
      }

      return aValue.toString().toLowerCase() > bValue.toString().toLowerCase() ? order : -1 * order;
    };

    /**
     * Adjust the start and last index of the currently viewed page.
     * @private
     * @function ccPaginated#adjustStartAndEndPageIndex
     * @param {integer} pageNumber The page number.
     */
    CCPaginated.prototype.adjustStartAndEndPageIndex = function(pageNumber){
      // Determine the ending index of the items on this page
      this.pageEndIndex(pageNumber * this.itemsPerPage);
      if(this.totalNumber()){
        if (this.pageEndIndex() > this.totalNumber()) {
          this.pageEndIndex(this.totalNumber());
        }
      }
      this.pageStartIndex((pageNumber - 1) * this.itemsPerPage);
    };

    /**
     * Initialize startIndex and EndIndex for a given page slice when loaded for
     * the first time.
     * @private
     * @function ccPaginated#initializeIndex.
     */
    CCPaginated.prototype.initializeIndex = function(){
      this.startIndex = 0;
      this.lastIndex = this.pageWindowSize -1;
      this.clickedPage(1);
    };

    /**
     * Clear the data.
     * @private
     * @function ccPaginated#clearData
     */
    CCPaginated.prototype.clearData = function() {
      this.data([]);
      this.prevTotalNumber = this.totalNumber();
      this.totalNumber(null);
    };

    /**
     * Responsible for adding data to the list of loaded data. This needs to
     * be called by the implementing class.
     * @param {Object[]} pagedData The data to add to the list of loaded data.
     * @param {integer} total The total number of data records that could possibly
     * be loaded.
     * @param {integer} startIndex The starting index of the loaded data.
     * @private
     * @function ccPaginated#addData
     */
    CCPaginated.prototype.addData = function(pagedData, total, startIndex) {
      var dataSet, endIndex, ii;
      //this if condition is to cover the case where all the items on the last page are deleted
      if(this.pageStartIndex() >0 && (total < 0 || total === startIndex)){
       total =  this.prevTotalNumber - this.blockSize >= 0 ? (this.prevTotalNumber - this.blockSize) : 0;
       this.removeLastPage();
      }else{
        total = total< 0 ? 0 : total;
      }
      this.totalNumber(total);
      endIndex = startIndex + this.blockSize * this.pageBatchSize;
      if(endIndex > total) {
        endIndex = total;
      }
      if(this.clearOnLoad) {
        dataSet = [];
        this.initializeIndex();
      } else {
        dataSet = this.data();
      }

      if(pagedData) {
        for(ii = 0; ii < pagedData.length; ii += 1) {
          dataSet[ii + startIndex] = pagedData[ii];
        }
      }

      if(this.clearOnLoad) {
        this.data(dataSet);
        this.clearOnLoad = false;
      } else {
        this.data.valueHasMutated();
      }

      // For currentProducts computed property, we are removing dependency on data to support caching, So when first time page loads after data
      // loaded, current products won't be computed. In that case we will manually trigger the subscription on current page property to show
      // products in the initial load
      if(this.currentPage() === this.targetPage){
        this.currentPage.notifySubscribers();
      }
      if(this.targetPage) {
        if(this.targetPage == 1){
          this.initializeIndex();
        }
        this.adjustStartAndEndPageIndex(this.targetPage);
        //Scroll to the top and switch page.
        if(this.scrollToTop === true) {
          $(window).scrollTop(0);
        }
        // Emptying the firstpage and resetting it
        this.firstPageIndex(null);
        this.currentPage(this.targetPage);
        this.firstPageIndex(1);
        if(this.scrollToTop === true) {
          $(window).scrollTop(0);
        }
        this.targetPage = null;
      } else if (endIndex < this.pageEndIndex()) {
        this.pageEndIndex(endIndex);
      }
    };

    /**
     * Load products using the current sorting order and starting from the
     * specified starting index.
     * @param {integer} startingIndex The index of the first record to load.
     * @function ccPaginated#fetchBlock
     */
    CCPaginated.prototype.fetchBlock = function(startingIndex) {
      throw "Function Not Implemented!";
    };

    /**
     * Function to remove all products in the last page.
     * @function ccPaginated#removeLastPage
     */
    CCPaginated.prototype.removeLastPage = function() {
      this.clearOnLoad = false;
      this.startIndex = (this.startIndex - 1) >= 0 ? this.startIndex - 1 : this.startIndex;
      this.getPage(this.currentPage() - 1);
    };

    /**
     * Reset the sort properties to a default state.
     * @function ccPaginated#sortReset
     */
    CCPaginated.prototype.sortReset = function() {
      this.sortDirectiveProp('displayName');
      this.sortDirectiveOrder('asc');

      $.each(this.sortOptions(), function(ii, value) {
        if(value.id === 'displayName') {
          value.order('asc');
        } else {
          value.order('none');
        }
      });
    };

    return CCPaginated;
  }
);

