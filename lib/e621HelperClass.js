
'use strict';

// document the e621 endpoints here
// the goal is to do NOTHING with the data but simply return it

const request = require('request');
const rp = require('request-promise');
const CONFIG = require('../config/config.js');
const Logger = require('../lib/loggerClass.js');
const interfaces = require('../lib/e621Interfaces.d.ts').e621APITag
const utils = require('./utils.js');
const BASE_URL = CONFIG.e621BaseUrl;
const USER_AGENT = CONFIG.USER_AGENT;
const logger = new Logger();                                          // Create an instance of our custom logger

class e621Helper {
    constructor(options) {

    }

    /**
     * Get the currently set E621 Base URL
     * @returns {string}
     * @memberof e621Helper
     */
    getE621BaseURL() {
        return CONFIG.e621BaseUrl;
    }

    getE621PostIndex(filters) {
        let url = `https://e621.net/post/index.json`;
        return requestUrl(url)
            .then((response) => {
                return response;
            })
            .catch((err) => {
                logger.error(err);
            })
    }

    /**
     * Used to get the apikey
     * @param {String} username e621 username
     * @param {String} password password (only needed to generate the key)
     */
    getApiKey(username, password) {
        return new Promise(function (resolve, reject) {
            const url = generateAPIKeyURL(username, password);
            requestUrl(url).then((response) => {
                resolve(response.password_hash);
            });
        });
    }
    // add any needed API stuff here...
}

/**
 * Generate the e621 URL for getting a user's API key
 * @param {String} username 
 * @param {String} password 
 * @returns {String}
 */
function generateAPIKeyURL(username, password) {
    let URL = `${BASE_URL}user/login.json?name="${username}"&password="${password}"`;
    return URL;
}

/**
 * Request an e621 URL using constant headers (user-agent, etc.)
 * @param {String} url 
 * @returns {Promise<Body>}
 */
function requestUrl(url) {
    // set up the options so we don't have to constantly redefine our user agent
    let options = {
        uri: url,
        headers: {
            'User-Agent': USER_AGENT
        },
        json: true
    };
    return new Promise((resolve, reject) => {
        request.get(options, function (err, response, body) {
            if (err) {
                return reject(err);
            }
            if (response.statusCode !== utils.e621ResponseCodes.OK) {
                return reject('GET did not return OK');
            }
            if (response.statusCode === utils.e621ResponseCodes.FORBIDDEN) {
                return reject('Incorrect password given');
            }
            return resolve(body);
        })
    })
}

module.exports = e621Helper;