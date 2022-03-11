const Database = require("../config");

const StellarSdk = require("stellar-sdk");

const getPair = require("../utils/get-pair");

const db = new Database();
db.connect();

class TradingService {
  constructor() {
    this.horizon = new StellarSdk.Server("https://horizon.stellar.org");
    this.buySpread = [0.5, 0.75, 1, 1.25, 1.5];
    this.sellSpread = [0.5, 0.75, 1, 1.25, 1.5];
    this.i = 0;
    this.offers = [];
    this.updateBuyInterval = null;
    this.updateSellInterval = null;
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
   * @param {string} publicKey Public key
   * @param {string} sellingAsset Selling asset
   * @param {string} buyingAsset Buying asset
   * @param {string} amount Amount
   * @param {function} cb code & message | object
   */
  async buyOffer(publicKey, sellingAsset, buyingAsset, amount, cb) {
    try {
      const user = await this._getUser(publicKey, cb);
      const loadUser = StellarSdk.Keypair.fromSecret(user);

      const getCurrentPrice = await (
        await getPair(buyingAsset + sellingAsset)
      ).pair[buyingAsset + sellingAsset];

      let lower = await this._lowerPrice(getCurrentPrice, false);

      console.log({
        buy: "initial",
        id: this.i,
        currentPrice: getCurrentPrice,
        lowerPrice: lower,
        spread: this.buySpread[this.i] || 1.5,
      });

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
          price: Number.parseFloat(lower.toFixed(5)),
        })
      );

      transaction.setNetworkPassphrase(StellarSdk.Networks.PUBLIC);

      transaction.setTimeout(30);

      let tx = transaction.build();
      tx.sign(loadUser);

      try {
        const submitTransaction = await this.horizon.submitTransaction(tx);

        let currentOffer =
          (await submitTransaction.offerResults[0].currentOffer) ||
          (await submitTransaction.offerResults[0].offersClaimed[0]);

        let offerId =
          (await submitTransaction.offerResults[0].currentOffer.offerId) ||
          (await submitTransaction.offerResults[0].offersClaimed[0].offerId);

        let immediatelyFilled = await submitTransaction.offerResults[0]
          .wasImmediatelyFilled;

        let partiallyFilled = await submitTransaction.offerResults[0]
          .wasPartiallyFilled;

        if (immediatelyFilled) {
          try {
            let currentOffer = await submitTransaction.offerResults[0]
              .offersClaimed[0];
            let offerId = await currentOffer.offerId;
            await this._saveOffer(
              publicKey,
              offerId,
              "Buy Offer",
              "Filled",
              sellingAsset,
              buyingAsset
            );
            let tx = transaction.build();
            tx.sign(loadUser);
            const submitTransaction1 = await this.horizon.submitTransaction(tx);
            cb(200, "Offer was filled, new offer sent!");
          } catch (error) {
            console.log(error);
          }
        } else if (partiallyFilled) {
          try {
            let currentOffer = await submitTransaction.offerResults[0]
              .currentOffer;
            let offerId = await currentOffer.offerId;
            let price = currentOffer.price.d / currentOffer.price.n;
            await this._saveOffer(
              publicKey,
              offerId,
              "Buy Offer",
              "Partially Filled",
              sellingAsset,
              buyingAsset,
              price
            );
            await this.updateBuyOffer(
              publicKey,
              sellingAsset,
              buyingAsset,
              amount,
              offerId,
              cb
            );
            cb(200, "Offer was partially filled, updated amount to full.");
            console.log("Offer was partially filled, updated amount to full.");
            this.updateSellInterval = setInterval(async () => {
              return await this.updateBuyOffer(
                publicKey,
                sellingAsset,
                buyingAsset,
                amount,
                offerId,
                cb
              );
            }, 60000);
          } catch (error) {
            console.log(error);
          }
        } else {
          let currentOffer = await submitTransaction.offerResults[0]
            .currentOffer;
          let offerId = await currentOffer.offerId;
          let price = currentOffer.price.d / currentOffer.price.n;
          await this._saveOffer(
            publicKey,
            offerId,
            "Buy Offer",
            "Open",
            sellingAsset,
            buyingAsset,
            price
          );
          console.log(`Buy Offer successfully sent with offer id ${offerId}`);
          cb(200, "Buy Offer successfully sent!");
          this.updateSellInterval = setInterval(async () => {
            return await this.updateBuyOffer(
              publicKey,
              sellingAsset,
              buyingAsset,
              amount,
              offerId,
              cb
            );
          }, 60000);
        }
      } catch (error) {
        console.log(error);
        cb(500, "Error sending transaction, check console for more details");
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Updates buy offer
   *
   * @async
   * @param {string} publicKey Public key
   * @param {string} sellingAsset Selling asset
   * @param {string} buyingAsset Buying asset
   * @param {string} amount Amount
   * @param {string} offerId Offer id
   * @param {function} cb code & message | object
   */
  async updateBuyOffer(
    publicKey,
    sellingAsset,
    buyingAsset,
    amount,
    offerId,
    cb
  ) {
    try {
      const user = await this._getUser(publicKey, cb);
      const loadUser = StellarSdk.Keypair.fromSecret(user);

      const getCurrentPrice = await (
        await getPair(buyingAsset + sellingAsset)
      ).pair[buyingAsset + sellingAsset];

      this.i++;
      let lower = await this._lowerPrice(getCurrentPrice);

      console.log({
        buy: "updated",
        currentPrice: getCurrentPrice,
        lowerPrice: Number.parseFloat(lower.toFixed(5)),
        spread: this.buySpread[this.i] || 1.5,
      });

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
          price: Number.parseFloat(lower.toFixed(5)),
          offerId: offerId,
        })
      );

