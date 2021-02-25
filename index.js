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
            return Type.getOverlord(args.id)
        },
        getReducedCoinTypeList: async function () {
            return Type.getTypesReducedList()
        },
        getCoinType: async function (_, args) {
            return Type.getType(args.id)
        }
    }, Mutation: {
        addCoinType: async function (_, args) {
            if (args.data.id) delete args.data.id
            return Type.addType(args.data)
        },
        updateCoinType(_,args) {
            return Type.updateType(args.id, args.data)
        },
        addOverlord(_, args) {
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


