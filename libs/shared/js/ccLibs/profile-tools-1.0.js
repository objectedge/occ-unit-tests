define(["ccRestClient","knockout","pubsub"],function(s,t,i){"use strict";function e(){var t=this;return t.restApi=s,$.Topic(i.topicNames.REGISTER_SUBMIT).subscribe(this.register),this}return e.prototype.login=function(s,t,i,e){var o=this;o.restApi.login(s,t,function(){i()},function(s){e(s)})},e.prototype.logout=function(){},e.prototype.register=function(s){var e,o,r;e=t.utils.unwrapObservable(s.email),o=t.utils.unwrapObservable(s.password),r=t.utils.unwrapObservable(s.confirmPassword),e&&o?o!==r?$.Topic(i.topicNames.REGISTER_FAILURE).publishWith(this,[{message:"Passwords do not match."}]):$.Topic(i.topicNames.REGISTER_SUCCESS).publishWith(this,[{message:"success"}]):$.Topic(i.topicNames.REGISTER_FAILURE).publishWith(this,[{message:"You must include at least a username and password."}])},e});
//# sourceMappingURL=profile-tools-1.0.js.map