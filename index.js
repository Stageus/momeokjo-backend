const express = require("express");
const session = require("express-session");
require("dotenv").config();

const app = express();

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

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
