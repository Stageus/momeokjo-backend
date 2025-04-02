const { createValidateChain } = require("./createValidateChain");

describe("createValidateChain", () => {
  it("body, params, query가 object 타입이 아닐때 빈 배열을 리턴한다.", () => {
    ["body", "params", "query"].forEach((key) => {
      [null, undefined, "", 123, true, []].forEach((value) => {
        expect(createValidateChain({ [key]: value })).toEqual([]);
      });
    });
  });

  it("body, params, query가 object 타입이지만 빈 객체일때 빈배열 배열을 리턴한다.", () => {
    ["body", "params", "query"].forEach((key) => {
      expect(createValidateChain({ [key]: {} })).toEqual([]);
    });
  });

  it("body, params, query가 object 타입일때 function 배열을 리턴한다.", () => {
    ["body", "params", "query"].forEach((key) => {
      expect(
        createValidateChain({
          [key]: { id: { isRequired: true, defaultValue: null, regexp: /^./ } },
        })
      ).toEqual(expect.arrayContaining([expect.any(Function)]));
    });
  });
});
