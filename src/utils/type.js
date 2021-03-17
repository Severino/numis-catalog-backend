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
            isolated_characters = $[isolatedCharacters],
            literature = $[literature],
            vassal=$[vassal],
            specials=$[specials]
            WHERE id = $[id] 
        `, Object.assign({ id }, data))


            await t.none("DELETE FROM overlord WHERE type=$1", id)
            await t.none("DELETE FROM issuer WHERE type=$1", id)
            await t.none("DELETE FROM other_person WHERE type=$1", id)
            await t.none("DELETE FROM piece WHERE type=$1", id)

            await this.addOverlords(t, data, id)
            await this.addIssuers(t, data, id)
            await this.addOtherPersons(t, data, id)
            await this.addPieces(t, data, id)
            return id
        })
    }

    static removeEmptyTitlesAndHonorifics(titledPerson) {
        function removeEmpty (el) {
            // This is not ideal, as the id in PSQL could be 0.
            // But only when explicitly defined. Otherwise counting starts at 1.
            // Therefore this should be fine. 
            return el != null && el != 0
        }
        titledPerson.titles = titledPerson.titles.filter(removeEmpty)
        titledPerson.honorifics = titledPerson.honorifics.filter(removeEmpty)
    }

    static unwrapCoinSideInformation(target, prefix, {
        fieldText = "",
        innerInscript = "",
        intermediateInscript = "",
        outerInscript = "",
        misc = ""
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
                isolated_characters,
                literature,
                vassal,
                specials
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
               $[literature],
               $[vassal],
                $[specials]
                ) RETURNING id
            `, data)


            await this.addOverlords(t, data, type)
            await this.addIssuers(t, data, type)
            await this.addOtherPersons(t, data, type)
            await this.addPieces(t, data, type)
            return type
        })
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

    static async getOtherPersonsByType(type_id) {
        const result = await Database.multi(`
        SELECT p.* FROM other_person op 
        JOIN person p
            ON op.person = p.id
			WHERE op.type=$1
        `, type_id)
        return result.length > 0 ? result[0] : []
    }

    static async getPieces(type_id) {
        const result = await Database.multi(`
        SELECT piece.piece FROM piece
			WHERE piece.type=$1
        `, type_id)

        return result.length > 0 ? result[0].map((obj) => obj.piece) : [];
    }

}

module.exports = Type