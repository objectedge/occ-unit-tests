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
      const responsesStatuses = fs.readdirSync(path.join(__dirname, responsePath));
      responsesStatuses.forEach(statusCode => {
        if(statusCode === 'default') {
          return;
        }

        try {
          const statusFiles = fs.readdirSync(path.join(__dirname, responsePath, statusCode));
          if(Object.keys(statusFiles).length === 1 && statusFiles[0] === 'metadata.json') {
            console.log(`Warning: There are no valid responses for the request "${requestData.operationId}"`);
          } else {
            statusFiles.forEach(responseType => {
              if(responseType === 'metadata.json') {
                return;
              }
              const requestEndpoint = `${schema.basePath}${requestPath.replace('{id}', ':id').replace('{path: .*}', ':path')}`;
              const responseFilePath = path.join(__dirname, responsePath, statusCode, responseType);

              app[method](requestEndpoint, (req, res) => {
                res.header("Content-Type", responseType.replace('-', '/').replace('.json', ''));
                res.status(statusCode);
                res.send(fs.readFileSync(responseFilePath, 'utf8'));
              });
            });
          }
        } catch(error) {
          console.log(error);
        }
      });
      
    } catch(error) {
      console.log(error);
    }
  }
}

console.log('Starting api server...');

app.listen(port, () => console.log(`Running api server on port ${port}`));