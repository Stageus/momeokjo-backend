const customErrorResponse = (status, message) => {
  const error = new Error(message);
  error.status = status;

  return error;
};

module.exports = customErrorResponse;
