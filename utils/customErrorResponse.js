const customErrorResponse = ({ status, message, target = null }) => {
  const error = new Error(message);
  error.status = status;

  if (target) {
    error.target = target;
  }

  return error;
};

module.exports = customErrorResponse;
