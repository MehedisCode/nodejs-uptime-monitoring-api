/*
    check handler
*/

/*
    user handler

    sameple object for testing
{
    "protocol": "http",
    "url": "google.com",
    "method": "get",
    "successCode": [
        200,
        201
    ],
    "timeoutSeconds": 2
}
*/

// dependencies
const data = require('../../lib/data');
const { createRandomString } = require('../../helpers/utilitise');
const { parseJSON } = require('../../helpers/utilitise');
const tokenHandler = require('./tokenHandler');
const { maxChecks } = require('../../helpers/environments');
// const { requestProperties } = require('../../helpers/handleReqRes');

const handler = {};

handler.checkHandler = (requestProperties, callback) => {
    const acceptedMethods = ['get', 'post', 'put', 'delete'];
    if (acceptedMethods.indexOf(requestProperties.method) > -1) {
        handler._check[requestProperties.method](requestProperties, callback);
    } else {
        callback(405);
    }
};

handler._check = {};

handler._check.post = (requestProperties, callback) => {
    const protocol =
        typeof requestProperties.body.protocol === 'string' &&
        ['http', 'https'].indexOf(requestProperties.body.protocol) > -1
            ? requestProperties.body.protocol
            : false;
    const url =
        typeof requestProperties.body.url === 'string' &&
        requestProperties.body.url.trim().length > 0
            ? requestProperties.body.url
            : false;
    const method =
        typeof requestProperties.body.method === 'string' &&
        ['get', 'post', 'put', 'delete'].indexOf(requestProperties.body.method) > -1
            ? requestProperties.body.method
            : false;
    const successCode =
        typeof requestProperties.body.successCode === 'object' &&
        requestProperties.body.successCode instanceof Array
            ? requestProperties.body.successCode
            : false;
    const timeoutSeconds =
        typeof requestProperties.body.timeoutSeconds === 'number' &&
        requestProperties.body.timeoutSeconds % 1 === 0 &&
        requestProperties.body.timeoutSeconds >= 1 &&
        requestProperties.body.timeoutSeconds <= 5
            ? requestProperties.body.timeoutSeconds
            : false;

    if (protocol && url && method && successCode && timeoutSeconds) {
        const token =
            typeof requestProperties.headerObj.token === 'string'
                ? requestProperties.headerObj.token
                : false;
        data.read('tokens', token, (err, tokenData) => {
            if (!err && tokenData) {
                const userPhone = parseJSON(tokenData).phone;
                // lookup the user data
                data.read('users', userPhone, (err2, userData) => {
                    if (!err2 && userData) {
                        tokenHandler._token.varify(token, userPhone, (tokenIsValid) => {
                            if (tokenIsValid) {
                                const userObject = parseJSON(userData);
                                const userChecks =
                                    typeof userObject.checks === 'object' &&
                                    userObject.checks instanceof Array
                                        ? userObject.checks
                                        : [];
                                if (userChecks.length < maxChecks) {
                                    const checkId = createRandomString(12);
                                    const checkObject = {
                                        id: checkId,
                                        userPhone,
                                        protocol,
                                        url,
                                        method,
                                        successCode,
                                        timeoutSeconds,
                                    };
                                    data.create('checks', checkId, checkObject, (err3) => {
                                        if (!err3) {
                                            userObject.checks = userChecks;
                                            userObject.checks.push(checkId);

                                            // update the user object with checks
                                            data.update('users', userPhone, userObject, (err4) => {
                                                if (!err4) {
                                                    callback(200, checkObject);
                                                } else {
                                                    callback(500, {
                                                        error: 'There was a problem in server side',
                                                    });
                                                }
                                            });
                                        } else {
                                            callback(400, {
                                                error: 'There was a problem in server side',
                                            });
                                        }
                                    });
                                } else {
                                    callback(401, { error: 'user has already reached max limit' });
                                }
                            } else {
                                callback(403, { error: 'Authentication problem' });
                            }
                        });
                    } else {
                        callback(400, { error: 'user not found' });
                    }
                });
            } else {
                callback(403, { error: 'Authentication problem' });
            }
        });
    } else {
        callback(400, { error: 'There was a problem in your input' });
    }
};

handler._check.get = (requestProperties, callback) => {
    const checkId =
        typeof requestProperties.queryStringObj.id === 'string'
            ? requestProperties.queryStringObj.id
            : false;
    if (checkId) {
        data.read('checks', checkId, (err, checkData) => {
            if (!err && checkData) {
                const token =
                    typeof requestProperties.headerObj.token === 'string'
                        ? requestProperties.headerObj.token
                        : false;
                tokenHandler._token.varify(
                    token,
                    parseJSON(checkData).userPhone,
                    (tokenIsValid) => {
                        if (tokenIsValid) {
                            callback(200, parseJSON(checkData));
                        } else {
                            callback(403, { error: 'Authentication error' });
                        }
                    }
                );
            } else {
                callback(400, { error: 'There was an error in server side' });
            }
        });
    } else {
        callback(400, { error: 'There was an error in server side' });
    }
};

