const express = require("express")
const graphql = require("graphql")
const { loadSchemaSync } = require('@graphql-tools/load');

const { GraphQLFileLoader } = require('@graphql-tools/graphql-file-loader');
const { makeExecutableSchema, addResolversToSchema } = require('graphql-tools');
const cors = require("cors")
const { graphqlHTTP } = require("express-graphql")

// const { query } = require("./src/graphql/queries.js")
const Resolver = require("./src/resolver.js")
const MintResolver = require("./src/resolver/mintresolver.js")
const app = express()
require("dotenv").config()

const resolverClasses = [
    new Resolver("material"), 
    new MintResolver("mint"), 
    new Resolver("title"), 
    new Resolver("person"),
    new Resolver("honorific") 
] 

const schemaFile = loadSchemaSync("./src/graphql/schema.graphql", { loaders: [new GraphQLFileLoader()] })

app.use(cors()) 
 

const resolvers = { Query: {}, Mutation: {} }
resolverClasses.forEach((resolverClass) => {
    Object.assign(resolvers.Query, resolverClass.resolvers.Query)
    Object.assign(resolvers.Mutation, resolverClass.resolvers.Mutation)
})

const schema = addResolversToSchema({
    schema: schemaFile, resolvers: {
        Query: Object.assign({}, resolvers.Query),
        Mutation: Object.assign({}, resolvers.Mutation)
    }
})

app.use('/graphql', graphqlHTTP({
    schema,
    graphiql: true
}))


app.listen(process.env.PORT, () => {
    console.log(`Express GraphQL Server Is Running On http://localhost:${process.env.PORT}/graphql`)
})


app.use("/", (req, res, next) => {
    res.send("Welcome")
})

