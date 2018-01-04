
class searchState {
    constructor(options) {
        this.lastSentMessageID = options.lastSentMessageID;
        this.initialMessageID = options.initialMessageID;
        this.searchSceneArray = options.searchSceneArray;
        this.currentIndex = options.currentIndex;
        this.rateLimit = 0;
    }
}

module.exports = searchState;