      transaction.setNetworkPassphrase(StellarSdk.Networks.PUBLIC);

      transaction.setTimeout(30);

      let tx = transaction.build();
      tx.sign(loadUser);

      try {
        const submitTransaction = await this.horizon.submitTransaction(tx);

        let immediatelyFilled = await submitTransaction.offerResults[0]
          .wasImmediatelyFilled;

        let partiallyFilled = await submitTransaction.offerResults[0]
          .wasPartiallyFilled;

        if (immediatelyFilled) {
          try {
            let currentOffer = await submitTransaction.offerResults[0]
              .offersClaimed[0];
            let offerId = await currentOffer.offerId;
            await this._saveOffer(
              publicKey,
              offerId,
              "Buy Offer",
              "Filled",
              sellingAsset,
              buyingAsset
            );
            let tx = transaction.build();
            tx.sign(loadUser);
            const submitTransaction1 = await this.horizon.submitTransaction(tx);
            console.log("Offer was filled, new offer sent!");
          } catch (error) {
            console.log(error);
          }
        } else if (partiallyFilled) {
          try {
            let currentOffer = await submitTransaction.offerResults[0]
              .currentOffer;
            let offerId = await currentOffer.offerId;
            let price = currentOffer.price.d / currentOffer.price.n;
            await this._saveOffer(
              publicKey,
              offerId,
              "Buy Offer",
              "Partially Filled",
              sellingAsset,
              buyingAsset,
              price
            );
            await this.updateSellOffer(
              publicKey,
              sellingAsset,
              buyingAsset,
              amount,
              offerId,
              cb
            );
            console.log("Offer was partially filled, updated amount to full.");
            this.updateSellInterval = setInterval(async () => {
              return await this.updateSellOffer(
                publicKey,
                sellingAsset,
                buyingAsset,
                amount,
                offerId,
                cb
              );
            }, 60000);
          } catch (error) {
            console.log(error);
          }
        } else {
          let currentOffer = submitTransaction.offerResults[0].currentOffer;
          let offerId = currentOffer.offerId;
          let price = currentOffer.price.d / currentOffer.price.n;
          await this._updateOffer(
            offerId,
            "Buy Offer",
            "Open",
            sellingAsset,
            buyingAsset,
            price
          );
          console.log(`Updated Buy Offer with Offer id: ${offerId}`);
        }
      } catch (error) {
        console.log(error);
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Cancels buy offer
   *
   * @async
   * @param {string} publicKey Public key
   * @param {string} sellingAsset Selling asset
   * @param {string} buyingAsset Buying asset
   * @param {string} cancelOfferId Offer id
   * @param {function} cb code & message | object
   */
  async cancelBuyOffer(
    publicKey,
    sellingAsset,
    buyingAsset,
    cancelOfferId,
    cb
  ) {
    try {
      const user = await this._getUser(publicKey, cb);
      const loadUser = StellarSdk.Keypair.fromSecret(user);

      const getCurrentPrice = await (
        await getPair(buyingAsset + sellingAsset)
      ).pair[buyingAsset + sellingAsset];

      const account = await this.horizon.loadAccount(loadUser.publicKey());

      clearInterval(this.updateBuyInterval);

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
          buyAmount: "0",
          price: getCurrentPrice,
          offerId: cancelOfferId,
        })
      );

