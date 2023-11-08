/*
    handler request response
*/

// dependencier
const url = require('url');
const { StringDecoder } = require('string_decoder');
const routes = require('../routes');
const { notFoundHandler } = require('../handler/routesHandler/notFoundHandler');
const utilities = require('./utilitise');

// module scaffolding
const handler = {};

handler.handleReqRes = (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');
    const method = req.method.toLowerCase();
    const headerObj = req.headers;
    const queryStringObj = parsedUrl.query;

    const requestProperties = {
        parsedUrl,
        path,
        trimmedPath,
        queryStringObj,
        method,
        headerObj,
    };
    const decoder = new StringDecoder('utf8');

    let realData = '';
    const choosenHandler = routes[trimmedPath] ? routes[trimmedPath] : notFoundHandler;
    req.on('data', (buffer) => {
        realData += decoder.write(buffer);
    });

    req.on('end', () => {
        realData += decoder.end();
        requestProperties.body = utilities.parseJSON(realData);
        choosenHandler(requestProperties, (sCode, pLoad) => {
            let statusCode = sCode;
            let payLoad = pLoad;
            statusCode = typeof statusCode === 'number' ? statusCode : 500;
            payLoad = typeof payLoad === 'object' ? payLoad : {};

            const payLoadString = JSON.stringify(payLoad);
            res.setHeader('content-type', 'application/json');
            res.writeHead(statusCode);
            res.end(payLoadString);
        });
    });
};
module.exports = handler;
