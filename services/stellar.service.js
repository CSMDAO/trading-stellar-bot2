const pool = require("../config");

const StellarSdk = require("stellar-sdk");
const bcrypt = require("bcrypt");

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
    let hashedPrivateKey = bcrypt.hashSync(privateKey, 12);
    try {
      const newUser = await pool.query(
        "INSERT INTO users (username, publickey, privatekey) VALUES ($1, $2, $3)",
        [username, pubKey, hashedPrivateKey]
      );
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
  async getBalance(username, cb) {
    try {
      const pubKey = await pool.query(
        "SELECT publickey FROM users WHERE username = $1",
        [username]
      );
      const account = await this.horizon.loadAccount(pubKey.rows[0].publickey);
      cb(200, { balance: account.balances });
    } catch (error) {
      console.log(error);
      cb(500, error.message);
    }
  }
}

module.exports = StellarService;
