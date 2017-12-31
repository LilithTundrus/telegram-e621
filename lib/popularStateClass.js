
class popularState {
    constructor(options) {
        this.lastSentMessageID = options.lastSentMessageID;
        this.popularSceneArray = options.popularSceneArray;
        this.currentIndex = options.currentIndex;
    }
}

module.exports = popularState;