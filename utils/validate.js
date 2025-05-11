const { body, query, param } = require("express-validator");
const customErrorResponse = require("./customErrorResponse");

const getValidationMethod = (type) => {
  switch (type) {
    case "param": {
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
  try {
    const method = getValidationMethod(type);

    if (typeof method !== "function")
      throw new Error(`validate 대상이 올바르지 않습니다. type: ${type}`);

    if (Object.keys(obj).length === 0) throw new Error(`validate 객체가 없습니다.`);

    const keys = Object.keys(obj);

    const chainOfKeys = keys.map((key) => {
      const { isRequired, defaultValue, regexp } = obj[key];

      if (isRequired) {
        return method(key)
          .notEmpty()
          .withMessage("필수값이 누락되었습니다.")
          .matches(regexp)
          .withMessage("정규표현식과 일치하지 않습니다.");
      }

      return method(key)
        .customSanitizer((value) => {
          return value === undefined || value === null || value === "" ? defaultValue : value;
        })
        .if((value) => value !== null && value !== undefined && value !== "")
        .matches(regexp)
        .withMessage("정규표현식과 일치하지 않습니다.");
    });

    return chainOfKeys;
  } catch (err) {
    throw customErrorResponse({
      status: 500,
      message: err.message || "validator chain 생성 중 오류 발생",
    });
  }
};

module.exports = { getValidationMethod, createChain };
