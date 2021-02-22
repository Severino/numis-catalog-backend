class SQLUtils {


    static objectifyBulk(obj, config) {
        config.forEach(conf => {
            this.objectify(obj, conf)
            
        })
        console.log(obj)
    }

    static objectify(obj, config) {
        obj[config.target] = {}
        config.keys.forEach(key => {
            obj[config.target][key] = obj[config.prefix + key]
            delete obj[config.prefix + key]
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
            obj[config.prefix + key].forEach((entry, i) => {
                if (!obj[config.target][i]) obj[config.target].push({})
                obj[config.target][i][config.to[key_num]] = entry
            })
            delete obj[config.prefix + key]
        })
    }
}

module.exports = SQLUtils