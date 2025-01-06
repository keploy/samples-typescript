const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: process.env.API_URL || 'http://localhost:8000',
    supportFile: false,
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
    // Add some reasonable timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
  },
});