import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 375,
    viewportHeight: 812,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      // Mobile viewport presets
      on('task', {
        setViewport: ({ device }) => {
          const viewports = {
            'iphone-x': { width: 375, height: 812 },
            'iphone-14': { width: 390, height: 844 },
            'ipad': { width: 768, height: 1024 },
            'desktop': { width: 1280, height: 720 },
          };
          return viewports[device] || viewports['iphone-x'];
        },
      });
    },
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
  },
});