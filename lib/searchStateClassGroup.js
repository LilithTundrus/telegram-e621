
class searchStateGroup {
    constructor(options) {
        this.lastSentMessageID = options.lastSentMessageID;
        this.initialMessageID = options.initialMessageID;
        this.searchSceneArray = options.searchSceneArray;
        this.currentIndex = options.currentIndex;
        this.rateLimit = options.currentIndex;
        this.originalSender = options.originalSender;
        this.groupID = options.groupID;
    }
}

module.exports = searchStateGroup;