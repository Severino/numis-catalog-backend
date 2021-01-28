const express = require("express")
const graphql = require("graphql")
const cors = require("cors")
const { graphqlHTTP } = require("express-graphql")

const { query } = require("./src/graphql/queries.js")
const app = express()
require("dotenv").config()


const schema = new graphql.GraphQLSchema({
    query
})

app.use(cors({
    origin: "http://localhost:8080",
    optionsSuccessStatus: 200
}))

app.use('/graphql', graphqlHTTP({
    schema,
    graphiql: true
}))


app.listen(process.env.PORT, () => {
    console.log(`Express GraphQL Server Is Running On http://localhost:${process.env.PORT}`)
})


app.use("/", (req, res, next) => {
    res.send("Welcome")
})

