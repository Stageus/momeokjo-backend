const router = require("express").Router();

router.get("/", (req, res) => {
  res.send("this is auth router");
});

module.exports = router;
