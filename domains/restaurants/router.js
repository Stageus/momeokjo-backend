const router = require("express").Router();
const { getRestaurantInfo } = require("./controller");

router.get("/:restaurant_idx", getRestaurantInfo);

module.exports = router;
