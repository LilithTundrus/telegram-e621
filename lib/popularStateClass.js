
class popularState {
    constructor(options) {
        this.lastSentMessageID = options.lastSentMessageID;
        this.searchSceneArray = options.searchSceneArray;
        this.currentIndex = options.currentIndex;
    }
}

module.exports = popularState;