const errorHandler = (err, req, res, next) => {
  const { status, message, code, constraint, target } = err;

  if (code === "23505") {
    if (constraint === "lists_id_key") {
      return res.status(409).json({ message: "중복 아이디 회원 있음", target: "id" });
    } else if (constraint === "lists_nickname_key") {
      return res.status(409).json({ message: "중복 닉네임 회원 있음", target: "nickname" });
    } else if (constraint === "lists_email_key") {
      return res.status(409).json({ message: "중복 이메일 회원 있음", target: "email" });
    } else if (constraint === "unique_restaurants_likes") {
      return res.status(409).json({ message: "음식점 즐겨찾기 중복 등록" });
    } else if (constraint === "unique_menus_likes") {
      return res.status(409).json({ message: "메뉴 추천 중복 등록" });
    } else if (constraint === "unique_reviews_likes") {
      return res.status(409).json({ message: "후기 좋아요 중복 등록" });
    } else if (constraint === "unique_restaurants_reports") {
      return res.status(409).json({ message: "음식점 신고 중복 등록" });
    } else if (constraint === "unique_menus_reports") {
      return res.status(409).json({ message: "메뉴 신고 중복 등록" });
    } else if (constraint === "unique_reviews_reports") {
      return res.status(409).json({ message: "후기 신고 중복 등록" });
    } else {
      return res.status(409).json({ message, target: constraint });
    }
  } else if (code === "23503") {
    if (constraint === "lists_restaurants_idx_fkey") {
      return res.status(400).json({ message: "입력값 확인 필요", target: "restaurants_idx" });
    } else if (constraint === "lists_menus_idx_fkey") {
      return res.status(400).json({ message: "입력값 확인 필요", target: "menus_idx" });
    } else if (constraint === "local_tokens_users_idx_fkey") {
      return res.status(400).json({ message: "입력값 확인 필요", target: "users_idx" });
    } else if (constraint === "likes_restaurants_idx_fkey") {
      return res.status(400).json({ message: "입력값 확인 필요", target: "restaurants_idx" });
    } else if (constraint === "likes_menus_idx_fkey") {
      return res.status(400).json({ message: "입력값 확인 필요", target: "menus_idx" });
    } else if (constraint === "likes_reviews_idx_fkey") {
      return res.status(400).json({ message: "입력값 확인 필요", target: "reviews_idx" });
    } else if (constraint === "lists_categories_idx_fkey") {
      return res.status(400).json({ message: "입력값 확인 필요", target: "category_idx" });
    } else {
      return res.status(400).json({ message, target: constraint });
    }
  }

  return res.status(status || 500).json({ message: message || "서버에 오류 발생", target });
};

module.exports = errorHandler;
