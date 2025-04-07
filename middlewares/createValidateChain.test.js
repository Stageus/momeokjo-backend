const { createValidateChain } = require("./createValidateChain");
const { createChain } = require("../utils/validate");

jest.mock("../utils/validate");

describe("createValidateChain", () => {
  beforeEach(() => {
    createChain.mockClear();
  });

  const invalidSchema = { body: {}, params: {}, query: {} };
  it.each(Object.keys(invalidSchema))(
    "스키마가 유효하지 않으면 빈 배열을 리턴해야한다.",
    (schema) => {
      createChain.mockReturnValue([]);

      const result = createValidateChain({ [schema]: invalidSchema[schema] });

      expect(createChain).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    }
  );

  const validSchema = {
    body: { isRequired: "", defaultValue: "", regexp: "" },
    query: { isRequired: "", defaultValue: "", regexp: "" },
    param: { isRequired: "", defaultValue: "", regexp: "" },
  };
  it.each(Object.keys(validSchema))("스키마가 유효하면 function 배열을 리턴한다.", (schema) => {
    const mockFn = jest.fn();
    createChain.mockReturnValue([mockFn]);

    const result = createValidateChain({ [schema]: validSchema[schema] });

    expect(createChain).toHaveBeenCalledWith(schema, validSchema[schema]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.any(Function));
  });
});
