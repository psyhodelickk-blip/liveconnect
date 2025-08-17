// src/setupProxy.js
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  // REST -> backend:4000
  app.use(
    ["/auth", "/chat"],
    createProxyMiddleware({
      target: "http://localhost:4000",
      changeOrigin: true,
      secure: false,
      logLevel: "warn",
    })
  );

  // Socket.IO (mora ws: true)
  app.use(
    "/socket.io",
    createProxyMiddleware({
      target: "http://localhost:4000",
      changeOrigin: true,
      secure: false,
      ws: true,
      logLevel: "warn",
    })
  );
};
