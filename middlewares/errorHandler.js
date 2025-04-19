const errorHandler = (err, req, res, next) => {
  const { status, message, code, constraint, target } = err;
  console.log(err);
  if (code === "23505") {
    if (constraint === "lists_id_key") {
      res.status(409).json({ message: "중복 아이디 회원 있음", target: "id" });
    } else if (constraint === "lists_nickname_key") {
      res.status(409).json({ message: "중복 닉네임 회원 있음", target: "nickname" });
    } else if (constraint === "lists_email_key") {
      res.status(409).json({ message: "중복 이메일 회원 있음", target: "email" });
    } else if (constraint === "unique_restaurants_likes") {
      res.status(409).json({ message: "중복 음식점 즐겨찾기 등록" });
    } else if (constraint === "unique_menus_likes") {
      res.status(409).json({ message: "중복 메뉴 추천 등록" });
    } else if (constraint === "unique_reviews_likes") {
      res.status(409).json({ message: "중복 후기 좋아요 등록" });
    } else {
      res.status(409).json({ message, target: constraint });
    }
  } else if (code === "23503") {
    if (constraint === "lists_restaurants_idx_fkey") {
      res.status(404).json({ message: "음식점 없음", target: "restaurant_idx" });
    } else if (constraint === "lists_menus_idx_fkey") {
      res.status(404).json({ message: "메뉴 없음", target: "menu_idx" });
    } else if (constraint === "local_tokens_users_idx_fkey") {
      res.status(404).json({ message: "사용자 없음", target: "users_idx" });
    } else if (constraint === "likes_restaurants_idx_fkey") {
      res.status(404).json({ message: "음식점 없음" });
    } else if (constraint === "likes_menus_idx_fkey") {
      res.status(404).json({ message: "메뉴 없음" });
    } else if (constraint === "likes_reviews_idx_fkey") {
      res.status(404).json({ message: "후기 없음" });
    } else {
      res.status(404).json({ message, target: constraint });
    }
  }

  res.status(status || 500).json({ message: message || "서버에 오류 발생", target });
};

module.exports = errorHandler;
