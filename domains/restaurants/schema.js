const REGEXP = require("../../utils/regexp");

exports.getRestaurantInfoList = {
  query: {
    category_idx: {
      isRequired: false,
      defaultValue: 0,
      regexp: REGEXP.INDEX,
    },
    range: {
      isRequired: false,
      defaultValue: 500,
      regexp: REGEXP.RANGE,
    },
    page: {
      isRequired: false,
      defaultValue: 1,
      regexp: REGEXP.PAGE,
    },
    longitude: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.COORDINATE,
    },
    latitude: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.COORDINATE,
    },
  },
};

exports.createRestaurantInfo = {
  body: {
    category_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
    restaurant_name: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.RESTAURANT_NAME,
    },
    latitude: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.COORDINATE,
    },
    longitude: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.COORDINATE,
    },
    address: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.ADDRESS,
    },
    address_detail: {
      isRequired: false,
      defaultValue: null,
      regexp: REGEXP.ADDRESS_DETAIL,
    },
    phone: {
      isRequired: false,
      defaultValue: null,
      regexp: REGEXP.RESTAURANT_PHONE,
    },
    start_time: {
      isRequired: false,
      defaultValue: null,
      regexp: REGEXP.RESTAURANT_RUN_TIME,
    },
    end_time: {
      isRequired: false,
      defaultValue: null,
      regexp: REGEXP.RESTAURANT_RUN_TIME,
    },
  },
};

exports.getRestaurantCategoryList = {
  query: {
    include_deleted: {
      isRequired: false,
      defaultValue: false,
      regexp: REGEXP.BOOLEAN,
    },
  },
};

exports.createRestaurantCategory = {
  body: {
    category_name: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.CATEGORY_NAME,
    },
  },
};

exports.updateRestaurantCategoryByIdx = {
  param: {
    category_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
  body: {
    category_name: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.CATEGORY_NAME,
    },
  },
};

exports.getRecommendRestaurant = {
  query: {
    category_idx: {
      isRequired: false,
      defaultValue: 0,
      regexp: REGEXP.INDEX,
    },
    range: {
      isRequired: false,
      defaultValue: 500,
      regexp: REGEXP.RANGE,
    },
    longitude: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.COORDINATE,
    },
    latitude: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.COORDINATE,
    },
  },
};

exports.getMenuReviewInfoList = {
  param: {
    menus_idx: {
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

exports.createMenuReview = {
  param: {
    restaurants_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
    menus_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
  body: {
    content: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.REVIEW,
    },
  },
};

exports.updateMenuReviewByIdx = {
  param: {
    reviews_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
  body: {
    content: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.REVIEW,
    },
  },
};

exports.getRestaurantMenuInfoList = {
  param: {
    restaurants_idx: {
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

exports.createRestaurantMenu = {
  param: {
    restaurants_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
  body: {
    menu_name: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.MENU_NAME,
    },
    price: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.MENU_PRICE,
    },
  },
};

exports.updateRestaurantMenuByIdx = {
  param: {
    menus_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
  body: {
    menu_name: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.MENU_NAME,
    },
    price: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.MENU_PRICE,
    },
  },
};

exports.getRestaurantInfoByIdx = {
  param: {
    restaurants_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
};

exports.updateRestaurantInfoByIdx = {
  param: {
    restaurants_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
  },
  body: {
    category_idx: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.INDEX,
    },
    restaurant_name: {
      isRequired: true,
      defaultValue: null,
      regexp: REGEXP.RESTAURANT_NAME,
    },
    address_detail: {
      isRequired: false,
      defaultValue: null,
      regexp: REGEXP.ADDRESS_DETAIL,
    },
    phone: {
      isRequired: false,
      defaultValue: null,
      regexp: REGEXP.RESTAURANT_PHONE,
    },
    start_time: {
      isRequired: false,
      defaultValue: null,
      regexp: REGEXP.RESTAURANT_RUN_TIME,
    },
    end_time: {
      isRequired: false,
      defaultValue: null,
      regexp: REGEXP.RESTAURANT_RUN_TIME,
    },
  },
};
