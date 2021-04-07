const { request } = require("express")
const { Database, pgp } = require("./database")
const SQLUtils = require("./sql")

class Type {


    static async updateType(id, data) {
        if (!id) throw new Error("Id is required for update.")
        /**
         * Thus the avers and reverse data is nested inside a seperate object,
         * inside the GraphQL interface, we need to transform whose properties
         * to the top level, to store them inside the database.
         * 
         * ADDITIONALLY: The 'unwrapCoinSideInformation' takes care of creating
         * empty properties, if the CoinSideInformation is not provided and
         * therefore null.
         */
        this.unwrapCoinSideInformation(data, "front_side_", data.avers)
        this.unwrapCoinSideInformation(data, "back_side_", data.reverse)

        return Database.tx(async t => {

            data.id = id
            await t.none(`
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
            literature = $[literature],
            specials=$[specials],
            exclude_from_type_catalogue=$[excludeFromTypeCatalogue],
            exclude_from_map_app=$[excludeFromMapApp],
            internal_notes = $[internalNotes]
            WHERE id = $[id] 
        `, data)


            await t.none("DELETE FROM overlord WHERE type=$1", id)
            await t.none("DELETE FROM issuer WHERE type=$1", id)
            await t.none("DELETE FROM other_person WHERE type=$1", id)
            await t.none("DELETE FROM piece WHERE type=$1", id)
            await t.none("DELETE FROM type_coin_marks WHERE type=$1", id)

            await this.addOverlords(t, data, id)
            await this.addIssuers(t, data, id)
            await this.addOtherPersons(t, data, id)
            await this.addPieces(t, data, id)
            await this.addCoinMarks(t, data, id)

            return id
        })
    }

    static removeEmptyTitlesAndHonorifics(titledPerson) {
        function removeEmpty(el) {
            // This is not ideal, as the id in PSQL could be 0.
            // But only when explicitly defined. Otherwise counting starts at 1.
            // Therefore this should be fine. 
            return el != null && el != 0
        }
        titledPerson.titles = titledPerson.titles.filter(removeEmpty)
        titledPerson.honorifics = titledPerson.honorifics.filter(removeEmpty)
    }

    static wrapCoinSideInformation(source, prefix) {
        const coinSideInformation = {}
        coinSideInformation.fieldText = source[prefix + "field_text"]
        delete source[prefix + "field_text"]
        coinSideInformation.innerInscript = source[prefix + "inner_inscript"]
        delete source[prefix + "inner_inscript"]
        coinSideInformation.intermediateInscript = source[prefix + "intermediate_inscript"]
        delete source[prefix + "intermediate_inscript"]
        coinSideInformation.outerInscript = source[prefix + "outer_inscript"]
        delete source[prefix + "outer_inscript"]
        coinSideInformation.misc = source[prefix + "misc"]
        delete source[prefix + "misc"]

        return coinSideInformation
    }

    static unwrapCoinSideInformation(target, prefix, {
        fieldText,
        innerInscript,
        intermediateInscript,
        outerInscript,
        misc,
    } = {}) {
        let infos = {
            fieldText,
            innerInscript,
            intermediateInscript,
            outerInscript,
            misc
        }

        for (let [key, value] of Object.entries(infos)) {
            key = key.replace(/([A-Z]{1})/g, (match) => {
                return `_${match.toLowerCase()}`
            })
            const fullKey = prefix + key
            target[fullKey] = value
        }

        return target
    }

    static async addType(data) {
        /**
         * Thus the avers and reverse data is nested inside a seperate object,
         * inside the GraphQL interface, we need to transform whose properties
         * to the top level, to store them inside the database.
         * 
         * ADDITIONALLY: The 'unwrapCoinSideInformation' takes care of creating
         * empty properties, if the CoinSideInformation is not provided and
         * therefore null.
         */
        this.unwrapCoinSideInformation(data, "front_side_", data.avers)
        this.unwrapCoinSideInformation(data, "back_side_", data.reverse)

        return Database.tx(async t => {

            const { id: type } = await t.one(`
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
                literature,
                specials,
                exclude_from_type_catalogue,
                exclude_from_map_app,
                internal_notes
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
               $[literature],
                $[specials],
                $[excludeFromTypeCatalogue],
                $[excludeFromMapApp],
                $[internalNotes]
                ) RETURNING id
            `, data)


            await this.addOverlords(t, data, type)
            await this.addIssuers(t, data, type)
            await this.addOtherPersons(t, data, type)
            await this.addPieces(t, data, type)
            await this.addCoinMarks(t, data, type)
            return type
        })
    }

