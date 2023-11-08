/*
    Utilities
*/

// dependecies
const crypto = require('crypto');
const environments = require('./environments');

const utilities = {};

utilities.parseJSON = (jsonString) => {
    let output = {};

    try {
        output = JSON.parse(jsonString);
    } catch {
        output = {};
    }
    return output;
};

utilities.hash = (str) => {
    if (typeof str === 'string' && str.length > 0) {
        const hast = crypto.createHmac('sha256', environments.secrateKey).update(str).digest('hex');
        return hast;
    }
    return false;
};

utilities.createRandomString = (strlen) => {
    const length = typeof strlen === 'number' && strlen > 0 ? strlen : false;
    if (length) {
        const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let output = '';

        for (let i = 1; i <= length; i += 1) {
            const randomChar = possibleCharacters.charAt(
                Math.floor(Math.random() * possibleCharacters.length)
            );
            output += randomChar;
        }
        return output;
    }
    return false;
};

module.exports = utilities;
