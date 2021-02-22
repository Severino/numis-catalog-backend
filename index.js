const express = require("express")
const { loadSchemaSync } = require('@graphql-tools/load');

const { GraphQLFileLoader } = require('@graphql-tools/graphql-file-loader');
const { addResolversToSchema } = require('graphql-tools');
const cors = require("cors")
const { graphqlHTTP } = require("express-graphql")

const Resolver = require("./src/resolver.js")
const MintResolver = require("./src/resolver/mintresolver.js");
const Database = require("./src/utils/database.js");
const PersonResolver = require("./src/resolver/personresolver.js");
const SQLUtils = require("./src/utils/sql.js");
const Type = require("./src/utils/type.js");

require("dotenv").config()

const app = express()

/**
 * The cors middleware allows (currently) all cross-domain calls.
 * TODO: Only allow cors calls from the website! This is a severe security risk!
 */
app.use(cors())

/**
 * The Resolver class combines the basic operations of
 * get, add, delete, update and list in one convenient utility.
 */
const resolverClasses = [
    new Resolver("material"),
    new MintResolver("mint"),
    new Resolver("title"),
    new PersonResolver("person"),
    new Resolver("honorific"),
    new Resolver("nominal")
]



/**
 *  Here custom resolvers are added to the object.
 */
const resolvers = {
    Query: {
        ping: () => Date.now(),
        getPersonsByRole: function (_, args) {
            return Database.any("SELECT * FROM Person WHERE role=$1", args.role)
        },
        getPersonsWithRole: function (_, args) {
            return Database.any("SELECT * FROM Person WHERE role IS NOT NULL")
        },
        getOverlord: function (_, args) {
            return getOverlord(args.id)
        },
        getCoinType: async function (_, args) {
            const result = await Database.any(`
            SELECT t.*, m.id AS mint_id, m.name AS mint_name, n.id AS nominal_id, n.name AS nominal_name, p.id AS caliph_id, p.name AS caliph_name FROM type t 
            JOIN mint m 
            ON t.mint = m.id
            JOIN nominal n 
            ON t.mint = n.id
            JOIN person p
            ON t.caliph = p.id
            WHERE t.id=1
            `, args.id)

            const type = result[0]

            const config = [
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

            SQLUtils.getOverlord()

        }
    }, Mutation: {
        addCoinType: async function (_, args) {
            const data = args.data

            data.front_side_field_text = data.avers.fieldText
            data.front_side_inner_inscript = data.avers.innerInscription
            data.front_side_intermediate_inscript = data.avers.intermediateInscription
            data.front_side_outer_inscript = data.avers.outerInscription
            data.front_side_misc = data.avers.misc
            data.back_side_field_text = data.reverse.fieldText
            data.back_side_inner_inscript = data.reverse.innerInscription
            data.back_side_intermediate_inscript = data.reverse.intermediateInscription
            data.back_side_outer_inscript = data.reverse.outerInscription
            data.back_side_misc = data.reverse.misc


            const result = await Database.any(`
            INSERT INTO type (
                project_id, 
                treadwell_id, 
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
                ) RETURNING *
            `, data)

            const type = result[0]
            const id = type.id

            for (const overlord of data.overlords) {
                overlord.type = id
                console.log(overlord.titles)
                await Type.addOverlord(overlord).catch(console.log)
            }

            // for (const issuer of data.issuer) {
            //     issuer.type = id
            //     await Type.addIssuer(issuer).catch(console.log)
            // }

            // for (const personId of data.otherPersons) {
            //     await Database.any("INSERT INTO other_person (type, person) VALUES ($[typeId], $[personId])", { typeId: id, personId }).catch(console.log)
            // }

            // for (const piece of data.pieces) {
            //     await Database.any("INSERT INTO piece (type, piece) VALUES($[typeId], $[piece])", { typeId: id, piece }).catch(console.log)
            // }
        }, addOverlord(_, args) {
            return Type.addOverlord(args.data)
        }

    }
}


/**
 * The schema file describes the requests a user can query 
 * to the graphql interface. 
 */
const schemaFile = loadSchemaSync("./src/graphql/schema.graphql", { loaders: [new GraphQLFileLoader()] })

resolverClasses.forEach((resolverClass) => {
    Object.assign(resolvers.Query, resolverClass.resolvers.Query)
    Object.assign(resolvers.Mutation, resolverClass.resolvers.Mutation)
})


/**
 * The loaded schema is combined with the resolvers.
 */
const schema = addResolversToSchema({
    schema: schemaFile, resolvers: {
        Query: Object.assign({}, resolvers.Query),
        Mutation: Object.assign({}, resolvers.Mutation)
    }
})


/**
 * Route of the GraphQL endpoint.
 */
app.use('/graphql', graphqlHTTP({
    schema,
    graphiql: true
}))


app.use("/", (req, res, next) => {
    res.send("Welcome")
})


app.listen(process.env.PORT, () => {
    console.log(`Express GraphQL Server Is Running On http://localhost:${process.env.PORT}/graphql`)
})


