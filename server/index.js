const { ApolloServer, gql } = require("apollo-server");
const { saveToCloud, getCloudFilesData } = require("./service");

const FILES = [];

getCloudFilesData()
  .then((files) => {
    FILES.push(...files);
    console.log("FILES RESTORED");
  })
  .catch((err) => console.log("CAN'T INIT FILES:", err));

const typeDefs = gql`
  type File {
    filename: String!
    mimetype: String!
    # encoding: String!
    publicUri: String!
    width: Int
    height: Int
    size: String
    extension: String
  }

  type Query {
    uploads: [File!]
  }

  type Mutation {
    uploadFiles(files: [Upload!]!): [File!]
  }
`;

const resolvers = {
  Query: {
    uploads() {
      return FILES;
    },
  },
  Mutation: {
    async uploadFiles(_, { files }) {
      console.log("PROCESSING FILES");
      const results = [];
      try {
        for await (const file of files) {
          const newFile = await saveToCloud(file);
          results.push(newFile);
          FILES.push(newFile);
        }
      } catch (error) {
        console.error("ERROR SAVING FILE TO CLOUD:", error);
      }
      console.log("FILES UPLOADED");
      return results;
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
