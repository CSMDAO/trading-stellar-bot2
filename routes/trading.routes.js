const express = require("express");
const router = express.Router();

const TradingService = require("../services/trading.service");
const TradingInstance = new TradingService();

const response = require("../utils/response.util");

// Get pair price route
router.get("/pairprice", async (req, res) => {
  const pair = req.body.pair;

  await TradingInstance.getPairPrice(pair, (code, message) =>
    response(code, message, res)
  );
});

// Buy offer route
router.post("/buy", async (req, res) => {
  //   const username = req.body.username;
  const publickey = req.body.publickey;
  const sellingasset = req.body.sellingasset;
  const buyingasset = req.body.buyingasset;
  const amount = req.body.amount;

  await TradingInstance.buyOffer(
    publickey,
    sellingasset,
    buyingasset,
    amount,
    (code, message) => response(code, message, res)
  );
});

// Cancel buy offer route
router.post("/buy/:id", async (req, res) => {
  const publickey = req.body.publickey;
  const sellingasset = req.body.sellingasset;
  const buyingasset = req.body.buyingasset;
  const offerId = req.params.id;

  await TradingInstance.cancelBuyOffer(
    publickey,
    sellingasset,
    buyingasset,
    offerId,
    (code, message) => response(code, message, res)
  );
});

// Sell offer route
router.post("/sell", async (req, res) => {
  //   const username = req.body.username;
  const publickey = req.body.publickey;
  const sellingasset = req.body.sellingasset;
  const buyingasset = req.body.buyingasset;
  const amount = req.body.amount;

  await TradingInstance.sellOffer(
    // username,
    publickey,
    sellingasset,
    buyingasset,
    amount,
    (code, message) => response(code, message, res)
  );
});

module.exports = router;
