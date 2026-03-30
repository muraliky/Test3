import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: './features/**/*.feature',
  steps: './src/steps/**/*.steps.ts',
});

export default defineConfig({
  testDir,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  
  use: {
    // Base URL - UPDATE THIS for your application
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Use Desktop Chrome (not bundled Playwright browser)
    channel: 'chrome',
    
    // AUTHENTICATION - Load saved auth state
    // This contains cookies/session, NOT credentials
    storageState: './auth.json',
    
    // Browser options
    headless: false,  // Set to true for CI
    viewport: { width: 1280, height: 720 },
    
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Setup project - runs auth setup before tests
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: {
        storageState: undefined, // No auth for setup
      },
    },
    
    // Main test project - uses saved auth state
    {
      name: 'desktop-chrome',
      dependencies: ['setup'],
      use: { 
        channel: 'chrome',
        storageState: './auth.json',
      },
    },
  ],

  // Uncomment to run local server before tests:
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
