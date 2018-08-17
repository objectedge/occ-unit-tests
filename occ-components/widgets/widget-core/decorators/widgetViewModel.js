export function exportToViewModel(target, key, descriptor) {
  if(typeof target.$data === 'undefined') {
    target.$data = {};
  }

  if(typeof target.$dataMethods === 'undefined') {
    target.$dataMethods = {};
  }

  if(typeof target.$dataProperties === 'undefined') {
    target.$dataProperties = {};
  }

  /**
   * Set method context and call it
   */
  if(typeof target[key] === 'function') {
    target.$dataMethods[key] = target[key];
    return descriptor;
  }

  /**
   * It's a property, then set its getter and setter
   */
  let {initializer} = descriptor;
  delete descriptor.initializer;
  delete descriptor.writable;

  /**
   * Object where all values of the same view model will be placed.
   *
   * It's an object, because if there is more than one instance of the same widget, it has
   * to delivery the right value for the right instance
   * 
   * @type {Object}
   */
  const propertyValue = {};

  /**
   * Gets the current instance id of the widget. If there is no $data yet, then, it's the first
   * "value" in this view model, then, it's id will be called 'root'
   * 
   * @return {String} widget instance id
   */
  const getCurrentInstanceId = () => {
    let currentInstanceID = target.$data.id ? target.$data.id() : 'root';

    if(currentInstanceID !== 'root' && !propertyValue[currentInstanceID]) {
      return 'root';
    }

    return currentInstanceID;
  };

  /**
   * Updates the propertyValue object using the current widget widget
   * @param  {Any} value any value
   * @return {Any} returns the current value
   */
  const setCurrentPropertyValue = (value) => {
    let currentInstanceID = getCurrentInstanceId();
    propertyValue[currentInstanceID] = value;
    return propertyValue[currentInstanceID];
  };

  /**
   * Initializes the current property value
   */
  setCurrentPropertyValue(initializer.call(descriptor));

  /**
   * Setter of the property
   * @param {Any} value any value
   */
  descriptor.set = function(value) {
    setCurrentPropertyValue(value);
  };

  /**
   * Getter of the property
   * @return {Any} returns the current value
   */
  descriptor.get = function() {
    let val = propertyValue[getCurrentInstanceId()];
    
    //If there are more than one instance of the same widget, reset the property
    if(this.$dataProperties.__widgetInstanceId && this.$data.id() !== this.$dataProperties.__widgetInstanceId) {
      val = setCurrentPropertyValue(initializer.call(descriptor));
    }

    target.$data[key] = val;
    return val;
  };

  /**
   * Attaches the new property to the widget $data.
   */
  target.$dataProperties[key] = target[key];
  
  return descriptor;
};
