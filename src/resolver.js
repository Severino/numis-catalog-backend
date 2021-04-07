const { Database } = require("./utils/database.js")

class Resolver {

    constructor(name, { tableName = null } = {}) {
        this.name = name
        this.tableName = tableName ? tableName : this.name
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
        return this.request(`INSERT INTO ${this.tableName} (${Object.keys(object).join(",")}) VALUES (${Object.keys(object).map((_, idx) => `$${idx + 1}`)})`, Object.values(object))
    }

    async update(_, args) {
        const object = args.data
        const id = object.id

        if(!id || id <= 0) throw new Error("error.invalid_id")

        delete object.id
        const query = `UPDATE ${this.tableName} SET ${Object.keys(object).map((val, idx) => `${val}=$${idx + 2}`)} WHERE id=$1`
        return this.request(query, [id, ...Object.values(object)])
    }

    async delete(_, args) {       
        return Database.none(`DELETE FROM ${this.tableName} WHERE id=$1`, [args.id])
    }

    async get(_, args) {
        return Database.one(`SELECT * FROM ${this.tableName} WHERE id=$1 `, [args.id])
    }

    async list() {
        return Database.manyOrNone(`SELECT * FROM ${this.tableName} ORDER BY name ASC`)
    }

    async search(_, args) {
        return Database.any(`SELECT * FROM ${this.tableName} WHERE unaccent(name) ILIKE $1 ORDER BY name ASC`, `%${args.text}%`)
    }

    async request(query, params = []) {
        return Database.any(query, params)
    }
}


module.exports = Resolver