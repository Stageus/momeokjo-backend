require("dotenv").config();

const algorithm = require("./algorithm");
const customErrorResponse = require("./customErrorResponse");

describe("encrypt", () => {
  const invalidInputs = [null, undefined, 123, {}, [], true];
  it.each(invalidInputs)(
    "인수가 string 타입이 아니면 상태코드 500과 안내 메시지로 예외를 발생시켜야한다.",
    async (input) => {
      try {
        await algorithm.encrypt(input);
      } catch (err) {
        expect(err).toBeDefined();
        expect(err.status).toBe(500);
        expect(err.message).toBe("암호화할 대상의 타입이 string이 아님");

        const errRes = customErrorResponse(err.status, err.message);
        expect(errRes).toBeInstanceOf(Error);
        expect(errRes).toMatchObject(
          expect.objectContaining({
            status: 500,
            message: "암호화할 대상의 타입이 string이 아님",
          })
        );
      }
    }
  );

  it("인수가 string 타입이면 암호화된 문자열을 리턴해야한다.", async () => {
    process.env.ALGORITHM_SECRET = "some_scret";
    process.env.ALGORITHM_WAY = "aes-256-gcm";
    process.env.ALGORITHM_IV_LENGTH = 12;

    const text = "some_text";
    const encrypted = await algorithm.encrypt(text);

    expect(typeof encrypted).toBe("string");
    expect(encrypted.split(":")).toHaveLength(3);
  });
});

describe("decrypt", () => {
  const invalidInputs = [null, undefined, 123, {}, [], true];
  it.each(invalidInputs)(
    "인수가 string 타입이 아니면 상태코드 500과 안내 메시지로 예외를 발생시켜야한다.",
    async (input) => {
      try {
        await algorithm.decrypt(input);
      } catch (err) {
        expect(err.status).toBe(500);
        expect(err.message).toBe("복호화할 대상의 타입이 string이 아님");

        const errRes = customErrorResponse(err.status, err.message);
        expect(errRes).toBeInstanceOf(Error);
        expect(errRes).toMatchObject(
          expect.objectContaining({
            status: 500,
            message: "복호화할 대상의 타입이 string이 아님",
          })
        );
      }
    }
  );

  it("인수가 string 타입이지만 암호화된 문자열이 아니면 상태코드 500과 안내 메시지로 예외를 발생시켜야한다.", async () => {
    try {
      await algorithm.decrypt("some_text");
    } catch (err) {
      expect(err.status).toBe(500);
      expect(err.message).toBe(
        "The first argument must be of type string or an instance of Buffer, ArrayBuffer, or Array or an Array-like Object. Received undefined"
      );

      const errRes = customErrorResponse(err.status, err.message);
      expect(errRes).toBeInstanceOf(Error);
      expect(errRes).toMatchObject(
        expect.objectContaining({
          status: 500,
          message:
            "The first argument must be of type string or an instance of Buffer, ArrayBuffer, or Array or an Array-like Object. Received undefined",
        })
      );
    }
  });

  it("인수가 잘못된 암호화 문자열이면 상태코드 500과 안내 메시지로 예외를 발생시켜야한다.", async () => {
    try {
      await algorithm.decrypt("a:b:c");
    } catch (err) {
      expect(err.status).toBe(500);
      expect(err.message).toBe("Invalid initialization vector");

      const errRes = customErrorResponse(err.status, err.message);
      expect(errRes).toBeInstanceOf(Error);
      expect(errRes).toMatchObject(
        expect.objectContaining({
          status: 500,
          message: "Invalid initialization vector",
        })
      );
    }
  });

  it("인수가 string 타입의 암호화된 문자열이면 복호화된 문자열을 리턴해야한다.", async () => {
    const result = await algorithm.decrypt(
      "Ri2382VWvpIXJagC:EyOcWdaYwxzV1YtCbPmVBA==:8ZqOqqmdMb2S"
    );

    expect(result).toBe("some_text");
  });
});
