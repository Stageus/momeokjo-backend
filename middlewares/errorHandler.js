const errorHandler = (err, req, res, next) => {
  const { status, message } = err;
  res.status(status || 500).json({ message: message || "서버에 오류 발생" });
};

module.exports = errorHandler;
