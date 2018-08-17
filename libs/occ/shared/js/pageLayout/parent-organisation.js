/**
 * @fileoverview Defines a ParentOrganisation view model used to
 * hold company information.
 */

/*global $ */
/*global define */
define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------
  'pageLayout/parent-organisation',

  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  [
    'knockout'
  ],

  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (ko) {

    "use strict";

    /**
     * Creates a parent organisation view model.
     * <p>
     * The Parent Organisation View Model hold company information
     * i.e name, description and path (url) to a logo.
     *
     * @public
     * @class Represents a parent organisation.
     * @name ParentOrganisation
     * @property {observable<string>} name Company name
     * @property {observable<string>} description Company description
     * @property {observable<string>} organizationLogoURL Company image src
     * @property {observable<string>} organizationLogoAltText Company logo image alt text
     * @property {observable<string>} organizationLogoTitle Company logo image title
     */
    function ParentOrganisation() {
      this.id = ko.observable('');
      this.name = ko.observable('');
      this.description = ko.observable('');
      this.organizationLogoURL = ko.observable('');
      this.organizationLogoAltText = ko.observable('');
      this.organizationLogoTitle = ko.observable('');
      this.delegateApprovalManagement = ko.observable('');
    }

    return ParentOrganisation;
  }
);

