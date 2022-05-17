require("module-alias/register");
const path = require("path");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const env = require("@/config/env");
const apiRouter = require("@/src/api");

app.disable("x-powered-by");
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/public", express.static(path.join(__dirname, "public")));

// TODO: Use "/api" for all api routes
app.use("/", apiRouter);

const _PORT = env.PORT || 5000;

app.listen(_PORT, () => {
  console.log(`Server running on port ${_PORT}`);
});
