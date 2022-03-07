const generateResponse = (code, payload, res) => {
  if (typeof payload === "string" || typeof payload === "number") {
    res.status(code).json({
      success: code < 300,
      message: payload,
    });
  } else if (isArray(payload)) {
    res.status(code).json(payload);
  } else {
    res.status(code).json({
      success: code < 300,
      ...payload,
    });
  }
};

const isArray = function (a) {
  return !!a && a.constructor === Array;
};

module.exports = generateResponse;
