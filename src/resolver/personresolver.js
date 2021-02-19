const Resolver = require("../resolver.js")
const StringUtils = require("../utils/stringutils.js")

class PersonResolver extends Resolver {

    async add(_, args) {
        this.fixRole(args)
        super.add(...arguments)
    }

    async update(_, args) {
        this.fixRole(args)
        super.update(...arguments)
    }

    fixRole(args) {
        if (args.data.role != undefined &&
            StringUtils.isEmptyOrWhitespaces(args.data.role)) {
            args.data.role = null
        }
    }

}

module.exports = PersonResolver