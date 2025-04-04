const { transporter } = require("../../utils/nodemailer");

exports.checkIsExistedEmailFromDb = async (client, email) => {
  const results = await client.query(
    `
      SELECT
        CASE 
          WHEN email = $1 THEN true 
          ELSE false
        END AS isExistedEmail
      FROM users.lists
      WHERE email = $1
    `,
    [email]
  );

  return results.rows[0].isExistedEmail;
};

exports.createVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.saveVerificationCodeAtDb = async (client, email, code) => {
  await client.query(
    `
        INSERT INTO users.codes(
        email,
        code
      ) VALUES (
       $1, $2
      )
    `,
    [email, code]
  );
};

exports.sendEmailVerificationCode = async (email, code) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "이메일 인증 코드",
    text: `인증번호: ${code}`,
  });
};

exports.checkVerificationCodeAtDb = async (client, email, code) => {
  const results = await client.query(
    `
      SELECT
        CASE 
          WHEN code = $1 THEN true 
          ELSE false
        END AS isValidCode
      FROM users.codes
      WHERE email = $2
    `,
    [code, email]
  );

  return results.rows[0].isValidCode;
};
