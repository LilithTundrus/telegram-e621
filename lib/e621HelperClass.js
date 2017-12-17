'use strict';
// document the e621 endpoints here
// the goal is to do NOTHING with the data but simply return it
const request = require('request');
const rp = require('request-promise');
const CONFIG = require('../config/config.js');
const Logger = require('../lib/loggerClass.js');
const utils = require('./utils.js');
const BASE_URL = CONFIG.e621BaseUrl;
const USER_AGENT = CONFIG.USER_AGENT;
const logger = new Logger();                                          // Create an instance of our custom logger

class e621Helper {
    constructor(options) {
        //TODO: Actually assign options using object.assign
    }

    /**
     * Get the currently set E621 Base URL
     * @returns {string}
     * @memberof e621Helper
     */
    getE621BaseURL() {
        return CONFIG.e621BaseUrl;
    }

    getE621PostIndex(tags, page, limit) {
        var tagsString;
        var pageString;
        var limitString;
        if (!tags) {
            tagsString = ''
        } else {
            tagsString = `tags=${tags}`
        }
        if (!page) {
            pageString = 'page=1';
        } else {
            pageString = `page=${page}`
        }
        if (!limit) {
            limitString = '50';
        } else {
            limitString = limit;
        }
        // resolve args to create the URL
        let url = `https://e621.net/post/index.json?${tagsString}&${pageString}&limit=${limitString}`;
        return requestUrl(url)
            .then((response) => {
                return response;
            })
            .catch((err) => {
                logger.error(err);
            })
    }

    //Search the e621 index by provided tags (supports order:score/etc)
    getE621PostIndexPaginate(tags, start, limitPerPage, pageLimit) {
        //TODO: make this an options obj!
        var tagsString;
        var pageString;
        var limitString;
        var pageLimitString;
        if (!tags) {
            tagsString = '';
        } else {
            tagsString = `tags=${tags}`;
        }
        if (!start) {
            pageString = 1;
        } else {
            pageString = start;
        }
        if (!limitPerPage) {
            limitString = '50';
        } else {
            limitString = limitPerPage;
        }
        if (!pageLimit) {
            pageLimitString = '3';
        } else {
            pageLimitString = pageLimit;
        }
        var dataArray = [];                                         // Empty array, likely not needed but eh?
        return paginateE621Endpoint(`https://e621.net/post/index.json?${tagsString}&limit=${limitString}`, start, pageLimit, dataArray);
    }

    paginateE621Endpoint() {
        var dataArray = [];                                         // Empty array, likely not needed but eh?
        return paginateE621Endpoint(`https://e621.net/post/index.json?`, 1, 3, dataArray);
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
 * Generate a .JSON file with ALL NON-Null e621 tags possible
 * NEEDS PAGINATION TO WORK FIRST
 */
function generateTagListJSON() {

}

/**
 * Request an E621 URL endpoint and recursively get all pages of information up to the limit set
 * 
 * Note: Page 0 and 1 are the same results so we start at 1, not 0 (Sorry)
 * 
 * Note: This is a RECURSIVE function!!
 * 
 * Note: For some endpoints the maximum is 750 pages (which should be fine)
 * @param {String} urlWithoutPageNum 
 * @param {Number} start 
 * @param {Number} limit 
 * @param {Array} pageArray 
 * @returns {<utils.e621PostData>} Returns a 2D array
 */
function paginateE621Endpoint(urlWithoutPageNum, start, limit, pageArray) {
    return requestUrl(`${urlWithoutPageNum}&page=${start}`)
        .then((response) => {
            logger.debug(response.length);
            if (response.length !== 0 && limit !== start) {
                pageArray.push(response);
                return paginateE621Endpoint(urlWithoutPageNum, start + 1, limit, pageArray)
            } else {
                // still push the last response!
                if (response.length !== 0) {
                    pageArray.push(response);
                }
                // Debugging
                pageArray.forEach((entry, index) => {
                    logger.debug(JSON.stringify(entry[0], null, 2));
                })
                logger.debug(`Done, got ${pageArray.length} pages`);
                return pageArray;
            }
        })
        .catch((err) => {
            logger.error(err);
        })
}

function getPostByID(postID) {
    // get a post's data by its ID using the e621 API
}

/**
 * Request an e621 URL using constant headers (user-agent, etc.)
 * @param {String} url 
 * @returns {Promise<Body>}
 */
function requestUrl(url) {
    // set up the options so we don't have to constantly redefine our user agent
    logger.debug(`URL is: ${url}`)
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