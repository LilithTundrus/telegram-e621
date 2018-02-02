
class searchStatePM {
    constructor(options) {
        this.lastSentMessageID = options.lastSentMessageID;
        this.initialMessageID = options.initialMessageID;
        this.searchSceneArray = options.searchSceneArray;
        this.currentIndex = options.currentIndex;
        this.rateLimit = options.currentIndex;
        this.originalSender = options.originalSender;
        this.chatID = options.chatID;

        this.test = function() {
            return 'bbb'
        }
    }
}

module.exports = searchStatePM;

