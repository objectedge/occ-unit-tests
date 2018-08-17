define(
  'swmRestClient',['swmRestClientConstructor', 'ccRestClient', 'ccLogger', 'pubsub', 'jquery', 'ccConstants','storageApi'], 
  
  function(SWMRestClient, ccRestClient, log, PubSub, $, CCConstants, storageApi) {

  "use strict";

  // this callback will be invoked for any
  // request that is successful (useful for debugging)
  var commonSuccessCallback = function(pResult) {
  };
  
  // this callback will be invoked for any
  // request that results in an error
  var commonErrorCallback = function(pResult, status) {
    
    try {
      var errResponse = JSON.parse(pResult);
      if (errResponse['error'] && errResponse['status'])
      {
        // oauth grant error, pass back the exact error?
        switch (errResponse['status']) {
          case '400.12':
            // failed because cc user is not logged in
            $.Topic(PubSub.topicNames.SOCIAL_SPACE_UNAVAILABLE).publish({reason:'ccsync_failed'});
            break;
          default:
            // failed because of some configuration reason
            $.Topic(PubSub.topicNames.SOCIAL_SPACE_UNAVAILABLE).publish({reason:'config'});
        }
        // TODO: Preempt any regular callback messaging by returning a "skip" flag
      }
      else if (errResponse['status'] === 401)
      {
        // oracle error, unauthorized request
        $.Topic(PubSub.topicNames.SOCIAL_SPACE_UNAVAILABLE).publish({reason:'unauthorized'});

        // a 401.99 indicates that this response was generated from the 
        // client code due to a mismatch in auth parameters
        if (errResponse['o:errorCode'] === "401.99") {
          $.Topic(PubSub.topicNames.SOCIAL_REFRESH_SPACES).publish({});
        }
        
        // TODO: Preempt any regular callback messaging by returning a "skip" flag
      }
      else if (errResponse['o:errorCode'] === "403.1" || 
               errResponse['o:errorCode'] === "403.2")
      {

        // remove currentSpaceId from localStorage
        storageApi.getInstance().removeItem('social.currentSpaceId');
        
        // TODO refresh page with publish SOCIAL_SPACE_SELECT?
        //$.Topic(PubSub.topicNames.SOCIAL_SPACE_SELECT).publish();
      }  
    } 
    catch(e) {
      log.warn("swm error occurred, response code: " + status);
      $.Topic(PubSub.topicNames.SOCIAL_SPACE_UNAVAILABLE).publish({});
    }
  };
  
  var client = new SWMRestClient(commonSuccessCallback, commonErrorCallback);
  if (window.externalServiceData) {
    var swmHost = window.externalServiceData.social.scheme + "://" + window.externalServiceData.social.host;
    if (window.externalServiceData.social.port != '0') {
      swmHost += ":" + window.externalServiceData.social.port;
    }
    client.setSWMHost(swmHost);
  }
  return client;
});

