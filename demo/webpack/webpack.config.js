"use strict";

var BundleAnalyzerPlugin = require("webpack-bundle-analyzer-sunburst").BundleAnalyzerPlugin;

module.exports = {
    mode: "development",
    entry: {
        unpacked: "./demo.unpacked.js",
    },
    output: {
        path: __dirname + "/dist",
        filename: "[name]-bundle.js",
        chunkFilename: "[name].[hash].bundle.js"
    },
    node: {
        global: false,
        process: false,
        Buffer: false,
        __filename: "mock",
        __dirname: "mock",
        setImmediate: false
    },
    module: {
    },
    resolve: {
    },
    devServer: {
        contentBase: __dirname,
        compress: true,
        port: 9000
    },
    plugins: [
        new BundleAnalyzerPlugin()
    ]
};

if (!module.parent) {
    var webpack = require("webpack");
    webpack(module.exports, function(err, stats) {
        if (err || stats.hasErrors()) {
            var info = stats.toJson();
            process.stdout.write(info.errors[0]);
            process.exit(0);
        }
    });
}