const { validationResult } = require("express-validator");

exports.validateRequest = (validations) => async (req, res, next) => {
  await Promise.all(validations.map((validation) => validation.run(req)));

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = errors.array()[0];
    return res.status(400).json({
      message: "입력값 확인 필요",
      target: error.param,
    });
  }

  next();
};
