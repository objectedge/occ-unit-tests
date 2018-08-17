define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'viewModels/dynamicPropertyMetaContainer',
  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['knockout', 'viewModels/dynamicProperty'],
  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (ko, DynamicProperty) {
    'use strict';

    /**
     * Creates dynamic property meta data container view model.
     * The Dynamic Property Meta Container View Model is a singleton class.
     * 
     * This view model contains dynamicPropertyMetaCache object which is map of item-descriptor versus
     * list of DynamicProperty view model object. DynamicProperty view model holds the meta data information
     * of a dynamic property. Dynamic Property view model should contain only meta data information not 
     * value. To access the dynamic properties meta information for a item descriptor following code reference
     * can be used. e.g. 
     * 
     * var dynamicPropertyMetaDataInfo = DynamicPropertyMetaContainer.getInstance();
     * if (dynamicPropertyMetaDataInfo && dynamicPropertyMetaDataInfo.dynamicPropertyMetaCache &&
     *     dynamicPropertyMetaDataInfo.dynamicPropertyMetaCache.hasOwnProperty(ItemDescriptorName)) {
     *     
     *     var listOfDynamicPropertiesMetaData = dynamicPropertyMetaDataInfo.dynamicPropertyMetaCache[ItemDescriptorName];
     * }
     * 
     * @public
     * @class Represents a Dynamic Property meta info holder.
     * @name DynamicPropertyMetaContainer
     * @property dynamicPropertyMetaCache First part of name
     */
    function DynamicPropertyMetaContainer() {
      if (DynamicPropertyMetaContainer.singleInstance) {
        throw new Error("Cannot instantiate more than one DynamicPropertyMetaContainer view model, use getInstance()");  
      }
      var self = this;
      self.dynamicPropertyMetaCache = {};
    };
    
    /**
     * Creates dynamic property and initialize with meta-data
     * 
     * @private
     * @function
     * @name intializeDynamicProperties
     * @param {Object[]} data list of dynamic properties meta-data
     */
    DynamicPropertyMetaContainer.prototype.intializeDynamicProperties = function(data, pItemDescriptor) {
      var self = this;
      var dynamicProperties = [];
      for (var i = 0; i < data.length; i++) {
        var dynPropItem = new DynamicProperty();
        dynPropItem.initializeMetadata(data[i], true);
        dynamicProperties.push(dynPropItem);
      }
      self.dynamicPropertyMetaCache[pItemDescriptor] = dynamicProperties;
    };
    
    /**
     * Return the singleton global instance of DynamicPropertyMetaContainer view model.
     * Creates it if it doesn't already exist.
     * 
     * @function
     * @name DynamicPropertyMetaContainer.getInstance
     * @returns {DynamicPropertyMetaContainer} The dynamic property meta data view model.
     */
    DynamicPropertyMetaContainer.getInstance = function() {
      if (!DynamicPropertyMetaContainer.singleInstance) {
        DynamicPropertyMetaContainer.singleInstance = new DynamicPropertyMetaContainer();
      }
      
      return DynamicPropertyMetaContainer.singleInstance;
    };
    
    return DynamicPropertyMetaContainer;
});
