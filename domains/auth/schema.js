const REGEXP = require("../../utils/regexp");

exports.signUp = {
  body: [
    { id: { isRequired: true, defaultValue: null } },
    { pw: { isRequired: true, defaultValue: null } },
    { nickname: { isRequired: true, defaultValue: null } },
    { code: { isRequired: true, defaultValue: null } },
  ],
};

exports.sendEmailVerificationCode = {
  body: {
    email: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.EMAIL,
    },
  },
};
