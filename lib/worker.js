/*
    Title: Worker Files
*/

// dependencies
const url = require('url');
const http = require('http');
const https = require('https');
const data = require('./data');
const { parseJSON } = require('../helpers/utilitise');
const { sendTwilioSms } = require('../helpers/notifications');

// server object - module scaffolding
const worker = {};

// lookup all the checks
worker.gatherAllChecks = () => {
    // get all the checks
    data.list('checks', (err1, checks) => {
        if (!err1 && checks && checks.length > 0) {
            checks.forEach((check) => {
                // read the check data
                data.read('checks', check, (err2, originalCheckData) => {
                    if (!err2 && originalCheckData) {
                        // pass the data to the check validator
                        worker.validateCheckData(parseJSON(originalCheckData));
                    } else {
                        console.log('Error: reading one of the check data');
                    }
                });
            });
        } else {
            console.log('Error: reading one of the check data');
        }
    });
};

// validate check data
worker.validateCheckData = (originalCheckData) => {
    const originalData = originalCheckData;
    if (originalCheckData && originalCheckData.id) {
        originalData.state =
            typeof originalCheckData.state === 'string' &&
            ['up', 'down'].indexOf(originalCheckData.state) > -1
                ? originalCheckData.state
                : 'down';

        originalData.lastChecked =
            typeof originalCheckData.lastChecked === 'number' && originalCheckData.lastChecked > 0
                ? originalCheckData.lastChecked
                : false;

        // pass to the next process
        worker.performCheck(originalData);
    } else {
        console.log('Error: check was invalid not properly formatted');
    }
};

// perform check
worker.performCheck = (originalCheckData) => {
    // prepare the initial check outcome
    let checkOutcome = {
        error: false,
        responseCode: false,
    };
    let outcomeSent = false;

    const parsedUrl = url.parse(`${originalCheckData.protocol}://${originalCheckData.url}`, true);
    const hostName = parsedUrl.hostname;
    const { path } = parsedUrl;

    const requestDetails = {
        protocol: `${originalCheckData.protocol}:`,
        hostname: hostName,
        method: originalCheckData.method.toUpperCase(),
        path,
        timeout: originalCheckData.timeoutSeconds * 1000,
    };
    const protocolToUse = originalCheckData.protocol === 'http' ? http : https;

    const req = protocolToUse.request(requestDetails, (res) => {
        // grab the status of the response
        const status = res.statusCode;
        // update the check process and pass to the next process
        checkOutcome.responseCode = status;
        if (!outcomeSent) {
            worker.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    req.on('error', (e) => {
        checkOutcome = {
            error: false,
            value: e,
        };
        if (!outcomeSent) {
            worker.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    req.on('timeout', () => {
        checkOutcome = {
            error: false,
            value: 'timeout',
        };
        if (!outcomeSent) {
            worker.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    req.end();
};

worker.processCheckOutcome = (originalCheckData, checkOutcome) => {
    const state =
        !checkOutcome.error &&
        checkOutcome.responseCode &&
        originalCheckData.successCode.indexOf(checkOutcome.responseCode) > -1
            ? 'up'
            : 'down';

    const alertWanted = !!(originalCheckData.lastChecked && originalCheckData.state !== state);
    // update the checkdata
    const newCheckData = originalCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();

    // update the check to disk
    data.update('checks', newCheckData.id, newCheckData, (err) => {
        if (!err) {
            if (alertWanted) {
                worker.alertUserToStatusChange(newCheckData);
            } else {
                console.log('Alert is not needed as there is not state change');
            }
        } else {
            console.log('Error trying to save check data of one of the checks');
        }
    });
};

// save check outcome to database and send to the next process
worker.alertUserToStatusChange = (newCheckData) => {
    const msg = `alert your check for ${newCheckData.method.toUpperCase()} ${
        newCheckData.protocol
    }://${newCheckData.url} is currently ${newCheckData.state}`;

    sendTwilioSms(newCheckData.userPhone, msg, (err) => {
        if (!err) {
            console.log(`User was alerted to a status change via SMS: ${msg}`);
        } else {
            console.log('There was a problem sending sms to one of the user!');
        }
    });
};

worker.loop = () => {
    setInterval(() => {
        worker.gatherAllChecks();
    }, 5000);
};

worker.init = () => {
    // execute all the checks
    worker.gatherAllChecks();

    // call the loop so that checks continue
    worker.loop();
};

module.exports = worker;
