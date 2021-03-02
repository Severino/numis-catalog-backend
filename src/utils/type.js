const { request } = require("express")
const { default: db } = require("node-pg-migrate/dist/db")
const pgPromise = require("pg-promise")
const { result } = require("./database")
const { Database, pgp } = require("./database")
const SQLUtils = require("./sql")

class Type {

    static async addIssuer({
        type = null,
        person = null,
        titles = [],
        honorifics = []
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
                const p = Database.any("INSERT INTO issuer_titles(issuer, title) VALUES($1, $2)", [issuer_id, title])
                promises.push(p)
            })

            honorifics.forEach((honorific) => {
                const p = Database.any("INSERT INTO issuer_honorifics(issuer, honorific) VALUES($1, $2)", [issuer_id, honorific])
                promises.push(p)
            })
        }

        return Promise.all(promises)
    }


    static async updateType(id, data) {
        if (!id) return Promise.reject("id is required for update.")
        /** UGLY BECAUSE OF NO TIME #cheers */
        data.front_side_field_text = data.avers.fieldText
        data.front_side_inner_inscript = data.avers.innerInscript
        data.front_side_intermediate_inscript = data.avers.intermediateInscript
        data.front_side_outer_inscript = data.avers.outerInscript
        data.front_side_misc = data.avers.misc
        data.back_side_field_text = data.reverse.fieldText
        data.back_side_inner_inscript = data.reverse.innerInscript
        data.back_side_intermediate_inscript = data.reverse.intermediateInscript
        data.back_side_outer_inscript = data.reverse.outerInscript
        data.back_side_misc = data.reverse.misc



        // const query = `
        // UPDATE type SET
        //     project_id =  ${data.projectId || null}, 
        //     treadwell_id =  ${data.treadwellId || null}, 
        //     material =  ${data.material || null},
        //     mint =  ${data.mint || null}, 
        //     mint_as_on_coin =  ${data.mintAsOnCoin || null}, 
        //     nominal =  ${data.nominal || null}, 
        //     year_of_mint =  ${data.yearOfMinting || null}, 
        //     donativ =  ${data.donativ || false}, 
        //     procedure =  ${data.procedure || "cast"}, 
        //     caliph =  ${data.caliph || null},
        //     front_side_field_text =  ${data.front_side_field_text || null},
        //     front_side_inner_inscript =  ${data.front_side_inner_inscript || null},
        //     front_side_intermediate_inscript =  ${data.front_side_intermediate_inscript || null},
        //     front_side_outer_inscript =  ${data.front_side_outer_inscript || null},
        //     front_side_misc =  ${data.front_side_misc || null},
        //     back_side_field_text =  ${data.back_side_field_text || null},
        //     back_side_inner_inscript =  ${data.back_side_inner_inscript || null},
        //     back_side_intermediate_inscript =  ${data.back_side_intermediate_inscript || null},
        //     back_side_outer_inscript =  ${data.back_side_outer_inscript || null},
        //     back_side_misc =  ${data.back_side_misc || null},
        //     cursive_script =  ${data.cursiveScript || false},
        //     isolated_characters =  ${data.isolatedCharacters || null},
        //     literature  = ${data.literature || null}
        //     WHERE id = ${id} 
        // `

        await Database.any(`
        UPDATE type 
        SET
            project_id = $[projectId],
            treadwell_id = $[treadwellId],
            material = $[material],
            mint = $[mint],
            mint_as_on_coin = $[mintAsOnCoin],
            nominal = $[nominal],
            year_of_mint = $[yearOfMinting],
            donativ = $[donativ],
            procedure = $[procedure],
            caliph = $[caliph],
            front_side_field_text = $[front_side_field_text],
            front_side_inner_inscript = $[front_side_inner_inscript],
            front_side_intermediate_inscript = $[front_side_intermediate_inscript],
            front_side_outer_inscript = $[front_side_outer_inscript],
            front_side_misc = $[front_side_misc],
            back_side_field_text = $[back_side_field_text],
            back_side_inner_inscript = $[back_side_inner_inscript],
            back_side_intermediate_inscript = $[back_side_intermediate_inscript],
            back_side_outer_inscript = $[back_side_outer_inscript],
            back_side_misc = $[back_side_misc],
            cursive_script = $[cursiveScript],
            isolated_characters = $[isolatedCharacters],
            literature = $[literature]
            WHERE id = $[id] 
        `, Object.assign({ id }, data))


        Database.any("DELETE FROM overlord WHERE type=$1", id)
        for (const overlord of data.overlords) {
            overlord.type = id
            await Type.addOverlord(overlord).catch(console.log)
        }

        Database.any("DELETE FROM issuer WHERE type=$1", id)
        for (const issuer of data.issuers) {
            issuer.type = id
            await Type.addIssuer(issuer).catch(console.log)
        }

        Database.any("DELETE FROM other_person WHERE type=$1", id)
        for (const personId of data.otherPersons) {
            await Database.any("INSERT INTO other_person (type, person) VALUES ($[typeId], $[personId])", { typeId: id, personId }).catch(console.log)
        }


        Database.any("DELETE FROM piece WHERE type=$1", id)
        for (const piece of data.pieces) {
            await Database.any("INSERT INTO piece (type, piece) VALUES($[typeId], $[piece])", { typeId: id, piece }).catch(console.log)
        }

        return null
    }



    static async addType(data) {
        /** UGLY BECAUSE OF NO TIME #cheers */
        data.front_side_field_text = data.avers.fieldText
        data.front_side_inner_inscript = data.avers.innerInscript
        data.front_side_intermediate_inscript = data.avers.intermediateInscript
        data.front_side_outer_inscript = data.avers.outerInscript
        data.front_side_misc = data.avers.misc
        data.back_side_field_text = data.reverse.fieldText
        data.back_side_inner_inscript = data.reverse.innerInscript
        data.back_side_intermediate_inscript = data.reverse.intermediateInscript
        data.back_side_outer_inscript = data.reverse.outerInscript
        data.back_side_misc = data.reverse.misc


        return Database.tx(async t => {

            const query = await t.one(`
            INSERT INTO type (
                project_id, 
                treadwell_id, 
                material,
                mint, 
                mint_as_on_coin, 
                nominal, 
                year_of_mint, 
                donativ, 
                procedure, 
                caliph,
                front_side_field_text,
                front_side_inner_inscript,
                front_side_intermediate_inscript,
                front_side_outer_inscript,
                front_side_misc,
                back_side_field_text,
                back_side_inner_inscript,
                back_side_intermediate_inscript,
                back_side_outer_inscript,
                back_side_misc,
                cursive_script,
                isolated_characters,
                literature
                )  VALUES (
               $[projectId],
               $[treadwellId],
               $[material],
               $[mint],
               $[mintAsOnCoin],
               $[nominal],
               $[yearOfMinting],
               $[donativ],
               $[procedure],
               $[caliph],
               $[front_side_field_text],
               $[front_side_inner_inscript],
               $[front_side_intermediate_inscript],
               $[front_side_outer_inscript],
               $[front_side_misc],
               $[back_side_field_text],
               $[back_side_inner_inscript],
               $[back_side_intermediate_inscript],
               $[back_side_outer_inscript],
               $[back_side_misc],
               $[cursiveScript],
               $[isolatedCharacters],
               $[literature]
                ) RETURNING id
            `, data)

            const type = query.id
            const subqueries = []

            const overlord_queries = data.overlords.map(overlord => {
                overlord.type = +type
                overlord.rank = +overlord.rank
                return t.one(pgp.helpers.insert(overlord, ["rank", "type", "person"], "overlord") + " RETURNING id").then(overlord_row => {
                    const overlord_id = overlord_row.id
                    const title_queries = overlord.titles.map(title => t.none("INSERT INTO overlord_titles(overlord_id, title_id) VALUES($1, $2)", [overlord_id, title]))
                    const honorific_queries = overlord.honorifics.map(honorific => t.none("INSERT INTO overlord_honorifics(overlord_id, honorific_id) VALUES($1, $2)", [overlord_id, honorific]))
                    subqueries.push(...title_queries, ...honorific_queries)
                }).catch((insert_overlord_error) => {
                    console.log("insert_overlord_error:", insert_overlord_error)
                })
            })

            const issuer_queries = data.issuers.map(issuer => {
                issuer.type = +type
                return t.one(pgp.helpers.insert(issuer, ["type", "person"], "issuer") + " RETURNING id").then(issuer_row => {
                    const issuer_id = issuer_row.id
                    const title_queries = issuer.titles.map(title => t.none("INSERT INTO issuer_titles(issuer, title) VALUES($1, $2)", [issuer_id, title]))
                    const honorific_queries = issuer.honorifics.map(honorific => t.none("INSERT INTO issuer_honorifics(issuer, honorific) VALUES($1, $2)", [issuer_id, honorific]))
                    subqueries.push(...title_queries, ...honorific_queries)
                }).catch((insert_issuer_error) => {
                    console.log("insert_issuer_error:", insert_issuer_error)
                })
            })

            const other_persons = data.otherPersons.map(otherPerson =>{
                return t.none("INSERT INTO other_person (person, type) VALUES ($1,$2)", [otherPerson, type])
            })

            const pieces = data.pieces.map(piece =>{
                return t.none("INSERT INTO piece (piece, type) VALUES ($1,$2)", [piece, type])
            })


            await t.batch(overlord_queries)
            await t.batch(issuer_queries)
            await t.batch(other_persons)
            await t.batch(pieces)
            await t.batch(subqueries)

            return query
        })
    }

    static async getTypesReducedList() {
        let typeList = await Database.any("SELECT id, project_id , treadwell_id  from type")

        const map = {
            project_id: "projectId",
            treadwell_id: "treadwellId"
        }

        typeList.forEach(type => {
            for (let [key, val] of Object.entries(map)) {
                if (type[key]) {
                    const value = type[key]
                    delete type[key]
                    type[val] = value
                }
            }
        })

        return typeList
    }

    static async getType(id) {
        console.log(id)


        const result = await Database.one(`
            SELECT t.*, ma.id AS material_id, ma.name AS material_name, mi.id AS mint_id, mi.name AS mint_name, n.id AS nominal_id, n.name AS nominal_name, p.id AS caliph_id, p.name AS caliph_name FROM type t 
            LEFT JOIN material ma 
            ON t.material = ma.id
            LEFT JOIN mint mi 
            ON t.mint = mi.id
            LEFT JOIN nominal n 
            ON t.mint = n.id
            LEFT JOIN person p
            ON t.caliph = p.id
            WHERE t.id=$1
            `, id).catch(console.log)

        if (!result) return {}

        const type = result

        const config = [
            {
                prefix: "material_",
                target: "material",
                keys: ["id", "name"]
            },
            {
                prefix: "mint_",
                target: "mint",
                keys: ["id", "name"]
            },
            {
                prefix: "nominal_",
                target: "nominal",
                keys: ["id", "name"]
            },
            {
                prefix: "caliph_",
                target: "caliph",
                keys: ["id", "name"]
            }
        ]

        config.forEach(conf => delete type[conf.target])
        SQLUtils.objectifyBulk(type, config)


        /** UGLY BECAUSE OF NO TIME #cheers */
        type.avers = {}
        type.avers.fieldText = type.front_side_field_text
        delete type.front_side_field_text
        type.avers.innerInscript = type.front_side_inner_inscript
        delete type.front_side_inner_inscript
        type.avers.intermediateInscript = type.front_side_intermediate_inscript
        delete type.front_side_intermediate_inscript
        type.avers.outerInscript = type.front_side_outer_inscript
        delete type.front_side_outer_inscript
        type.avers.misc = type.front_side_misc
        delete type.front_side_misc

        type.reverse = {}
        type.reverse.fieldText = type.back_side_field_text
        delete type.back_side_field_text
        type.reverse.innerInscript = type.back_side_inner_inscript
        delete type.back_side_inner_inscript
        type.reverse.intermediateInscript = type.back_side_intermediate_inscript
        delete type.back_side_intermediate_inscript
        type.reverse.outerInscript = type.back_side_outer_inscript
        delete type.back_side_outer_inscript
        type.reverse.misc = type.back_side_misc
        delete type.back_side_misc



        type.overlords = await Type.getOverlordsByType(type.id)
        type.issuers = await Type.getIssuerByType(type.id)
        type.otherPersons = await Type.getOtherPersonsByType(type.id)
        type.pieces = await Type.getPieces(type.id)

        for (let [key, val] of Object.entries(this.databaseToGraphQlMap)) {
            if (type[key]) {
                type[val] = type[key]
                delete type[key]
            }
        }


        return type
    }

    static get databaseToGraphQlMap() {
        return {
            project_id: "projectId",
            treadwell_id: "treadwellId",
            mint_as_on_coin: "mintAsOnCoin",
            year_of_mint: "yearOfMinting",
            cursive_script: "cursiveScript",
            isolated_characters: "isolatedCharacters"
        }
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


    static async getOverlordsByType(type_id) {

        const request = await Database.multi(
            `
            SELECT o.id, o.rank, o.type, p.id as person_id, p.name as person_name, p.role as person_role, t.title_names, t.title_ids, h.honorific_names, h.honorific_ids FROM overlord o
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
			WHERE o.type =$1
        `, type_id)

        const overlords = []

        request[0].forEach(result => {
            const config = [
                {
                    prefix: "person_",
                    target: "person",
                    keys: ["id", "name", "role"]
                }
            ]

            SQLUtils.objectifyBulk(result, config)


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

            SQLUtils.listifyBulk(result, arrays)
            overlords.push(result)
        })

        return Promise.resolve(overlords)
    }

    static async getIssuerByType(type_id) {
        const result = await Database.multi(`
        SELECT i.id, i.type, p.id as person_id, p.name as person_name, p.role as person_role, t.title_names, t.title_ids, h.honorific_names, h.honorific_ids FROM issuer i
            JOIN (
                 SELECT it.issuer AS id, array_agg(t.name) AS title_names, array_agg(t.id) AS title_ids
                 FROM issuer_titles it
                 JOIN title t ON t.id = it.title
                 GROUP BY it.issuer
            ) t USING(id)
            JOIN (
                 SELECT ih.issuer AS id, array_agg(h.name) AS honorific_names, array_agg(h.id) AS honorific_ids
                 FROM issuer_honorifics ih
                 JOIN honorific h ON h.id = ih.honorific
                 GROUP BY ih.issuer
            ) h USING(id)
            INNER JOIN person p
                ON i.person = p.id
			WHERE i.type =$1
        `, type_id).catch(console.log)


        if (request.length < 1) return []

        const issuers = []

        result[0].forEach(issuer => {
            const config = [
                {
                    prefix: "person_",
                    target: "person",
                    keys: ["id", "name", "role"]
                }
            ]

            SQLUtils.objectifyBulk(issuer, config)


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

            SQLUtils.listifyBulk(issuer, arrays)
            issuers.push(issuer)
        })


        return issuers
    }

    static async getOtherPersonsByType(type_id) {
        const result = await Database.multi(`
        SELECT p.* FROM other_person op 
        JOIN person p
            ON op.person = p.id
			WHERE op.type=$1
        `, type_id).catch(console.log)
        return result.length > 0 ? result[0] : []
    }

    static async getPieces(type_id) {
        const result = await Database.multi(`
        SELECT piece.piece FROM piece
			WHERE piece.type=$1
        `, type_id).catch(console.log)

        return result.length > 0 ? result[0].map((obj) => obj.piece) : [];
    }

}

module.exports = Type