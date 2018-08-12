define("spinner",["knockout","imagesloaded"],function(e,t){"use strict";function n(){var e=this;e.spinnerId="cc-spinner",e.spinnerContainer="cc-spinner",e.spinnerCSS="cc-spinner-css",e.spinnerTimeOutId=null,e.create=function(t){return e.time=(new Date).getTime(),e.parent=t.parent,e.selector=t.selector?t.selector:t.parent,e.centerOn=t.centerOn,e.posTop=t.posTop?t.posTop:"50%",e.posLeft=t.posLeft?t.posLeft:"44%",e.loadingText=t.loadingText?t.loadingText:"Loading...",e.processingText=t.processingText,e.processingPosTop=t.processingPosTop?t.processingPosTop:"5%",e.textWidth=t.textWidth?t.textWidth:"100%",!!e.parent&&("body"===e.parent&&(e.centerOn&&0!==$(e.centerOn).length?(e.posTop=$(e.centerOn).height()/2-27+$(e.centerOn).position().top+"px",e.processingPosTop=$(e.centerOn).height()/2-54+$(e.centerOn).position().top+"px",e.posLeft=$(e.centerOn).width()/2-27+$(e.centerOn).position().left+"px"):(e.posTop=$(window).height()/2-27+"px",e.processingPosTop=$(window).height()/2-54+"px",e.posLeft=$(window).width()/2-27+"px")),void(0===$(e.selector).find("."+e.spinnerContainer).not(".cc-spinner-exclude").length&&(e.buildCSS(e.selector,e.posTop,e.posLeft),t.createWithTimeout&&e.setDestroyTimeout(t.waitTime,t.callBackFn,t.context))))},e.buildCSS=function(t,n,o){var i,r;i=$("<div />").attr({id:e.spinnerId,class:e.spinnerContainer}),r=$("<div />").attr({class:e.spinnerCSS,style:"top:"+n+";left:"+o});for(var s=1;s<13;s++)$(r).append($("<div />").attr({class:e.spinnerCSS+"-"+s}));e.processingText?$(i).prepend($("<div/>").css("padding-top",e.processingPosTop).append($('<span class="center-block"/>').css("width",e.textWidth).text(e.processingText))):$(r).prepend($('<span class="ie-show">').text(e.loadingText)),$(i).append(r),"body"===t?$(t).prepend(i):$(t).append(i)},e.loadCheck=function(t,n){var o=e.parent,i=e.selector;n&&(o=n.parent?n.parent:n.parent,i=n.selector?n.selector:o),(t||0==t)&&(0===$(i).find("."+e.spinnerContainer).length&&e.buildCSS(i,e.posTop,e.posLeft),$(o+" img")?$(o+" img").imagesLoaded(function(){0!==$(i).find("."+e.spinnerContainer).not(".cc-spinner-exclude").length&&e.destroy(t,o,i)}):e.destroy(t,o,i))},e.destroy=function(t,n,o){var i,r,o=o?o:e.parent,n=n?n:e.parent;e.spinnerContainer;i=e.time+250-(new Date).getTime(),$(n).children().length===t?i>0?r=setTimeout(e.destroyWithoutDelay,i):e.destroyWithoutDelay(o):t&&null!==t?setTimeout(e.destroy,1):i>0?r=setTimeout(e.destroyWithoutDelay(o),i):e.destroyWithoutDelay(o)},e.destroyWithoutDelay=function(t){var n=t?t:e.selector,o=e.spinnerContainer;$(n).find("."+o).remove()},e.createWithTimeout=function(t,n,o,i){t.waitTime=n,t.callBackFn=o,t.context=i,t.createWithTimeout=!0,e.create(t)},e.destroyAndClearTimeout=function(t,n){e.destroyWithoutDelay(),null!=e.spinnerTimeOutId&&clearTimeout(e.spinnerTimeOutId),null!=t&&t.call(n)},e.destroyAndClearCreateTimeout=function(t){e.destroyWithoutDelay(t),null!=e.spinnerTimeOutId&&clearTimeout(e.spinnerTimeOutId)},e.setDestroyTimeout=function(t,n,o){e.spinnerTimeOutId=setTimeout(function(){e.destroyWithoutDelay(),null!=n&&n.call(o)},t)},e.createAndReturnWithTimeout=function(t,n,o,i){return e.create(t),e.setDestroyTimeout(n,o,i),e.spinnerTimeOutId},e.destroyAndClearTimeoutWithId=function(t,n,o,i){e.destroyWithoutDelay(t),null!=n&&clearTimeout(n),null!=o&&o.call(i)}}return new n});
//# sourceMappingURL=spinner-1.0.js.map