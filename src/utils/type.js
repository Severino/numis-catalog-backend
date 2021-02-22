const Database = require("./database")
const SQLUtils = require("./sql")

class Type {

    static async addIssuer({
        type = null,
        person = null,
        titles: [],
        honorifics: []
    } = {}) {


        const insert = await Database.any(`
        INSERT INTO issuer (type, person) 
        VALUES ($[type],$[person]) 
        RETURNING id;
        `, {
            type,
            person
        })

        const promises = []

        if (insert.length == 1) {
            const issuer_id = insert[0].id

            titles.forEach((title) => {
                const p = Database.any("INSERT INTO issuer_titles(issuer_id, title_id) VALUES($1, $2)", [issuer_id, title])
                promises.push(p)
            })

            honorifics.forEach((honorific) => {
                const p = Database.any("INSERT INTO issuer_honorifics(issuer_id, honorific_id) VALUES($1, $2)", [issuer_id, honorific])
                promises.push(p)
            })
        }

        return Promise.all(promises)
    }

    static async addOverlord({
        type = null,
        person = null,
        rank = null,
        titles = [],
        honorifics = []
    } = {}) {


        const insert = await Database.any(`
        INSERT INTO overlord (type, person, rank) 
        VALUES ($[type],$[person],$[rank]) 
        RETURNING id;
        `, { type, person, rank })

        const promises = []


        if (insert.length >= 1) {
            const overlord_id = insert[0].id

            titles.forEach((title) => {
                const p = Database.any("INSERT INTO overlord_titles(overlord_id, title_id) VALUES($1, $2)", [overlord_id, title])
                promises.push(p)
            })

            honorifics.forEach((honorific) => {
                const p = Database.any("INSERT INTO overlord_honorifics(overlord_id, honorific_id) VALUES($1, $2)", [overlord_id, honorific])
                promises.push(p)
            })
        }

        return Promise.all(promises)
    }

    static async getOverlord(id) {

        const request = await Database.one(
            `
            SELECT o.id, o.rank, o.type, p.id as person_id, p.name as person_name, p.role as person_role, t.title_names, t.title_ids, h.honorific_names, h.honorific_ids FROM overlords o 
            JOIN (
                 SELECT ot.overlord_id AS id, array_agg(t.name) AS title_names, array_agg(t.id) AS title_ids
                 FROM overlord_titles ot
                 JOIN title t ON t.id = ot.title_id
                 GROUP BY ot.overlord_id
            ) t USING(id)
            JOIN (
                 SELECT oh.overlord_id AS id, array_agg(h.name) AS honorific_names, array_agg(h.id) AS honorific_ids
                 FROM overlord_honorifics oh
                 JOIN honorific h ON h.id = oh.honorific_id
                 GROUP BY oh.overlord_id
            ) h USING(id)
            INNER JOIN person p
                ON o.person = p.id
        `)

        const config = [
            {
                prefix: "person_",
                target: "person",
                keys: ["id", "name", "role"]
            }
        ]

        SQLUtils.objectifyBulk(request, config)


        const arrays = [
            {
                target: "honorifics",
                prefix: "honorific_",
                keys: ["ids", "names"],
                to: ["id", "name"]
            },
            {
                target: "titles",
                prefix: "title_",
                keys: ["ids", "names"],
                to: ["id", "name"]
            },
        ]

        SQLUtils.listifyBulk(request, arrays)

        return Promise.resolve(request)
    }
}

module.exports = Type