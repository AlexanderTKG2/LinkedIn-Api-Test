const axios = require("axios").default;
const DEFAULT_SCOPES =
  "r_organization_social rw_organization_admin r_emailaddress r_liteprofile r_ads rw_ads w_member_social w_organization_social";
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
    files,
    visibility = "PUBLIC"
  ) {
    try {
      const preparedMedia = [];

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
        },
      };

      const uploadHeaders = {
        Authorization: "Bearer " + accessToken,
      };

      for (const file of files) {
        const prepareResponse = await this.sendPostRequest(
          prepareUrl,
          prepareRequestPayload
        );

        const uploadUrl =
          prepareResponse.data.value.uploadMechanism[
            "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
          ].uploadUrl;
        const assetId = prepareResponse.data.value.asset;

        const responseImage = await this.sendPostRequest(
          uploadUrl,
          file.buffer,
          "image/png",
          uploadHeaders
        );

        preparedMedia.push({
          status: "READY",
          description: {
            text: "New Post!",
          },
          media: assetId,
          title: {
            text: "Glasshive image post",
          },
        });
      }

      // console.log(responseImage);

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
            media: preparedMedia,
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": visibility,
        },
      };
      const _response = await this.sendPostRequest(postUrl, postRequestPayload);
      return _response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async createVideoPost(videoAssetUrnId, postText, videoTitle, accessToken) {
    try {
      const personId = await this.getAccountId(accessToken);
      const personOwnerUrn = `urn:li:person:${personId}`;

      const videoPostCreationUrl = "https://api.linkedin.com/rest/posts";

      const videoPostCreationRequestBody = {
        author: personOwnerUrn,
        commentary: postText,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        content: {
          media: {
            title: videoTitle,
            id: videoAssetUrnId,
          },
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      };

      const postRequestContentType = "application/json";

      const todayDateComponentsStr = new Date().toISOString().split("-");

      // LinkedIn version: version number in the format YYYYMM
      const linkedinVersion =
        todayDateComponentsStr[0] + todayDateComponentsStr[1];

      const postCreationAdditionalHeaders = {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": linkedinVersion,
      };

      console.log("Creating post for video: " + videoAssetUrnId);

      const postCreationResponse = await this.sendPostRequest(
        videoPostCreationUrl,
        videoPostCreationRequestBody,
        postRequestContentType,
        postCreationAdditionalHeaders
      );

      const newPostUgcUrnId = postCreationResponse.headers["x-restli-id"];

      const newPostUgcUrl = `https://www.linkedin.com/feed/update/${newPostUgcUrnId}`;

      const response = {
        status: "Created",
        postUrl: newPostUgcUrl,
      };

      return response;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async uploadVideoAsset(video, accessToken) {
    try {
      const personId = await this.getAccountId(accessToken);
      const personOwnerUrn = `urn:li:person:${personId}`;
      const size = video.size;

      // Initialize video upload
      const initUploadUrl =
        "https://api.linkedin.com/rest/videos?action=initializeUpload";

      const initUploadBody = {
        initializeUploadRequest: {
          owner: personOwnerUrn,
          fileSizeBytes: size,
          uploadCaptions: false,
          uploadThumbnail: false,
        },
      };

      const initUploadContentType = "application/json";

      const today = new Date();
      const todayDateComponentsStr = today.toISOString().split("-");

      // LinkedIn version: version number in the format YYYYMM
      const linkedinVersion =
        todayDateComponentsStr[0] + todayDateComponentsStr[1];

      const initUploadAdditionalHeaders = {
        "LinkedIn-Version": linkedinVersion,
        "X-RestLi-Protocol-Version": "2.0.0",
        Authorization: "Bearer " + accessToken,
      };

      const initUploadResponse = await this.sendPostRequest(
        initUploadUrl,
        initUploadBody,
        initUploadContentType,
        initUploadAdditionalHeaders
      );

      const initResponseData = initUploadResponse.data; // Getting data from Axios Response object

      // Upload Video to Linkedin

      const videoUploadURL =
        initResponseData["value"]["uploadInstructions"][0]["uploadUrl"];
      const videoAssetUrnId = initResponseData["value"]["video"];

      const videoUploadContentType = "application/octet-stream";

      console.log("Uplaoding video");
      const responseCreate = await this.sendPostRequest(
        videoUploadURL,
        video.buffer,
        videoUploadContentType
      );

      const signedEtag = responseCreate.headers["etag"];

      // Finalizing Upload

      const finalizeUploadUrl =
        "https://api.linkedin.com/rest/videos?action=finalizeUpload";

      const finalizeUploadRequestBody = {
        finalizeUploadRequest: {
          video: videoAssetUrnId,
          uploadToken: "",
          uploadedPartIds: [signedEtag],
        },
      };

      const finalizeUploadAdditionalHeaders = {
        "LinkedIn-Version": linkedinVersion,
        "X-RestLi-Protocol-Version": "2.0.0",
        Authorization: `Bearer ${accessToken}`,
      };

      const finalizeResponse = await this.sendPostRequest(
        finalizeUploadUrl,
        finalizeUploadRequestBody,
        "application/json",
        finalizeUploadAdditionalHeaders
      );

      return videoAssetUrnId;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async sendPostRequest(
    url,
    payload,
    contentType = "application/json",
    headers
  ) {
    try {
      const response = await axios.post(url, payload, {
        headers: {
          ...headers,
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
