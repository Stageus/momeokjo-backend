const express = require("express");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();

app.use(cookieParser());
app.use(express.json());

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

module.exports = app;
