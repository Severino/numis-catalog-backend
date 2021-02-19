

class StringUtils {
    static isEmptyOrWhitespaces(text) {
        return text === null || text.match(/^ *$/) !== null;
    }

}

module.exports = StringUtils