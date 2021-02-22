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
        getOverlord: async function (_, args) {
            const id = args.id

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
    }, Mutation: {
        addOverlord: async function (_, args) {

            args = args.data
            const argNames = ["type", "person", "rank"]

            const array = argNames.map((name) => {
                console.log(args[name])
                return args[name]
            })


            console.log(args.titles)
            console.log(args.honorifics)


            const insert = await Database.any(`
            INSERT INTO overlords (${argNames.join(", ")}) 
            VALUES ($1,$2,$3) 
            RETURNING id;
            `, array)

            const promises = []


            if (insert.length == 1) {
                const overlord_id = insert[0].id

                args.titles.forEach((title) => {
                    const p = Database.any("INSERT INTO overlord_titles(overlord_id, title_id) VALUES($1, $2)", [overlord_id, title])
                    promises.push(p)
                })

                args.honorifics.forEach((honorific) => {
                    const p = Database.any("INSERT INTO overlord_honorifics(overlord_id, honorific_id) VALUES($1, $2)", [overlord_id, honorific])
                    promises.push(p)
                })
            }

            return Promise.all(promises)
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


