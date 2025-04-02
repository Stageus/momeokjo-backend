const { body, query, param } = require("express-validator");
const { getValidationMethod, createChain } = require("./validate");
const { commonErrorResponse } = require("./customErrorResponse");

jest.mock("./customErrorResponse", () => ({
  commonErrorResponse: jest.fn(),
}));

describe("getValidationMethod", () => {
  it("인수가 body인 경우 body 함수, query인 경우 query 함수, params인 경우 param 함수를 반환해야한다.", () => {
    [{ body: body }, { query: query }, { params: param }].forEach((target) => {
      const key = Object.keys(target)[0];
      expect(getValidationMethod(key)).toBe(target[key]);
    });
  });

  it("인수가 body, query, params가 아니면 null을 반환해야한다.", () => {
    [null, undefined, "", 123, true, [], {}].forEach((value) => {
      expect(getValidationMethod(value)).toBe(null);
    });
  });
});

describe("createChain", () => {
  it("타입이 body, query, params가 아니면 commonErrorResponse를 호출해야한다.", () => {
    [null, undefined, "", 123, true, [], {}].forEach((type) => {
      createChain(type, {});

      expect(commonErrorResponse).toHaveBeenCalledWith(
        500,
        `validate 대상이 올바르지 않습니다. type: ${type}`
      );
    });
  });

  it("타입이 body, query, params이고 빈 객체이면 commonErrorRespons를 호출해야한다.", () => {
    ["body", "query", "params"].forEach((type) => {
      createChain(type, {});

      expect(commonErrorResponse).toHaveBeenCalledWith(500, "validate 객체가 없습니다.");
    });
  });

  it("타입이 body, query, params이고 객체이 필수값이 있으면 미들웨어 함수 배열을 리턴한다.", () => {
    const testObj = { id: { isRequired: true, defaultValue: null, regexp: /^./ } };
    [{ body: testObj }, { query: testObj }, { params: testObj }].forEach((obj) => {
      const type = Object.keys(obj)[0];
      const result = createChain(type, obj[type]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.any(Function));
    });
  });
});