      transaction.setNetworkPassphrase(StellarSdk.Networks.PUBLIC);

      transaction.setTimeout(30);

      let tx = transaction.build();
      tx.sign(loadUser);

      try {
        const submitTransaction = await this.horizon.submitTransaction(tx);
        await this._updateOffer(
          cancelOfferId,
          "Buy Offer",
          "Canceled",
          sellingAsset,
          buyingAsset
        );
        cb(200, "Successfully canceled Buy Offer!");
      } catch (error) {
        console.log(error);
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
  async sellOffer(publicKey, sellingAsset, buyingAsset, amount, cb) {
    try {
      const user = await this._getUser(publicKey, cb);
      const loadUser = StellarSdk.Keypair.fromSecret(user);

      const getCurrentPrice = await (
        await getPair(buyingAsset + sellingAsset)
      ).pair[buyingAsset + sellingAsset];

      let higher = await this._higherPrice(getCurrentPrice);

      console.log({
        buy: "initial",
        currentPrice: getCurrentPrice,
        higherPrice: Number.parseFloat(higher.toFixed(5)),
        spread: this.sellSpread[this.i] || 1.5,
      });

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
          price: Number.parseFloat(higher.toFixed(5)),
        })
      );

      transaction.setNetworkPassphrase(StellarSdk.Networks.PUBLIC);

      transaction.setTimeout(30);

      let tx = transaction.build();
      tx.sign(loadUser);

