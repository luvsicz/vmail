/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ["**/.*"],
  serverDependenciesToBundle: [
    "database/dao",
    "database/db",
    "database/schema",
    "icons",
  ],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // publicPath: "/build/",
  // serverBuildPath: "build/index.js",
  browserNodeBuiltinsPolyfill: {
    modules: {
      os: true,
      fs: true,
      net: true,
      tls: true,
      crypto: true,
      stream: true,
      perf_hooks: true,
      buffer: true,
      path: true,
      process: true,
      url: true,
      util: true,
      assert: true,
      zlib: true,
      querystring: true,
      events: true,
      string_decoder: true,
    },
    globals: {
      Buffer: true,
      process: true,
    }
  }
};
