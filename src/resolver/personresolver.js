const Resolver = require("../resolver.js")
const { Database } = require("../utils/database.js")
const SQLUtils = require("../utils/sql.js")
const { objectifyBulk, transformPropertyToSnakeCase } = require("../utils/sql.js")

class PersonResolver extends Resolver {

    constructor() {
        super("person")
    }

    async add(_, args){
        args.data = transformPropertyToSnakeCase(args.data, "shortName")
        return super.add(_, args)
    }

    async update(_, args){
        SQLUtils.removeNullProperty(args, "dynasty")
        SQLUtils.removeNullProperty(args, "role")

        return super.update(_, args)
    }

    async get(_, args) {
        let result = await Database.one(`
        SELECT p.id, p.name, p.short_name,
        r.id AS role_id, r.name AS role_name,
        d.id AS dynasty_id, d.name AS dynasty_name
        FROM $[table:name] p
        LEFT JOIN person_role r ON p.role = r.id 
        LEFT JOIN dynasty d ON p.dynasty = d.id
        WHERE p.id=$[id]
        ORDER BY name ASC
        `, {
            table: this.tableName,
            id:args.id
        })

        return this.decomposePersonResult(result)
    }

    decomposePersonResult(result) {
        result = objectifyBulk(result, this.objectifyConfigs)
        result = SQLUtils.transformPropertyToCamelCase(result, "short_name")
        return result
    }


    async list() {

        let result = await Database.manyOrNone(`
        SELECT p.id, p.name, p.short_name,
        r.id AS role_id, r.name AS role_name,
        d.id AS dynasty_id, d.name AS dynasty_name
        FROM $[table:name] p
        LEFT JOIN person_role r ON p.role = r.id 
        LEFT JOIN dynasty d ON p.dynasty = d.id
        ORDER BY name ASC`, {
            table: this.tableName
        })

        result = result.map(item => {
            return this.decomposePersonResult(item)
        })


        return result
    }

    async search(_, args) {

        let result = await Database.any(`
        SELECT p.id, p.name, p.short_name,
        r.id AS role_id, r.name AS role_name,
        d.id AS dynasty_id, d.name AS dynasty_name
        FROM $[table:name] p
        LEFT JOIN person_role r ON p.role = r.id 
        LEFT JOIN dynasty d ON p.dynasty = d.id
        WHERE unaccent(p.name) 
        ILIKE $[search] 
        ORDER BY p.name ASC
        `, {
            table: this.tableName,
            search: `%${args.text}%`
        })

        return result.map(this.decomposePersonResult.bind(this))
    }

    async request(query, params = []) {
        return Database.any(query, params)
    }


    get dynastyObjectyifyConfig() {
        return {
            prefix: "dynasty_",
            target: "dynasty",
            keys: ["id", "name"]
        }
    }

    get roleObjectifyConfig() {
        return {
            prefix: "role_",
            target: "role",
            keys: ["id", "name"]
        }
    }

    get objectifyConfigs() {
        return [this.roleObjectifyConfig, this.dynastyObjectyifyConfig]
    }
}

module.exports = PersonResolver