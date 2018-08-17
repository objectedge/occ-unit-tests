/*global $, requestAnimFrame, cancelAnimFrame */
define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'ccImageZoom',

  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['spinner'],

  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function(spinner) {

    "use strict";

    /* ------------------------------------- */
    /* PRIVATE VARIABLES                     */
    /* ------------------------------------- */
    var incX, incY,
      timeoutid,
      fullImageWidth = -1.0,
      fullImageHeight = -1.0;


    /* ------------------------------------- */
    /* CONSTRUCTOR */
    /* ------------------------------------- */

    function ImageZoom() {

      /* use requestAnimationFrame for better performance */
      /* fallback to window.setTimeout */
      window.requestAnimFrame = (function() {
        return window.requestAnimationFrame ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame ||
          function(callback) {
            return window.setTimeout(callback, 1000 / 60);
        };
      })();

      window.cancelAnimFrame =
        window.cancelAnimationFrame || window.mozCancelAnimationFrame ||
        function(id) {
          clearTimeout(id);
      };

      this.framesPerSecond = 60;
      this.spinner = spinner;
      this.usingSpinner = true;
      this.spinnerDelay = 200;
      this.zoomDelay = 800;
      this.smallImageClass = "ccz-small";
      this.magnifierClass = "ccz-magnifier";
      this.fullImageClass = "ccz-full";
      this.flyoutClass = "ccz-flyout";
      this.magnifierPercent = 0.45;
      this.flyoutSpacing = 0; // px
      this.element = null;
      this.flyout = null;
      this.flyoutEnabled = true;
      this.flyoutScaling = 0.8;
      this.magnifierEnabled = false;
      this.magnifierPercentEased = 0.25;
      this.smallImageUrl = null;
      this.smallImageUrls = null;
      this.fullImageUrl = null;
      this.fullImageUrls = null;
      this.errorImageUrl = null;
      this.imageMetadataDefault = null;
	  this.imageMetadatas = [];
      this.fullImage = null; /* cached image object */
      this.smallIamge = null; /* cached image object */
      this.jqBackgroundImage = null; /* jquery cached img tag */
      this.loading = false;

      this.magnifierMin = 0.1;
      this.magnifierMax = 0.9;
      this.magnifierVelocity = 0.02;
      this.dampingFactor = 12.0;
      this.magnifierBorderWidth = 2.0;
      this.zoomCurtainClassName = "ccz-zoom-curtain";
      this.magnifierBackgroundClassName = "ccz-magnifier-background";

      this.lastTouchDistance = 0;
      this.currentMx = 0;
      this.currentMy = 0;
      this.xp = 0;
      this.yp = 0;

      this.offsetMagnifier = false; /* for mobile */
      this.replaceImageAtIndex = true;

      var self = this;


      /* react to mouse scroll or pinch events */
      this.handleMouseWheel = function(e) {
        e = window.event || e;
        if (e.preventDefault) {
          e.preventDefault();
        }
        var delta = Math.max(-1, Math.min(1, ((e.wheelDelta || -e.detail) || e.deltaY)));
        var newMagnifier = Math.max(self.magnifierMin, Math.min(self.magnifierMax,
          self.magnifierPercent + (self.magnifierVelocity * delta)));
        self.magnifierPercent = newMagnifier;

        // this will be picked on on next redraw
        //self.setMagnifierSize(true);
        //self.positionFlyoutAndMagnifier(self);
        return false;
      };

      /* react to movement events , mouse or touchmove */
      this.handleMouseMove = function(e) {
      //Don't show zoomed image if the image is still loaidng  
        if(!self.loading) {
        // Don't display magnifier if there is no image - its silly.
          if (self.imageLoadFailed || self.fullImageUrl.indexOf(self.errorImageUrl) != -1) {
              return;
          }

          e.preventDefault();
          /* Note: use "self" to reference the ImageZoom class properties. */
          /* Use "this" to reference the element */
          /* from which we are getting update events. */
          if (e.type.indexOf('touch') === 0) {
            var touchlist = e.touches || e.originalEvent.touches;

            if (touchlist.length > 1) {
              var dist =
                Math.sqrt(
                  (touchlist[0].pageX - touchlist[1].pageX) * (touchlist[0].pageX - touchlist[1].pageX) +
                  (touchlist[0].pageY - touchlist[1].pageY) * (touchlist[0].pageY - touchlist[1].pageY));
                self.lastTouchDistance = dist;
            }
            incX = touchlist[0].pageX;
            incY = touchlist[0].pageY;
          } else {
              incX = e.pageX || incX;
              incY = e.pageY || incY;
          }

          // This condition initializes magnify_offset as mousemove event is trigerred first before mouseenter in IE.
          if (!self.magnify_offset) {
            self.magnify_offset = $(self.element).offset();
          }
          var mx = incX - self.magnify_offset.left;
          var my = incY - self.magnify_offset.top;
          // stop taking measurements if we have the magnifier disabled
          // and the zoom box has hit the edge of the small image
          if (!self.magnifierEnabled) {
            var sw = self.jqSmallImage.width(),
              sh = self.jqSmallImage.height(),
              mw = self.getMagnifierWidth(),
              mh = self.getMagnifierHeight(),
              xmax = sw - mw / 2,
              xmin = mw / 2,
              ymax = sh - mh / 2,
              ymin = mh / 2;
              /* keep zooming extents within small image box */
              self.currentMx = self.constrainValue(xmin, xmax, mx);
              self.currentMy = self.constrainValue(ymin, ymax, my);
          } else {
            self.currentMx = mx;
            self.currentMy = my;
          }
          if (mx > Math.round($(this).width()) || my > Math.round($(this).height()) || mx < 0 || my < 0) {
            self.handleMouseLeave();
          }
        }
      }; // end handle mouse move

      /**
       * Called when the mouse (or touch events) leave
       * the image area which is being zoomed.
       */
      this.handleMouseLeave = function() {
        var self = this;
        clearTimeout(self.zoomTimeout);
        self.cancelRedraw(self);
        $('.' + self.zoomCurtainClassName).hide();
        $('.' + self.magnifierBackgroundClassName).hide();
        $(self.element).css({
          cursor: 'auto'
        });
        self.jqMagnifier.fadeOut(100);
        if (self.flyoutEnabled) {
          self.jqFlyout.fadeOut(100);
        }
      };
      
      /**
       * check to see if we are on IE or Edge
       */
      this.isIE = function() {
        if(navigator.userAgent.match(/Trident/) ||
           navigator.userAgent.match(/Edge/)) {
          return true;
        }
        return false;
      };

      /**
       * Called when the mouse or touch event has started.
       */
      this.handleMouseEnter = function() {
        var self = this;
        //Don't show zoomed image if the image is still loaidng 
        if(!self.loading) {
          if (self.jqFlyout.find('img').attr('src') == undefined) {
            self.jqFlyout.find('img').attr('src', self.fullImageUrl);
            $.when(self.loadImage(self.fullImageUrl))
            .done(function (fullImg) {
              self.jqFullImage.attr('src', fullImg.src);
            })
            .fail(function (fullImg) {
              self.imageLoadFailed = true;
              self.jqFullImage.attr('src', self.errorImageUrl);
            });
          }
          self.magnify_offset = $(self.element).offset();
            // Don't display magnifier if there is no image - its silly.
          if (self.fullImageUrl.indexOf(self.errorImageUrl) == -1 && !self.imageLoadFailed) {
            self.zoomTimeout = setTimeout(function() {
              self.magnify_offset = $(self.element).offset();
              if(self.isIE()){
	              $(self.element).css({
	                cursor: 'pointer'
	              });
              }
              else {
            	  $(self.element).css({
  	                cursor: 'zoom-in'
  	              });
              }
              self.magnifierBackgroundImage();
              if (!self.jqZoomCurtain) {
                self.jqZoomCurtain = self.addCurtain(self.element);
              } else {
                self.jqZoomCurtain.fadeIn(100);
              }
              if (self.flyoutEnabled) {
                self.setFlyoutSizeAndPosition();
              }
              self.jqMagnifier.fadeIn(500);
              if (self.flyoutEnabled) {
                self.jqFlyout.fadeIn(500);
              }
              self.timeoutid = self.scheduleRedraw(self);
            }, self.zoomDelay);
          }
        }
      };
    }

    /**
     * Register for mouse scroll events
     */
    ImageZoom.prototype.registerMouseWheel = function(e) {
      var self = this;
      var smallImage = self.jqMagnifier[0];
      // detect available wheel event
      var support = "onwheel" in document.createElement("div") ? "wheel" : // Modern browsers support "wheel"
      document.onmousewheel !== undefined ? "mousewheel" : // Webkit and IE support at least "mousewheel"
      "DOMMouseScroll"; // let's assume that remaining browsers are older Firefox
      if (smallImage.addEventListener) {
        smallImage.addEventListener(support,
          self.handleMouseWheel, false);
      } else {
        smallImage.attachEvent("onmousewheel", self.handleMouseWheel);
      }
    };

    ImageZoom.prototype.getMagnifierWidth = function() {
      var self = this,
        dims = self.getFlyoutDimensions(),
        magnifierWidth = dims['width'] * self.magnifierPercentEased;
      return magnifierWidth;
    };

    ImageZoom.prototype.getMagnifierHeight = function() {
      var self = this,
        dims = self.getFlyoutDimensions(),
        magnifierWidth = dims['width'] * self.magnifierPercentEased,
        magnifierHeight = self.flyoutEnabled ? dims['height'] * self.magnifierPercentEased : magnifierWidth;
      return magnifierHeight;
    };

    /**
     * Returns the css needed to position the magnifier background image.
     * TODO: Use CCS3 transition for nicer scrolling on newer browsers.
     */
    ImageZoom.prototype.getPositionMagnifierCss = function() {
      var self = this,

        smallImageDisplayedWidth = self.jqSmallImage.width(),
        smallImageDisplayedHeight = self.jqSmallImage.height(),
        magnifierWidth = self.getMagnifierWidth(),
        magnifierHeight = self.getMagnifierHeight(),
        md = (self.offsetMagnifier ? 1 : 2),
        mo = (self.offsetMagnifier ? 25 : 0),
        px = self.currentMx + (2 * mo) - (magnifierWidth / md),
        py = self.currentMy - mo - (magnifierHeight / md),
        xpercent = self.currentMx / smallImageDisplayedWidth,
        ypercent = self.currentMy / smallImageDisplayedHeight;
      /* don't allow zoom box to move outside the product image area on scroll events */
      if (!self.magnifierEnabled) {
        px = self.constrainValue(self.magnifierBorderWidth, smallImageDisplayedWidth - magnifierWidth, px);
        py = self.constrainValue(self.magnifierBorderWidth, smallImageDisplayedHeight - magnifierHeight, py);
      }
      //console.log(smallImageDisplayedWidth + "x" + smallImageDisplayedHeight + ' mx: ' + self.currentMx + ',' + self.currentMy);
      /* this should use small image width when magnifier is disabled? (was: self.fullImageWidth) */
      var glassZoomX = px * -1,
        glassZoomY = py * -1;

      if (self.magnifierEnabled) {
        glassZoomX = (xpercent * self.jqBackgroundImage.width() - (magnifierWidth / 2.0)) * -1;
        glassZoomY = (ypercent * self.jqBackgroundImage.height() - (magnifierHeight / 2.0)) * -1;
      }
      var bgp = glassZoomX + 'px ' + glassZoomY + 'px';

      return {
        'css': {
          width: magnifierWidth,
          height: magnifierHeight,
          left: (px - self.magnifierBorderWidth),
          top: (py - self.magnifierBorderWidth)
        },
        'background': {
          'left': glassZoomX,
          'top': glassZoomY
        }
      };
    };

    /**
     * Returns the css needed to position the flyout background image.
     * TODO: Use CCS3 transition for nicer scrolling on newer browsers.
     */
    ImageZoom.prototype.getPositionFlyoutCss = function() {
      var self = this,
        dims = self.getFlyoutDimensions(),
        smallImageDisplayedWidth = self.jqSmallImage.width(),
        smallImageDisplayedHeight = self.jqSmallImage.height(),
        flyoutImageWidth = smallImageDisplayedWidth / self.magnifierPercentEased,
        flyoutImageHeight = smallImageDisplayedHeight / self.magnifierPercentEased,
        xpercent = self.xp / smallImageDisplayedWidth,
        ypercent = self.yp / smallImageDisplayedHeight,
        leftZoomX = xpercent * flyoutImageWidth - (self.jqFlyout.width() / 2.0),
        leftZoomY = ypercent * flyoutImageHeight - (self.jqFlyout.height() / 2.0);
      //var maxval = flyoutImageWidth - (self.jqFlyout.width() / 2.0);

      if (!self.magnifierEnabled) {
        leftZoomX = self.constrainValue(0.0, flyoutImageWidth - self.jqFlyout.width(), leftZoomX);
        leftZoomY = self.constrainValue(0.0, flyoutImageHeight - self.jqFlyout.height(), leftZoomY);
      }
      return {
        left: -leftZoomX,
        top: -leftZoomY,
        width: flyoutImageWidth,
        height: flyoutImageHeight
      };
    };

    /**
     * Position the magnifier and background image based upon
     * the current mouse location and magnification settings.
     */
    ImageZoom.prototype.positionMagnifier = function() {
      var self = this,
        css = self.getPositionMagnifierCss();
      self.jqMagnifier.css(css['css']);
      $('.' + self.magnifierBackgroundClassName).css(css['background']);
    };

    /**
     * Position the flyout background image based upon
     * the current mouse location and magnification settings.
     */
    ImageZoom.prototype.positionFlyout = function() {
      var self = this,
        css = self.getPositionFlyoutCss();
      self.jqFullImage.css(css);
      /*
      if(!$(self.jqFlyout).visible()) {
        self.jqFlyout.css('left','-385px');
      }

      if(!$(self.jqFlyout).visible()) {
        self.jqFlyout.css('left','0px').css('top', '400px').css('left', '40px');
      }*/
    };

    ImageZoom.prototype.getFlyoutDimensions = function() {
      var self = this,
        width = self.jqSmallImage.width() * self.flyoutScaling,
        height = self.jqSmallImage.height() * self.flyoutScaling;
      return {
        'width': width,
        'height': height
      };
    };
    /**
     * Set the position and size of the container for the flyout image.
     */
    ImageZoom.prototype.setFlyoutSizeAndPosition = function() {
      var self = this;
      var dims = self.getFlyoutDimensions();
      var flyoutLeft = (self.jqSmallImage.width() + self.flyoutSpacing) + 'px';
      self.jqFlyout.css({
        'width': dims['width'],
        'height': dims['height'],
        'top': '0px',
        'left': flyoutLeft
      });
    };

    /**
     * Adds the background image for the magnifier
     **/
    ImageZoom.prototype.magnifierBackgroundImage = function() {

      var self = this,
        backgroundUrl = self.magnifierEnabled ? self.fullImageUrl : self.smallImageUrl;
      if (self.jqBackgroundImage !== null) {
        if (self.jqBackgroundImage.attr('src') != backgroundUrl) {
          $(self.jqBackgroundImage).attr('src',backgroundUrl);
        }
        self.jqBackgroundImage.css({
          width: self.jqSmallImage.width(),
          height: self.jqSmallImage.height()
        });
        self.jqBackgroundImage.show();
        return;
      }
      var img = $("<img class='" + self.magnifierBackgroundClassName + "'/>");
      if (self.magnifierEnabled) {
        img.css({
          position: 'absolute'
        });
      } else {
        img.css({
          position: 'absolute',
          'max-height': 'none',
          'max-width': 'none',
          width: self.jqSmallImage.width(),
          height: self.jqSmallImage.height()
        });
      }

      $(img).attr('src', backgroundUrl);
      self.jqBackgroundImage = img;
      self.jqMagnifier.append(img);
    };

    /**
     * Adds a curtain to the given element.
     * Returns the jquery object created representing the zoom curtain.
     */
    ImageZoom.prototype.addCurtain = function(element) {

      var self = this,
        zoomCurtain = $("<div class='" + self.zoomCurtainClassName + "'></div>");
      zoomCurtain.css({
        display: 'block',
        position: 'absolute',
        top: '0px',
        left: '0px',
        width: '100%',
        height: '100%',
        'background-color': 'rgb(255,255,255)',
        opacity: 0
      });
      $(self.element).append(zoomCurtain);
      zoomCurtain.animate({
        opacity: 0.25
      }, 100);
      return zoomCurtain;
    };

    /**
     * Load image with the given url, returning a jquery promise
     * object which will resolve or fail when the image load completes.
     */
    ImageZoom.prototype.loadImage = function(url) {
      var self = this;
      var doLoad = function(deferred) {
        var img = new Image();
        img.src = url;

        function cleanup() {
          img.onload = null;
          img.onerror = null;
          img.onabort = null;
        }

        function doneLoading() {
          cleanup();
          deferred.resolve(img);
        }

        function errorLoading() {
          cleanup();
          deferred.reject(img);
        }

        img.onload = doneLoading;
        img.onerror = errorLoading;
        img.onabort = errorLoading;

      };
      return $.Deferred(doLoad).promise();
    };

    /**
     * Constraints a number to be no greater
     * than a given maximum and no less than
     * a given minimum.
     * If the number is greater than the max
     * the maximum will be returned. If it is
     * less than the minimum, the minimum will be
     * returned. If the number is in bettwen
     * the maximum and minimum it will be
     * returned unmodified.
     */
    ImageZoom.prototype.constrainValue = function(minimum, maximum, input) {
      return Math.max(minimum, Math.min(maximum, input));
    };


    /* Stop scheduling new redraw events */
    ImageZoom.prototype.cancelRedraw = function(imgZoom) {
      cancelAnimFrame(imgZoom.timeoutid);
    };

    /* Schedule a redraw event based upon configured fps */
    ImageZoom.prototype.scheduleRedraw = function(self) {
      /* clear any running anim frame requests so we don't schedule 2*/
      if (self.timeoutid) {
        self.cancelRedraw(self);
      }
      (function animloop() {
        self.timeoutid = requestAnimFrame(animloop);
        // easing with zeno's paradox
        self.xp += (self.currentMx - self.xp) / self.dampingFactor;
        self.yp += (self.currentMy - self.yp) / self.dampingFactor;
        self.magnifierPercentEased += (self.magnifierPercent - self.magnifierPercentEased) / self.dampingFactor;
        if (self.flyoutEnabled) {
          self.positionFlyout();
        }
        self.positionMagnifier();
      })();
    };

    /*
     * Changes the current image to be the one at the given image index.
     * The "smallImageUrls" and "fullImageUrls" properties must be set
     * to arrays containing the image urls which will be read from
     * at the given index to determine image locations.
     * An activity indicator will be displayed during the image loading
     * process.
     */
ImageZoom.prototype.presentImageAtIndex = function(index) {

      var self = this, spinnerTimeout;
      self.smallImageUrl = self.smallImageUrls()[index];
      self.fullImageUrl = self.fullImageUrls()[index];
      var imgMetadata = {alttext: self.smallImageUrl, title:self.smallImageUrl};
      imgMetadata = $.extend(imgMetadata, self.imageMetadataDefault, self.imageMetadatas[index]);
      
      self.imageLoadFailed = false;
      self.loading = true;
      self.jqSmallImage.fadeTo(200, 0.0, function() {

        // reset the image if selection is changed, so that the full image will be reloaded during hovering
        // (in the handleMouseEnter() method)
    	  self.jqFlyout.find('img').removeAttr("src");
        if (self.usingSpinner) {
          /* delay showing the spinner for 100ms in case the image is quick to load or loaded */
          spinnerTimeout = setTimeout(function() {
            self.spinner.create({
              'parent': self.element
            });
          }, self.spinnerDelay);
        }
        if(self.replaceImageAtIndex){
          self.jqSmallImage.attr('src', self.smallImageUrl);
          self.jqSmallImage.attr('alt', imgMetadata.altText);
          self.jqSmallImage.attr('title', imgMetadata.titleText);
        }
        self.jqFullImage.attr('title', imgMetadata.titleText);
        self.jqFullImage.attr('alt', imgMetadata.altText);
        $.when(self.loadImage(self.smallImageUrl))
          .done(function (smallImg) {
            self.jqSmallImage.fadeTo(200, 1.0);
          })
          .fail(function (smallImg) {
            self.imageLoadFailed = true;
            self.jqSmallImage.fadeTo(200, 1.0);
            self.jqSmallImage.attr('src', self.errorImageUrl);
          })
          .always(function () {
            if (self.usingSpinner) {
              /* cancel the spinner if the image displays quickly */
              self.loading = false;
              clearTimeout(spinnerTimeout);
              self.spinner.destroyAndClearTimeout();
            }
          });
      });
    };

    /*
     * Starts the image zoom script listening on the root element.
     * Requires setting the 'element' property first.
     */
    ImageZoom.prototype.start = function() {

      var self = this,
        borderRadius = '10px';

      // Keep track of when images have failed to load.
      self.imageLoadFailed = false;

      /* cache jquery objects */
      self.jqSmallImage = $(self.element).find('.' + self.smallImageClass);
      self.jqFullImage = $(self.element).find('.' + self.fullImageClass);
      self.jqFlyout = $(self.element).find('.' + self.flyoutClass);
      self.jqMagnifier = $(self.element).find('.' + self.magnifierClass);
      /* create if not there */
      if (!self.jqMagnifier.length) {
        self.jqMagnifier = $("<div></div>");
        self.jqMagnifier.addClass(self.magnifierClass);
        $(self.element).append(self.jqMagnifier);
      }
      if (!self.jqFlyout.length && self.flyoutEnabled) {
        self.jqFlyout = $("<div></div>");
        self.jqFlyout.css({
          'display': 'none'
        });
        self.jqFlyout.addClass(self.flyoutClass);
        var flyoutImage = $("<img></img>");
        flyoutImage.css({
          'max-width': 'none'
        });

        flyoutImage.addClass(self.fullImageClass);

        // If the image does not load, we want to shut up shop.
        flyoutImage.on('error', function() { self.imageLoadFailed = true; });
        self.jqFlyout.append(flyoutImage);
        self.jqFullImage = flyoutImage;
        $(self.element).append(self.jqFlyout);
      }

      /* subscribe to the index observable */
      if (self.index) {
        self.subHandle = self.index.subscribe(function(newValue) {
          self.presentImageAtIndex(newValue);
        });

        // When we our element gets deleted, make sure we dont leave the index subscriber hanging.
        $(self.element).on("remove", function () {
          if(self.subHandle) {
            self.subHandle.dispose();
          }
        });
      }

      if (!self.flyoutEnabled) {
        borderRadius = '100%';
      }
      if (self.element) {
        /* will trigger preload of images */
        /* problem for responsive though since we could load mobile and desktop */



        self.registerMouseWheel();

        $(self.element).css({
          'position': 'relative',
          'display': 'inline-block'
        });

        self.jqFullImage.css({
          'position': 'absolute'
        });
        self.jqSmallImage.css({
          'display': 'block',
          '-webkit-touch-callout': 'none'
        });
        var flyoutCSS = {
          'background': '#DDD',
          'border': '1px solid #FFF',
          'box-shadow': '0 0 15px rgba(0,0,0,0.5)',
          'display': 'none',
          'overflow': 'hidden',
          'position': 'absolute',
          'z-index': '99'
        };
        self.jqFlyout.css(flyoutCSS);
        var borderStr = self.magnifierBorderWidth + 'px solid rgb(125,125,125)';
        var magnifierCSS = {
          'position': 'absolute',
          'border-radius': borderRadius,
          'display': 'none',
          'z-index': '98',
          'overflow': 'hidden',
          'background-repeat': 'no-repeat',
          'border': borderStr
        };

        self.jqMagnifier.css(magnifierCSS);

        var eventSource = self.element;

        /* touch start event */
        $(eventSource).bind('touchstart', function(e) {
          e.preventDefault();
          if (self.magnifierEnabled) {
            self.offsetMagnifier = true;
          }
          self.handleMouseEnter();
          self.handleMouseMove(e); /* set location */          
        });
        /* touch end event */
        $(eventSource).bind('touchend', function(e) {
          self.handleMouseLeave();
          self.offsetMagnifier = false;
        });
        /* touch move event */
        $(eventSource).bind('touchmove', self.handleMouseMove);
        /* mouse move event */
        $(eventSource).mousemove(self.handleMouseMove);
        /* mouse enter */
        $(eventSource).mouseenter(function() {
          self.handleMouseEnter();  
        });
        /* clean up when mouse leaves */
        $(eventSource).mouseleave(function() {
          self.handleMouseLeave();
        });
      }
    };

    return ImageZoom;
  });

