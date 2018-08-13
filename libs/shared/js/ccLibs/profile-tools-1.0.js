//----------------------------------------
/**
 * Public Javascript API for Oracle Cloud Commerce
 */

 define(
  //-------------------------------------------------------------------
  // PACKAGE NAME
  //-------------------------------------------------------------------2
  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  'profiletools',['ccRestClient','knockout','pubsub'],

  //-------------------------------------------------------------------
  // MODULE DEFINTIION
  //-------------------------------------------------------------------
  function (ccRestClient,ko,pubsub) {

    "use strict";
  //----------------------------------------
  /**
   * constructor
   */
   function ProfileTools() {
    var self = this;
    var functionName;
    self.restApi = ccRestClient;
    // Subscribe to registrationAttempted, this is generally a form submit
    $.Topic(pubsub.topicNames.REGISTER_SUBMIT).subscribe(this.register);    
    return (this);
  }

  
  /**
   * Authenticates the user with the given username and password
   * @public
   * @name regionBuilder
   * @memberOf APIBuilder
   * @function
   * @param {RegionViewModel} RegionViewModel The RegionViewModel to extend
   * @param {LayoutContainer} LayoutContainer The layoutContainer.
   */

   ProfileTools.prototype.login = function(pUser, pPassword,pSuccess, pFailure) {
    var self = this;
    // Success callback
    self.restApi.login(pUser, pPassword, function() {
      pSuccess();
    },
    // Error callback
    function (errorData) {
      pFailure(errorData);
    });
  };

  //----------------------------------------
  // Logout the current user
  //----------------------------------------

  ProfileTools.prototype.logout = function () {

  };

  //----------------------------------------
  // Register a new user.
  //
  // The view model must supply
  // properties representing form data.
  // Required:
  // email
  // password
  //----------------------------------------

  ProfileTools.prototype.register = function (viewModel) {
    var email,password,confirmPassword;
    //var viewModel = data.viewModel;
    email = ko.utils.unwrapObservable(viewModel.email);
    password = ko.utils.unwrapObservable(viewModel.password);
    confirmPassword = ko.utils.unwrapObservable(viewModel.confirmPassword);

    if (!email || ! password) {
      $.Topic(pubsub.topicNames.REGISTER_FAILURE).publishWith(this,[{message:"You must include at least a username and password."}]);
    } else if ( password !== confirmPassword ) {
      $.Topic(pubsub.topicNames.REGISTER_FAILURE).publishWith(this,[{message:"Passwords do not match."}]);
    } else {
      $.Topic(pubsub.topicNames.REGISTER_SUCCESS).publishWith(this,[{message:"success"}]);
   }
 };

return ProfileTools;
});



