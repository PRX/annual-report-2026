'use strict';

var index = require('./index-B1UH6AUG.js');
var appGlobals = require('./app-globals-V2Kpy_OQ.js');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
/*
 Stencil Client Patch Browser v4.38.1 | MIT Licensed | https://stenciljs.com
 */

var patchBrowser = () => {
  const importMeta = (typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('web-components.cjs.js', document.baseURI).href));
  const opts = {};
  if (importMeta !== "") {
    opts.resourcesUrl = new URL(".", importMeta).href;
  }
  return index.promiseResolve(opts);
};

patchBrowser().then(async (options) => {
  await appGlobals.globalScripts();
  return index.bootstrapLazy([["prx-audio-quote_2.cjs",[[262,"prx-audio-quote",{"src":[1],"transcriptUrl":[1,"transcript-url"],"playing":[32],"progress":[32]}],[257,"prx-bg-aurora",{"colorStops":[16],"amplitude":[2],"blend":[2],"speed":[2],"time":[2]}]]]], options);
});

exports.setNonce = index.setNonce;
//# sourceMappingURL=web-components.cjs.js.map
