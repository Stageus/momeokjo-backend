const { validationResult } = require("express-validator");
const { createChain } = require("../utils/validate");

exports.createValidateChain = (validations) => {
  const { body, params, query } = validations;

  const validateChain = [];
  if (body && typeof body === "object" && Object.keys(body).length !== 0) {
    const bodyChain = createChain("body", body);
    validateChain.push(...bodyChain);
  }

  if (params && typeof params === "object" && Object.keys(params).length !== 0) {
    const paramChain = createChain("params", params);
    validateChain.push(...paramChain);
  }

  if (query && typeof query === "object" && Object.keys(query).length !== 0) {
    const queryChain = createChain("query", query);
    validateChain.push(...queryChain);
  }

  return validateChain;
};
