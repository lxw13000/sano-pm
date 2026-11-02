'use strict';
const path=require('path');
const dependencyRoot=process.env.SANO_NODE_MODULES||'C:/Users/24725/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
module.exports={chromium:require(path.join(dependencyRoot,'playwright')).chromium,chrome:process.env.SANO_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'};
