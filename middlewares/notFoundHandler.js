const notFoundHandler = (req, res, next) => {
  res.status(404).json({ message: "요청한 API 찾을 수 없음" });
};

module.exports = notFoundHandler;
