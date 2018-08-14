const fs = require('fs-extra');
const path = require('path');
const express = require('express');
const app = express();
const port = 3000;
const schema = fs.readJsonSync(path.join('api','schema.json'), 'utf8');
const schemaPaths = schema.paths;

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

          const middleware = (req, res, next) => {
            const queryParameters = requestDefinition.queryParameters;
            const headers = requestDefinition.headers;
            const hasQueryParameters = Object.keys(queryParameters).length;
            const hasHeaders = Object.keys(headers).length;

            if(!hasQueryParameters && !hasHeaders) {
              return next();
            }

            let match = true;

            if(hasQueryParameters) {
              match = Object.keys(queryParameters).every(queryKey => req.query[queryKey] && req.query[queryKey] === queryParameters[queryKey]);
              console.log(match);
            }

            if(hasHeaders) {
              match = Object.keys(headers).every(queryKey => {
                queryKey = queryKey.toLocaleLowerCase();
                req.headers[queryKey] && req.headers[queryKey] === headers[queryKey]
              });
            }

            if(!match) {
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

// app.get("/test", function (req, res) {
//   console.log(req.headers);
//   res.send("no query string");
// });

app.listen(port, () => console.log(`Running api server on port ${port}`));