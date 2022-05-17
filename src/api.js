const router = require("express").Router();
const linkedinRouter = require("./routes/Linkedin.router");

router.use("/linkedin", linkedinRouter);

module.exports = router;
