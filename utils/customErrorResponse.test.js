const customErrorResponse = require("./customErrorResponse");

it("status와 message를 갖는 Error 객체를 리턴해야한다.", () => {
  const status = 400;
  const message = "some error";

  const result = customErrorResponse({ status, message });

  expect(result).toBeInstanceOf(Error);
  expect(result.status).toBe(status);
  expect(result.message).toBe(message);
});

it("status와 message, target을 갖는 Error 객체를 리턴해야한다.", () => {
  const status = 400;
  const message = "some error";
  const target = "some target";

  const result = customErrorResponse({ status, message, target });

  expect(result).toBeInstanceOf(Error);
  expect(result.status).toBe(status);
  expect(result.message).toBe(message);
  expect(result.target).toBe(target);
});
