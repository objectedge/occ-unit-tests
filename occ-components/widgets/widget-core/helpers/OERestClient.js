import ko from 'knockout';
import promise from 'promise';
import restClient from 'ccRestClient';

export class OERestClient {
  endpoint = null;
  path = null;
  query = null;

  constructor (endpoint = '', path = '', query = {}) {
    this.endpoint = endpoint;
    this.path     = path;
    this.query    = query;
  }

  /**
   * Set the request endpoint
   *
   * @param  {String} endpoint The endpoint
   * @return {Void}
   */
  setEndpoint (endpoint) {
    this.endpoint = endpoint;
  }

  /**
   * Set the path parameters
   *
   * @param  {String} path The path parameters
   * @return {Void}
   */
  setPath (path) {
    this.path = path;
  }

  /**
   * Set the request query parameters
   *
   * @param  {Object} query The query parameters
   * @return {Void}
   */
  setQuery (query) {
    this.query = query;
  }

  /**
   * Send the request to OCC
   *
   * @return {promise}
   */
  send () {
    return new Promise((resolve, reject) => {
      // Check required properties validity
      if (!this.validate()) {
        reject({error: 'Required fields not provided'});
      }
      // Request using OCC Rest Client
      restClient.request(
        this.endpoint,
        this.query,
        (response) => {
          resolve(response);
        },
        (error) => {
          reject(error);
        },
        this.path);
    });
  }

  /**
   * Validate the provided parameters
   *
   * @return {Boolean} Whether the provided parameters are valid or not
   */
  validate () {
    return (this.endpoint) ? true : false;
  }
};
