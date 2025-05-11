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
    users_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
};

exports.getRestaurantLikeList = {
  param: {
    users_idx: {
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
    users_idx: {
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
    restaurants_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
};

exports.deleteRestaurantLike = {
  param: {
    restaurants_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
};

exports.createMenuLike = {
  param: {
    menus_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
};

exports.deleteMenuLike = {
  param: {
    menus_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
};

exports.createReviewLike = {
  param: {
    reviews_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
};

exports.deleteReviewLike = {
  param: {
    reviews_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
};

exports.createRestaurantReport = {
  param: {
    restaurants_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
};

exports.createMenuReport = {
  param: {
    menus_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
};

exports.createReviewReport = {
  param: {
    reviews_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
};
