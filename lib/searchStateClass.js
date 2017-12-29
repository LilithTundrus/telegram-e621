
class searchState {
    constructor(options) {
        this.lastSentMessageID = options.lastSentMessageID;
        this.searchSceneArray = options.searchSceneArray;
        this.currentIndex = options.currentIndex;
        this.teleID = options.teleID
    }
}

module.exports = searchState;