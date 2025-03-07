const express = require("express");
require("dotenv").config();

const app = express();

const authRouter = require("./domains/auth/router");
const restaurantsRouter = require("./domains/restaurants/router");
const usersRouter = require("./domains/users/router");
const errorHandler = require("./middlewares/errorHandler");
const notFoundHandler = require("./middlewares/notFoundHandler");

app.use("/auth", authRouter);
app.use("/restaurants", restaurantsRouter);
app.use("/users", usersRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
