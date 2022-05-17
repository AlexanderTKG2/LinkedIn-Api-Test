const router = require("express").Router();
const LinkedInService = require("@/src/services/Linkedin.service");
const env = require("@/config/env");

const linkedInService = new LinkedInService(
  env.linkedin.client_id,
  env.linkedin.client_secret,
  env.linkedin.callback_url
);

router.get("/auth", (req, res) => {
  try {
    const redirect = linkedInService.getAuthUrl();
    res.redirect(redirect);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/callback", async (req, res) => {
  try {
    const code = req.code || req.query.code || req.params.code;
    if (!code) {
      res.status(400).json({ error: "No request code found" });
    }
    const data = await linkedInService.getAccessToken(code);
    if (!data) {
      res.status(400).json({ error: "No access TOKEN found" });
    }
    res.status(200).json({ data });
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/account-data", async (req, res) => {
  try {
    let accessToken = req.body.accessToken;
    if (!accessToken) {
      res.status(400).json({ error: "bad request" });
    }
    const accountData = await linkedInService.getAccountData(accessToken);
    res.status(200).json(accountData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
