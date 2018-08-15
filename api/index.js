const fs = require('fs-extra');
const path = require('path');
const express = require('express');
const glob = require('glob');
const bodyParser = require('body-parser')
const serverConfigs = require('../server-configs');

const app = express();
const port = serverConfigs.api.port;

const customResponsesPath = path.join(__dirname, 'custom-responses');
const schema = fs.readJsonSync(path.join('api','schema.json'), 'utf8');

try {
  customResponses = fs.readdirSync(customResponsesPath);
} catch(error) {
  console.log(`It was able to find any custom-response... using the default one`);
}

const schemaPaths = schema.paths;

app.use(bodyParser.json());
app.use(bodyParser.text());

// Disabling ETag
app.set('etag', false);

for(requestPath in schemaPaths) {
  for(method in schemaPaths[requestPath]) {
    const requestData = schemaPaths[requestPath][method];
    let responsePath = requestData.responses;

    if(customResponses.includes(requestData.operationId)) {
      responsePath = path.relative(__dirname, path.join(customResponsesPath, requestData.operationId));
      console.log(`Using custom response for ${requestData.operationId}...`);
    }

    try {
      const requestsDefinitionPath = path.join(__dirname, responsePath);
      const requestsDefinition = glob.sync(path.join(requestsDefinitionPath, '**', 'descriptor.json'));

      requestsDefinition.forEach(definitionPath => {
        let descriptor;

        try {
          descriptor = fs.readJsonSync(definitionPath);
        } catch(error) {
          console.log(`Warning: There is no valid descriptor for the request "${requestData.operationId}"`);
        }

        try {          
          const responseDataPath = path.join(definitionPath, '..', descriptor.response.dataPath);
          const requestDefinition = descriptor.request;
          const responseDefinition = descriptor.response;
          let requestEndpoint = `${schema.basePath}${requestPath.replace('{id}', ':id').replace('{path: .*}', ':path')}`;
          
          if(requestDefinition.queryParameters && requestDefinition.queryParameters.hasOwnProperty(':path')) {
            requestEndpoint = requestEndpoint.replace(':path', requestDefinition.queryParameters[':path']);
            delete requestDefinition.queryParameters[':path'];
          }

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

          console.log(requestEndpoint);
          
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