const router = require("express").Router();

router.get("/", (req, res) => {
  res.send("this is users router");
});

module.exports = router;