      try {
        const submitTransaction = await this.horizon.submitTransaction(tx);

        let immediatelyFilled = await submitTransaction.offerResults[0]
          .wasImmediatelyFilled;

        let partiallyFilled = await submitTransaction.offerResults[0]
          .wasPartiallyFilled;

        if (immediatelyFilled) {
          try {
            let currentOffer = await submitTransaction.offerResults[0]
              .offersClaimed[0];
            let offerId = await currentOffer.offerId;
            await this._saveOffer(
              publicKey,
              offerId,
              "Sell Offer",
              "Filled",
              sellingAsset,
              buyingAsset
            );
            let tx = transaction.build();
            tx.sign(loadUser);
            const submitTransaction1 = await this.horizon.submitTransaction(tx);
            cb(200, "Offer was filled, new offer sent!");
          } catch (error) {
            console.log(error);
          }
        } else if (partiallyFilled) {
          try {
            let currentOffer = await submitTransaction.offerResults[0]
              .currentOffer;
            let offerId = await currentOffer.offerId;
            let price = currentOffer.price.d / currentOffer.price.n;
            await this._saveOffer(
              publicKey,
              offerId,
              "Sell Offer",
              "Partially Filled",
              sellingAsset,
              buyingAsset,
              price
            );
            await this.updateSellOffer(
              publicKey,
              sellingAsset,
              buyingAsset,
              amount,
              offerId,
              cb
            );
            cb(200, "Offer was partially filled, updated amount to full.");
            console.log("Offer was partially filled, updated amount to full.");
            this.updateSellInterval = setInterval(async () => {
              return await this.updateSellOffer(
                publicKey,
                sellingAsset,
                buyingAsset,
                amount,
                offerId,
                cb
              );
            }, 60000);
          } catch (error) {
            console.log(error);
          }
        } else {
          let currentOffer = await submitTransaction.offerResults[0]
            .currentOffer;
          let offerId = await currentOffer.offerId;
          let price = (await currentOffer.price.d) / currentOffer.price.n;
          await this._saveOffer(
            publicKey,
            offerId,
            "Sell Offer",
            "Open",
            sellingAsset,
            buyingAsset,
            price
          );
          cb(200, "Sell Offer successfully sent!");
          this.updateSellInterval = setInterval(async () => {
            return await this.updateSellOffer(
              publicKey,
              sellingAsset,
              buyingAsset,
              amount,
              offerId,
              cb
            );
          }, 60000);
        }
      } catch (error) {
        console.log(error);
        cb(500, "Error sending transaction, check console for more details");
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Updates sell offer
   *
   * @async
   * @param {string} publicKey Public key
   * @param {string} sellingAsset Selling asset
   * @param {string} buyingAsset Buying asset
   * @param {string} amount Amount
   * @param {string} offerId Offer id
   * @param {function} cb code & message | object
   */
  async updateSellOffer(
    publicKey,
    sellingAsset,
    buyingAsset,
    amount,
    offerId,
    cb
  ) {
    try {
      const user = await this._getUser(publicKey, cb);
      const loadUser = StellarSdk.Keypair.fromSecret(user);

      const getCurrentPrice = await (
        await getPair(buyingAsset + sellingAsset)
      ).pair[buyingAsset + sellingAsset];

      this.i++;
      let higher = await this._higherPrice(getCurrentPrice);

      console.log({
        buy: "updated",
        id: this.i,
        currentPrice: getCurrentPrice,
        higherPrice: Number.parseFloat(higher.toFixed(5)),
        spread: this.sellSpread[this.i] || 1.5,
      });

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
          price: Number.parseFloat(higher.toFixed(5)),
          offerId: offerId,
        })
      );

      transaction.setNetworkPassphrase(StellarSdk.Networks.PUBLIC);

      transaction.setTimeout(30);

      let tx = transaction.build();
      tx.sign(loadUser);

      try {
        const submitTransaction = await this.horizon.submitTransaction(tx);

        let immediatelyFilled = await submitTransaction.offerResults[0]
          .wasImmediatelyFilled;

        let partiallyFilled = await submitTransaction.offerResults[0]
          .wasPartiallyFilled;

        if (immediatelyFilled) {
          try {
            let currentOffer = await submitTransaction.offerResults[0]
              .offersClaimed[0];
            let offerId = await currentOffer.offerId;
            await this._saveOffer(
              publicKey,
              offerId,
              "Sell Offer",
              "Filled",
              sellingAsset,
              buyingAsset
            );
            let tx = transaction.build();
            tx.sign(loadUser);
            const submitTransaction1 = await this.horizon.submitTransaction(tx);
            console.log("Offer was filled, new offer sent!");
          } catch (error) {
            console.log(error);
          }
        } else if (partiallyFilled) {
          try {
            let currentOffer = await submitTransaction.offerResults[0]
              .currentOffer;
            let offerId = await currentOffer.offerId;
            let price = currentOffer.price.d / currentOffer.price.n;
            await this._saveOffer(
              publicKey,
              offerId,
              "Sell Offer",
              "Partially Filled",
              sellingAsset,
              buyingAsset,
              price
            );
            await this.updateSellOffer(
              publicKey,
              sellingAsset,
              buyingAsset,
              amount,
              offerId,
              cb
            );
            console.log("Offer was partially filled, updated amount to full.");
            this.updateSellInterval = setInterval(async () => {
              return await this.updateSellOffer(
                publicKey,
                sellingAsset,
                buyingAsset,
                amount,
                offerId,
                cb
              );
            }, 60000);
          } catch (error) {
            console.log(error);
          }
        } else {
          let currentOffer = submitTransaction.offerResults[0].currentOffer;
          let offerId = currentOffer.offerId;
          let price = currentOffer.price.d / currentOffer.price.n;
          await this._updateOffer(
            offerId,
            "Sell Offer",
            "Open",
            sellingAsset,
            buyingAsset,
            price
          );
          console.log(`Updated Sell Offer with Offer id: ${offerId}`);
        }
      } catch (error) {
        console.log(error);
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Cancels sell offer
   *
   * @async
   * @param {string} publicKey Public key
   * @param {string} sellingAsset Selling asset
   * @param {string} buyingAsset Buying asset
   * @param {string} cancelOfferId Offer id
   * @param {function} cb code & message | object
   */
  async cancelSellOffer(
    publicKey,
    sellingAsset,
    buyingAsset,
    cancelOfferId,
    cb
  ) {
    try {
      const user = await this._getUser(publicKey, cb);
      const loadUser = StellarSdk.Keypair.fromSecret(user);

      const getCurrentPrice = await (
        await getPair(buyingAsset + sellingAsset)
      ).pair[buyingAsset + sellingAsset];

      clearInterval(this.updateSellInterval);

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
          amount: "0",
          price: getCurrentPrice,
          offerId: cancelOfferId,
        })
      );

