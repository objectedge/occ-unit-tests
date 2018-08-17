define('ccRestClient',['ccRestClientConstructor','ccConstants', 'pubsub', 'ccStoreConfiguration'], function(CCRestClient, CCConstants, pubsub, CCStoreConfiguration) {

  "use strict";

  // this callback will be invoked for any
  // request that results in an error
  var commonErrorCallback = function(pResult, status) {
    if ((status == 0 || status < 100 || status > 600) && !pResult) {
      $.Topic(pubsub.topicNames.USER_NETWORK_ERROR).publish([{message:"failure"}]);
    }
    if (status == CCConstants.HTTP_UNAUTHORIZED_ERROR) {
      $.Topic(pubsub.topicNames.USER_SESSION_EXPIRED).publish();
    }
  };

  var profileType = (window.CCStorefrontPreviewMode === true) ? CCConstants.PROFILE_TYPE_LAYOUT_PREVIEW : CCConstants.PROFILE_TYPE_STOREFRONT;

  var client = new CCRestClient(profileType, commonErrorCallback);
  client.allowSiteSwitchingOnProduction = CCStoreConfiguration.getInstance().allowSiteSwitchingOnProduction();

  //Setting the configuration flag to rest client when updated via any means
  CCStoreConfiguration.getInstance().allowSiteSwitchingOnProduction.subscribe(function() {
     client.allowSiteSwitchingOnProduction = CCStoreConfiguration.getInstance().allowSiteSwitchingOnProduction();
  });
  
  if(window.endpointRegistry ){
	  client.init( true , ! window.isPreviewMode, window.endpointRegistry);
  }else{
	  client.init( false , ! window.isPreviewMode);
  }
  
  try {
	    delete window.isPreviewMode;
	    delete window.endpointRegistry;
	}
	catch (e) {
		window.isPreviewMode = undefined;
		window.endpointRegistry = undefined;
	}
	
	
  return client;
});

