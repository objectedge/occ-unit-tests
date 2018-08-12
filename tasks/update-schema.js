const fs = require('fs-extra');
const path = require('path');
const request = require('request');
const apiPath = path.join(__dirname, '..', 'api');
const responsesPath = path.join(apiPath, 'responses');
const definitionsPath = path.join(apiPath, 'definitions');
const webMIMETypes = fs.readJsonSync(path.join(apiPath, 'utils', 'webMIMETypes.json'));

const schemaPath = path.join(apiPath, 'schema.json');
const schemaURL = 'https://ccadmin-dev-zd8a.oracleoutsourcing.com/ccstore/v1/metadata-catalog';

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
      const responsePath = path.join(responsesPath, `${requestId}`);
      
      fs.ensureDirSync(responsePath);

      for(responseCode in responses) {
        const responseCodeData = responses[responseCode];
        const responseCodePath = path.join(responsePath, `${responseCode}`);
        const metadataPath = path.join(responseCodePath, 'metadata.json');
        const metadataObject = {
          schema: responseCodeData.schema,
          description: responseCodeData.description
        };

        fs.ensureDirSync(responseCodePath);
        fs.writeFileSync(metadataPath, JSON.stringify(metadataObject, null, 2), 'utf8');

        if(responses[responseCode].examples) {
          const responseTypeList = Object.keys(responses[responseCode].examples);
          const foundValidMIMEType = responseTypeList.some(mimeType => webMIMETypes.includes(mimeType));

          // If didn't find any valid mime type, copy the current data and set it as application/json
          if(!foundValidMIMEType) {
            const tempResponseData = JSON.parse(JSON.stringify(responses[responseCode].examples));
            responses[responseCode].examples = {
              'application/json': tempResponseData
            };
          }

          for(const responseType in responses[responseCode].examples) {
            const responseTypePath = path.join(responseCodePath, `${responseType.replace('/', '-')}.json`);
            fs.writeFileSync(responseTypePath, JSON.stringify(responses[responseCode].examples[responseType], null, 2), 'utf8');
          }
        }
      }

      schemaPaths[requestPath][method].responses = path.relative(apiPath, responsePath);
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