handler._check.put = (requestProperties, callback) => {
    const checkId =
        typeof requestProperties.body.id === 'string' &&
        requestProperties.body.id.trim().length === 12
            ? requestProperties.body.id
            : false;
    const protocol =
        typeof requestProperties.body.protocol === 'string' &&
        ['http', 'https'].indexOf(requestProperties.body.protocol) > -1
            ? requestProperties.body.protocol
            : false;
    const url =
        typeof requestProperties.body.url === 'string' &&
        requestProperties.body.url.trim().length > 0
            ? requestProperties.body.url
            : false;
    const method =
        typeof requestProperties.body.method === 'string' &&
        ['get', 'post', 'put', 'delete'].indexOf(requestProperties.body.method) > -1
            ? requestProperties.body.method
            : false;
    const successCode =
        typeof requestProperties.body.successCode === 'object' &&
        requestProperties.body.successCode instanceof Array
            ? requestProperties.body.successCode
            : false;
    const timeoutSeconds =
        typeof requestProperties.body.timeoutSeconds === 'number' &&
        requestProperties.body.timeoutSeconds % 1 === 0 &&
        requestProperties.body.timeoutSeconds >= 1 &&
        requestProperties.body.timeoutSeconds <= 5
            ? requestProperties.body.timeoutSeconds
            : false;

    if (checkId) {
        if (protocol || url || method || successCode || timeoutSeconds) {
            data.read('checks', checkId, (err, checkData) => {
                if (!err && checkData) {
                    const checkObject = parseJSON(checkData);
                    const { userPhone } = checkObject;
                    const token =
                        typeof requestProperties.headerObj.token === 'string'
                            ? requestProperties.headerObj.token
                            : false;
                    tokenHandler._token.varify(token, userPhone, (tokenIsValid) => {
                        if (tokenIsValid) {
                            if (protocol) checkObject.protocol = protocol;
                            if (url) checkObject.url = url;
                            if (method) checkObject.method = method;
                            if (successCode) checkObject.successCode = successCode;
                            if (timeoutSeconds) checkObject.timeoutSeconds = timeoutSeconds;

                            data.update('checks', checkId, checkObject, (err2) => {
                                if (!err2) {
                                    callback(200, { message: 'check updat successful' });
                                }
                            });
                        } else {
                            callback(403, { error: 'Authentication error' });
                        }
                    });
                } else {
                    callback(400, { error: 'There was an error in server side' });
                }
            });
        } else {
            callback(400, { error: 'You must provide atleast one field to update' });
        }
    } else {
        callback(400, { error: 'There was a problem in request' });
    }
};

handler._check.delete = (requestProperties, callback) => {
    const checkId =
        typeof requestProperties.queryStringObj.id === 'string'
            ? requestProperties.queryStringObj.id
            : false;
    if (checkId) {
        data.read('checks', checkId, (err, checkData) => {
            if (!err && checkData) {
                const token =
                    typeof requestProperties.headerObj.token === 'string'
                        ? requestProperties.headerObj.token
                        : false;
                tokenHandler._token.varify(
                    token,
                    parseJSON(checkData).userPhone,
                    (tokenIsValid) => {
                        if (tokenIsValid) {
                            // delete start
                            data.delete('checks', checkId, (err2) => {
                                if (!err2) {
                                    data.read(
                                        'users',
                                        parseJSON(checkData).userPhone,
                                        (err3, userData) => {
                                            const userObject = parseJSON(userData);
                                            if (!err3 && userData) {
                                                const userChecks =
                                                    typeof userObject.checks === 'object' &&
                                                    userObject.checks instanceof Array
                                                        ? userObject.checks
                                                        : [];
                                                // remove the deleted check id
                                                const checkPosition = userChecks.indexOf(checkId);
                                                if (checkPosition > -1) {
                                                    userChecks.splice(checkPosition, 1);
                                                    userChecks.checks = userChecks;
                                                    data.update(
                                                        'users',
                                                        userObject.phone,
                                                        userObject,
                                                        (err4) => {
                                                            if (!err4) {
                                                                callback(200);
                                                            } else {
                                                                console.log('one');
                                                                callback(400, {
                                                                    error: 'There was an error in server side',
                                                                });
                                                            }
                                                        }
                                                    );
                                                } else {
                                                    callback(400, {
                                                        error: 'There was an error in server side',
                                                    });
                                                }
                                            } else {
                                                callback(400, {
                                                    error: 'There was an error in server side',
                                                });
                                            }
                                        }
                                    );
                                } else {
                                    callback(400, { error: 'There was an error in server side' });
                                }
                            });
                        } else {
                            callback(403, { error: 'Authentication error' });
                        }
                    }
                );
            } else {
                callback(400, { error: 'There was an error in server side' });
            }
        });
    } else {
        callback(400, { error: 'There was an error in server side' });
    }
};

module.exports = handler;
