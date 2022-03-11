const Database = require("../config");

const StellarSdk = require("stellar-sdk");

const db = new Database();
db.connect();

class StellarService {
  constructor() {
    this.publickey = null;
    this.privatekey = null;
    this.horizon = new StellarSdk.Server("https://horizon.stellar.org");
  }

  /**
   * createAndSave method
   * registers users to the database
   *
   * @async
   * @param {string} username Username
   * @param {string} pubKey Public key
   * @param {string} privateKey Plain private key
   * @param {function} cb code & message | object
   */
  async createAndSave(username, pubKey, privateKey, cb) {
    try {
      const newUser = await db.insert({
        username: username,
        publickey: pubKey,
        privatekey: privateKey,
        offers: [],
      });
      cb(201, "User added!");
    } catch (error) {
      console.log(error);
      cb(500, error.message);
    }
  }

  /**
   *
   * getBalance method
   * retrieves account balance
   *
   * @async
   * @param {string} username Username
   * @param {function} cb code & message | object
   */
  async getBalance(publickey, cb) {
    try {
      const pubKey = await db.find({ publickey: publickey });
      const account = await this.horizon.loadAccount(pubKey.publickey);
      cb(200, { balance: account.balances });
    } catch (error) {
      console.log(error);
      cb(500, error.message);
    }
  }
}

module.exports = StellarService;
