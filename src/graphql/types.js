const { GraphQLObjectType, GraphQLID, GraphQLString } = require("graphql");

const MaterialType = new GraphQLObjectType({
    name: "Material",
    type: "Query",
    fields: {
        id: { type: GraphQLID },
        name: { type: GraphQLString }
    }
})

exports.MaterialType = MaterialType