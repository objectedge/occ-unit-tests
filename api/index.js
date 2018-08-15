const fs = require('fs-extra');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser')
const serverConfigs = require('../server-configs');

const app = express();
const port = serverConfigs.api.port;
const schema = fs.readJsonSync(path.join('api','schema.json'), 'utf8');
const schemaPaths = schema.paths;

app.use(bodyParser.json());
app.use(bodyParser.text());

// Disabling ETag
app.set('etag', false);

for(requestPath in schemaPaths) {
  for(method in schemaPaths[requestPath]) {
    const requestData = schemaPaths[requestPath][method];
    const responsePath = requestData.responses;

    try {
      const requestsDefinitionPath = path.join(__dirname, responsePath);
      const requestsDefinition = fs.readdirSync(requestsDefinitionPath);
      
      requestsDefinition.forEach(definitionPath => {
        const requestDescriptorPath = path.join(requestsDefinitionPath, definitionPath, 'descriptor.json');
        let descriptor;

        try {
          descriptor = fs.readJsonSync(requestDescriptorPath);
        } catch(error) {
          console.log(`Warning: There is no valid descriptor for the request "${requestData.operationId}"`);
        }

        try {          
          const responseDataPath = path.join(requestsDefinitionPath, definitionPath, descriptor.response.dataPath);
          const requestDefinition = descriptor.request;
          const responseDefinition = descriptor.response;
          let requestEndpoint = `${schema.basePath}${requestPath.replace('{id}', ':id').replace('{path: .*}', ':path')}`;
          
          const checkEquality = (object1, object2) => {
            const optionsPropertyKey = '__options';
            const options = object1[optionsPropertyKey] || {};
            const matchType = options.matchType || 'string';
            const match = (object1Value, object2Value) => {
              if(matchType === 'string') {
                return object1Value.toString() === object2Value.toString();
              }

              return new RegExp(object1Value.toString()).test(object2Value.toString());
            };

            if(typeof object1 === 'string') {
              return match(object1, object2);
            }

            const iterableObjectKeys = Object.keys(object2).filter(item => item !== optionsPropertyKey);
            
            return iterableObjectKeys.every(objectKey => {
              const object1Value = object1[objectKey];
              const object2Value = object2[objectKey];

              if(typeof object2Value === 'undefined' || typeof object1Value === 'undefined') {
                return false;
              }

              if(typeof object1Value === 'object' && typeof object2Value === 'object') {
                return checkEquality(object1Value, object2Value);  
              }
              
              return match(object1Value, object2Value);
            });
          };

          const middleware = (req, res, next) => {
            const queryParameters = requestDefinition.queryParameters;
            const headers = requestDefinition.headers;
            const hasQueryParameters = Object.keys(queryParameters).length;
            const hasHeaders = Object.keys(headers).length;
            const hasBody = Object.keys(requestDefinition.body).length; // Check with Object.keys even if it's an object
            const body = requestDefinition.body;

            if(!hasQueryParameters && !hasHeaders && !hasBody) {
              return next();
            }

            let matches = [];

            if(hasQueryParameters) {
              matches.push(checkEquality(queryParameters, req.query));
            }

            if(hasHeaders) {
              matches.push(checkEquality(headers, req.headers));
            }

            if(hasBody) {
              matches.push(checkEquality(body, req.body));
            }

            if(!matches.every(match => match)) {
              return next('route');
            }

            next();
          };

          app[requestDefinition.method](requestEndpoint, middleware, (req, res) => {
            res.header("OperationId", requestData.operationId);

            Object.keys(responseDefinition).forEach(requestOption => {
              if(requestOption === 'headers') {
                res.set(responseDefinition.headers);
              }

              if(requestOption === 'statusCode') {
                res.status(responseDefinition.statusCode);
              }
            });

            res.send(fs.readFileSync(responseDataPath, 'utf8'));
          });
        } catch(error) {
          console.log(`Warning: There is no valid response for the request "${requestData.operationId}"`);
        }
      });
    } catch(error) {
      console.log(error);
    }
  }
}

console.log('Starting api server...');

app.listen(port, () => console.log(`Running api server on port ${port}`));