const fs = require('fs-extra');
const path = require('path');
const request = require('request');
const configs = require('../configs');

const apiPath = configs.application.oracleApiDir;
const responsesPath = path.join(apiPath, 'responses');
const definitionsPath = path.join(apiPath, 'definitions');
const webMIMETypes = fs.readJsonSync(path.join(__dirname, '..', 'api', 'webMIMETypes.json'));

const schemaPath = path.join(apiPath, 'schema.json');
const schemaURL = `${configs.application.occAdminUrl}/ccstore/v1/metadata-catalog`;

// Removing files
fs.removeSync(responsesPath);
fs.removeSync(definitionsPath);
fs.ensureDirSync(responsesPath);
fs.ensureDirSync(definitionsPath);

console.log(`Requesting schema from ${schemaURL}...`);

request(schemaURL, (error, response, body) => {
  if(error) {
    return console.log(error);
  }

  const schemaJSON = JSON.parse(body);
  const schemaPaths = schemaJSON.paths;

  console.log('Updating schema...');

  if(!/ui/.test(schemaJSON.basePath)) {
    schemaJSON.basePath = schemaJSON.basePath.replace('ccadmin', 'ccadminui').replace('ccstore', 'ccstoreui');
  }

  // Setting paths
  for(const requestPath in schemaPaths) {
    for(method in schemaPaths[requestPath]) {
      const requestData = schemaPaths[requestPath][method];
      const responses = requestData.responses;
      const requestId = requestData.operationId;
      const responseMethodPath = path.join(responsesPath, `${requestId}`);

      fs.ensureDirSync(responseMethodPath);

      for(statusCode in responses) {
        // Don't create structure for the default
        if(statusCode === 'default') {
          continue;
        }

        const responsePath = path.join(responseMethodPath, 'default');
        const dataDescriptorPath = path.join(responsePath, 'descriptor.json');
        const dataPath = path.join(responsePath, 'data.json');

        const descriptor = {
          allowedParameters: requestData.parameters,
          request: {
            queryParameters: {},
            method,
            headers: {},
            body: {}
          },
          response: {
            dataPath: path.relative(responsePath, dataPath),
            statusCode,
            headers: {}
          }
        };

        fs.ensureDirSync(responsePath);

        if(responses[statusCode].examples) {
          let contentTypeList = Object.keys(responses[statusCode].examples);
          const foundValidMIMEType = contentTypeList.some(mimeType => webMIMETypes.includes(mimeType));

          // If didn't find any valid mime type, consider it as application/json
          if(!foundValidMIMEType) {
            contentTypeList = ['application/json'];
          }

          let contentType = contentTypeList[0];
          const responseData = responses[statusCode].examples[contentType];

          descriptor.response.headers['content-type'] = contentType;
          let stringifiedResponseData = JSON.stringify(responseData, null, 2);

          if(stringifiedResponseData) {
            stringifiedResponseData = stringifiedResponseData.replace(/localhost:[0-9]+?\//g, `localhost:${configs.server.karma.port}/`).replace(/"httpPort":\s[0-9]+?,/g, `"httpPort": ${configs.server.karma.port},`);
          }

          fs.writeFileSync(dataPath, stringifiedResponseData, 'utf8');
        }

        fs.writeFileSync(dataDescriptorPath, JSON.stringify(descriptor, null, 2), 'utf8');
      }

      schemaPaths[requestPath][method].responses = path.relative(apiPath, responseMethodPath);
    }
  }

  // Setting Definitions
  for(const schemaDefinitionPath in schemaJSON.definitions) {
    const definitionPath = path.join(definitionsPath, `${schemaDefinitionPath}.json`);
    fs.writeFileSync(definitionPath, JSON.stringify(schemaJSON.definitions[schemaDefinitionPath], null, 2), 'utf8');
  }
  delete schemaJSON.definitions;

  fs.writeFileSync(schemaPath, JSON.stringify(schemaJSON, null, 2), 'utf8');
  console.log('Schema Updated!');
});
