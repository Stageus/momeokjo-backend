const { body, query, param } = require("express-validator");
const { getValidationMethod, createChain } = require("./validate");
const customErrorResponse = require("./customErrorResponse");

describe("getValidationMethod", () => {
  const invalidType = [null, undefined, "", 123, true, [], {}];
  it.each(invalidType)("type이 유효하지 않으면 null을 리턴해야한다.", (type) => {
    expect(getValidationMethod(type)).toBe(null);
  });

  const validType = [{ body: body }, { query: query }, { param: param }];
  it.each(validType)(
    "type이 유효하면 type에 맞는 express-validator 메소드를 리턴해야한다.",
    (type) => {
      const key = Object.keys(type)[0];
      expect(getValidationMethod(key)).toBe(type[key]);
    }
  );
});

describe("createChain", () => {
  const invalidType = [null, undefined, "", 123, true, [], {}];
  it.each(invalidType)("타입이 유효하지 않으면 예외를 발생시켜야 한다.", (type) => {
    try {
      createChain(type, {});
    } catch (err) {
      expect(err.status).toBe(500);
      expect(err.message).toBe(`validate 대상이 올바르지 않습니다. type: ${type}`);

      const errRes = customErrorResponse({ status: err.status, message: err.message });
      expect(errRes).toBeInstanceOf(Error);
      expect(errRes).toMatchObject({
        status: 500,
        message: `validate 대상이 올바르지 않습니다. type: ${type}`,
      });
    }
  });

  const validType = ["body", "query", "param"];
  it.each(validType)("타입은 유효하지만 빈 객체가 전달된 경우 예외를 발생시켜야 한다.", (type) => {
    try {
      createChain(type, {});
    } catch (err) {
      expect(err.status).toBe(500);
      expect(err.message).toBe(`validate 객체가 없습니다.`);

      const errRes = customErrorResponse({ status: err.status, message: err.message });
      expect(errRes).toBeInstanceOf(Error);
      expect(errRes).toMatchObject({
        status: 500,
        message: `validate 객체가 없습니다.`,
      });
    }
  });

  const validObject = [
    { body: { id: { isRequired: true, defaultValue: null, regexp: /^./ } } },
    { query: { id: { isRequired: false, defaultValue: "1", regexp: /^./ } } },
    { param: { id: { isRequired: true, defaultValue: null, regexp: /^./ } } },
  ];
  it.each(validObject)("%s 타입과 객체가 유효하면 validator chain 배열을 리턴해야한다.", (obj) => {
    const type = Object.keys(obj)[0];
    const result = createChain(type, obj[type]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        notEmpty: expect.any(Function),
        matches: expect.any(Function),
        withMessage: expect.any(Function),
      })
    );
  });
});
