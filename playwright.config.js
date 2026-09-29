// End-to-end tests (tasks 2.x) against the built file via file://. Unit tests in tests/unit run with node --test.
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: { browserName: 'chromium', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    // Every scenario runs at desktop size, except the ones only about small screens.
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } }, grepInvert: /@mobile-only/ },
    // Small-screen scenarios, plus key flows tagged @mobile.
    { name: 'mobile', use: { viewport: { width: 375, height: 812 } }, grep: /@mobile/ },
  ],
});
