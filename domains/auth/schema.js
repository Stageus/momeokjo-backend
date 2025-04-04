const REGEXP = require("../../utils/regexp");

exports.sendEmailVerificationCode = {
  body: {
    email: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.EMAIL,
    },
  },
};

exports.checkEmailVerificationCode = {
  body: {
    code: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.CODE,
    },
  },
};
