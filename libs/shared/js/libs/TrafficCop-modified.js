!function(e,n){var r={};e.trafficCop=function(n,t){var f,a=n;if(2===arguments.length&&(a=e.extend(!0,t,{url:n})),f=JSON.stringify(a),f in r)for(i in{success:1,error:1,complete:1})r[f][i]=a[i];else r[f]=e.ajax(a).always(function(){delete r[f]});return r[f]}}(jQuery);
//# sourceMappingURL=TrafficCop-modified.js.map