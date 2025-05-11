// 일반 wrapper
const tryCatchWrapper = (func) => async (req, res, next) => {
  try {
    await func(req, res, next);
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release(); // 클라이언트 반환
  }
};

// 데이터베이스 작업이 필요한 경우 사용할 wrapper
const tryCatchWrapperWithDb = (pool) => (func) => async (req, res, next) => {
  const client = await pool.connect();
  try {
    await func(req, res, next, client);
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
};

// 신고 누적으로 인한 soft delete 진행 시 사용할 wrapper
const tryCatchWrapperWithDbTransaction = (pool) => (func) => async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 트랜잭션을 사용할 함수에 client(트랜잭션을 관리할 클라이언트 객체) 전달
    await func(req, res, next, client);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release(); // 클라이언트 반환
  }
};

module.exports = {
  tryCatchWrapper,
  tryCatchWrapperWithDb,
  tryCatchWrapperWithDbTransaction,
};
