import { p as promiseResolve, b as bootstrapLazy } from './index-Dqx6Rc4F.js';
export { s as setNonce } from './index-Dqx6Rc4F.js';
import { g as globalScripts } from './app-globals-DQuL1Twl.js';

/*
 Stencil Client Patch Browser v4.38.1 | MIT Licensed | https://stenciljs.com
 */

var patchBrowser = () => {
  const importMeta = import.meta.url;
  const opts = {};
  if (importMeta !== "") {
    opts.resourcesUrl = new URL(".", importMeta).href;
  }
  return promiseResolve(opts);
};

patchBrowser().then(async (options) => {
  await globalScripts();
  return bootstrapLazy([["prx-audio-quote_2",[[262,"prx-audio-quote",{"src":[1],"transcriptUrl":[1,"transcript-url"],"playing":[32],"progress":[32]}],[257,"prx-bg-aurora",{"colorStops":[16],"amplitude":[2],"blend":[2],"speed":[2],"time":[2]}]]]], options);
});
//# sourceMappingURL=web-components.js.map
