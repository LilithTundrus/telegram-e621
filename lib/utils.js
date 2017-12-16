'use strict';
/**
 * @namespace e621ResponseCodes
 */
const e621ResponseCodes = Object.freeze({
    /**200, Everything worked out ok
     * @memberof e621ResponseCodes*/
    OK: 200,
    /**403, You don't have access to that resource
     * @memberof e621ResponseCodes*/
    FORBIDDEN: 403,
    /**404, this is not the adress you were looking for
     * @memberof e621ResponseCodes*/
    NOT_FOUND: 404,
    /**420, Record could not be saved
     * @memberof e621ResponseCodes*/
    INVALID_RECORD: 420,
    /**421, User is throttled, try again later
     * @memberof e621ResponseCodes*/
    USER_THROTTLED: 421,
    /**422, The resource is locked and cannot be modified
     * @memberof e621ResponseCodes*/
    LOCKED: 422,
    /**423, Resource already exists
     * @memberof e621ResponseCodes*/
    ALREADY_EXISTS: 423,
    /**424, The given parameters were invalid
     * @memberof e621ResponseCodes*/
    INVALID_PARAMETERS: 424,
    /**500, Something went wrong
     * @memberof e621ResponseCodes*/
    INTERNAL_SERVERERROR: 500,
    /**502, Gateway received invalid response from server
     * @memberof e621ResponseCodes*/
    BAD_GATEWAY: 502,
    /**503, Server cannot currently handle the request or you have exceeded the request rate limit. Try again later or decrease your rate of request
     * @memberof e621ResponseCodes*/
    SERVICE_UNAVAILABLE: 503,
    /**520, Unexpected server response which violates protocol
     * @memberof e621ResponseCodes*/
    UNKNOWN_ERROR: 520,
    /**522, CloudFlare's attempt to connect to the e621 servers timed out
     * @memberof e621ResponseCodes*/
    ORIGIN_CONNECTION_TIMEOUT_BEFORE: 522,
    /**524, A connection was established between CloudFlare and the e621 servers, but it timed out before an HTTP response was received
     * @memberof e621ResponseCodes*/
    ORIGIN_CONNECTION_TIMEOUT_AFTER: 524,
    /**525, The SSL handshake between CloudFlare and the e621 servers failed
     * @memberof e621ResponseCodes*/
    SLL_HANDSHAKE_FAILED: 525,
});

const e621TagTypes = Object.freeze({
    general: 0,
    artist: 1,
    copyright: 3,
    character: 4,
    species: 5
});

exports.e621ResponseCodes = e621ResponseCodes;
exports.e621TagTypes = e621TagTypes;