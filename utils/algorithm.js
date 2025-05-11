const utils = require("util");
const crypto = require("crypto");

const algorithm = process.env.ALGORITHM_WAY;
const ivLength = parseInt(process.env.ALGORITHM_IV_LENGTH);
const password = process.env.ALGORITHM_SECRET;

const asyncScrypt = utils.promisify(crypto.scrypt);
const asyncRandomBytes = utils.promisify(crypto.randomBytes);

// 암호화
exports.encrypt = async (text) => {
  try {
    if (!text || typeof text !== "string")
      return { isEncrypted: false, results: "암호화할 대상의 타입이 string이 아님" };

    const iv = await asyncRandomBytes(ivLength);
    const key = await asyncScrypt(password, "salt", 32);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
      isEncrypted: true,
      results: [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(
        ":"
      ),
    };
  } catch (err) {
    return { isEncrypted: false, results: err.message || "암호화 중 오류 발생" };
  }
};

// 복호화
exports.decrypt = async (encryptedText) => {
  try {
    if (!encryptedText || typeof encryptedText !== "string")
      return {
        isDecrypted: false,
        results: "복호화할 대상의 타입이 string이 아님",
      };
    const [ivB64, tagB64, encryptedB64] = encryptedText.split(":");

    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");

    const encrypted = Buffer.from(encryptedB64, "base64");
    const key = await asyncScrypt(password, "salt", 32);
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return { isDecrypted: true, results: decrypted.toString("utf8") };
  } catch (err) {
    return { isDecrypted: false, results: err.message || "복호화 중 오류 발생" };
  }
};