      transaction.setNetworkPassphrase(StellarSdk.Networks.PUBLIC);

      transaction.setTimeout(30);

      let tx = transaction.build();
      tx.sign(loadUser);

      try {
        const submitTransaction = await this.horizon.submitTransaction(tx);
        await this._updateOffer(
          cancelOfferId,
          "Sell Offer",
          "Canceled",
          sellingAsset,
          buyingAsset
        );
        cb(200, "Successfully canceled Sell Offer!");
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
   * if public key matches the one in the database,
   * returns the matching private key
   *
   * @async
   * @param {string} username Username
   * @param {string} privateKey Private key
   * @returns matching Private key
   */
  async _getUser(publicKey, cb) {
    const user = await db.find({ publickey: publicKey });
    if (user) {
      return user.privatekey;
    } else {
      cb(401, "User not found.");
      return !!user;
    }
  }

  /**
   * Returns lower price
   *
   * @async
   * @param {string} currentPrice Current price
   * @returns
   */
  async _lowerPrice(currentPrice) {
    let lower =
      Number.parseFloat(currentPrice) -
      Number.parseFloat(currentPrice) * ((this.buySpread[this.i] || 1.5) / 100);
    return lower;
  }

  /**
   * Returns higher price
   *
   * @async
   * @param {string} currentPrice Current price
   * @returns
   */
  async _higherPrice(currentPrice) {
    let higher =
      Number.parseFloat(currentPrice) +
      Number.parseFloat(currentPrice) * ((this.buySpread[this.i] || 1.5) / 100);
    return higher;
  }

  /**
   * Saves the offer in MongoDB collection
   *
   * @async
   * @param {string} offerId
   * @param {string} type
   * @param {string} status
   * @param {string} sellingAsset
   * @param {string} buyingAsset
   * @param {number} price
   */
  async _saveOffer(
    publicKey,
    offerId,
    type,
    status,
    sellingAsset,
    buyingAsset,
    price
  ) {
    try {
      let saveOffer = await db.update(
        { publickey: publicKey },
        {
          $push: {
            offers: {
              offerId: offerId,
              offerType: type,
              offerStatus: status,
              sellingAsset: sellingAsset,
              buyingAsset: buyingAsset,
              price: price !== undefined ? price : undefined,
            },
          },
        }
      );
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Updates the offer in MongoDB collection
   *
   * @async
   * @param {string} offerId Offer id
   * @param {string} type Offer type
   * @param {string} status Offer status
   * @param {string} sellingAsset Selling asset
   * @param {string} buyingAsset Buying asset
   * @param {number} price Price
   */
  async _updateOffer(offerId, type, status, sellingAsset, buyingAsset, price) {
    try {
      let updateOffer = await db.update(
        {
          "offers.offerId": offerId,
        },
        {
          $set: {
            "offers.$": {
              offerId: offerId,
              offerType: type,
              offerStatus: status,
              sellingAsset: sellingAsset,
              buyingAsset: buyingAsset,
              price: price !== undefined ? price : undefined,
            },
          },
        }
      );
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = TradingService;
