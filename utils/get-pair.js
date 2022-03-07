const Binance = require("binance-api-node").default;

const getPair = async (pair) => {
  const client = Binance();

  return { pair: await client.prices({ symbol: pair }) };
};

module.exports = getPair;
