/**
 * @fileoverview OE Fedex API
 *
 *  Exemple
    oeFedexAPI.validateAddress(address).then((success) => {
      ccLogger.info(success, 'SUCCESS')
    }).catch((error) => {
      ccLogger.info(error, 'ERROR')
    });
 *
 *  will return the object
 *  return of then: {"success":true,"totalAddresses":1,"addresses":[{"fullZipCode":"70146-5601","isPoBox":false}]}
 *  return of catch: {"success":false,"code":2,"message":"Missing required information"} *
 * @author rafael.mario@objetedge.com
 */

import $ from 'jquery';
import pubsub from 'pubsub';
import ccLogger from 'ccLogger';
import site from 'pageLayout/site';
let oeFedexAPI;
const SSE_ENDPOINTS = 'oeSSEEndpoints';
export default {
  onLoad() {
    ccLogger.info("[OE][Core] Loading OE FEDEX API");
    oeFedexAPI = this.oeFedexApi;
  },

  getSSEEndpoint(key) {
    return site.getInstance().extensionSiteSettings[SSE_ENDPOINTS][key];
  },

  validateAddress(address) {
    return new Promise ((resolve, reject) => {
      const url = oeFedexAPI.getSSEEndpoint('addressValidationEndpoint');
      $.ajax({
        type: "POST",
        ContentType: 'application/json',
        url: url,
        data: address,
        success: (res) => {
          resolve(res);
        },
        error:(res) => {
          reject(res.responseJSON);
        }
      });
    });
  },
};
