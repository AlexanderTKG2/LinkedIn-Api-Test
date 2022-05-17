const axios = require("axios").default;
const DEFAULT_SCOPES = "r_emailaddress r_liteprofile w_member_social";

class LinkedInService {
  constructor(appId, appSecret, callback, scopes = "", ssl = true) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.csrf = parseInt(Math.random(11111111111111) * 10000000000000);
    this.callback = callback;
    this.scopes = scopes || DEFAULT_SCOPES;
    this.ssl = ssl;
  }

  getAuthUrl() {
    return (
      "https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=" +
      this.appId +
      "&state=" +
      this.csrf +
      "&scope=" +
      encodeURIComponent(this.scopes) +
      "&redirect_uri=" +
      encodeURIComponent(this.callback)
    );
  }

  async getAccessToken(code) {
    try {
      const url = "https://www.linkedin.com/oauth/v2/accessToken";
      let params = {
        client_id: this.appId,
        client_secret: this.appSecret,
        redirect_uri: this.callback,
        code: code,
        grant_type: "authorization_code",
      };

      const queryParams = new URLSearchParams(params);
      const _response = await this.sendPostRequest(
        url,
        queryParams.toString(),
        "application/x-www-form-urlencoded"
      );

      return _response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getAccountData(accessToken) {
    try {
      const url =
        "https://api.linkedin.com/v2/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))&oauth2_access_token=" +
        accessToken;
      const response = await this.sendGetRequest(url);
      console.log("TACHALA");
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getAccountId(accessToken) {
    try {
      const url =
        "https://api.linkedin.com/v2/me?oauth2_access_token=" + accessToken;
      const response = await this.sendGetRequest(url);
      console.log(response);
      return response;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async sendPostRequest(url, payload, contentType = "application/json") {
    try {
      const response = await axios.post(url, payload, {
        headers: {
          "Content-Type": contentType,
        },
      });

      return response;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async sendGetRequest(url, contentType = "*/*") {
    try {
      const response = await axios.get(url, {
        headers: {
          "Content-Type": contentType,
        },
      });
      return response;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

module.exports = LinkedInService;
