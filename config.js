// DB Connection
require("dotenv").config();
const { MongoClient } = require("mongodb");

class Database {
  constructor() {
    this.uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_URL}/${process.env.DB_DATABASE}?retryWrites=true&w=majority`;
    this.db = null;
  }

  async connect() {
    this.client = await MongoClient.connect(this.uri, {
      useNewUrlParser: true,
    }).catch((err) => {
      console.log(err);
    });
    this.db = this.client.db("api");
    return this.db;
  }

  async insert(data) {
    const collection = this.db.collection("users");
    try {
      await collection.insertOne(data);
    } catch (err) {
      console.log(err);
    }
  }

  async update(query, newData) {
    const collection = this.db.collection("users");
    try {
      await collection.updateOne(query, newData);
    } catch (err) {
      console.log(err);
    }
  }

  async find(query, projection) {
    const collection = this.db.collection("users");
    try {
      return await collection.findOne(query, projection);
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = Database;
