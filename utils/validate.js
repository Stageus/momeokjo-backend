const { body, query, param } = require("express-validator");
const { commonErrorResponse } = require("./customErrorResponse");

const getValidationMethod = (type) => {
  switch (type) {
    case "params": {
      return param;
    }
    case "query": {
      return query;
    }
    case "body": {
      return body;
    }
    default: {
      return null;
    }
  }
};

const createChain = (type, obj) => {
  const method = getValidationMethod(type);

  if (!method) {
    return commonErrorResponse(500, `validate 대상이 올바르지 않습니다. type: ${type}`);
  }

  if (Object.keys(obj).length === 0) {
    return commonErrorResponse(500, `validate 객체가 없습니다.`);
  }

  const keys = Object.keys(obj);

  const chainOfKeys = keys.map((key) => {
    const { isRequired, defaultValue } = obj[key];

    if (isRequired) {
      return method(key)
        .notEmpty()
        .customSanitizer((value) => value || defaultValue);
    }

    return method(key)
      .optional()
      .customSanitizer((value) => value || defaultValue);
  });

  return chainOfKeys;
};

module.exports = { getValidationMethod, createChain };
