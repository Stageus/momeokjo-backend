const { createChain } = require("../utils/validate");

exports.createValidateChain = (schema) => {
  const { body, param, query } = schema;

  const validateChain = [];
  if (body && typeof body === "object" && Object.keys(body).length !== 0) {
    const bodyChain = createChain("body", body);
    validateChain.push(...bodyChain);
  }

  if (param && typeof param === "object" && Object.keys(param).length !== 0) {
    const paramChain = createChain("param", param);
    validateChain.push(...paramChain);
  }

  if (query && typeof query === "object" && Object.keys(query).length !== 0) {
    const queryChain = createChain("query", query);
    validateChain.push(...queryChain);
  }

  return validateChain;
};
