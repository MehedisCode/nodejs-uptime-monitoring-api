/*
    Title: Uptime monitoring application
    Description: A RESTFul api to monitor up or down time of user defined links
    Author: Md Mehedi Hasan
*/

// dependencies
const http = require('http');
const { handleReqRes } = require('./helpers/handleReqRes');
const environments = require('./helpers/environments');
const { sendTwilioSms } = require('./helpers/notifications');
// const lib = require('./lib/data');

// @TODO remove later
sendTwilioSms('Your number', 'hello world', (err) => {
    console.log('This is the error ', err);
});
// app object - module scaffolding
const app = {};

// configuration

// file CURD

// create server
app.createserver = () => {
    const server = http.createServer(app.handleReqRes);
    server.listen(environments.port, () => {
        console.log(`Listening to port ${environments.port}`);
    });
};

app.handleReqRes = handleReqRes;
app.createserver();
