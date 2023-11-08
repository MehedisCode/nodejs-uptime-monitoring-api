/*
    user handler

    sameple object for testing
{
    "firstName": "Mehedi",
    "lastName": "Hasan",
    "phone": "017335341xx",
    "password": "CODE",
    "tosAgreement": true
}
*/

// dependencies
const data = require('../../lib/data');
const { hash } = require('../../helpers/utilitise');
const { parseJSON } = require('../../helpers/utilitise');
const tokenHandler = require('./tokenHandler');

const handler = {};

handler.userHandler = (requestProperties, callback) => {
    const acceptedMethods = ['get', 'post', 'put', 'delete'];
    if (acceptedMethods.indexOf(requestProperties.method) > -1) {
        handler._users[requestProperties.method](requestProperties, callback);
    } else {
        callback(405);
    }
};

handler._users = {};

handler._users.post = (requestProperties, callback) => {
    const firstName =
        typeof requestProperties.body.firstName === 'string' &&
        requestProperties.body.firstName.trim().length > 0
            ? requestProperties.body.firstName
            : false;
    const lastName =
        typeof requestProperties.body.lastName === 'string' &&
        requestProperties.body.lastName.trim().length > 0
            ? requestProperties.body.lastName
            : false;

    const phone =
        typeof requestProperties.body.phone === 'string' &&
        requestProperties.body.phone.trim().length === 11
            ? requestProperties.body.phone
            : false;
    const password =
        typeof requestProperties.body.password === 'string' &&
        requestProperties.body.password.trim().length > 0
            ? requestProperties.body.password
            : false;
    const tosAgreement =
        typeof requestProperties.body.tosAgreement === 'boolean'
            ? requestProperties.body.tosAgreement
            : false;
    if (firstName && lastName && phone && password && tosAgreement) {
        // make sure user does not exsist alreay
        data.read('users', phone, (err) => {
            if (err) {
                const userObject = {
                    firstName,
                    lastName,
                    phone,
                    password: hash(password),
                    tosAgreement,
                };
                data.create('users', phone, userObject, (err2) => {
                    if (!err2) {
                        callback(200, 'user is created successfully');
                    } else {
                        callback(500, 'could not create users');
                    }
                });
            } else {
                callback(500, {
                    error: 'There was a error in serverside',
                });
            }
        });
    } else {
        callback(400, { error: 'You have a problem in your request' });
    }
};

handler._users.get = (requestProperties, callback) => {
    const phone =
        typeof requestProperties.queryStringObj.phone === 'string' &&
        requestProperties.queryStringObj.phone.trim().length === 11
            ? requestProperties.queryStringObj.phone
            : false;
    if (phone) {
        // user authentication
        const token =
            typeof requestProperties.headerObj.token === 'string'
                ? requestProperties.headerObj.token
                : false;
        tokenHandler._token.varify(token, phone, (tokenId) => {
            if (tokenId) {
                data.read('users', phone, (err2, u) => {
                    const user = { ...parseJSON(u) };
                    if (!err2 && user) {
                        delete user.password;
                        callback(200, user);
                    } else {
                        callback(404, {
                            error: 'user not found',
                        });
                    }
                });
            } else {
                callback(403, {
                    error: 'Authentication faliure',
                });
            }
        });
    } else {
        callback(404, {
            error: 'phone not found',
        });
    }
};

handler._users.put = (requestProperties, callback) => {
    const firstName =
        typeof requestProperties.body.firstName === 'string' &&
        requestProperties.body.firstName.trim().length > 0
            ? requestProperties.body.firstName
            : false;
    const lastName =
        typeof requestProperties.body.lastName === 'string' &&
        requestProperties.body.lastName.trim().length > 0
            ? requestProperties.body.lastName
            : false;

    const phone =
        typeof requestProperties.body.phone === 'string' &&
        requestProperties.body.phone.trim().length === 11
            ? requestProperties.body.phone
            : false;
    const password =
        typeof requestProperties.body.password === 'string' &&
        requestProperties.body.password.trim().length > 0
            ? requestProperties.body.password
            : false;

    if (phone) {
        if (firstName || lastName || password) {
            // user authentication
            const token =
                typeof requestProperties.headerObj.token === 'string'
                    ? requestProperties.headerObj.token
                    : false;
            tokenHandler._token.varify(token, phone, (tokenId) => {
                if (tokenId) {
                    // lookup user
                    data.read('users', phone, (err, user) => {
                        const userData = { ...parseJSON(user) };
                        if (!err && userData) {
                            if (firstName) {
                                userData.firstName = firstName;
                            }
                            if (lastName) {
                                userData.lastName = lastName;
                            }
                            if (password) {
                                userData.password = hash(password);
                            }

                            data.update('users', phone, userData, (err2) => {
                                if (!err2) {
                                    callback(200, {
                                        message: 'user was updated successfully ',
                                    });
                                } else {
                                    callback(500, {
                                        error: 'There was an error in the server side',
                                    });
                                }
                            });
                        } else {
                            callback(400, {
                                error: 'You have a problem with request',
                            });
                        }
                    });
                } else {
                    callback(403, {
                        error: 'Authentication faliure',
                    });
                }
            });
        } else {
            callback(400, {
                error: 'You have a problem with request',
            });
        }
    } else {
        callback(400, {
            error: 'Invalid Phone Number',
        });
    }
};

handler._users.delete = (requestProperties, callback) => {
    const phone =
        typeof requestProperties.queryStringObj.phone === 'string' &&
        requestProperties.queryStringObj.phone.trim().length === 11
            ? requestProperties.queryStringObj.phone
            : false;
    if (phone) {
        // user authentication
        const token =
            typeof requestProperties.headerObj.token === 'string'
                ? requestProperties.headerObj.token
                : false;
        tokenHandler._token.varify(token, phone, (tokenId) => {
            if (tokenId) {
                // lookup user
                data.delete('users', phone, (err) => {
                    if (!err) {
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
                callback(403, {
                    error: 'Authentication faliure',
                });
            }
        });
    } else {
        callback(400, { error: 'There was a error in phone number' });
    }
};

module.exports = handler;
