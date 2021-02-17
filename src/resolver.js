const Database = require("./utils/database.js")

class Resolver {

    constructor(name) {
        this.name = name
    }

    get capitalizedName() {
        return this.name[0].toUpperCase() + this.name.substr(1)
    }

    get resolvers() {
        const resolvers = {
            Query: {},
            Mutation: {}
        }
        resolvers.Mutation[`add${this.capitalizedName}`] = this.add.bind(this)
        resolvers.Mutation[`update${this.capitalizedName}`] = this.update.bind(this)
        resolvers.Mutation[`delete${this.capitalizedName}`] = this.delete.bind(this)
        resolvers.Query[`${this.name}`] = this.list.bind(this)
        resolvers.Query[`get${this.capitalizedName}`] = this.get.bind(this)
        resolvers.Query[`search${this.capitalizedName}`] = this.search.bind(this)
        return resolvers
    }

    async add(_, args) {
        const object = args.data
        return this.request(`INSERT INTO ${this.name} (${Object.keys(object).join(",")}) VALUES (${Object.keys(object).map((_, idx) => `$${idx + 1}`)})`, Object.values(object))
    }

    async update(_, args) {
        const object = args.data
        const id = object.id
        delete object.id
        const query = `UPDATE ${this.name} SET ${Object.keys(object).map((val, idx) => `${val}=$${idx + 2}`)} WHERE id=$1`
        return this.request(query, [id, ...Object.values(object)])
    }

    async delete(_, args) {
        return this.request(`DELETE FROM ${this.name} WHERE id=$1`, [args.id])
    }

    async get(_, args) {
        let p = Database.one(`SELECT * FROM ${this.name} WHERE id=$1`, [args.id]).catch(console.log)
        return p
    }

    async list() {
        const query = `SELECT * FROM ${this.name}`
        const result = await this.request(query)
        console.log(this.name)
        return result || []
    }

    async search(_, args) {
        return Database.any(`SELECT * FROM ${this.name} WHERE name ILIKE $1`, `%${args.text}%`).catch(console.log)
    }

    async request(query, params = []) {
        return Database.any(query, params).catch(console.log)
    }
}


module.exports = Resolver