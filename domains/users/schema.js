const REGEXP = require("../../utils/regexp");

exports.updateMyInfo = {
  body: {
    nickname: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.NICKNAME,
    },
  },
};

exports.getUserInfoByIdx = {
  param: {
    user_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
};

exports.getRestaurantLikeList = {
  param: {
    user_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
  query: {
    page: {
      isRequired: false,
      defaultValue: 1,
      regexp: REGEXP.PAGE,
    },
  },
};

exports.getReviewList = {
  param: {
    user_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
  query: {
    page: {
      isRequired: false,
      defaultValue: 1,
      regexp: REGEXP.PAGE,
    },
  },
};

exports.createRestaurantLike = {
  param: {
    restaurant_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
};

exports.deleteRestaurantLike = {
  param: {
    restaurant_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
};

exports.createMenuLike = {
  param: {
    menu_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
};

exports.deleteMenuLike = {
  param: {
    menu_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
};

exports.createReviewLike = {
  param: {
    review_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
};

exports.deleteReviewLike = {
  param: {
    user_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
    review_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
};

exports.createRestaurantReport = {
  param: {
    user_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
    restaurant_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
};

exports.createMenuReport = {
  param: {
    user_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
    menu_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
};

exports.createReviewReport = {
  param: {
    user_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
    review_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
};
