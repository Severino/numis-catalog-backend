class SQLUtils {




    static removeNullProperty(obj, prop, name = "id") {
        if (obj[prop] && obj[prop][name] && obj[prop][name] == null) {
            delete obj[prop]
            console.log(`REMOVE ${prop} / ${name}`)
        }
    }

    /**
     * @typedef ObjectifyConfig
     * @type {object}
     * @property {string} prefix - Defines the prefix used for the target parameters (e.g. *prefix_*)
     * @property {string} target - Defines the target property, that will store the deconstructed value (e.g. 'person' would create a new object inside the result that is named 'person' which will be the parent of all properties). 
    *  @property {Array.<string>} keys - Defines the keys that are used after the prefix (e.g. we destructre person_id and person_name. Then our keys would be ["id", "name"]).
    */



    /**
     * 
     * @param {*} obj 
     * @param {*} config 
     */
    static objectifyBulk(obj, config) {
        config.forEach(conf => {
            SQLUtils.objectify(obj, conf)
        })
        return obj
    }

    /**
     * Rewraps the result of a database result into an object.
     * 
     * @example
     * 
     * When we joined the name and the id of a person to our request, the
     * result may look like this:
     * let response = {... , person_id, person_name, ...}
     * 
     * But for GraphQL we need the person to represent a single object. Then we provide
     * the config as follows:
     * let config = {
     *          prefix: "person_",
     *          target: "person",
     *          keys: ["id", "name"]
     * }
     * 
     * Running: let result = objectify(response, config)
     * Returns: [return] { ... , person: {id, name}, ...} 
     * 
     * 
     * @param {object} obj - Represents the database response object of some query.
     * @param {ObjectifyConfig} config - Defines the operations the objectify function will perform.
     */
    static objectify(obj, config) {
        obj[config.target] = {}
        config.keys.forEach(key => {
            if (obj[config.prefix + key]) {
                obj[config.target][key] = obj[config.prefix + key]
                delete obj[config.prefix + key]
            } else console.error(`Key '${config.prefix + key}' was not found on object:\n${JSON.stringify(obj)}`)
        })
        return obj
    }

    static listifyBulk(obj, config) {
        config.forEach((config) => {
            this.listify(obj, config)
        })
    }

    static listify(obj, config) {
        obj[config.target] = []
        config.keys.forEach((key, key_num) => {
            if (obj[config.prefix + key]) {
                obj[config.prefix + key].forEach((entry, i) => {
                    if (!obj[config.target][i]) obj[config.target].push({})
                    obj[config.target][i][config.to[key_num]] = entry
                })
                delete obj[config.prefix + key]
            }
        })
    }

    static transformPropertyToSnakeCase(obj, property) {
        let snakeCase = SQLUtils.camelCaseToSnakeCase(property)
        obj[snakeCase] = obj[property]
        delete obj[property]
        return obj
    }

    static camelCaseToSnakeCase(str) {
        return str.replace(/[A-Z]/g, (match) => {
            return `_${match.toLowerCase()}`
        })
    }

    static transformPropertyToCamelCase(obj, property) {
        let camelCase = SQLUtils.snakeToCamelCase(property)
        obj[camelCase] = obj[property]
        delete obj[property]
        return obj
    }

    static snakeToCamelCase(str) {
        return str.replace(/_[a-zA-Z]{1}/g, (match) => {
            return match.charAt(1).toUpperCase()
        })
    }
}

module.exports = SQLUtils