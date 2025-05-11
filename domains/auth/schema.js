const REGEXP = require("../../utils/regexp");

exports.signIn = {
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
  },
};

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

exports.findPw = {
  body: {
    id: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.ID,
    },
    email: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.EMAIL,
    },
  },
};

exports.resetPw = {
  body: {
    pw: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.PW,
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

exports.signUpWithOauth = {
  body: {
    nickname: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.NICKNAME,
    },
  },
};
