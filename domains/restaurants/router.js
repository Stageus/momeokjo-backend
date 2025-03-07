const router = require("express").Router();

router.get("/", (req, res) => {
  res.send("this is restaurants router");
});

module.exports = router;
