"use strict";

var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
    mode: 'development',
    entry: {
        packed: "./demo.js",
        unpacked: "./demo.unpacked.js",
    },
    output: {
        path: __dirname + "/dist",
        filename: "[name]-bundle.js"
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