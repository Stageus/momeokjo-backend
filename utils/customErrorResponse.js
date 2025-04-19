const customErrorResponse = ({ status, message, target = null }) => {
  const error = new Error(message);
  error.status = status;
  error.target = target;

  return error;
};

module.exports = customErrorResponse;
