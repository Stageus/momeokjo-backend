const tryCatchWrapper = (func) => (req, res, next) => {
  try {
    func(req, res, next);
  } catch (err) {
    next(err);
  }
};

module.exports = tryCatchWrapper;
