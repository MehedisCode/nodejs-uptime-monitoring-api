/*
    Title: server library
    Description: server related files
*/

// dependencies
const http = require('http');
const { handleReqRes } = require('../helpers/handleReqRes');
const environments = require('../helpers/environments');

// server object - module scaffolding
const server = {};

// create server
server.createserver = () => {
    const createServerVariable = http.createServer(server.handleReqRes);
    createServerVariable.listen(environments.port, () => {
        console.log(`Listening to port ${environments.port}`);
    });
};

server.handleReqRes = handleReqRes;

server.init = () => {
    server.createserver();
};

module.exports = server;
