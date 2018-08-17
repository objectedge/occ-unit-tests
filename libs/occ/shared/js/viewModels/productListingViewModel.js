
/**
 * @fileoverview Product Listing View Model.
 */
define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'viewModels/productListingViewModel',

  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['knockout', 'ccPaginated', 'pubsub', 'ccRestClient', 'ccConstants',
    'CCi18n', 'spinner', 'ccNumber', 'pageLayout/product', 'storageApi', 'pageLayout/site', 'navigation', 'ccStoreConfiguration'],

  function(ko, Paginated, pubsub, ccRestClient, CCConstants, CCi18n, spinner, ccNumber, Product, storageApi, SiteViewModel, navigation, CCStoreConfiguration) {

    "use strict";

    //-------------------------------------------------------
    // View Model
    //-------------------------------------------------------

    /**
     * Represents a product listing, used when handling product collections from category selection.
     *
     * @public
     * @class ProductListingViewModel
     * @extends ccPaginated
     * @param {Product[]} data - The list of products.
     *
     * @property {observable<boolean>} display=true Display results?
     * @property {observable<string>} spanClass The Bootstrap CSS class, determined by the viewport type.
     * @property {string} type='ProductListingViewModel' View model type.
     * @property {Object} productLoadingOptions The options for the 'loading' spinner.
     * @property {integer} itemsPerPage=12 The number of items per page.
     * @property {integer} blockSize=60 The number of items per block.
     * @property {observable<integer>} recordsPerPage=12 The number of records per page;
     * @property {Object[]} currentProducts The current products.
     * @property {string} catalog The current catalog.
     * @property {observable<string>} category The current category.
     * @property {observable<string>} selectedSort The selected sort criteria.
     * @property {observable<string>} resultsText The results text.
     * @property {observable<string>} titleText The title text.
     * @property {observable<integer>} itemsPerRow=4 The number of items per row.
     * @property {integer} itemsPerRowInTabletView=4 The number of items per row in tablet view.
     * @property {integer} itemsPerRowInPhoneView=2 The number of items per row in phone view.
     * @property {integer} itemsPerRowInDesktopView=4 The number of items per row in desktop view.
     * @property {integer} itemsPerRowInLargeDesktopView=4 The number of items per row in large desktop view.
     * @property {CCStoreConfiguration} storeConfiguration An instance of the cc-store-configuration containing store-configuration data.
     */
    function ProductListingViewModel(data) {
      var self = this;

      // call super constructor
      Paginated.call(this);

      //widget object
      self.widget = data;
      self.productGridRefreshOrAppend = true;
      
      self.catalog = ko.observable();

      self.display = ko.observable(true);

      self.showInactiveProducts = null;
      self.showInactiveSkus = null;
      // array to hole Product view models of scrolled products
      self.scrolledViewModels = [];
      // Flag to support scrolling in all view ports, will be set in widget according to configuration
      self.isLoadOnScroll = ko.observable(false);
      // Variable to support backward compatibility to optimize the productgrid rows
      self.productGridExtension = false;
      // Variable to enable client side caching
      self.isCacheEnabled = false;
      // Array to hold clist side cached product view models
      self.cachedViewModels = [];
      // Number of categories to cache on client side
      self.viewModelCacheLimit = 3;
      // flag to refresh the value of ProductGrid when required        
      self.refreshValues=false;

      self.defaultBlockSize = 60;
      self.selectedSort = ko.observable();

      self.categoryOrSearchChanged = false;

      self.changedViaDropDown = false;

      this.handleResultsPerPage = function(resultsPerPageOption, callback){
        var timeout = setTimeout(this.doChangeResultsPerPage.bind(this, resultsPerPageOption, callback),200);
      };

      /**
       * Change the number of results per page
       * @private
       * @param {Object} resultsPerPage The results per page options.
       * @param {function} callback Callback function.
       */
      this.doChangeResultsPerPage = function(resultsPerPageOption, callback) {
        var itemsPerPage = CCConstants.DEFAULT_ITEMS_PER_PAGE, newBlockSize = this.defaultBlockSize, onPageOne = false;

        if(resultsPerPageOption) {
          this.prevTotalNumber = (this.totalNumber && this.totalNumber() !== null) ? this.totalNumber() : this.prevTotalNumber;

          if(resultsPerPageOption.id == CCConstants.RESULTS_PER_PAGE_ALL) {
            itemsPerPage = this.prevTotalNumber;
            if(this.blockSize < itemsPerPage) {
              newBlockSize = itemsPerPage;
            }
          } else {
            itemsPerPage = resultsPerPageOption.value;
            if(this.widget && this.widget.blockSize && !(isNaN(this.widget.blockSize())) ){
              newBlockSize = parseInt(this.widget.blockSize());
            }
          }

          this.blockSize = newBlockSize;
        }

        // set our new items per page value
        this.itemsPerPage = itemsPerPage;

        if(!this.widget) {
          return;
        }

        this.changedViaDropDown = true;

        if (this.widget.listType() === CCConstants.LIST_VIEW_PRODUCTS) {
          // clean the URL in case it was paged
          this.cleanPage();

          // reset the page number and current page
          this.pageNumber = null;
          this.currentPage(null);
          this.getPage(1);
        } else if (this.widget.listType() === CCConstants.LIST_VIEW_SEARCH) {
          // clean the URL in case it was paged
          //this.cleanPage();

          if (this.currentPage() == 1){
            onPageOne = true;
          }
          // reset the page number and current page
          this.pageNumber = null;
          this.currentPage(null);

          if (onPageOne){
            this.getPage(1);
          }else{
            //go back to the first page of results
            navigation.goTo(this.firstPage(), false, true);
          }
         }

         this.changedViaDropDown = false;
      };

      // For mobile and tablet, default view would be scrolling view
      if(($(window)[0].innerWidth || $(window).width()) <= CCConstants.VIEWPORT_TABLET_UPPER_WIDTH){
        self.isLoadOnScroll(true);
      }

      var expandedOffset=0, actualOffset=0, totalExpandedResults=0, totalResults=0;

      // This computed variable gives the BS classes to be put for the
      // product grid.
      self.spanClass = ko.computed(function(){
        var classString = "";
        // The conditions are for checking if the respective class has to be
        // added for that viewport based on the configuration.
        // The first condition states whether the data exists.
        // The second condition removes redundancy if the small viewport
        // has the same class as the larger viewport.
        // This makes it so that the items per row can be made configurable and
        // the products per row changes as per configuration.
        var phoneViewItems = 0,
        tabletViewItems = 0,
        desktopViewItems = 0,
        largeDesktopViewItems = 0;
        if (this.itemsPerRowInPhoneView) {
          phoneViewItems = 12 / this.itemsPerRowInPhoneView;
        }
        if (this.itemsPerRowInTabletView) {
          tabletViewItems = 12 / this.itemsPerRowInTabletView();
        }
        if (this.itemsPerRowInDesktopView) {
          desktopViewItems = 12 / this.itemsPerRowInDesktopView();
        }
        if (this.itemsPerRowInLargeDesktopView) {
          largeDesktopViewItems = 12 / this.itemsPerRowInLargeDesktopView();
        }

        if (phoneViewItems > 0) {
          classString += "col-xs-" + phoneViewItems;
        }
        if ((tabletViewItems > 0) && (tabletViewItems != phoneViewItems)) {
          classString += " col-sm-" + tabletViewItems;
        }
        if ((desktopViewItems > 0) && (desktopViewItems != tabletViewItems)) {
          classString += " col-md-" + desktopViewItems;
        }
        if ((largeDesktopViewItems > 0) && (largeDesktopViewItems != desktopViewItems)) {
          classString += " col-lg-" + largeDesktopViewItems;
        }

        return classString;
      }, self).extend({ deferred: true });

      // additional public variables
      self.type = "ProductListingViewModel";
      // overwrite public methods

      this.productLoadingOptions = {};
      this.productLoadingOptions.parent = '#cc-product-spinner';
      this.productLoadingOptions.selector = '#cc-product-spinner-area';

      /**
       * Remove the 'loading' spinner.
       * @private
       * @instance
       */
      this.removeSpinner = function() {
        var removeDelay = setTimeout(function() {
          $('#cc-product-spinner-area').find('.cc-spinner').remove();}, 500);
      };

      this.handleSorting = function(sorting,cb){
        var timeout = setTimeout(this.doSort.bind(this,sorting,cb),200);

      }

      /**
       * Sort the items.
       * Calls the 'sort' method on the Paginated superclass, and then calls the callback
       * method when finished.
       * @private
       * @param {Object} sorting The sort options.
       * @param {function} cb Callback function.
       */
      this.doSort = function(sorting,cb) {
        if(this.isCacheEnabled) {
          var cachedInex = this.findCachedResultIndex(1);
          if (cachedInex != undefined) {
            this.sortDirectiveOrder(sorting.order());
            this.sortDirectiveProp(sorting.id);
            if(this.currentPage()===1){
              this.currentPage.notifySubscribers();
            }
            this.targetPage = 1;
            this.currentPage(1);
            return;
          }
        }
        this.sort(sorting);

        if(cb) {
          cb(arguments[3]);
        }
      };

      this.itemsPerPage = CCConstants.DEFAULT_ITEMS_PER_PAGE;
      this.blockSize = this.defaultBlockSize;
      
      // This array holds row wise product view models to show in product listing. we will empty it once the row is computed.
      this.pageProductsTemp = [];

      if(this.widget && this.widget.productsPerPage && !isNaN(this.widget.productsPerPage()) ){
        this.itemsPerPage = parseInt(this.widget.productsPerPage());
      }
      if(this.widget && this.widget.blockSize && !(isNaN(this.widget.blockSize())) ){
        this.blockSize = parseInt(this.widget.blockSize());
      }
      if(this.blockSize <= this.itemsPerPage) {
        this.blockSize = this.itemsPerPage + 1;
      }

      this.recordsPerPage = ko.observable(CCConstants.DEFAULT_ITEMS_PER_PAGE);
      this.lruSize = 100;
      this.numberOfElementsToDelete = 20;
      this.currentProductsComputed = ko.observableArray([]);
      this.currentProducts = ko.computed(function(){

        if (this.widget && (this.widget.listType() === "product")) {
          var pageProducts = [];
          this.productGridRefreshOrAppend = true;
          var startPosition, endPosition;
          // Get the products in the current page
          startPosition = (this.currentPage() - 1) * this.itemsPerPage;
          endPosition = startPosition + this.itemsPerPage;
          var isLoadOnScroll = this.isLoadOnScroll.peek();
          if(!this.isCacheEnabled){
            var data = this.data.peek();
            pageProducts = data.slice(startPosition, endPosition);
          }

          var products = [];
          var pageProductsLength = pageProducts.length, imageSize, imageUrl;
          var product, listingSku, listingVariant, listingOffsetMap, offsetKeys, offsetLength, sortedOffsetKeys=[];
          if(this.isCacheEnabled) {
            var viewModelsPresent = true;
            var cachedIndex = this.findCachedResultIndex();
            if (cachedIndex != undefined) {
              if (endPosition > this.cachedViewModels[cachedIndex].totalResults) {
                endPosition = this.cachedViewModels[cachedIndex].totalResults;
              }
              for (var i = startPosition; i < endPosition; i++) {
                if (this.cachedViewModels[cachedIndex].viewModels[i] == undefined) {
                  viewModelsPresent = false;
                  break;
                }
              }
              if (viewModelsPresent) {
                this.cachedViewModels[cachedIndex].visitCount++;
                products = this.cachedViewModels[cachedIndex].viewModels.slice(startPosition, endPosition);
                this.currentProductsComputed(products);
                if(isLoadOnScroll){
                  return this.cachedViewModels[cachedIndex].viewModels;
                }
                return products;
              }
              pageProducts = this.cachedViewModels[cachedIndex].products.slice(startPosition, endPosition);
              pageProductsLength = pageProducts.length;
            }
          }
          for (var index = 0; index < pageProductsLength; index++) {
            if (pageProducts[index]) {
              product = new Product(pageProducts[index].product);

              //set up the observable for product listing image
              imageSize = this.listingImageSize();

              // use the primarySmallImageURL, stripping off any dimensions
              imageUrl = product.primarySmallImageURL().match(/.+?(?=&height=)/);

              // if there were no dimensions use the path, otherwise extract the matched string
              imageUrl = imageUrl == null ? product.primarySmallImageURL() : imageUrl[0];

              product.listingImageURL = ko.observable(imageUrl + "&height=" + imageSize + "&width=" + imageSize);

              if ((this.widget.shouldUseStyleBased() || this.widget.shouldUseStyleBased()=="true") && window.history && window.history.pushState){
                if (index == 0  && this.category()) {

                  var listingOffsetMap = storageApi.getInstance().getItem(CCConstants.LISTING_OFFSET_MAP_KEY);
                  if (listingOffsetMap && typeof listingOffsetMap === 'string') {
                    listingOffsetMap = JSON.parse(listingOffsetMap);
                  }

                  if (listingOffsetMap) {
                    offsetKeys = Object.keys(listingOffsetMap);
                    offsetLength = offsetKeys.length;
                    if (offsetLength && offsetLength > this.lruSize) {
                      sortedOffsetKeys = offsetKeys.sort(function(a,b){return listingOffsetMap[a].timestamp-listingOffsetMap[b].timestamp});
                      for (var offsetIndex=0; offsetIndex < this.numberOfElementsToDelete; offsetIndex++) {
                        delete listingOffsetMap[sortedOffsetKeys[offsetIndex]];
                      }
                    }
                  } else {
                    listingOffsetMap = {};
                  }
                  pageProducts[index].offsetMap.timestamp=Date.now();
                  listingOffsetMap[this.category().route + "/" + this.pageNumber] = pageProducts[index].offsetMap;
                  storageApi.getInstance().setItem(CCConstants.LISTING_OFFSET_MAP_KEY, JSON.stringify(listingOffsetMap));
                }
                listingVariant = self.widget.productListingTypes[product.type()];
                product.listingSku = pageProducts[index].listingSku;
                if (listingVariant) {
                  if (!listingVariant.variantBasedDisplay
                    && pageProducts[index].product.defaultProductListingSku &&
                    pageProducts[index].product.defaultProductListingSku.images &&
                    pageProducts[index].product.defaultProductListingSku.images.length > 0) {
                    product.listingSku = pageProducts[index].product.defaultProductListingSku;
                  }
                  if (product.listingSku) {
                    product.listingSku.route = pageProducts[index].product.route +
                      "?variantName=" +
                      listingVariant.id +
                      "&variantValue=" +
                      product.listingSku[listingVariant.id];
                  }
                }
              }
              products.push(product);
              this.pageProductsTemp.push(product);
              //We will not wait until all the product view models are constructed to render the product grid. As a row is complete we would pass it back to the widget to render the grid.
              // when last row is incomplete, in load on scroll mode we will pass it if the total results equal to the sum of already scrolled products and pageProductsTemp
              // in pagination, if the last product index+1 (as index starts from 0) is equal to pageProductsLength, then we will return that incomplete row 
              if(((this.pageProductsTemp.length > 0 && this.pageProductsTemp.length % this.itemsPerRow() === 0) ||
                ((isLoadOnScroll && this.totalNumber.peek()===(this.pageProductsTemp.length + this.scrolledViewModels.length)) ||
                (!isLoadOnScroll && (index + 1) === pageProductsLength)))) {
                this.scrolledViewModels.push.apply(this.scrolledViewModels, this.pageProductsTemp);
                if(!this.productGridExtension && (this.viewportMode() == CCConstants.TABLET_VIEW ||this.viewportMode() == CCConstants.PHONE_VIEW)){
                  this.currentProductsComputed(this.scrolledViewModels);
                }else {
                  this.currentProductsComputed(this.pageProductsTemp.splice(0));
                }
                this.pageProductsTemp = [];
                this.productGridRefreshOrAppend = false;
              }
            }
          }
          var selectedCategory = this.category();
          if(selectedCategory && cachedIndex!=undefined && this.isCacheEnabled){
            for(var i = 0; i< products.length; i++){
              this.cachedViewModels[cachedIndex].viewModels[i+startPosition] = products[i];
            }
          }
          if(isLoadOnScroll){
              return this.scrolledViewModels;
          }
          // This makes the page focus outlike the product-listing as appear as the page is stuck on ipad and iphone.
          // $('#CC-product-listing-sortby').focus();

          return products;
        }
      }, this).extend({ deferred: true });


      /**
       * Check the size of the current viewport and set the viewport
       * mode accordingly.
       * @private
       * @param {integer} viewportWidth The viewport width.
       **/
      this.checkResponsiveFeatures = function(viewportWidth) {
        if(viewportWidth > CCConstants.VIEWPORT_LARGE_DESKTOP_LOWER_WIDTH) {
          if(self.viewportMode() != CCConstants.LARGE_DESKTOP_VIEW) {
            self.viewportMode(CCConstants.LARGE_DESKTOP_VIEW);
            self.handleViewportChange(CCConstants.LARGE_DESKTOP_VIEW);
          }
        }
        else if(viewportWidth > CCConstants.VIEWPORT_TABLET_UPPER_WIDTH  && viewportWidth <= CCConstants.VIEWPORT_LARGE_DESKTOP_LOWER_WIDTH) {
          if(self.viewportMode() != CCConstants.DESKTOP_VIEW) {
            self.viewportMode(CCConstants.DESKTOP_VIEW);
            self.handleViewportChange(CCConstants.DESKTOP_VIEW);
          }
        }
        else if(viewportWidth >= CCConstants.VIEWPORT_TABLET_LOWER_WIDTH && viewportWidth <= CCConstants.VIEWPORT_TABLET_UPPER_WIDTH){
          if(self.viewportMode() != CCConstants.TABLET_VIEW) {
            self.viewportMode(CCConstants.TABLET_VIEW);
            self.handleViewportChange(CCConstants.TABLET_VIEW);
          }
        }
        else if(self.viewportMode() != CCConstants.PHONE_VIEW) {
          self.viewportMode(CCConstants.PHONE_VIEW);
          self.handleViewportChange(CCConstants.PHONE_VIEW);
        }
      };

      /**
       * Set the number of items per row for responsive viewports
       * (tablet and phone).
       * @private
       */
      this.handleResponsiveViewports = function() {
        if(self.viewportMode() == CCConstants.TABLET_VIEW) {
          self.itemsPerRow(self.itemsPerRowInTabletView());
          self.isMobileView(true);
          self.isLoadOnScroll(true);
        }
        if(self.viewportMode() == CCConstants.PHONE_VIEW) {
          self.itemsPerRow(self.itemsPerRowInPhoneView);
          self.isMobileView(true);
          self.isLoadOnScroll(true);
        }
        self.refreshValues=true;
        self.scrolledViewModels = [];
        if(self.isLoadOnScroll()){
          // Computing current products in case of scrollable view as fetchBlock is not called
          if(self.productGridExtension){
            if(self.currentPage() === 1){
              self.currentPage.notifySubscribers();
            } else {
              self.currentPage(1);
            }
          }
          self.scrollToTop = false;
        } else {
          self.scrollToTop = true;
        }
      };

      /**
       * Adds and removes scroll event handler from window, based on what
       * viewport mode we're in.
       * @private
       * @param {integer} value The viewport mode.
       */
      this.handleViewportChange = function(value) {
    	var initial= self.itemsPerRow();
        if(value == self._internalViewportMode()) return;

        if (value) {
          self._internalViewportMode(value);
        }
        if(self.viewportMode() == CCConstants.DESKTOP_VIEW) {
    
          self.itemsPerRow(self.itemsPerRowInDesktopView());
          self.clearOnLoad = true;
          self.targetPage = 1;
          self.fetchBlock(0);
          self.isMobileView(false);
          self.isLoadOnScroll(false);
        }
        else if(self.viewportMode() == CCConstants.LARGE_DESKTOP_VIEW) {

          self.itemsPerRow(self.itemsPerRowInLargeDesktopView());
          self.clearOnLoad = true;
          self.targetPage = 1;
          self.fetchBlock(0);
          self.isMobileView(false);
          self.isLoadOnScroll(false);
        }
        self.handleResponsiveViewports();
      };

      this.pageNumberDeferred = $.Deferred();
      /**
       * Handles calculation of pagination links for SEO rel tags.
       *
       * @param {viewModel} instance of ProductListingViewModel
       * @param {data} PAGE_PAGINATION_CHANGE event data
       */
      this.handleLinks = function(viewModel, data) {
        var pagesCount = viewModel.totalNumberOfPages();
        var currentPage = parseInt(data.page) || (data.paginationOnly ? 1 : viewModel.pageNumber);
        var curr, prev;

        if (pagesCount == 1 || currentPage == 1) {
          prev = null;
          curr = '';
        } else {
          prev = "/" + (currentPage - 1);
          curr = "/" + currentPage;
        }

        $.Topic(pubsub.topicNames.PAGE_PAGINATION_CALCULATED).publish({
          currPageNo: curr,
          prevPageNo: prev,
          nextPageNo: (pagesCount == 1 || currentPage == pagesCount) ? null : '/' + (currentPage + 1)
        });
      };
      /**
       * Handles PAGE_PAGINATION_CHANGE pub sub event.
       *
       * @param {data} PAGE_PAGINATION_CHANGE event data
       */
      this.handlePaginationChange = function(data) {
        this.pageNumberDeferred.resolve(this, data);
        if (data.paginationOnly) {
          this.handleLinks(this, data);
        }
      };
      // subscribe to the pubsub event
      $.Topic(pubsub.topicNames.PAGE_PAGINATION_CHANGE).subscribe(this.handlePaginationChange.bind(this));

      this.checkResponsiveFeatures($(window)[0].innerWidth || $(window).width());
      this.handleResponsiveViewports();

      this._internalViewportMode(this.viewportMode());

      this.resultsText = ko.computed(this.getResultsText, this);
      this.storeConfiguration = CCStoreConfiguration.getInstance();
    }

    var Temp = function(){};
    Temp.prototype = Paginated.prototype;

    ProductListingViewModel.prototype = new Temp();

    // setup the inheritance chain
    ProductListingViewModel.prototype.constructor = ProductListingViewModel;

    ProductListingViewModel.prototype.category = ko.observable();
    ProductListingViewModel.prototype.resultsText = ko.observable();
    ProductListingViewModel.prototype.titleText = ko.observable();
    ProductListingViewModel.prototype.itemsPerRow = ko.observable(4);
    ProductListingViewModel.prototype.itemsPerRowInTabletView = ko.observable(4);
    ProductListingViewModel.prototype.itemsPerRowInPhoneView = 2;
    ProductListingViewModel.prototype.itemsPerRowInDesktopView = ko.observable(4);
    ProductListingViewModel.prototype.itemsPerRowInLargeDesktopView = ko.observable(4);
    ProductListingViewModel.prototype._internalViewportMode = ko.observable(4);
    ProductListingViewModel.prototype.viewportMode = ko.observable(4);
    ProductListingViewModel.prototype.spanClass = ko.observable();
    ProductListingViewModel.prototype.listingImageSize = ko.observable(300);

    /**
     * Resets the sort by drop down and user selected sort option.
     */
    ProductListingViewModel.prototype.resetSortOptions = function() {
      // Setting displayName id as default sort.
      var defaultSortOption = this.sortOptions()[0];
      this.selectedSort(defaultSortOption);
      this.sortDirectiveProp(defaultSortOption.id);
      this.sortDirectiveOrder(defaultSortOption.order("none"));
    };

    /**
     * Clear function to reset all the local data
     * and associated metadata.
     * @private
     */
    ProductListingViewModel.prototype.clearData = function() {
      this.data([]);
      this.prevTotalNumber = this.totalNumber();
      this.totalNumber(null);
      this.actualOffset=0;
      this.expandedOffset=0;
      this.scrolledViewModels = [];
    };

    /**
     * Gets the specified page of results. Will fetch needed results if they
     * are not already loaded.
     * @param {integer} pageNumber The page number of results to get.
     * @private
     * @function productListingViewModel#getPage
     */
    ProductListingViewModel.prototype.getPage = function(pageNumber) {
      if (this.totalNumberOfPages() > 1) {
        this.adjustPageIndex(pageNumber);
      }
      this.adjustStartAndEndPageIndex(pageNumber);
      // Pagination for mobile views
      if(pageNumber !== this.currentPage() && pageNumber !== this.targetPage && this.isMobileView()) {
        $.Topic(pubsub.topicNames.RECORD_PAGINATION_PAGE_CHANGE).publish();
      }
      // Populate all missing items on the page
      if (pageNumber !== this.targetPage || this.targetPage === null || this.targetPage === undefined) {
        this.targetPage = pageNumber;
      }
      if(this.isCacheEnabled) {
        var getData = false;
        var cachedIndex = this.findCachedResultIndex(pageNumber);
        if (cachedIndex == undefined) {
          getData = true;
        } else {
          var pageEndIndex = this.pageEndIndex();
          if(pageEndIndex > this.cachedViewModels[cachedIndex].totalResults){
            pageEndIndex = this.cachedViewModels[cachedIndex].totalResults;
          }
          for (var i = this.pageStartIndex(); i < pageEndIndex; i += 1) {
            if (typeof this.cachedViewModels[cachedIndex]["products"][i] === 'undefined') {
              getData = true;
              break;
            }
          }
        }
        if (getData) {
          if (pageNumber !== this.currentPage()) {
            this.targetPage = pageNumber;
          }
          this.fetchBlock(this.pageStartIndex());
          return;
        }
        if(this.currentPage() === pageNumber){
          this.currentPage.notifySubscribers();
        }
        this.totalNumber(this.cachedViewModels[cachedIndex].totalResults);
        $.when(this.pageNumberDeferred).done(this.handleLinks);
        this.titleText(this.getTitleText());
      } else {
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
      }
      this.currentPage(pageNumber);
    };

    /**
     * finds the index of cached category
     * @private
     * @function productListingViewModel#findCachedResultIndex
     */
    ProductListingViewModel.prototype.findCachedResultIndex = function(){
      var cachedIndex;
      var selectedCategory = this.category.peek();
      var selectedSort = this.selectedSort.peek();
      for(var i=0; i< this.cachedViewModels.length; i++){
        if(this.cachedViewModels[i] && this.cachedViewModels[i]["categoryId"] == selectedCategory.repositoryId &&
          this.cachedViewModels[i]["sortKey"] == selectedSort.id && this.cachedViewModels[i]["sortOrder"] == selectedSort.order()){
          cachedIndex = i;
          break;
        }
      }
      return cachedIndex;
    };

    /**
     * Load products using the current sorting order and starting from the
     * specified starting index.
     * @param {integer} startingIndex the index of the first record to load.
     */
    ProductListingViewModel.prototype.fetchBlock = function(startingIndex) {
      var url, data;

      if(this.clearOnLoad) {
        this.titleText('');
        this.clearData();
      }

      data = {};
      data[CCConstants.TOTAL_RESULTS] = true;
      data[CCConstants.TOTAL_EXPANDED_RESULTS]=true;
      if(this.catalog) {
        data[CCConstants.CATALOG] = this.catalog();
      }
      if (this.widget.user && this.widget.user().catalogId){
        data[CCConstants.CATALOG] = this.widget.user().catalogId();
      }
      if ((this.widget.shouldUseStyleBased() || this.widget.shouldUseStyleBased()=="true") && window.history && window.history.pushState) {
        if (startingIndex == 0) { //first page data
          this.actualOffset = 0;
          this.expandedOffset = 0;
          data[CCConstants.OFFSET] = this.actualOffset;
        } else if (this.pageNumber == Math.ceil(this.totalExpandedResults/this.itemsPerPage)) { //last page data
          this.actualOffset = (this.totalResults - this.blockSize)<0?0:this.totalResults - this.blockSize;
          this.expandedOffset = -1 * this.totalExpandedResults;
          data[CCConstants.OFFSET] = this.actualOffset;
        } else {
          for (var index=1; index <= this.blockSize; index++) {
            if (this.data()[startingIndex + this.itemsPerPage - index]) {
              this.actualOffset = this.data()[startingIndex + this.itemsPerPage - index].offsetMap.actualOffset + this.blockSize;
              this.expandedOffset = startingIndex + this.itemsPerPage + 1 - index;
              data[CCConstants.OFFSET] = this.actualOffset;
              break;
            }
          }
          if (data[CCConstants.OFFSET] == undefined) {
            for (var index=1; index <= this.blockSize; index++) {
              if (this.data()[startingIndex + index]) {
                this.actualOffset = (this.data()[startingIndex + index].offsetMap.actualOffset - this.blockSize) < 0 ?
                  0 : (this.data()[startingIndex + index].offsetMap.actualOffset - this.blockSize);
                this.expandedOffset = -1 * (startingIndex + index -1);
                data[CCConstants.OFFSET] = this.actualOffset;
                break;
              }
            }
          }
        }

        if (data[CCConstants.OFFSET] == undefined) {
          var offsetMap, listingOffsetMap;

          listingOffsetMap = storageApi.getInstance().getItem(CCConstants.LISTING_OFFSET_MAP_KEY);
          if (listingOffsetMap && typeof listingOffsetMap === 'string') {
            listingOffsetMap = JSON.parse(listingOffsetMap);
          }

          if (listingOffsetMap) {
            offsetMap = listingOffsetMap[this.category().route + "/" + this.pageNumber];
          }
          if (offsetMap && offsetMap !== undefined) {
            this.actualOffset= offsetMap.actualOffset;
            this.expandedOffset = offsetMap.expandedOffset;
            data[CCConstants.OFFSET] = this.actualOffset;
          }
        }
      }

      if (data[CCConstants.OFFSET] == undefined) {
        this.actualOffset = startingIndex;
        this.expandedOffset = startingIndex;
        data[CCConstants.OFFSET] = this.actualOffset;
      }

      data[CCConstants.LIMIT] = this.blockSize;
      if (this.sortDirectiveProp() !== 'default') {
        data[CCConstants.SORTS] = this.sortDirectiveProp() + ":" + this.sortDirectiveOrder();
      }

      url = CCConstants.ENDPOINT_PRODUCTS_LIST_PRODUCTS;

      if(this.category()) {

        if (!this.requesting) {
          this.requesting = true;
          spinner.create(this.productLoadingOptions);

          data[CCConstants.CATEGORY] = this.category().id;
          data.includeChildren = true;
          if(this.showInactiveProducts != null && this.showInactiveSkus != null) {
            data.showInactiveProducts = this.showInactiveProducts;
            data.showInactiveSkus = this.showInactiveSkus;
          }

          if (this.widget && this.widget.fields && this.widget.fields()){
            data.fields = this.widget.fields();
          }
          this.requesting = true;
          data[CCConstants.STORE_PRICELISTGROUP_ID] = SiteViewModel.getInstance().selectedPriceListGroup().id;

          if (this.widget && this.widget.productListing && this.widget.productListing.filterKey) {
            data[CCConstants.FILTER_KEY] = this.widget.productListing.filterKey;
          }
          ccRestClient.request(url, data,
        	  function(result){this.successFunc(result);}.bind(this),
//            this.successFunc.bind(this),
            this.errorFunc.bind(this));
        }
      }
    };


    ProductListingViewModel.prototype.buildResultsPerPageOption = function(value, allResults) {
      return {
        'id':           allResults ? CCConstants.RESULTS_PER_PAGE_ALL : 'rec-per-page-' + value,
        'displayText':  allResults ?  CCi18n.t('ns.productlisting:resources.resultsPerPageOptionAll') : value,
        'value':        value
      };
    };

    /**
     * Build the Results Per Page data
     * Adds the product data to the view model.
     * @private
     * @param {Object} result The products result object.
     * @param {Object} previously selected results per page option
     * @param {Object} previous total results count
     */
    ProductListingViewModel.prototype.buildResultsPerPage = function(currentTotalResults, previousTotalResults, prevSelectedResultsPerPageOption) {
      var vm = this;

      // don't process it if the results per page option has not been selected or
      // the property doesn't exist for the version of the widget (CCSF-11824)
      if(!vm.widget.showResultsPerPageSection || !vm.widget.showResultsPerPageSection()) {
        return;
      }

      var newResultsPerPageOptions = [],
          recordsPerPageVal = 0,
          itemsPerPage = (vm.widget.productsPerPage && vm.widget.productsPerPage()) || CCConstants.DEFAULT_ITEMS_PER_PAGE;

      if (!this.resultsPerPageOptions().length || this.categoryOrSearchChanged) {
        this.categoryOrSearchChanged = false;
        // loop through the series and create results per page options
        $.each(CCConstants.RESULTS_PER_PAGE_SERIES, function(i, val) {
          //skip the first entry as we will always add ALL
          if(i == 0) {
            return;
          }

          recordsPerPageVal = itemsPerPage * val;

          if(recordsPerPageVal < currentTotalResults) {
            newResultsPerPageOptions.push(vm.buildResultsPerPageOption(recordsPerPageVal));
          }
        });

        newResultsPerPageOptions.push(vm.buildResultsPerPageOption(currentTotalResults, true));
        this.resultsPerPageOptions(newResultsPerPageOptions);
      }
    };

    /**
     * 'Load products' success callback function.
     * Adds the product data to the view model.
     * @private
     * @param {Object} result The products result object.
     */
    ProductListingViewModel.prototype.successFunc = function(result) {
      var prevSelectedResultsPerPageOption = this.selectedResultsPerPageOption(),
          prevTotalResultsCount = this.prevTotalNumber;

      if ((this.widget.shouldUseStyleBased() || this.widget.shouldUseStyleBased()=="true") && window.history && window.history.pushState) {
        this.totalExpandedResults = result.totalExpandedResults;
        this.totalResults = result.totalResults;

        // generate the results per page data
        this.buildResultsPerPage(this.totalExpandedResults, prevTotalResultsCount, prevSelectedResultsPerPageOption);

        var offsetMap = {};
        offsetMap.actualOffset = result.offset;
        var expandedProducts = this.expandProducts(result.items, offsetMap);
        var currentExpandedOffset;
        if (this.expandedOffset >= 0) {
          currentExpandedOffset = this.expandedOffset;
        } else {
          currentExpandedOffset = Math.abs(this.expandedOffset) - expandedProducts.length;
        }
        offsetMap.expandedOffset = currentExpandedOffset; //It updates the object value which is tied to all expanded products
        if (expandedProducts && expandedProducts.length > 0) {
          if(this.isCacheEnabled){
            this.populateData(expandedProducts, result.totalExpandedResults, currentExpandedOffset);
          }
          this.addData(expandedProducts, result.totalExpandedResults < 0 ? 0
            : result.totalExpandedResults, currentExpandedOffset);
        } else {
          // Passing in true for noHistory param (2nd param), we don't want the url to change on 404 pages.
          navigation.goTo(this.widget.links()['404'].route, true, true);
        }
      } else {
        // generate the results per page data
        this.totalResults = result.totalResults;
        this.buildResultsPerPage(this.totalResults, prevTotalResultsCount, prevSelectedResultsPerPageOption);

        var items = [];
        if(result && result.items && result.items.length > 0){
          for (var index = 0, prodLength = result.items.length; index < prodLength; index++) {
            var obj = {};
            obj.product = result.items[index];
            items[index] = obj;
          }
        } else {
          navigation.goTo(this.widget.links()['404'].route, true, true);
        }

        if(this.isCacheEnabled) {
          this.populateData(items, result.totalResults, result.offset);
        }
        this.addData(items, result.totalResults < 0 ? 0 : result.totalResults, result.offset);

      }

      // tell the deferred method that it can now calculate SEO links
      $.when( this.pageNumberDeferred ).done(this.handleLinks);
      this.removeSpinner();
      this.titleText(this.getTitleText());
      this.requesting = false;
    };

    /**
     * 'Load products' error callback function.
     * @private
     * @param {Object} result The error object.
     */
    ProductListingViewModel.prototype.errorFunc = function(result) {
      this.removeSpinner();
      this.requesting = false;
    };

    /**
     * Adds the product data to the cached array when cache is enabled.
     * @private
     * @param {Object} items The products result object.
     * @param {Integer} totalResults total number of products.
     * @param {Object} startIndex starting position after which products should be added in the cached array.
     */
    ProductListingViewModel.prototype.populateData = function(items, totalResults, startIndex){
      var ii, dataSet;
      var cachedIndex = this.findCachedResultIndex();
      if(cachedIndex == undefined){
        dataSet = [];
        for(ii = 0; ii < items.length; ii += 1) {
          dataSet[ii + startIndex] = items[ii];
        }
        this.cachedViewModels.push({
          "categoryId": this.category().repositoryId,
          "viewModels": [],
          "visitCount": 0,
          "sortKey": this.selectedSort().id,
          "sortOrder": this.selectedSort().order(),
          "products": dataSet,
          "totalResults": totalResults
        });
        // If cache limit is reached, then delete the oldest category visited
        if(this.cachedViewModels.length > this.viewModelCacheLimit){
          this.cachedViewModels.splice(0, 1);
        }
      } else {
        dataSet = this.cachedViewModels[cachedIndex].products;
        for(ii = 0; ii < items.length; ii += 1) {
          dataSet[ii + startIndex] = items[ii];
        }
        this.cachedViewModels[cachedIndex].products = dataSet;
        this.cachedViewModels[cachedIndex].viewModels.splice(startIndex);
      }
      return;
    };

    /**
     * Expand all the products depending upon product level ordering
     * or product type level ordering.
     * Set appropriate offsets for each product
     * @param {Object} all the products from success function of fetchBlock
     * @param {Object} offsetMap to store actual and expanded offsets for the product
     */
    ProductListingViewModel.prototype.expandProducts = function(pProducts, pOffsetMap) {
      var self = this;
      var expandedItems = [];
      var product, sku, skuGroups;
      var productListingTypes = this.widget.productListingTypes;
      var productTypeLevelOrder = [];
      var productLevelOrder = [];
      var listingVariant;
      var expandedIndex=0;

      if (pProducts) {
        for (var index = 0, prodLength = pProducts.length; index < prodLength; index++) {
          product = pProducts[index];
          if (product.childSKUs.length > 0 && productListingTypes[product.type] && productListingTypes[product.type].variantBasedDisplay) {
            skuGroups = {};
            listingVariant = productListingTypes[product.type].id;
            productLevelOrder = product.variantValuesOrder[listingVariant];
            productTypeLevelOrder =  productListingTypes[product.type].values;
            for (var lcIndex = 0, lcLength = product.childSKUs.length; lcIndex < lcLength; lcIndex++) {
              sku = product.childSKUs[lcIndex];
              if (!skuGroups[sku[listingVariant]] || sku.productListingSku) {
                var obj = {};
                obj.product = pProducts[index];
                obj.listingSku = sku;
                skuGroups[sku[listingVariant]] = obj;
              }
            }
            var orderingArray = [];
            if (productLevelOrder && productLevelOrder.length > 0) {
              orderingArray = productLevelOrder
            } else {
              orderingArray = productTypeLevelOrder
            }
            for (var orderingIdx = 0; orderingIdx < orderingArray.length; orderingIdx++) {
              if (skuGroups[orderingArray[orderingIdx]]) {
                expandedItems[expandedIndex] = skuGroups[orderingArray[orderingIdx]];
                expandedItems[expandedIndex].offsetMap = pOffsetMap;
                expandedIndex++;
              }
            }
          } else {
            var obj = {};
            obj.product = pProducts[index];
            expandedItems[expandedIndex] = obj;
            expandedItems[expandedIndex].offsetMap = pOffsetMap;
            expandedIndex++;
          }
        }
      }

      return expandedItems;
    };

    /**
     * The results text.
     * Builds up a string, based on the number of products returned, and the size of the viewport.
     * @private
     * @returns {string} The results string.
     */
    ProductListingViewModel.prototype.getResultsText = function() {
      var startIndex = this.pageStartIndex();
      var resultsText;

      if (this.isLoadOnScroll()) {
        startIndex = 0;
      }

      if (ccNumber.formatNumber(this.totalNumber())) {

        if (this.totalNumber() > 0) {
          resultsText = CCi18n.t('ns.common:resources.productresultsText',
            { startIndex: ccNumber.formatNumber(startIndex + 1),
              endIndex: ccNumber.formatNumber(this.pageEndIndex()),
              totalProducts: ccNumber.formatNumber(this.totalNumber())
            });
        }
        else {
          resultsText = CCi18n.t('ns.common:resources.emptyProductresultsText');
        }
      }

      if(resultsText === 'ns.common:resources.productresultsText') {
        resultsText = '';
      }

      return resultsText;
    };

    /**
     * The title text.
     * Builds up a string to be used as a title. If a category is selected, the category
     * name is returned. Otherwise, falls back to a static resource string.
     * @private
     * @returns {string} The title.
     */
    ProductListingViewModel.prototype.getTitleText = function() {

      var retText = '';

      if (this.category()) {
        retText = this.category().displayName;
      } else {
        retText = CCi18n.t('ns.common:resources.TitleText');
      }

      return retText;
    };

    return ProductListingViewModel;
  }
);

