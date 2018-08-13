/**
 * @fileoverview Defines a SpaceViewModel used for SWM Spaces Wishlist to differentiate share/private space 
 */
/*global $ */
/*global define */
define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'pageLayout/space',
  
  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['jquery', 'knockout', 'pubsub', 'notifier', 'ccLogger', 'CCi18n', 'swmRestClient', 'swmKoValidateRules'],
    
  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function ($, ko, PubSub, notifier, logger, CCi18n, swmRestClient, swmKoValidateRules) {
  
    "use strict";
    
    /**
     * SpaceViewModel. Used for Storefront Spaces Wishlist.
     * Used as a singleton - accessed through the getInstance method.
     * 
     * @private
     * @class SpaceViewModel
     * @param {Object} pAdapter - The REST adapter.
     * @param {Object} pUserData - The custom user data.
     * 
     * @property {observable(string)} id The ID of the space.
     * @property {observable(string)} name The name of the space.
     * @property {observable(string)} ownerId The ID of the owner of this space.
     * @property {observable(string)} ownerFirstName The owner's first name.
     * @property {observable(string)} ownerLastName The owner's last name.
     * @property {observable(string)} ownerMediaId The owner's media ID.
     * @property {observable(string)} ownerMediaUrl The owner's media URL.
     * @property {observable(string)} accessLevel Access level.
     * @property {observable(string)} siteName Site name.
     * @property {observable(string)} fbAppId Facebook App ID.
     * @property {observableArray} members The members of the space.
     * @property {observable(string)} ownerFullName The owner's full name.
     * @property {observable(string)} contextId The context ID.
     * @property {observable(boolean)} showSpace=false Show the space?
     * @property {observable(string)} spaceProductMediaUrl Media URL for the first product in the space.
     * 
     */
    function SpaceViewModel(pAdapter, pUserData) {
      
      if (SpaceViewModel.singleInstance) {
        throw new Error("Cannot instantiate more than one SpaceViewModel, use getInstance(pAdapter, pUserData, pParams)");  
      }
      
      // Keep reference of current context.
      var self = this;
      
      // Values from calling context
      self.adapter = pAdapter;
      
      /**
       * Define SpaceViewModel fields, modification of these fields should be done through SpaceViewModel.updateSpace() 
       */
      self.id = ko.observable('');
      self.name = ko.observable('');
      self.ownerId = ko.observable('');
      self.ownerFirstName = ko.observable('');
      self.ownerLastName = ko.observable('');
      self.ownerMediaId = ko.observable('');
      self.ownerMediaUrl = ko.observable('');
      self.accessLevel = ko.observable('');
      self.siteName = ko.observable('');
      self.fbAppId = ko.observable('');
      self.inviteAcceptInProgress = ko.observable(false);
      
      /**
       * Members array, modification to members of a space should be done through SpaceViewModel.updateMembers()
       */
      self.members = ko.observableArray([]);
      
      // Computed observables with self fields, these field do NOT need to be modified explicitly, they are computed from other fields
      self.ownerFullName = ko.computed(function(){
        return self.ownerFirstName() + " " + self.ownerLastName();
      }, self);
      
      // populated by space-header, if url is /spaces/{spaceid}
      self.contextId = ko.observable('');
      // Flag to determine whether or not to show space
      self.showSpace = ko.observable(false);
      // populated by space-content
      self.spaceProductMediaUrl = ko.observable('');
            
      return self;
    };
    
    /*
     * Get information from passed in context     
    SpaceViewModel.prototype.setContext = function(pContext) {
      var self = this;
      
      if (pContext.global.user.firstName) {
        self.id(pContext.global.user.id);
      }
    };
    */
    
    /**
     * Boolean Methods - widgets are mostly interested in these questions
     */
    
    /**
     * Determine if user is the owner of the space.
     * @function SpaceViewModel#isSpaceOwner
     * @param {string} apiUserId The API user ID.
     * @returns {boolean} true if the API user ID matches the owner ID of the space.
     */
    SpaceViewModel.prototype.isSpaceOwner = function(apiUserId) {
      var self = this;
      return self.ownerId() === apiUserId;
    };
    
    /**
     * Determine if user is a member of the space.
     * @function SpaceViewModel#isMember
     * @param {string} apiUserId The API user ID.
     * @returns {boolean} true if the API user ID matches the user ID of one of the members in the space.
     */
    SpaceViewModel.prototype.isMember = function(apiUserId) {
      var self = this;
      var result = false;
      $.each( self.members(), function( index, member ) {
        if (member.userId == apiUserId){
          //is member, so show widget
          result = true;
          return false;
        }
      });
      return result;
    };
    
    /**
     * Determine if space is a Private Wishlist
     * @function SpaceViewModel#isPrivate
     * @returns {boolean} true if the wishlist accessLevel = 0.
     */
    SpaceViewModel.prototype.isPrivate = function() {
      var self = this;
      var result = false;
      if (self.accessLevel() === '0') {
        result = true;
      }
      return result;
    };
    
    /**
     * Determine if space is a Group Wishlist
     * @function SpaceViewModel#isGroup
     * @returns {boolean} true if the wishlist accessLevel = 2.
     */
    SpaceViewModel.prototype.isGroup = function() {
      var self = this;
      var result = false;
      if (self.accessLevel() === '2') {
        result = true;
      }
      return result;
    };
    
    /**
     * Determine if space is a Shared Wishlist
     * @function SpaceViewModel#isShared
     * @returns {boolean} true if the wishlist accessLevel = 1.
     */
    SpaceViewModel.prototype.isShared = function() {
      var self = this;
      var result = false;
      if (self.accessLevel() === '1') {
        result = true;
      }
      return result;
    };
    
    /**
     * Determine if space is a Private OR Group Wishlist
     * @function SpaceViewModel#isPrivateOrGroup
     * @returns {boolean} true if the wishlist accessLevel = 0 OR 2.
     */
    SpaceViewModel.prototype.isPrivateOrGroup = function() {
      var self = this;
      var result = false;
      if (self.isPrivate() || self.isGroup()) {
        result = true;
      }
      return result;
    };
    
    /**
     * Update Methods - updates to the SpaceViewModel
     */
    
    /**
     * Updates the Space information.
     * @function SpaceViewModel#updateSpace
     * @param {SpaceViewModel} obj The object containing the updated values.
     */
    SpaceViewModel.prototype.updateSpace = function(obj) {
      var self = this;
      
      if (obj.id) {
        self.id(obj.id);  
      }
      if (obj.name) {
        self.name(obj.name);  
      }
      if (obj.ownerId) {
        self.ownerId(obj.ownerId);  
      }
      if (obj.ownerFirstName) {
        self.ownerFirstName(obj.ownerFirstName);  
      }
      if (obj.ownerLastName) {
        self.ownerLastName(obj.ownerLastName);  
      }
      if (obj.ownerMediaId) {
        self.ownerMediaId(obj.ownerMediaId);  
      }
      if (obj.ownerMediaUrl) {
        self.ownerMediaUrl(obj.ownerMediaUrl);  
      }
      if (obj.accessLevel) {
        self.accessLevel(obj.accessLevel);  
      }
      if (obj.siteName) {
        self.siteName(obj.siteName);
      }
      if (obj.fbAppId) {
        self.fbAppId(obj.fbAppId);
      }
      if (obj.spaceProductMediaUrl) {
        self.spaceProductMediaUrl(obj.spaceProductMediaUrl);
      }
    };    
    
    /**
     * Update Members collection in the space.
     * All existing members will be removed, and will be replaced by the list passed in.
     * Publishes the SOCIAL_SPACE_MODEL_MEMBERS_CHANGED event after the members have
     * been updated.
     * @function SpaceViewModel#updateMembers
     * @param {Object[]} membersArray The list of members to be updated.
     */
    SpaceViewModel.prototype.updateMembers = function(membersArray) {
      var self = this;
      self.members.removeAll();
      self.members(membersArray);
      $.Topic(PubSub.topicNames.SOCIAL_SPACE_MODEL_MEMBERS_CHANGED).publish();
    };
    
    /**
     * Returns a single global instance of SpaceViewModel.
     * @function SpaceViewModel.getInstance
     * @param {Object} pAdapter The REST adapter.
     * @param {Object} pUserData Custom user data.
     * @param {Object} pParams some additional params (server data).
     * @returns {SpaceViewModel} The SpaceViewModel instance.
     */
    SpaceViewModel.getInstance = function(pAdapter, pUserData, pParams) {
      if (!SpaceViewModel.singleInstance) {
        SpaceViewModel.singleInstance = new SpaceViewModel(pAdapter, pUserData);
        //TODO: We may need to pass in a context in the future.
        //SpaceViewModel.singleInstance.setContext(pParams);
      }
      
      return SpaceViewModel.singleInstance;
    };
    
    return SpaceViewModel;
  }
  
);

