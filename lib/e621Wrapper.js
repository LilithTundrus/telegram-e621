'use strict';

// document the e621 endpoints here

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
                logger.debug(response);
                return response
            })
    }

}



function generateAPIKeyURL(username, password) {
    let URL = `${BASE_URL}user/login.json?name="${username}"&password="${password}"`;
    return URL;
}

// main way to get e621Urls
async function requestUrl(opts) {
    let res;
    return res = await rp(opts);
}

module.exports = E621Wrapper;