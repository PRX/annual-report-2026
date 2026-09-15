import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'web-components',
  outputTargets: [
    {
      type: 'dist',
      dir: '../assets/js/web-components',
      isPrimaryPackageOutputTarget: true
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'www',
      serviceWorker: null, // disable service workers
    },
  ],
  testing: {
    browserHeadless: "shell",
  },
  validatePrimaryPackageOutputTarget: true,
};
