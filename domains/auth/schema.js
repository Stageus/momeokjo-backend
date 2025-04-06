const REGEXP = require("../../utils/regexp");

exports.signUp = {
  body: {
    id: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.ID,
    },
    pw: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.PW,
    },
    nickname: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.NICKNAME,
    },
    code: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.CODE,
    },
  },
};

exports.findId = {
  body: {
    email: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.EMAIL,
    },
  },
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

exports.checkEmailVerificationCode = {
  body: {
    code: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.CODE,
    },
  },
};
