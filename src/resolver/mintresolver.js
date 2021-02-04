const Resolver = require("../resolver.js")
const Database = require("../utils/database.js")

class MintResolver extends Resolver {

    async add(_, args) {
        this.modifyLocation(args)
        super.add(...arguments)
    }


    async update(_, args) {
        this.modifyLocation(args)
        super.update(...arguments)
    }

    async get(_, args) {
        let p = await Database.one(`SELECT *,ST_X(location), ST_Y(location) FROM ${this.name} WHERE id=$1`, [args.id]).catch(console.log)

        p.location = { lat: p.st_x, lon: p.st_y }
        delete p.st_x
        delete p.st_y

        return p
    }

    modifyLocation(args) {
        if (args.data.location) {
            const location = args.data.location
            args.data.location = `POINT(${location.lat} ${location.lon})`
        }
    }

}

module.exports = MintResolver