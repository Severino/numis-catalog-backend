const express = require("express")
const { loadSchemaSync } = require('@graphql-tools/load');

const { GraphQLFileLoader } = require('@graphql-tools/graphql-file-loader');
const { addResolversToSchema } = require('graphql-tools');
const cors = require("cors")
const { graphqlHTTP } = require("express-graphql")

const Resolver = require("./src/resolver.js")
const MintResolver = require("./src/resolver/mintresolver.js");
const { Database } = require("./src/utils/database.js");
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
        getOverlord: function (_, args) {
            return Type.getOverlord(args.id)
        },
        getReducedCoinTypeList: async function () {
            return Type.getTypesReducedList()
        },
        getCoinType: async function (_, args) {
            console.log(args.id)
            return Type.getType(args.id)
        },
        searchPersonsWithRole: async function (_, args) {
            const searchString = args.text
            const additionalFilter = args.filter || []
            const filter = [" ", "overlord", ...additionalFilter]
            return Database.any(`SELECT * FROM person WHERE role IS NOT NULL AND (role IN ($2:csv)) IS NOT true AND unaccent(name) ILIKE $1 ORDER BY name ASC`, [`%${searchString}%`, filter]).catch(console.log)
        },
        searchPersonsWithoutRole: async function (_, args) {
            const searchString = args.text
            return Database.any(`SELECT * FROM person WHERE (role IS NULL OR role=' ' OR role='overlord') AND unaccent(name) ILIKE $1 ORDER BY name ASC`, `%${searchString}%`).catch(console.log)
        }
    }, Mutation: {
        addCoinType: async function (_, args) {
            return Type.addType(args.data)
        },
        updateCoinType(_, args) {
            return Type.updateType(args.id, args.data) 
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


