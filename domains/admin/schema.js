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
