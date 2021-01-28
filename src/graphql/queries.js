const { GraphQLObjectType, GraphQLID, GraphQLList, GraphQLNonNull, GraphQLInt, GraphQLString, graphqlSync } = require("graphql");
const { MaterialType } = require("./types");
const pgPromise = require("pg-promise")

const pgp = pgPromise({})

function createClient() {
    return pgp({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT
    })

}

const rootQuery = new GraphQLObjectType({
    name: "RootQueryType",
    type: "Query",
    fields: {

        updateMaterial: {
            type: MaterialType,
            args: {
                id: { type: GraphQLID },
                name: { type: GraphQLString }
            }, resolve: (value, { id, name }) => {



                const query = (id == -1) ?
                    "INSERT INTO material (name) VALUES ($1)"
                    :
                    "UPDATE material SET name=$1 WHERE id=$2"

                const client = createClient()
                
                client.query(query, [name, id]).then(res => {
                    console.log(`Updated material ${id, name}.`)
                    return res
                }).catch(console.log).finally(() => {
                    pgp.end()
                })
            }
        },

        addMaterial: {
            type: MaterialType,
            args: {
                name: { type: GraphQLString }
            },
            resolve: (value, { name }) => {
                const client = createClient()

                let query = `INSERT INTO material(name) VALUES($1)`

                return client.query(query, [name]).then(res => {
                    console.log([name])
                    return res
                }).catch(console.log).finally(() => {
                    pgp.end()
                })
            }
        },
        deleteMaterial: {
            type: MaterialType,
            args: {
                id: { type: GraphQLID }
            },
            resolve: (value, { id }) => {
                const client = createClient()

                let query = `DELETE FROM material WHERE id=$1`

                return client.query(query, [parseInt(id)]).then(res => {
                    console.log([parseInt(id)])
                    return res
                }).catch(console.log).finally(() => {
                    pgp.end()
                })
            }
        },

        material: {
            type: new GraphQLList(MaterialType),
            args: { id: { type: GraphQLID } },
            resolve(parentValue, args) {

                const client = createClient()

                let query
                let values = []
                if (args.id) {
                    query = `SELECT * FROM material WHERE id=$1`
                    values = [args.id]
                } else
                    query = `SELECT * FROM material`

                console.log("Run query", query, values)

                return client.query(query, values).then(res => {
                    console.log(res)
                    return res
                }).catch(console.log).finally(() => {
                    pgp.end()
                })
            }
        }
    }
})

exports.query = rootQuery