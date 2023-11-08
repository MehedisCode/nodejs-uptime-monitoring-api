/*
    token handler
*/

// dependencies
const data = require('../../lib/data');
const { hash, parseJSON } = require('../../helpers/utilitise');
const { createRandomString } = require('../../helpers/utilitise');
const { token } = require('../../routes');

const handler = {};

handler.tokenHandler = (requestProperties, callback) => {
    const acceptedMethods = ['get', 'post', 'put', 'delete'];
    if (acceptedMethods.indexOf(requestProperties.method) > -1) {
        handler._token[requestProperties.method](requestProperties, callback);
    }
};

// inner module scaffold
handler._token = {};

handler._token.post = (requestProperties, callback) => {
    const phone =
        typeof requestProperties.body.phone === 'string' &&
        requestProperties.body.phone.trim().length > 0
            ? requestProperties.body.phone
            : false;

    const password =
        typeof requestProperties.body.password === 'string' &&
        requestProperties.body.password.trim().length > 0
            ? requestProperties.body.password
            : false;
    if (phone && password) {
        data.read('users', phone, (err, userData) => {
            const hashedPassword = hash(password);

            if (hashedPassword === parseJSON(userData).password) {
                const tokenId = createRandomString(12);
                const expire = Date.now() + 60 * 60 * 1000;
                const tokenObject = {
                    phone,
                    id: tokenId,
                    expire,
                };
                data.create('tokens', tokenId, tokenObject, (err2) => {
                    if (!err2) {
                        callback(200, tokenObject);
                    } else {
                        callback(500, { error: 'token creation failed' });
                    }
                });
            } else {
                callback(405, { error: 'invalid password' });
            }
        });
    } else {
        callback(404, { error: 'user not found' });
    }
};
handler._token.get = (requestProperties, callback) => {
    const id =
        typeof requestProperties.queryStringObj.id === 'string' &&
        requestProperties.queryStringObj.id.trim().length === 12
            ? requestProperties.queryStringObj.id
            : false;

    if (id) {
        data.read('tokens', id, (err, tokenData) => {
            const token = { ...parseJSON(tokenData) };
            if (!err && token) {
                callback(200, token);
            } else {
                callback(405, {
                    error: 'token not found',
                });
            }
        });
    } else {
        callback(405, { error: 'request token not found' });
    }
};
handler._token.put = (requestProperties, callback) => {
    const id =
        typeof requestProperties.body.id === 'string' &&
        requestProperties.body.id.trim().length === 12
            ? requestProperties.body.id
            : false;
    const expire = !!(
        typeof requestProperties.body.extend === 'boolean' && requestProperties.body.extend === true
    );
    if (id && expire) {
        data.read('tokens', id, (err, tokenData) => {
            const tokenObj = parseJSON(tokenData);
            if (tokenObj.expire > Date.now()) {
                tokenObj.expire = Date.now() + 60 * 60 * 1000;
                data.update('tokens', id, tokenObj, (err2) => {
                    if (!err2) {
                        callback(200);
                    } else {
                        callback(400, { error: 'There was a problem in request' });
                    }
                });
            } else {
                callback(400, { error: 'User date expire' });
            }
        });
    } else {
        callback(400, { error: 'There was a problem in user request' });
    }
};
handler._token.delete = (requestProperties, callback) => {
    const id =
        typeof requestProperties.queryStringObj.id === 'string' &&
        requestProperties.queryStringObj.id.trim().length === 12
            ? requestProperties.queryStringObj.id
            : false;
    if (id) {
        data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                data.delete('tokens', id, (err2) => {
                    if (!err2) {
                        callback(200, {
                            message: 'user successfully deleted',
                        });
                    } else {
                        callback(405, {
                            error: 'There was problem in server side',
                        });
                    }
                });
            } else {
                callback(400, { error: 'token not found' });
            }
        });
    } else {
        callback(400, { error: 'cannot get token id' });
    }
};

handler._token.varify = (id, phone, callback) => {
    data.read('tokens', id, (err, tokenData) => {
        if (!err && tokenData) {
            if (parseJSON(tokenData).phone === phone && parseJSON(tokenData).expire > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

module.exports = handler;
