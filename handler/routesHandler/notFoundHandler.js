/*
    not sample handler
*/

const handler = {};

handler.notFoundHandler = (requestProperties, callback) => {
    callback(500, {
        error: 'The request url is not found',
    });
};

module.exports = handler;