    static async addCoinMarks(t, data, type) {

        data.coinMarks = data.coinMarks.filter(coinMark => coinMark != null)
        for (let coinMark of data.coinMarks.values()) {
            await t.none("INSERT INTO type_coin_marks (coin_mark, type) VALUES ($1,$2)", [coinMark, type])
        }
    }

    static async addPieces(t, data, type) {
        for (let piece of data.pieces.values()) {
            await t.none("INSERT INTO piece (piece, type) VALUES ($1,$2)", [piece, type])
        }
    }

    static async addOtherPersons(t, data, type) {
        for (let otherPerson of data.otherPersons.values()) {
            await t.none("INSERT INTO other_person (person, type) VALUES ($1,$2)", [otherPerson, type])
        }
    }

    static async addIssuers(t, data, type) {
        for (let issuer of data.issuers.values()) {
            issuer.type = +type
            this.removeEmptyTitlesAndHonorifics(issuer)
            let { id: issuer_id } = await t.one(pgp.helpers.insert(issuer, ["type", "person"], "issuer") + " RETURNING id")

            for (let title of issuer.titles.values()) {
                await t.none("INSERT INTO issuer_titles(issuer, title) VALUES($1, $2)", [issuer_id, title])
            }

            for (let honorific of issuer.honorifics.values()) {
                await t.none("INSERT INTO issuer_honorifics(issuer, honorific) VALUES($1, $2)", [issuer_id, honorific])
            }
        }
    }

    static async addOverlords(t, data, type) {
        for (let overlord of data.overlords.values()) {
            overlord.type = +type
            overlord.rank = +overlord.rank
            this.removeEmptyTitlesAndHonorifics(overlord)
            let { id: overlord_id } = await t.one(pgp.helpers.insert(overlord, ["rank", "type", "person"], "overlord") + " RETURNING id")
            for (let title of overlord.titles.values()) {
                await t.none("INSERT INTO overlord_titles(overlord_id, title_id) VALUES($1, $2)", [overlord_id, title])
            }

            for (let honorific of overlord.honorifics.values()) {
                await t.none("INSERT INTO overlord_honorifics(overlord_id, honorific_id) VALUES($1, $2)", [overlord_id, honorific])
            }
        }
    }

    static async getTypesReducedList() {
        let typeList = await Database.manyOrNone(`SELECT 
        id, project_id , treadwell_id,
        CASE 
            WHEN tc.type IS NULL THEN false
            ELSE true
        END AS completed
        FROM type t
        LEFT JOIN type_completed tc ON t.id = tc.type
        ORDER BY project_id
        `)

        const map = {
            project_id: "projectId",
            treadwell_id: "treadwellId"
        }

        typeList = typeList.map(type => {
            for (let [key, val] of Object.entries(map)) {
                type[val] = type[key]
            }
            return type
        })

        return typeList
    }

    static async getTypes() {
        const result = await Database.manyOrNone(`
        SELECT t.*, ma.id AS material_id, ma.name AS material_name, mi.id AS mint_id, mi.name AS mint_name, n.id AS nominal_id, n.name AS nominal_name, p.id AS caliph_id, p.name AS caliph_name FROM type t 
        LEFT JOIN material ma 
        ON t.material = ma.id
        LEFT JOIN mint mi 
        ON t.mint = mi.id
        LEFT JOIN nominal n 
        ON t.nominal = n.id
        LEFT JOIN person p
        ON t.caliph = p.id
        `)


        for (let [idx, type] of result.entries()) {
            result[idx] = this.postprocessType(type)
        }

        return result
    }

    static async getType(id) {
        if (!id) throw new Error("Id must be provided!")

        const result = await Database.one(`
            SELECT t.*, ma.id AS material_id, ma.name AS material_name, mi.id AS mint_id, mi.name AS mint_name, n.id AS nominal_id, n.name AS nominal_name, p.id AS caliph_id, p.name AS caliph_name FROM type t 
            LEFT JOIN material ma 
            ON t.material = ma.id
            LEFT JOIN mint mi 
            ON t.mint = mi.id
            LEFT JOIN nominal n 
            ON t.nominal = n.id
            LEFT JOIN person p
            ON t.caliph = p.id
            WHERE t.id=$1
            `, id).catch(() => {
            throw new Error("Requested type does not exist!")
        })

        return await this.postprocessType(result);
    }

