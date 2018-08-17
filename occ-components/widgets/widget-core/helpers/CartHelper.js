/**
 * Dependencies
 */
import $ from 'jquery';
import ko from 'knockout';
import Cart from 'pageLayout/cart';
import pubsub from 'pubsub';
import ccConstants from 'ccConstants';

/**
 * Constants
 */
const TOPIC_ON_ALL_ITEMS_ADDED = 'oe.on.all.items.added';

/**
 * Helper for cart common actions
 *
 * @class
 *
 * @property {Object} widget The widget context
 * @property {Object} cart   OCC Cart instance
 */
export class CartHelper {
  constructor (widget) {
    this.widget = widget;
    this.cart = Cart.getInstance();
  }

  /**
   * Adds an item to cart
   *
   * @param {Object} item The item to add to cart
   */
  addItemToCart (item) {
    $.Topic(pubsub.topicNames.CART_ADD).publishWith(item);
  }

  /**
   * Add multiple items to cart
   *
   * @param {Array} items A list of items
   *
   * @return {Promise} A promise to wait for adding
   */
  addMultipleItemsToCart (items) {
    // If items is not an array, reject the promise
    if (!$.isArray(items)) {
      return Promise.reject({error: 'An array of items must be provided!'});
    } else {
      // Create a temporary items array in the helper
      this.addingQueue = items;

      // Store the current pricing success callback
      const currentSuccessCb = this.getCartCallbackByAction(ccConstants.PRICING_SUCCESS_CB);

      // Replace the pricing success callback to handle the multiple add to cart
      this.setPricingSuccessCallback(this.onPricingSuccess.bind(this));

      return new Promise((resolve) => {
        // Handle action end
        const onItemsAdded = () => {
          // In case of empty list:
          // - remove the topic subscribe
          $.Topic(TOPIC_ON_ALL_ITEMS_ADDED).unsubscribe(onItemsAdded);
          // - return the previous pricing success callback
          this.setPricingSuccessCallback(currentSuccessCb);
          // - resolve the promise
          resolve({success: true});
        };

        // Unsubscribe and subscribe again to avoid stacking
        $.Topic(TOPIC_ON_ALL_ITEMS_ADDED).unsubscribe(onItemsAdded);
        $.Topic(TOPIC_ON_ALL_ITEMS_ADDED).subscribe(onItemsAdded);

        // If we have a list of items in queue,
        // send the first to cart to start the loop
        if (this.addingQueue.length) {
          this.addItemToCart(this.addingQueue[0]);
        } else {
          // Call the action end handler manually
          onItemsAdded();
        }
      });
    }
  }

  /**
   * Empty the cart
   */
  clearCart () {
    this.cart.emptyCart();
    this.cart.markDirty();
  }

  /**
   * Get a cart callback given an action
   *
   * @param {String} action The action performed by the callback
   *
   * @return {Function|Undefined} The callback
   */
  getCartCallbackByAction (action) {
    const allCallbacks = this.cart.callbacks;
    let callback;

    if (allCallbacks.hasOwnProperty(action)) {
      callback = allCallbacks[action];
    }

    return callback;
  }

  /**
   * Get a dynamic property given an ID
   *
   * @param {String} id The dynamic property ID to look for
   *
   * @return {Object|Undefined} The dynamic property or nothing
   */
  getDynamicPropertyById (id = '') {
    let property;

    if (this.cart && ko.isObservable(this.cart.dynamicProperties)) {
      const properties = this.cart.dynamicProperties();

      // Using 'some' due to IE11 compatibility issues
      properties.some(prop => {
        if (prop.id() === id) {
          property = prop;
          return true;
        }
      });
    }

    return property;
  }

  /**
   * Handle pricing success for multiple add to cart
   */
  onPricingSuccess () {
    // Apply this defensive check to avoid page break
    if ($.isArray(this.addingQueue)) {
      // Remove the recently added product
      this.addingQueue.shift();

      // If there is remaining items in list, add the first to cart
      if (this.addingQueue.length) {
        this.addItemToCart(this.addingQueue[0]);
      } else {
        // Otherwise, notify the action end
        $.Topic(TOPIC_ON_ALL_ITEMS_ADDED).publish();
      }
    }
  }

  /**
   * Save current cart state to cookies
   */
  saveCart () {
    this.cart.saveCartCookie();
  }

  /**
   * Save current cart state to cookies and price the cart
   */
  saveCartAndPersist () {
    this.saveCart();
    this.cart.priceCartIfNeccessary(true);
  }

  /**
   * Set a callback to cart given the action
   *
   * @param {String}   action   The callback action
   * @param {Function} callback The callback
   */
  setCartCallback (action, callback) {
    if (action && typeof (callback) === 'function') {
      const allCallbacks = this.cart.callbacks;

      allCallbacks[action] = callback;

      this.cart.setCallbackFunctions(allCallbacks);
    }
  }

  /**
   * Set a dynamic property value
   *
   * @param {Object} property The dynamic property
   * @param {Any}    value    The new value
   */
  setDynamicProperty (property, value) {
    if (property && ko.isObservable(property.value)) {
      property.value(value);
    }
  }

  /**
   * Set a dynamic property value given an id
   *
   * @param {String} id    The dynamic property id
   * @param {Any}    value The new value
   */
  setDynamicPropertyById (id, value) {
    const property = this.getDynamicPropertyById(id);

    if (property) {
      this.setDynamicProperty(property, value);
    }
  }

  /**
   * Set prepricing callback to cart
   *
   * @param {Function} callback The callback to handle prepricing action
   */
  setPrepricingCallback (callback) {
    this.setCartCallback(ccConstants.PREPRICING, callback);
  }

  /**
   * Set failure pricing callback to cart
   *
   * @param {Function} callback The callback to handle failure pricing action
   */
  setPricingFailureCallback (callback) {
    this.setCartCallback(ccConstants.PRICING_FAILURE_CB, callback);
  }

  /**
   * Set success pricing callback to cart
   *
   * @param {Function} callback The callback to handle success pricing action
   */
  setPricingSuccessCallback (callback) {
    this.setCartCallback(ccConstants.PRICING_SUCCESS_CB, callback);
  }
}
