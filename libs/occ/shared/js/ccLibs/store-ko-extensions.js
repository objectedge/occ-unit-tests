/**
 * @fileoverview Includes knockout extensions that contain logic specific
 * to store-front functionality. Any extensions that require knowledge
 * about store-front functionality should go here. Other extensions
 * live under cc-ko-extensions.js & ko-extensions.js
 * 
 */

/*global $ */
define('storeKoExtensions',
       ['knockout', 'jqueryui', 'notifier','ccLogger', 'koValidate'], 
       function (ko, jQueryUI, notifier, log, koValidate) {
  
  'use strict';
  
  /** @namespace ko.extenders */
  
  /**
   * The notify extender builds upon the functionality of the Knockout
   * Validation library and sends/clears error messages to the header
   * message panel depending on the validation state of the observable.
   * It also enables the error messages to be removed regardless of the 
   * validation state of the observable.
   * 
   * @requires notifier lib to send / clear errors
   * @param {observable} observable The target observable
   * @param {(Object|string)} params May be either a single String representing the ID to use
   *   for the notifier or it can contain both an id and a message value, where
   *   the message is what should actually be displayed in the header message
   *   panel. In either case, the ID value should be specific to the object
   *   or widget so that it is unique within the message system.
   * @example 
   * myObservable = ko.observable().extend({ notify: myID });
   * myObservable = ko.observable().extend({ notify: {id: myID, message: myErrorMessage} });
   * 
   * @public
   * @function
   * @memberof ko.extenders
   */
  ko.extenders.notify = function (observable, params) {

    // This extender relies on functionality from the knockout validation
    // library, so check the observable has been extended by it already
    if(observable.isValid && ko.isObservable(observable.isValid)
      && observable.isModified && ko.isObservable(observable.isModified)) {
      
      var id = '';
      var message = "An error has occurred.";
        
      if(params) {
        if(params.id) {
          id = params.id;
          
          if(params.message) {
            message = params.message;
          }
          
        } else if(params.toString() !== '') {
          id = params.toString();
        }
        
      }
      
      if(id === '') {
        log.error('Notify ID not set');
        throw new Error('Notify ID not set.');
      }

      observable.notify = function(newValue) {    
          if(observable.isValid() 
              || !observable.isModified()) {
            // value is valid or unmodified
            // clear any previous errors for it
            notifier.clearError(id); 
          } else {
            // value not valid
            // send error to message panel
            notifier.sendError(id,message);
          }
      };
      
      observable.clearError = function() {
        notifier.clearError(id);
      };
      
      // listen for both changes to the observable's
      // isValid property & its isModified property 
      // (which indicates the observable can be validated)
      observable.isModified.subscribe(observable.notify);
      observable.isValid.subscribe(observable.notify);
    
    }

    return observable;
  };
  
  /**
   * @public
   * @class The productVariantImageSource binding provides scaled images to be displayed.
   * <p>
   * It also provides the ability to specify an alternate image and image text
   * to be loaded in the event that the desired image cannot be found.
   * <p>
   * One may specify a product object as the src and an optional imageType attribute.
   * The imageType attribute should be one of 'large', 'medium', 'small' or 'thumb' (no quotes). In this case
   * this binding will attempt to find an image on the product, if one cannot be found it will fall back to the errorSrc image.
   * <p>
   * If imageType is not specified, the default style is 'medium'.
   * <p>
   * If the image is not found
   * <h2>Parameters:</h2>
   * <ul>
   *   <li><code>{Observable Object} src</code> - The image source object.
   *   This should contain an object of the form:
   *   <pre>
   *   {
   *     'primaryFullImageURL': '..',
   *     'primaryLargeImageURL': '..',
   *     'primaryMediumImageURL': '..',
   *     'primarySmallImageURL': '..',
   *     'primaryThumbImageURL': '..'
   *   }
   *   </pre>
   *   </li>
   *   <li><code>{Observable String} [imageType='medium']</code> - The image type. One of 'full', 'large', 'medium', 'small', 'thumb'</li>
   *   <li><code>{Observable String} [errorSrc]</code> - The error image URL.</li>
   *   <li><code>{Observable String} [alt]</code> - The image 'alt' text.</li>
   *   <li><code>{Observable String} [errorAlt]</code> - The error image 'alt' text.</li>
   *   <li><code>{Observable function(Object)} [onerror]</code> - The error callback function. Called with the current element.</li>
   * </ul>
   * @example
   * &lt;img data-bind="productVariantImageSource: {src:myProduct, , alt:'The desired image', errorSrc:'images/noImage.png', errorAlt:'No Image Found'}">&lt;/img>
   * &lt;img data-bind="productVariantImageSource: {src:myProduct, imageType: 'large', alt:'The desired image', errorSrc:'images/noImage.png', errorAlt:'No Image Found'}">&lt;/img>
*/
ko.bindingHandlers.productVariantImageSource = {

  /**
   * Get the 'no-image' site settings, if set.
   * <p>
   * Looks up the parent hierarchy for the SiteViewModel, located at the 'site' property of WidgetViewModel, and
   * uses the noImageSrc property from the site.
   * @param bindingContext The binding context.
   * @returns {*}
   */
  getNoImageSiteSetting: function(bindingContext) {
    var errorSrc = null;

    for (var i=0; i<bindingContext.$parents.length; i++) {
      // Look for the 'site' observable in the widget view model
      if (ko.isObservable(bindingContext.$parents[i].site)) {
        errorSrc = ko.unwrap(bindingContext.$parents[i].site().noImageSrc);
        break;
      }
    }

    return errorSrc;
  },

 /**
    The logic runs once to initialize the binding for this element. Preloads the fallback image if it's already set.
    @private
    @param {Object} element The DOM element attached to this binding.
    @param {function(): object} valueAccessor A function that returns all of the values associated with this binding.
    @param {function(): object} allBindingsAccessor Object containing information about other bindings on the same HTML element.
    @param {Object} viewModel The viewModel that is the current context for this binding.
    @param {Object} bindingContext The binding hierarchy for the current context.
  */
 init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
   var src, defaultErrSrc, siteNoImageSrc, errSrc, tmp, values = ko.utils.unwrapObservable(valueAccessor());

   //If not working with values as an object or an image element don't do anything
   if(typeof values !== 'object' || element.nodeName !== 'IMG') {
     return;
   }

   src = ko.utils.unwrapObservable(values.src);

   // Error source - use the one defined in site settings first, and then fall back to the one specified
   // in the errorSrc attribute.
   defaultErrSrc = ko.utils.unwrapObservable(values.errorSrc);
   siteNoImageSrc = ko.bindingHandlers.productVariantImageSource.getNoImageSiteSetting(bindingContext);
   errSrc = siteNoImageSrc && siteNoImageSrc.length > 0 ? siteNoImageSrc : defaultErrSrc;

   //If both src and errorSrc are defined pre-cache the error image
   //This works under the assumption that error image src generally won't change
   //if it does there would just be a bit of extra delay before displaying the error image
   if(src && errSrc) {
     tmp = new Image();
     tmp.src = errSrc;
   }
 },

 /**
    update is run whenever an observable in the binding's properties changes. Attempts to load the desired image from
    the provided source. If the image fails to load the fallback image & text is instead used.
    @private
    @param {Object} element The DOM element attached to this binding.
    @param {function(): object} valueAccessor A function that returns all of the values associated with this binding.
    @param {function(): object} allBindingsAccessor Object containing information about other bindings on the same HTML element.
    @param {Object} viewModel The viewModel that is the current context for this binding.
    @param {Object} bindingContext The binding hierarchy for the current context.
  */
 update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
   var imageType, tmpImg, src, imageSrc, defaultErrSrc, siteNoImageSrc, errSrc, alt, title, errAlt, onerror,
       values = ko.utils.unwrapObservable(valueAccessor());

   //If not working with values as an object or an image element don't do anything
   if(typeof values !== 'object' || element.nodeName !== 'IMG') {
     return;
   }

   //Unwrap input values
   imageSrc = ko.utils.unwrapObservable(values.src);
   imageType = ko.utils.unwrapObservable(values.imageType);
   if (!imageType) {
     imageType = 'medium'; // default to medium images if not specified
   }
   

   if(imageSrc) {
	   switch(imageType) {
       case 'full':
         src = ko.utils.unwrapObservable((imageSrc.childSKUs && imageSrc.childSKUs.length > 0 && imageSrc.childSKUs[0].primaryFullImageURL)?
        		 imageSrc.childSKUs[0].primaryFullImageURL : imageSrc.primaryFullImageURL);
         break;
       case 'large':
         src = ko.utils.unwrapObservable((imageSrc.childSKUs && imageSrc.childSKUs.length  >0 && imageSrc.childSKUs[0].primaryLargeImageURL)?
        		 imageSrc.childSKUs[0].primaryLargeImageURL : imageSrc.primaryLargeImageURL);
         break;
       case 'medium':
         src = ko.utils.unwrapObservable((imageSrc.childSKUs && imageSrc.childSKUs.length > 0 && imageSrc.childSKUs[0].primaryMediumImageURL)?
        		 imageSrc.childSKUs[0].primaryMediumImageURL : imageSrc.primaryMediumImageURL);
         break;
       case 'small':
         src = ko.utils.unwrapObservable((imageSrc.childSKUs && imageSrc.childSKUs.length > 0 && imageSrc.childSKUs[0].primarySmallImageURL)?
        		 imageSrc.childSKUs[0].primarySmallImageURL : imageSrc.primarySmallImageURL);
         break;
       case 'thumb':
         src = ko.utils.unwrapObservable((imageSrc.childSKUs && imageSrc.childSKUs.length > 0 && imageSrc.childSKUs[0].primaryThumbImageURL)?
        		 imageSrc.childSKUs[0].primaryThumbImageURL: imageSrc.primaryThumbImageURL);
         break;
       default:
         src = ko.utils.unwrapObservable((imageSrc.childSKUs && imageSrc.childSKUs.length > 0 && imageSrc.childSKUs[0].primaryMediumImageURL)?
        		 imageSrc.childSKUs[0].primaryMediumImageURL: imageSrc.primaryMediumImageURL);
       	break;
     }
   } else {
     src = values.errorSrc;
   }

   alt = ko.utils.unwrapObservable(imageSrc.primaryImageAltText);
   title = ko.utils.unwrapObservable(imageSrc.primaryImageTitle);
   
   // Error source - use the one defined in site settings first, and then fall back to the one specified
   // in the errorSrc attribute.
   defaultErrSrc = ko.utils.unwrapObservable(values.errorSrc);
   siteNoImageSrc = ko.bindingHandlers.productImageSource.getNoImageSiteSetting(bindingContext);
   errSrc = siteNoImageSrc && siteNoImageSrc.length > 0 ? siteNoImageSrc : defaultErrSrc;
   
   // If the product image URL matches the default error source, use errSrc instead, to allow for a site specific
   // no-image image
   if (src === defaultErrSrc || src === '/img/no-image.jpg') {
     src = errSrc;
   }

   // Load the no-image image for the site
   if (siteNoImageSrc && siteNoImageSrc.length > 0) {
     var siteNoImageImage = new Image();

     // On error, set errSrc to the default error image
     siteNoImageImage.onerror = function() {
       errSrc = defaultErrSrc;
     }

     siteNoImageImage.src = siteNoImageSrc;
   }

   if(!alt) {
   alt = ko.utils.unwrapObservable(values.alt);
   }
   if(!title) {
     title = ko.utils.unwrapObservable(values.title);
   }
   errAlt = ko.utils.unwrapObservable(values.errorAlt);
   onerror = ko.utils.unwrapObservable(values.onerror);

   //if we have no fallback image, then just load away
   if(!errSrc) {
     element.src = src;
     if(alt) {
       element.alt = alt;
     }
     return;
   }
   if(src) {
     //Pre-cache image on a hidden element to prevent
     //the 'x' from being displayed
     tmpImg = new Image();

     //If the tmp image successfully loads then have the element display
     //the image.
     tmpImg.onload = function() {
       element.src = src;
       if(alt) {
         element.alt = alt;
       }
       if(title) {
         element.title = title;
       }
     };

     //If the tmpImage fails to load successfully then display the fallback image
     tmpImg.onerror = function() {
       // If the image fails to load, displays the error image
       element.src = errSrc;

       if(errAlt) {
         element.alt = errAlt;
       }

       //run the binding's onerror event.
       if(onerror) {
         onerror(element);
       }
     };

     tmpImg.src = src;
   } else {
     //If we have no main image at all then just load the fallback image
     element.src = errSrc;
     if(errAlt) {
       element.alt = errAlt;
     } else if(alt) {
       element.alt = alt;
     }

     //run the binding's onerror event.
     if(onerror) {
       onerror(element);
     }
   }
 }
};

  
});

