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

router.post("/simple-text-post", async (req, res) => {
  try {
    const accessToken = req.body.accessToken;
    const postText = req.body.postText;

    if (!(accessToken && postText)) {
      res.status(400).json({ error: "bad request" });
    }

    const _accountIdResponse = await linkedInService.getAccountId(accessToken);
    const accountId = _accountIdResponse;

    const _postDataResponse = await linkedInService.linkedinTextPost(
      accessToken,
      accountId,
      postText
    );

    res.status(200).json({
      message: "post created",
      status: "success",
      postData: _postDataResponse,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
    res.end();
  }
});

module.exports = router;
