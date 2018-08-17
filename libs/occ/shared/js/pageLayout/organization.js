/**
 * @fileoverview Defines a Organization view model used to
 * holds the additional company information required by the Delegated Admin.
 */

/*global $ */
/*global define */
define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'pageLayout/organization',

  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  [
    'knockout', 'ccConstants', 'ccRestClient', 'viewModels/dynamicPropertyMetaContainer'
  ],

  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (ko, CCConstants, ccRestClient, DynamicPropertyMetaContainer) {

    "use strict";

    /**
     * Creates a organization view model.
     * <p>
     * The Organization View Model holds the additional company information
     * required by the Delegated Admin
     *
     * @public
     * @class Represents an Organization.
     * @name Organization
     * @property {observable<string>} id organization Id
     * @property {observable<string>} isActive organization active
     * @property {observable<string>} relativeRoles roles available in the organization
     * @property {observable<string>} approvalRequired approvalRequired flag of the organization
     * @property {observable<string>} orderPriceLimit approval price limit of the organization
     * @property {observable<boolean>} delegateApprovalManagement flag whether delegated admin has provision to change order approval settings of an organization
     * @property {observable<boolean>} isApprovalWebhookEnabled flag check if use external approval webhook property is enabled or not.
     */
    //TODO: should we add another parameter organizationId to this constructor so that this viewModel 
    //can also call the getCurrentOrganization endpoint?
    //This would be needed when we have multiple instances of this viewModel in future scope.
    function Organization(organizationData, pAdapter) {
      var self = this;
      var ignoreProperties = self.listOfIgnoreProperties();
      ko.mapping.fromJS(organizationData, ignoreProperties, self);
      self.blockSize = 20;
      self.sortProperty = "email:asc";
      self.adapter = pAdapter;
      self.id = ko.observable('');
      self.active = ko.observable(false); //TODO: needs to be updated if changed from admin
      self.relativeRoles = ko.observable([]);
      self.approvalRequired = ko.observable(false); //TODO: needs to be updated when changed
      self.orderPriceLimit = ko.observable('');
      self.delegateApprovalManagement = ko.observable(false);
      self.numberOfActiveApprovers = ko.observable();
      self.isApprovalWebhookEnabled = ko.observable(false);

      //This property is cache to hold dynamic property meta information all the item-descriptor.
      self.dynamicPropertyMetaInfo = DynamicPropertyMetaContainer.getInstance();
      
      if(organizationData) {
        self.id(organizationData.id);
        self.active(organizationData.active);
        self.relativeRoles(organizationData.relativeRoles);
        self.approvalRequired(organizationData.approvalRequired);
        self.orderPriceLimit(organizationData.orderPriceLimit);
        self.delegateApprovalManagement(organizationData.delegateApprovalManagement);
        self.isApprovalWebhookEnabled(organizationData.useExternalApprovalWebhook);
        self.updatenumberOfActiveApprovers();
      }
      return self;
    };
    
  /**
   * Calls updateOrganization endpoint
   * for updating the require Approval flag and order purchase limit
   */
  Organization.prototype.updatenumberOfActiveApprovers = function() {
    var self = this;
    var approverRepositoryId;
    var url, inputData;
    inputData = {};
    inputData[CCConstants.OFFSET] = 0;
    inputData[CCConstants.LIMIT] = self.blockSize ;
    inputData[CCConstants.SORTS] = self.sortProperty;
    var rolesLength=self.relativeRoles().length
    for(var i = 0; i < rolesLength; i++) {
      if(self.relativeRoles()[i]["function"] === "approver"){
        approverRepositoryId = self.relativeRoles()[i]["repositoryId"];
      }
    }
    inputData["q"] = "roles.id eq \"" +approverRepositoryId +"\" AND active eq \"1\"";
    self.adapter.loadJSON(CCConstants.ENDPOINT_LIST_CONTACTS_BY_ORGANIZATION,null,inputData,
    // success callback
    function(data) {
     self.numberOfActiveApprovers(data.totalResults);
    },
    //TODO: Complete error callback function
    // error callback
    function(data) {});
  };
  
  /**
   * Populate organization view model
   * @private
   * @function
   * @name OrganizationViewModel#populateOrganizationViewModel
   * @param {Object[]} data List organization properties
   */
  Organization.prototype.populateOrganizationViewModel = function(organizationData) {
    var self = this;
    var ignoreProperties = self.listOfIgnoreProperties();
    ko.mapping.fromJS(organizationData, ignoreProperties, self);
    if(organizationData) {
      self.id(organizationData.id);
      self.active(organizationData.active);
      self.relativeRoles(organizationData.relativeRoles);
      self.approvalRequired(organizationData.approvalRequired);
      self.orderPriceLimit(organizationData.orderPriceLimit);
      self.delegateApprovalManagement(organizationData.delegateApprovalManagement);
      self.isApprovalWebhookEnabled(organizationData.useExternalApprovalWebhook);
      self.updatenumberOfActiveApprovers();
    }
  };

  /**
   * This method populates organization dynamic property meta data into
   * dynamic property meta container view model.
   *
   * @private
   * @function
   * @name OrganizationViewModel#populateDynamicPropertyMetaData
   */
  Organization.prototype.populateDynamicPropertiesMetaData = function() {
    var self = this;
    var organizationPramas = {};
    organizationPramas[CCConstants.PARENT] = CCConstants.ENDPOINT_ORGANIZATION_PARAM;
    if (self.dynamicPropertyMetaInfo && self.dynamicPropertyMetaInfo.dynamicPropertyMetaCache && 
        !self.dynamicPropertyMetaInfo.dynamicPropertyMetaCache.hasOwnProperty(CCConstants.ENDPOINT_ORGANIZATION_PARAM)) {

      ccRestClient.request(CCConstants.ENDPOINT_GET_ITEM_TYPE, organizationPramas,
        //success callback
        function(dynamicPropData){
          self.dynamicPropertyMetaInfo.intializeDynamicProperties(dynamicPropData.specifications, CCConstants.ENDPOINT_ORGANIZATION_PARAM);
        },
        //error callback
        function(dynamicPropData) {
        },
        CCConstants.ENDPOINT_ORGANIZATION_PARAM);
      }
  }

  /**
   * Returns list of organization properties that should be ignored during 
   * fromJS call.
   * @private
   * @function
   * @name OrganizationViewModel#listOfIgnoreProperties
   */
  Organization.prototype.listOfIgnoreProperties = function() {
    var ignoreProperties = {
      'ignore': ["id", "active", "relativeRoles", "approvalRequired", "orderPriceLimit",
                 "delegateApprovalManagement", "numberOfActiveApprovers", "isApprovalWebhookEnabled"]
    }
    return ignoreProperties;
  }

  return Organization;
  }
);

