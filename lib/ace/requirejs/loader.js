/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

/*
 * Extremely simplified version of the requireJS text plugin
 */
 
(function() {
    
var globalRequire = typeof require != "undefined" && require;
if (typeof define !== "function") {// running in webpack
    return module.exports = function(source) {
        var path = this.resource.replace(/[^\/\\]*$/, "");
        var modes = this.fs.readdirSync(path + "/mode").filter(function(x) {
            return /\.js$/.test(x) && !/highlight_rules\.js$|_test.js$| |^_|worker/.test(x);
        }).map(function(x) {
            return ["mode", x];
        });
        
        var themes = this.fs.readdirSync(path + "/theme").filter(function(x) {
            return /\.js$/.test(x) && !/highlight_rules\.js$|_test.js$| |^_|worker/.test(x);
        }).map(function(x) {
            return ["theme", x];
        });
        
        var files = themes.concat(modes);
        
        console.log(this.fs.readdir);
        
        /*if (this.fs && this.resourcePath)
            source = this.fs.readFileSync(this.resourcePath).toString("utf8");
        source = source.replace(/\/\*(?:[^*]|[*](?=[^\/]))+\*\//g, "")
            .replace(/^[ \t]+/gm, "");
        var json = JSON.stringify(source)
            .replace(/[\u2028\u2029]/g, function(x) { '\\u' + x.charCodeAt(0).toString(16);  })
*/
        return ("module.exports = " + function() {
            function getModule(path) {
                switch (path) {
                    case 1: break
                }
            }
            function loadModule(path, callback) {
                if (Array.isArray(path))
                    path = path.pop();
                var name = path.split("/").pop() + ".js"
                var m = getModule(name)
                m && m.then(callback)
            }
            return {
                loadModule: loadModule
            }
        } + "()").replace(/case.*/, function() {
            return files.map(function(x) {
                return "case " + JSON.stringify(x[1]) + ":return import(" + JSON.stringify('./'+x[0] + "/" + x[1]) + ");"
            }).join("\n");
        });
    };
}


var global = (function() {
    return this || typeof window != "undefined" && window;
})();
exports.moduleUrl = function(name, component) {
    if (options.$moduleUrls[name])
        return options.$moduleUrls[name];

    var parts = name.split("/");
    component = component || parts[parts.length - 2] || "";
    
    // todo make this configurable or get rid of '-'
    var sep = component == "snippets" ? "/" : "-";
    var base = parts[parts.length - 1];
    if (component == "worker" && sep == "-") {
        var re = new RegExp("^" + component + "[\\-_]|[\\-_]" + component + "$", "g");
        base = base.replace(re, "");
    }

    if ((!base || base == component) && parts.length > 1)
        base = parts[parts.length - 2];
    var path = options[component + "Path"];
    if (path == null) {
        path = options.basePath;
    } else if (sep == "/") {
        component = sep = "";
    }
    if (path && path.slice(-1) != "/")
        path += "/";
    return path + component + sep + base + this.get("suffix");
};

exports.setModuleUrl = function(name, subst) {
    return options.$moduleUrls[name] = subst;
};

exports.$loading = {};
exports.loadModule = function(moduleName, onLoad) {
    var module, moduleType;
    if (Array.isArray(moduleName)) {
        moduleType = moduleName[0];
        moduleName = moduleName[1];
    }

    try {
        module = require(moduleName);
    } catch (e) {}
    // require(moduleName) can return empty object if called after require([moduleName], callback)
    if (module && !exports.$loading[moduleName])
        return onLoad && onLoad(module);

    if (!exports.$loading[moduleName])
        exports.$loading[moduleName] = [];

    exports.$loading[moduleName].push(onLoad);

    if (exports.$loading[moduleName].length > 1)
        return;

    var afterLoad = function() {
        require([moduleName], function(module) {
            exports._emit("load.module", {name: moduleName, module: module});
            var listeners = exports.$loading[moduleName];
            exports.$loading[moduleName] = null;
            listeners.forEach(function(onLoad) {
                onLoad && onLoad(module);
            });
        });
    };

    if (!exports.get("packaged"))
        return afterLoad();
    net.loadScript(exports.moduleUrl(moduleName, moduleType), afterLoad);
};

function init(packaged) {
    if (!global || !global.document)
        return;
    
    options.packaged = packaged || require.packaged || module.packaged || (global.define && define.packaged);

    var scriptOptions = {};
    var scriptUrl = "";

    // Use currentScript.ownerDocument in case this file was loaded from imported document. (HTML Imports)
    var currentScript = (document.currentScript || document._currentScript ); // native or polyfill
    var currentDocument = currentScript && currentScript.ownerDocument || document;
    
    var scripts = currentDocument.getElementsByTagName("script");
    for (var i=0; i<scripts.length; i++) {
        var script = scripts[i];

        var src = script.src || script.getAttribute("src");
        if (!src)
            continue;

        var attributes = script.attributes;
        for (var j=0, l=attributes.length; j < l; j++) {
            var attr = attributes[j];
            if (attr.name.indexOf("data-ace-") === 0) {
                scriptOptions[deHyphenate(attr.name.replace(/^data-ace-/, ""))] = attr.value;
            }
        }

        var m = src.match(/^(.*)\/ace(\-\w+)?\.js(\?|$)/);
        if (m)
            scriptUrl = m[1];
    }

    if (scriptUrl) {
        scriptOptions.base = scriptOptions.base || scriptUrl;
        scriptOptions.packaged = true;
    }

    scriptOptions.basePath = scriptOptions.base;
    scriptOptions.workerPath = scriptOptions.workerPath || scriptOptions.base;
    scriptOptions.modePath = scriptOptions.modePath || scriptOptions.base;
    scriptOptions.themePath = scriptOptions.themePath || scriptOptions.base;
    delete scriptOptions.base;

    for (var key in scriptOptions)
        if (typeof scriptOptions[key] !== "undefined")
            exports.set(key, scriptOptions[key]);
}


define(function (require, exports, module) {
    "use strict";
    if (globalRequire && globalRequire.nodeRequire) {
        module.exports = globalRequire.nodeRequire(require.toUrl("./text_build"));
    } else {
        exports.load = function(name, req, onLoad, config) {
            require("../lib/net").get(req.toUrl(name), onLoad);
        };
    }
});

})();
