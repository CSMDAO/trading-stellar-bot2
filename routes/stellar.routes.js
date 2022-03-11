const express = require("express");
const router = express.Router();

const StellarService = require("../services/stellar.service");
const StellarInstance = new StellarService();

const response = require("../utils/response.util");

// Create route
router.post("/create", async (req, res) => {
  const username = req.body.username;
  const publickey = req.body.publickey;
  const privatekey = req.body.privatekey;
  if (!username || !publickey || !privatekey) {
    return res.status(400).send("Please enter all fields");
  }

  await StellarInstance.createAndSave(
    username,
    publickey,
    privatekey,
    (code, message) => response(code, message, res)
  );
});

// getBalance route
router.get("/balance", async (req, res) => {
  const publickey = req.body.publickey;

  await StellarInstance.getBalance(publickey, (code, message) =>
    response(code, message, res)
  );
});

module.exports = router;
