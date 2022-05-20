const axios = require("axios").default;
const DEFAULT_SCOPES = "r_emailaddress r_liteprofile w_member_social";
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

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
      return response.data.id;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async linkedinTextPost(
    accessToken,
    accountId,
    postText,
    visibility = "PUBLIC"
  ) {
    try {
      const postUrl =
        "https://api.linkedin.com/v2/ugcPosts?oauth2_access_token=" +
        accessToken;
      const requestPayload = {
        author: "urn:li:person:" + accountId,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: postText,
            },
            shareMediaCategory: "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": visibility,
        },
      };

      const _response = await this.sendPostRequest(postUrl, requestPayload);

      return _response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async linkedInSingleImagePost(
    accessToken,
    accountId,
    postText,
    imageFilePath,
    imageTitle,
    imageDescription,
    visibility = "PUBLIC"
  ) {
    try {
      const prepareUrl =
        "https://api.linkedin.com/v2/assets?action=registerUpload&oauth2_access_token=" +
        accessToken;

      const prepareRequestPayload = {
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner: `urn:li:person:${accountId}`,
          serviceRelationships: [
            {
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent",
            },
          ],
          supportedUploadMechanism: ["SYNCHRONOUS_UPLOAD"],
        },
      };

      const prepareResponse = await this.sendPostRequest(
        prepareUrl,
        prepareRequestPayload
      );

      const uploadUrl =
        prepareResponse.data.value.uploadMechanism[
          "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
        ].uploadUrl;
      const assetId = prepareResponse.data.value.asset;

      console.log(uploadUrl);
      console.log(assetId);

      // Unimplemented
      // TODO: upload file and create post

      const headers = {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "multipart/form-data",
        "X-Restli-Protocol-VersionW": "2.0.0",
      };

      const newFileStream = await fs.createReadStream(
        path.join(process.cwd(), imageFilePath)
      );

      const postUrl =
        "https://api.linkedin.com/v2/ugcPosts?oauth2_access_token=" +
        accessToken;

      const postRequestPayload = {
        author: "urn:li:person:" + accountId,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: postText,
            },
            shareMediaCategory: "IMAGE",
            media: [
              {
                status: "READY",
                description: {
                  text: imageDescription.substring(0, 200),
                },
                media: assetId,
                title: {
                  text: imageTitle,
                },
              },
            ],
            visibility: {
              "com.linkedin.ugc.MemberNetworkVisibility": visibility,
            },
          },
        },
      };
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

  async sendPutRequest(url, payload, requestHeaders) {
    try {
      const response = await axios.put(url, {
        headers: { ...requestHeaders },
      });
      return response;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  promise_fopen(path) {
    return new Promise((resolve, reject) => {
      fs.open(path, "r+", (error, fd) => {
        if (error) {
          reject(error);
        }
        resolve(fd);
      });
    });
  }
}

module.exports = LinkedInService;
