require("dotenv").config();

const algorithm = require("./algorithm");
const crypto = require("crypto");

describe("encrypt", () => {
  const invalidInputs = [null, undefined, 123, {}, [], true];
  it.each(invalidInputs)(
    "인수가 string 타입이 아니면 안내 메시지를 응답해야한다.",
    async (input) => {
      const { isEncrypted, results } = await algorithm.encrypt(input);

      expect(isEncrypted).toBe(false);
      expect(results).toBe("암호화할 대상의 타입이 string이 아님");
    }
  );

  it("인수가 string 타입이면 암호화된 문자열을 포함한 객체를 리턴해야한다.", async () => {
    process.env.ALGORITHM_SECRET = "some_scret";

    const { isEncrypted, results } = await algorithm.encrypt("some_text");

    expect(isEncrypted).toBe(true);
    expect(results.split(":")).toHaveLength(3);
  });

  it("인수가 string 타입이지만 암호화에 실패하면 안내 메시지로 응답해야한다.", async () => {
    process.env.ALGORITHM_SECRET = "some_scret";

    jest.spyOn(crypto, "createCipheriv").mockImplementation(() => {
      throw new Error();
    });

    const { isEncrypted, results } = await algorithm.encrypt("some_text");

    expect(isEncrypted).toBe(false);
    expect(results).toBe("암호화 중 오류 발생");
  });
});

describe("decrypt", () => {
  const invalidInputs = [null, undefined, 123, {}, [], true];
  it.each(invalidInputs)(
    "인수가 string 타입이 아니면 안내 메시지를 응답해야한다.",
    async (input) => {
      const { isDecrypted, results } = await algorithm.decrypt(input);

      expect(isDecrypted).toBe(false);
      expect(results).toBe("복호화할 대상의 타입이 string이 아님");
    }
  );

  it("인수가 string 타입이지만 암호화된 문자열이 아니면 안내 메시지를 응답해야한다.", async () => {
    process.env.ALGORITHM_SECRET = "some_scret";

    const { isDecrypted, results } = await algorithm.decrypt("some_text");

    expect(isDecrypted).toBe(false);
    expect(results).toBe(
      "The first argument must be of type string or an instance of Buffer, ArrayBuffer, or Array or an Array-like Object. Received undefined"
    );
  });

  it("인수가 잘못된 암호화 문자열이면 안내 메시지를 응답해야한다.", async () => {
    process.env.ALGORITHM_SECRET = "some_scret";

    const { isDecrypted, results } = await algorithm.decrypt("a:b:c");

    expect(isDecrypted).toBe(false);
    expect(results).toBe("Invalid initialization vector");
  });

  it("인수가 string 타입의 암호화된 문자열이면 복호화된 문자열을 리턴해야한다.", async () => {
    process.env.ALGORITHM_SECRET = "some_scret";

    const { isDecrypted, results } = await algorithm.decrypt(
      "Ri2382VWvpIXJagC:EyOcWdaYwxzV1YtCbPmVBA==:8ZqOqqmdMb2S"
    );

    expect(isDecrypted).toBe(true);
    expect(results).toBe("some_text");
  });

  it("복호화 중 오류가 발생하면 안내 메시지를 응답해야한다.", async () => {
    process.env.ALGORITHM_SECRET = "some_scret";

    jest.spyOn(crypto, "createDecipheriv").mockImplementation(() => {
      throw new Error();
    });

    const { isDecrypted, results } = await algorithm.decrypt(
      "Ri2382VWvpIXJagC:EyOcWdaYwxzV1YtCbPmVBA==:8ZqOqqmdMb2S"
    );

    expect(isDecrypted).toBe(false);
    expect(results).toBe("복호화 중 오류 발생");
  });
});
