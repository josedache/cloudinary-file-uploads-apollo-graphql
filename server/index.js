const { ApolloServer, gql } = require("apollo-server");

const typeDefs = gql`
  type File {
    filename: String!
    mimetype: String!
    encoding: String!
    publicUri: String!
  }

  type Query {
    uploads: [File]
  }

  type Mutation {
    uploadFiles(file: [Upload!]!): Boolean!
  }
`;

const resolvers = {
  Query: {
    uploads() {},
  },
  Mutation: {
    uploadFiles() {},
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
