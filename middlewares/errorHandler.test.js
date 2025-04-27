const errorHandler = require("./errorHandler");

describe("errorHandler", () => {
  it("error 객체에 status와 message가 없는 경우 기본값으로 응답해야한다.", () => {
    const err = {};
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "서버에 오류 발생" });
  });

  it("error 객체에 status와 message가 있는 경우 해당 값으로 응답해야한다.", () => {
    const err = {
      status: 400,
      message: "뭔가 오류 발생",
    };
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(err.status);
    expect(res.json).toHaveBeenCalledWith({ message: err.message });
  });
});

describe("errorHandeler with code 23505", () => {
  const errorCases = [
    {
      code: "23505",
      constraint: "lists_id_key",
      status: 409,
      message: "중복 아이디 회원 있음",
      target: "id",
    },
    {
      code: "23505",
      constraint: "lists_nickname_key",
      status: 409,
      message: "중복 닉네임 회원 있음",
      target: "nickname",
    },
    {
      code: "23505",
      constraint: "lists_email_key",
      status: 409,
      message: "중복 이메일 회원 있음",
      target: "email",
    },
    {
      code: "23505",
      constraint: "unique_restaurants_likes",
      status: 409,
      message: "음식점 즐겨찾기 중복 등록",
      target: undefined,
    },
    {
      code: "23505",
      constraint: "unique_menus_likes",
      status: 409,
      message: "메뉴 추천 중복 등록",
      target: undefined,
    },
    {
      code: "23505",
      constraint: "unique_reviews_likes",
      status: 409,
      message: "후기 좋아요 중복 등록",
      target: undefined,
    },
    {
      code: "23505",
      constraint: "unique_restaurants_reports",
      status: 409,
      message: "음식점 신고 중복 등록",
      target: undefined,
    },
    {
      code: "23505",
      constraint: "unique_menus_reports",
      status: 409,
      message: "메뉴 신고 중복 등록",
      target: undefined,
    },
    {
      code: "23505",
      constraint: "unique_reviews_reports",
      status: 409,
      message: "후기 신고 중복 등록",
      target: undefined,
    },
    {
      code: "23505",
      constraint: "케이스 없음",
      status: 409,
      message: "케이스 없는 오류",
      target: "케이스 없음",
    },
  ];
  it.each(errorCases)(
    "code 23505 constraint가 $constraint일때 상태코드 409와 안내 메시지를 응답해야한다.",
    ({ code, constraint, status, message, target }) => {
      const err = {
        code,
        constraint,
        message,
        target,
      };
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(status);
      expect(res.json).toHaveBeenCalledWith({
        message,
        target,
      });
    }
  );
});

describe("errorHandeler with code 23503", () => {
  const errorCases = [
    {
      code: "23503",
      constraint: "lists_restaurants_idx_fkey",
      status: 400,
      message: "입력값 확인 필요",
      target: "restaurants_idx",
    },
    {
      code: "23503",
      constraint: "lists_menus_idx_fkey",
      status: 400,
      message: "입력값 확인 필요",
      target: "menus_idx",
    },
    {
      code: "23503",
      constraint: "local_tokens_users_idx_fkey",
      status: 400,
      message: "입력값 확인 필요",
      target: "users_idx",
    },
    {
      code: "23503",
      constraint: "likes_restaurants_idx_fkey",
      status: 400,
      message: "입력값 확인 필요",
      target: "restaurants_idx",
    },
    {
      code: "23503",
      constraint: "likes_menus_idx_fkey",
      status: 400,
      message: "입력값 확인 필요",
      target: "menus_idx",
    },
    {
      code: "23503",
      constraint: "likes_reviews_idx_fkey",
      status: 400,
      message: "입력값 확인 필요",
      target: "reviews_idx",
    },
    {
      code: "23503",
      constraint: "lists_categories_idx_fkey",
      status: 400,
      message: "입력값 확인 필요",
      target: "category_idx",
    },
    {
      code: "23503",
      constraint: "케이스 없음",
      status: 400,
      message: "케이스 없는 오류",
      target: "케이스 없음",
    },
  ];
  it.each(errorCases)(
    `code가 23503이고 constraint가 $constraint일때 상태코드 400와 안내 메시지를 응답해야한다.`,
    ({ code, constraint, status, message, target }) => {
      const err = {
        code,
        constraint,
        message,
        target,
      };
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(status);
      expect(res.json).toHaveBeenCalledWith({
        message,
        target,
      });
    }
  );
});
