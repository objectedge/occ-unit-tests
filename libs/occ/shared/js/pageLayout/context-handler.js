/**
 * @fileoverview Defines the context handler responsible for handling and 
 * updating contextual data.
 */
/*global $ */
define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'pageLayout/context-handler',
  
  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['knockout'],
    
  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (ko) {
    
    "use strict";
    
    //-----------------------------------------------------------------
    // Class definition & member variables
    //-----------------------------------------------------------------
    
    /**
       Creates a context handler.
       @private
       @name ContextHandler
       @property {Map} values Map storing all current contextual values as a key/value pair
       @property {Object} eventAnchor
       @class The ContextHandler is responsible for maintaining the current state of the page including
       all current contextual data. Other parts of the system, including widgets, can make requests for current data
       as dictated by the context handler.
     */
    function ContextHandler() {
      this.values = {'global':{}, 'page':{}, 'user':{}}; //current values
      this.eventAnchor = $({}); //an anchor to attach event handling to
      return(this);
    }
    
    /**
       Exclusively set a property on the context handler. Will clear out all other contextual data and then set the
       current data for the given type & value pair. This method will fire any listen events necessary.
       @private
       @param {String} type The type of contextual data to set.
       @param {ViewModel} value The viewModel to set the type's value to
     */
    ContextHandler.prototype.exclusiveSet = function(type, value, scope) {
      var key, scopeValues;
      
      scope = scope || 'user';
      scopeValues = this.values[scope];
      
      if(!type) {
        return;
      }
      
      //trigger events for all keys other than the current one
      for(key in scopeValues) {
        if(scopeValues.hasOwnProperty(key) && key !== type && 
           this.values[key]) {
          this.eventAnchor.trigger(type, null);
          if(ko.isObservable(scopeValues[key])) {
            scopeValues[key](null);
          } else {
            scopeValues[key] = ko.observable(null);
            scopeValues[key].isData = true;
          }
        }
      }
      
      this.set(type, value, scope);
    };
    
    /**
       Set a property on the context handler. Will clear out all other contextual data and then set the
       current data for the given type/value pair. The listen events for the provided type will be fired.
       @private
       @param {String} type The type of contextual data to set.
       @param {ViewModel} value The viewModel to set the type's value to
     */
    ContextHandler.prototype.set = function(type, value, scope) {
      var rawValue, scopeValues;
      
      scope = scope || 'user';
      scopeValues = this.values[scope];
      
      if(!type || !scopeValues) {
        return;
      }
      
      rawValue = ko.utils.unwrapObservable(value);
      //Same value, no change. Treats null & undefined as the same.
      if(scopeValues[type] && 
          (rawValue === scopeValues[type]() || (!rawValue && !scopeValues[type]()))) {
        return;
      }
      
      //Set the values, creating a new observable if need be.
      if(scopeValues[type]) {
        scopeValues[type](rawValue);
      } else {
        scopeValues[type] = ko.observable(rawValue);
        scopeValues[type].isData = true;
      }
      
      this.eventAnchor.trigger(type, scopeValues[type]); //trigger and pass 
    };
    
    /**
       Gets a property from the context handler. The result will be an observable pointing
       to the specified property value and will either evaluate null or to the current value of
       the conextual data.
       @private
       @param {String} type The type of contextual data to get.
       @return {observable<Object>} An observable pointing to the current value
     */
    ContextHandler.prototype.get = function(type, scope) {
      var scopeValues;
      
      scope = scope || 'user';
      scopeValues = this.values[scope];
      
      if(!type || !scopeValues) {
        return null;
      }
      
      if(ko.isObservable(scopeValues[type])) {
        return scopeValues[type];
      }
      
      scopeValues[type] = ko.observable();
      scopeValues[type].isData = true;
      
      return scopeValues[type];
    };
    
    /**
       Registers an event handler to be fired when the contextual data for the provided type changes
       @private
       @param {String} type The type of contextual data to listen to.
       @param {function} handler An event handler function with params <event, observable>.
     */
    ContextHandler.prototype.listen = function(type, handler) {
      if(!type) {
        return;
      }
      
      this.eventAnchor.on(type, handler);
      handler(null, this.values[type]);
    };
    
    /**
       Removes the provided event handler from the provided contextual data type
       @private
       @param {String} type The type of contextual data where the event handler was registered.
       @param {function} handler The event handler function to remove.
     */
    ContextHandler.prototype.unlisten = function(type, handler) {
      if(!type) {
        return;
      }
      
      this.eventAnchor.off(type, handler);
    };
    
    /**
       Flushes all values from the contextHandler and optionally all event handlers. After calling flush
       all contextual data will be null.
       @private
       @param {boolean} events True if all events should be unregistered as well.
     */
    ContextHandler.prototype.flush = function(events) {
      var key;
      if(events) {
        //Clear out the events first
        this.eventAnchor = $({});
      }
      
      //If not purging events, trigger change events
      for(key in this.values.page) {
        if(this.values.page.hasOwnProperty(key)) {
          if(!events) {
            this.eventAnchor.trigger(key, null);
          }
          if(ko.isObservable(this.values[key])) {
            this.values.page[key](null);
          } else {
            this.values.page[key] = null;
          }
        }
      }
      
      //If not purging events, trigger change events
      for(key in this.values.user) {
        if(this.values.user.hasOwnProperty(key)) {
          if(!events) {
            this.eventAnchor.trigger(key, null);
          }
          if(ko.isObservable(this.values.user[key])) {
            this.values.user[key](null);
          } else {
            this.values.user[key] = null;
          }
        }
      }
    };
    
    return ContextHandler;
  }
);

