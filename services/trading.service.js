const pool = require("../config");

const StellarSdk = require("stellar-sdk");

const bcrypt = require("bcrypt");
const getPair = require("../utils/get-pair");

class TradingService {
  constructor() {
    this.horizon = new StellarSdk.Server("https://horizon.stellar.org");
  }

  /**
   * Retrieves the latest price for the pair
   *
   * @async
   * @param {string} pair Trading pair
   * @param {function} cb code & message | object
   */
  async getPairPrice(pair, cb) {
    try {
      const getpair = await getPair(pair);
      cb(200, getpair);
    } catch (error) {
      console.log(error);
      cb(500, error.message);
    }
  }

  /**
   * Sends buy offer to stellar network
   *
   * @async
   * @param {string} username Username
   * @param {string} privateKey Private key
   * @param {string} sellingAsset Selling asset
   * @param {string} buyingAsset Buying asset
   * @param {string} amount Amount
   * @param {function} cb code & message | object
   */
  async buyOffer(username, privateKey, sellingAsset, buyingAsset, amount, cb) {
    try {
      const user = await this._getUser(username, privateKey);
      const loadUser = StellarSdk.Keypair.fromSecret(user);

      const getCurrentPrice = await (
        await getPair(buyingAsset + sellingAsset)
      ).pair[buyingAsset + sellingAsset];

      const account = await this.horizon.loadAccount(loadUser.publicKey());

      let transaction = new StellarSdk.TransactionBuilder(account, {
        fee: "100000",
      });

      transaction.addOperation(
        StellarSdk.Operation.manageBuyOffer({
          selling: new StellarSdk.Asset(
            sellingAsset,
            "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
          ),
          buying: new StellarSdk.Asset(
            buyingAsset,
            "GANCHORKQEZ46AFTJLEVTA5MCE432MSR5VMVQBWW3LAUYGTBFTKGKTJF"
          ),
          buyAmount: amount,
          price: getCurrentPrice,
        })
      );

      transaction.setNetworkPassphrase(StellarSdk.Networks.PUBLIC);

      transaction.setTimeout(30);

      let tx = transaction.build();
      tx.sign(loadUser);

      try {
        const submitTransaction = await this.horizon.submitTransaction(tx);
        console.log(submitTransaction);
        cb(200, "Buy Offer successfully sent!");
      } catch (error) {
        cb(500, "Error sending transaction, check console for more details");
      }
    } catch (error) {
      console.log(error);
      cb(500, error.message);
    }
  }

  /**
   * Sends sell offer to stellar network
   *
   * @async
   * @param {string} username Username
   * @param {string} privateKey Private key
   * @param {string} sellingAsset Selling asset
   * @param {string} buyingAsset Buying asset
   * @param {string} amount Amount
   * @param {function} cb code & message | object
   */
  async sellOffer(username, privateKey, sellingAsset, buyingAsset, amount, cb) {
    try {
      const user = await this._getUser(username, privateKey);
      const loadUser = StellarSdk.Keypair.fromSecret(user);

      const getCurrentPrice = await (
        await getPair(buyingAsset + sellingAsset)
      ).pair[buyingAsset + sellingAsset];

      const account = await this.horizon.loadAccount(loadUser.publicKey());

      let transaction = new StellarSdk.TransactionBuilder(account, {
        fee: "100000",
      });

      transaction.addOperation(
        StellarSdk.Operation.manageSellOffer({
          selling: new StellarSdk.Asset(
            sellingAsset,
            "GANCHORKQEZ46AFTJLEVTA5MCE432MSR5VMVQBWW3LAUYGTBFTKGKTJF"
          ),
          buying: new StellarSdk.Asset(
            buyingAsset,
            "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
          ),
          amount: amount,
          price: getCurrentPrice,
        })
      );

      transaction.setNetworkPassphrase(StellarSdk.Networks.PUBLIC);

      transaction.setTimeout(30);

      let tx = transaction.build();
      tx.sign(loadUser);

      try {
        const submitTransaction = await this.horizon.submitTransaction(tx);
        console.log(submitTransaction);
        cb(200, "Sell Offer successfully sent!");
      } catch (error) {
        console.log(error["response"]["data"]["extras"]["result_codes"]);
        cb(500, "Error sending transaction, check console for more details");
      }
    } catch (error) {
      console.log(error);
      cb(500, error.message);
    }
  }

  /**
   * Checks for user,
   * if privatekey matches the one in the database,
   * returns the matching one
   *
   * @async
   * @param {string} username Username
   * @param {string} privateKey Private key
   * @returns matching Private key
   */
  async _getUser(username, privateKey) {
    const user = await pool.query(
      "SELECT privatekey FROM users WHERE username = $1",
      [username]
    );
    if (user.rows.length > 0) {
      const first = user.rows[0];
      const compareHash = await bcrypt.compareSync(
        privateKey,
        first.privatekey
      );
      if (compareHash) {
        return privateKey;
      } else {
        cb(401, "Private Key doesn't match the one with the username");
      }
    } else {
      cb(401, "User not found.");
    }
  }
}

module.exports = TradingService;
