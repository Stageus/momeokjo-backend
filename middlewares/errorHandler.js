const errorHandler = (err, req, res, next) => {
  const { status, message, code, constraint } = err;

  // console.log(err);
  if (code === "23505") {
    if (constraint === "lists_id_key") {
      res.status(409).json({ message: "중복 아이디 회원 있음", target: "id" });
    } else if (constraint === "lists_nickname_key") {
      res.status(409).json({ message: "중복 닉네임 회원 있음", target: "nickname" });
    } else if (constraint === "lists_email_key") {
      res.status(409).json({ message: "중복 이메일 회원 있음", target: "email" });
    } else {
      res.status(409).json({ message, target: constraint });
    }
  }

  res.status(status || 500).json({ message: message || "서버에 오류 발생" });
};

module.exports = errorHandler;
