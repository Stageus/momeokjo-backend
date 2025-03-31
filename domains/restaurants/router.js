const router = require("express").Router();
const upload = require("../../config/aws-s3");
const rc = require("./controller");

// 음식점 리스트 조회
router.get("/", rc.getRestaurantInfoList);

// 음식점 등록
router.post("/", rc.createRestaurantInfo);

// 음식점 카테고리 리스트 조회
router.get("/categories", rc.getRestaurantCategoryList);

// 음식점 카테고리 등록
router.post("/categories", rc.createRestaurantCategory);

// 음식점 카테고리 수정
router.put("/categories/:category_idx", rc.updateRestaurantCategoryByIdx);

// 음식점 랜덤 조회
router.get("/recommends", rc.getRecommendRestaurant);

// 메뉴 후기 리스트 조회
router.get("/menus/:menu_idx/reviews", rc.getMenuReviewInfoList);

// 메뉴 후기 등록
router.post("/menus/:menu_idx/reviews", upload.single("image"), rc.createMenuReview);

// 메뉴 후기 수정
router.put("/menus/reviews/:review_idx", upload.single("image"), rc.updateMenuReviewByIdx);

// 음식점 메뉴 리스트 조회
router.get("/:restaurant_idx/menus", rc.getRestaurantMenuInfoList);

// 음식점 메뉴 등록
router.post("/:restaurant_idx/menus", rc.createRestaurantMenu);

// 음식점 메뉴 수정
router.put("/menus/:menu_idx", rc.updateRestaurantMenuByIdx);

// 음식점 상세보기 조회
router.get("/:restaurant_idx", rc.getRestaurantInfoByIdx);

// 음식점 상세보기 수정
router.put("/:restaurant_idx", rc.updateRestaurantInfoByIdx);

module.exports = router;
