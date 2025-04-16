const { validationResult } = require("express-validator");

exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = errors.array()[0];

    return res.status(400).json({
      message: "입력값 확인 필요",
      target: error.path,
    });
  }

  next();
};
