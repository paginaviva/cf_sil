const path = require("path");
const fs = require("fs");
const glob = require("glob");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const INCLUDE_PATTERN =
  /<include\s+src=["'](.+?)["']\s*\/?>\s*(?:<\/include>)?/gis;

// Read site config from wrangler.toml (single source of truth, G2)
// process.env overrides allow CI to inject values if needed
const _toml = fs.existsSync("./wrangler.toml")
  ? fs.readFileSync("./wrangler.toml", "utf8")
  : "";
const _getVar = (key) => {
  const m = _toml.match(new RegExp(`${key}\\s*=\\s*"([^"]+)"`, "m"));
  return m ? m[1] : "";
};
const templateParams = {
  SITE_NAME: process.env.SITE_NAME || _getVar("SITE_NAME") || "C&B Consulting",
  IMG_LOGO_SITE: process.env.IMG_LOGO_SITE || _getVar("IMG_LOGO_SITE") || "",
  IMG_FAVICON_SITE:
    process.env.IMG_FAVICON_SITE || _getVar("IMG_FAVICON_SITE") || "",
};

// Expand <include> directives and substitute <%= VAR %> template parameters
const processNestedHtml = (content, loaderContext, dir = null) => {
  const expanded = !INCLUDE_PATTERN.test(content)
    ? content
    : content.replace(INCLUDE_PATTERN, (m, src) => {
        const filePath = path.resolve(dir || loaderContext.context, src);
        loaderContext.dependency(filePath);
        return processNestedHtml(
          loaderContext.fs.readFileSync(filePath, "utf8"),
          loaderContext,
          path.dirname(filePath),
        );
      });
  // Substitute template parameters so html-loader sees final values
  return Object.entries(templateParams).reduce(
    (result, [key, value]) =>
      result.replace(new RegExp(`<%=\\s*${key}\\s*%>`, "g"), value),
    expanded,
  );
};

// HTML generation
const paths = [];
const generateHTMLPlugins = () =>
  glob.sync("./src/*.html").map((dir) => {
    const filename = path.basename(dir);

    if (filename !== "404.html") {
      paths.push(filename);
    }

    return new HtmlWebpackPlugin({
      filename,
      template: `./src/${filename}`,
      inject: "body",
    });
  });

// Site config injected from build env vars (G2: no hardcoding)
const siteConfig = {
  "process.env.SITE_NAME": JSON.stringify(templateParams.SITE_NAME),
  "process.env.IMG_LOGO_SITE": JSON.stringify(templateParams.IMG_LOGO_SITE),
  "process.env.IMG_FAVICON_SITE": JSON.stringify(templateParams.IMG_FAVICON_SITE),
};

module.exports = {
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  entry: "./src/js/index.js",
  devServer: {
    static: {
      directory: path.join(__dirname, "./build"),
    },
    compress: true,
    port: 3000,
    hot: true,
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        test: /\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [
                  require("autoprefixer")({
                    overrideBrowserslist: ["last 2 versions"],
                  }),
                ],
              },
            },
          },
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
      },
      {
        test: /\.html$/,
        loader: "html-loader",
        options: {
          preprocessor: processNestedHtml,
          // Skip EJS template vars (<%= %>) so HtmlWebpackPlugin can substitute them
          sources: {
            urlFilter: (_attribute, value) => !value.startsWith("<%"),
          },
        },
      },
    ],
  },
  plugins: [
    ...generateHTMLPlugins(),
    new webpack.DefinePlugin(siteConfig),
    new MiniCssExtractPlugin({
      filename: "style.css",
      chunkFilename: "style.css",
    }),
  ],
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "build"),
    clean: true,
    assetModuleFilename: "[path][name][ext]",
  },
  target: "web", // fix for "browserslist" error message
  stats: "errors-only", // suppress irrelevant log messages
};
