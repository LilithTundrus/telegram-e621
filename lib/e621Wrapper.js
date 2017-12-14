'use strict';

// document the e621 endpoints here


const request = require('request');
const rp = require('request-promise');
const CONFIG = require('../config/config.js')



// main way to get e621Urls
async function requestUrl(opts) {
    let res;
    return res = await rp(opts)
}

exports.requestUrl = requestUrl