    static async getTypesByOverlord(person) {
        if (!person) throw new Error("Person must be provided!")
        // const result = await Database.one(
        //     , person).catch(() => {
        //     throw new Error("Requested type does not exist!")
        // })




        const result = await Database.manyOrNone(`
        WITH blah AS(
            SELECT type FROM overlord WHERE person = $1
        )
        SELECT t.*, ma.id AS material_id, ma.name AS material_name, mi.id AS mint_id, mi.name AS mint_name, n.id AS nominal_id, n.name AS nominal_name, p.id AS caliph_id, p.name AS caliph_name FROM type t 
        LEFT JOIN material ma 
        ON t.material = ma.id
        LEFT JOIN mint mi 
        ON t.mint = mi.id
        LEFT JOIN nominal n 
        ON t.nominal = n.id
        LEFT JOIN person p
        ON t.caliph = p.id
        WHERE t.id IN (SELECT type FROM blah)
        `, person);

        for (let [key, value] of result.entries()) {
            result[key] = await this.postprocessType(value)
        }


        return result
    }

    static async postprocessType(type) {

        if (!type) throw new Error(`Type was not provided!`)

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

        type.avers = this.wrapCoinSideInformation(type, "front_side_")
        type.reverse = this.wrapCoinSideInformation(type, "back_side_")

        type.overlords = await Type.getOverlordsByType(type.id)
        type.issuers = await Type.getIssuerByType(type.id)
        type.otherPersons = await Type.getOtherPersonsByType(type.id)
        type.pieces = await Type.getPieces(type.id)
        type.coinMarks = await Type.getCoinMarks(type.id)



        for (let [key, val] of Object.entries(this.databaseToGraphQlMap)) {
            if (type[key] != null) {
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
            exclude_from_type_catalogue: "excludeFromTypeCatalogue",
            exclude_from_map_app: "excludeFromMapApp",
            internal_notes: "internalNotes"
        }
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
            LEFT JOIN (
                 SELECT ot.overlord_id AS id, array_agg(t.name) AS title_names, array_agg(t.id) AS title_ids
                 FROM overlord_titles ot
                 JOIN title t ON t.id = ot.title_id
                 GROUP BY ot.overlord_id
            ) t USING(id)
            LEFT JOIN (
                 SELECT oh.overlord_id AS id, array_agg(h.name) AS honorific_names, array_agg(h.id) AS honorific_ids
                 FROM overlord_honorifics oh
                 JOIN honorific h ON h.id = oh.honorific_id
                 GROUP BY oh.overlord_id
            ) h USING(id)
            INNER JOIN person p
                ON o.person = p.id
			WHERE o.type =$1
            ORDER BY o.rank ASC
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
            LEFT JOIN (
                 SELECT it.issuer AS id, array_agg(t.name) AS title_names, array_agg(t.id) AS title_ids
                 FROM issuer_titles it
                 JOIN title t ON t.id = it.title
                 GROUP BY it.issuer
            ) t USING(id)
            LEFT JOIN (
                 SELECT ih.issuer AS id, array_agg(h.name) AS honorific_names, array_agg(h.id) AS honorific_ids
                 FROM issuer_honorifics ih
                 JOIN honorific h ON h.id = ih.honorific
                 GROUP BY ih.issuer
            ) h USING(id)
            INNER JOIN person p
                ON i.person = p.id
			WHERE i.type =$1
        `, type_id)

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

    static async getCoinMarks(type_id) {
        return await Database.manyOrNone(`
        SELECT cm.* FROM type_coin_marks tcm
        LEFT JOIN coin_marks cm
            ON tcm.coin_mark = cm.id
			WHERE tcm.type = $1
        `, type_id)
    }

    static async getOtherPersonsByType(type_id) {
        return await Database.manyOrNone(`
        SELECT p.* FROM other_person op 
        LEFT JOIN person p
            ON op.person = p.id
			WHERE op.type=$1
        `, type_id)
    }

    static async getPieces(type_id) {
        let results = await Database.manyOrNone(`
        SELECT piece.piece FROM piece
			WHERE piece.type=$1
        `, type_id)

        return results.map(res => res.piece)
    }

}

module.exports = Type