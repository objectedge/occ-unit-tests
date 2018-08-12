!function(e,t,a){var n={templates:{},storeTemplate:function(e,t){this.templates[e]=t},getTemplate:function(e){return this.templates[e]},purge:function(){this.templates={}}},r={templateIds:[],storeTemplate:function(e,t){var a=document.getElementById(e);null===a&&(this.templateIds.push(e),a=document.createElement("script"),a.type="text/html",a.id=e,document.body.appendChild(a)),a.text=t},getTemplate:function(e){return document.getElementById(e)},purge:function(){for(var e=0;e<this.templateIds.length;e++)document.body.removeChild(document.getElementById(this.templateIds[e]));this.templateIds=[]}},l="<div class='infuser-error'>The template <a href='{TEMPLATEURL}'>{TEMPLATEID}</a> could not be loaded. {STATUS}</div>",o=function(e,t,a){return l.replace("{STATUS}",e).replace("{TEMPLATEID}",t).replace("{TEMPLATEURL}",a)},u=[],i={getTemplatePath:function(e){var t=e.templatePrefix+e.templateId+e.templateSuffix;return e.templateUrl===a||""===e.templateUrl?t:e.templateUrl+"/"+t},templateGetSuccess:function(e,t){return function(a){p.store.storeTemplate(e,a),t(p.store.getTemplate(e))}},templateGetError:function(t,a,n){return function(r){e.inArray(t,u)===-1&&u.push(t);var l=o("HTTP Status code: "+r.status,t,a);p.store.storeTemplate(t,l),n(p.store.getTemplate(t))}},getAjaxOptions:function(e){}},p={storageOptions:{hash:n,script:r},store:n,defaults:{templateUrl:"",templateSuffix:".html",templatePrefix:"",ajax:{async:!0,dataType:"html",type:"GET"},target:function(e){return"#"+e},loadingTemplate:{content:'<div class="infuser-loading"></div>',transitionIn:function(t,a){var n=e(t);n.hide(),n.html(a),n.fadeIn()},transitionOut:function(t){e(t).html("")}},postRender:function(e){},preRender:function(e,t){},render:function(t,a){var n=e(t);0===n.children().length?n.append(e(a)):n.children().replaceWith(e(a))},bindingInstruction:function(e,t){return e},useLoadingTemplate:!0},get:function(t,a){var n,r=e.extend({},p.defaults,"object"==typeof t?t:{templateId:t});r.ajax.url=i.getTemplatePath(r),n=p.store.getTemplate(r.ajax.url),n&&e.inArray(r.ajax.url,u)===-1?a(n):(r.ajax.success=i.templateGetSuccess(r.ajax.url,a),r.ajax.error=i.templateGetError(r.templateId,r.ajax.url,a),e.trafficCop(r.ajax))},getSync:function(t){var a,n,r=e.extend({},p.defaults,"object"==typeof t?t:{templateId:t},{ajax:{async:!1}});return r.ajax.url=i.getTemplatePath(r),a=p.store.getTemplate(r.ajax.url),a&&e.inArray(r.ajax.url,u)===-1||(n=null,r.ajax.success=function(e){n=e},r.ajax.error=function(t){e.inArray(r.ajax.url)===-1&&u.push(r.ajax.url),n=o("HTTP Status code: exception.status",r.templateId,r.ajax.url)},e.ajax(r.ajax),null===n?n=o("An unknown error occurred.",r.templateId,r.ajax.url):(p.store.storeTemplate(r.ajax.url,n),a=p.store.getTemplate(r.ajax.url))),a},infuse:function(t,n){var r=e.extend({},p.defaults,"object"==typeof t?t:n,"string"==typeof t?{templateId:t}:a),l="function"==typeof r.target?r.target(t):r.target;r.useLoadingTemplate&&r.loadingTemplate.transitionIn(l,r.loadingTemplate.content),p.get(r,function(e){var t=e;r.preRender(l,t),t=r.bindingInstruction(t,r.model),r.useLoadingTemplate&&r.loadingTemplate.transitionOut(l),r.render(l,t),r.postRender(l)})}};t.infuser=p}(jQuery,window);
//# sourceMappingURL=infuser.js.map