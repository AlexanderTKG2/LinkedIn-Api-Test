require("dotenv").config();
require("process");

const env = {
  api: {
    port: process.env.PORT,
    host: process.env.HOST,
    protocol: process.env.PROTOCOL,
    api_root: process.env.API_ROOT,
    environment: process.env.ENVIRONMENT,
  },
  linkedin: {
    app_name: process.env.APP_NAME,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    callback_url: process.env.CALLBACK_URL,
  },
};

module.exports = env;
