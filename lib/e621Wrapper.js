'use strict';

// document the e621 endpoints here
// the goal is to do NOTHING with the data but simply return it

const request = require('request');
const rp = require('request-promise');
const CONFIG = require('../config/config.js');
const Logger = require('../lib/loggerClass.js');
const BASE_URL = CONFIG.e621BaseUrl;
const USER_AGENT = CONFIG.USER_AGENT;
const logger = new Logger();                                          // Create an instance of our custom logger

class E621Wrapper {
    constructor(options) {

    }

    /**
     * Get the currently set E621 Base URL
     * @returns {string}
     * @memberof E621Wrapper
     */
    getE621BaseURL() {
        return CONFIG.e621BaseUrl;
    }

    getE621PostIndex() {
        let options = {
            uri: `https://e621.net/post/index.json`,
            headers: {
                'User-Agent': USER_AGENT
            },
        };
        return requestUrl(options)
            .then((response) => {
                logger.debug(response.length);
                return response;
            })
            .catch((err) => {
                logger.error(err);
            })
    }

}



function generateAPIKeyURL(username, password) {
    let URL = `${BASE_URL}user/login.json?name="${username}"&password="${password}"`;
    return URL;
}

// main way to get e621Urls
function requestUrl(opts) {                        //DB call abstraction
    return new Promise((resolve, reject) => {
        request.get(opts, function (err, response, body) {
            if (err) {
                return reject(err);
            }
            if (response.statusCode !== 200) {
                return reject(err);
            }
            return resolve(body);
        })
    })
}


module.exports = E621Wrapper;