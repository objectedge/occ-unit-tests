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
      const routeResponse = await request(util.format(dataTypeEndpoint, dataTypeEndpoint));

      responseDescriptor.request.queryParameters = dataTypeQueryParameters;
      responseDescriptor.request.queryParameters[':path'] = normalizedRoute;
      fs.writeJson(`${dataTypePath}/descriptor.json`, responseDescriptor, { spaces: 2 });
      fs.writeJson(`${dataTypePath}/data.json`, JSON.parse(routeResponse.body), { spaces: 2 });
    }
  }
})();
