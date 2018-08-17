const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const util = require('util');
const path = require('path');
const url = require('url');
const request = util.promisify(require('request'));
const baseUrl = 'https://admin:admin@ccstore-z1ma.oracleoutsourcing.com';

const pagesDataEndpoints = {
  global: `${baseUrl}/ccstoreui/v1/pages/%s?dataOnly=false&cacheableDataOnly=true&productTypesRequired=true`,
  pageContext: `${baseUrl}/ccstoreui/v1/pages/%s?dataOnly=false&currentDataOnly=true`,
  layout: `${baseUrl}/ccstoreui/v1/pages/layout/%s?ccvp=lg`
};

const customResponsesPath = path.join(__dirname, '..', 'api', 'custom-responses');
const pagesPath = path.join(customResponsesPath, 'getPage');
const layoutsPath = path.join(customResponsesPath, 'getLayout');

(async () => {
  await fs.remove(pagesPath);
  await fs.ensureDir(pagesPath);
  await fs.remove(layoutsPath);
  await fs.ensureDir(layoutsPath);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  console.log(`Requesting main page ${baseUrl}...`);

  const waitXHRResponse = urlRegex => {
    return page.waitForResponse(request => {
      if('xhr' !== request.request().resourceType()){
        return false;
      }
      
      return urlRegex.test(request.url());
    });
  };

  waitXHRResponse(/dataOnly=false&cacheableDataOnly=true&productTypesRequired=true/);
  await page.goto(baseUrl);
  const pageResponse = await waitXHRResponse(/dataOnly=false&cacheableDataOnly=true&productTypesRequired=true/);
  const jsonData = await pageResponse.json();
  const links = jsonData.data.global.links;
  await browser.close();

  await fs.ensureDir(customResponsesPath);
  await fs.ensureDir(pagesPath);
  await fs.ensureDir(layoutsPath);

  const responseDescriptor = {
    "request": {
      "queryParameters": {},
      "method": "get",
      "headers": {},
      "body": {}
    },
    "response": {
      "dataPath": "data.json",
      "statusCode": "200",
      "headers": {
        "content-type": "application/json"
      }
    }
  };

  for(linkKey in links) {
    const linkObject = links[linkKey];
    const pagePath = path.join(pagesPath, linkObject.pageType, linkObject.repositoryId);
    const layoutPath = path.join(layoutsPath, linkObject.pageType, linkObject.repositoryId);

    await fs.ensureDir(pagePath);
    await fs.ensureDir(layoutPath);

    for(pageDataType in pagesDataEndpoints) {
      const currentPath = pageDataType === 'layout' ? layoutPath : pagePath;
      const normalizedRoute = linkObject.route.replace(/^\/{1}/, '');
      const dataTypeEndpoint = util.format(pagesDataEndpoints[pageDataType], normalizedRoute);
      const dataTypePath = path.join(currentPath, pageDataType);
      const dataTypeQueryParameters = url.parse(dataTypeEndpoint, true).query;
      await fs.ensureDir(dataTypePath);

      console.log(`Getting data from ${util.format(dataTypeEndpoint, dataTypeEndpoint)}...`);
      const routeResponse = await request(util.format(dataTypeEndpoint, dataTypeEndpoint));
      const parseBody = JSON.parse(routeResponse.body);

      // Don't keep any widgets, we are going to mock this
      if(parseBody.hasOwnProperty('regions')) {
        parseBody.regions.forEach(region => {
          region.widgets = [];
        });
      }

      // Don't keep information about resolution on layouts, it will force us to generate one layout for each resolution
      // we should mock this when necessary
      if(pageDataType === 'layout' && dataTypeQueryParameters['ccvp']) {
        delete dataTypeQueryParameters['ccvp'];
      }

      responseDescriptor.request.queryParameters = dataTypeQueryParameters;
      responseDescriptor.request.queryParameters[':path'] = normalizedRoute;
      const descriptorPath = `${dataTypePath}/descriptor.json`;
      const dataPath = `${dataTypePath}/data.json`;
      fs.writeJson(descriptorPath, responseDescriptor, { spaces: 2 });
      fs.writeJson(dataPath, parseBody, { spaces: 2 });
      console.log(`Descriptor have been saved at ${descriptorPath}...`);
      console.log(`Data have been saved at ${dataPath}...\n\n`);
    }
  }

  console.log('Done!');
})();
