class SQLUtils {


    static objectifyBulk(obj, config) {
        config.forEach(conf => {
            this.objectify(obj, conf)
        })
    }

    static objectify(obj, config) {
        obj[config.target] = {}
        config.keys.forEach(key => {
            if (obj[config.prefix + key]) {
                obj[config.target][key] = obj[config.prefix + key]
                delete obj[config.prefix + key]
            }
        })
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
}

module.exports = SQLUtils