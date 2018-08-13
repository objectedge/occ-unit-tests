/**
 * @fileoverview css-loader library that takes care of loading layout specific css into the DOM.
 * 
 * library will be given a path e.g. /pretty-shirt/product/xprod10001 and will send a request to the
 * server for the correct CSS for that path. Server will respond with a 302 to the actual CSS file for the layout e.g. /file/v12345/pl100001.css
 * 
 * The response will be inlined into the DOM, to ensure it exists prior to the page being rendered from the pages endpoint response.
 */
define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  "pageLayout/css-loader",

  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ["module", "jquery", "ccConstants", "ccRestClient"],

  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function(module, $, CCConstants, ccRestClient) {

    var OCC_RESOURCE = "/ccstoreui/v1/pages/css/", 
        STYLE_ELEMENT = "style", 
        CSS_MIME_TYPE = "text/css";
    
    /**
     * function returns a quick hash of the content passed in.
     * 
     * @param {any} pStr the string to hash 
     * @returns the hash code for the content.
     */
    function hashContents(pStr) {
      var hash = 0;

      if (pStr.length == 0) {
        return hash;
      }

      for (var i = 0; i < pStr.length; i++) {
        var char = pStr.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }

      return hash;
    }

    /**
     * CSSLoader.
     * 
     * This is the main module returned from this module.
     */
    function CSSLoader() {

      // module.config().optimizingCSS will have been passed down from the server. 
      // This indicates whether or not we should request layout specific CSS.
      this.loadingOptimizedCSS = module.config().optimizingCSS;
    }

    /**
     * function loads CSS for the layout for the path passed in
     * and inserts the returned CSS into a style element in the DOM.
     * 
     * @param {any} pPath the path to load CSS for e.g. /pretty-shirt/product/xprod10001     
     */
    CSSLoader.prototype.loadCssForLayout = function(pPath) {
      
      var path = OCC_RESOURCE + pPath;
      var cssDeferred = $.Deferred();
      var data = {};

      var headers = {};

      headers[CCConstants.AUTHORIZATION_HEADER] = CCConstants.BEARER = "Bearer " + ccRestClient.tokenSecret;

      // add viewport header for viewport based page rule evaluation.
      headers = ccRestClient.updateHeaderWithViewport(headers);

      if (window.siteId) {
        data[CCConstants.URL_SITE_PARAM] = window.siteId;
      }

      // If we're requesting layout specifc CSS, lets go get it.
      if (this.loadingOptimizedCSS) {

        $.ajax({
          url: path,
          data: data,
          headers: headers
        })
        .then(function(css, status, xhr) {

          if (xhr.status === 200) {
             // Get a basic hash of the content and use this as the id for the newly created style element.
             // That way we need not repeat ourselves by creating multiple style elements if we get the 
             // same CSS back for another path e.g. another product page.
             var hashCode = hashContents(css);

             if (!document.getElementById(hashCode)) {
               var style = document.createElement(STYLE_ELEMENT);
               style.type = CSS_MIME_TYPE;
               style.id = hashCode;
               style.appendChild(document.createTextNode(css));

               document.head.appendChild(style);
             }
          }
         
          cssDeferred.resolve();
        })
        .fail(function() {
          cssDeferred.resolve();
        });
      }
      // If we're not requesting layout specific CSS, just resolve straight away.
      else {
        cssDeferred.resolve();
      }

      return cssDeferred;
    };

    return new CSSLoader();
  }
);
