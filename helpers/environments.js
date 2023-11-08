/*
    Environment Variable
*/

const environments = {};

environments.staging = {
    port: 3000,
    envName: 'staging',
    secrateKey: 'qwerty',
    maxChecks: 5,
    twilio: {
        fromPhone: '+12023353675',
        accountSid: 'from your twillo',
        authToken: 'from your twillo',
    },
};
environments.production = {
    port: 4000,
    envName: 'production',
    secrateKey: 'poiu',
    maxChecks: 5,
};

const currenctEnvironment =
    typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV : 'staging';

const environmentToExport =
    typeof environments[currenctEnvironment] === 'object'
        ? environments[currenctEnvironment]
        : environments.staging;

module.exports = environmentToExport;
