const { expect } = require('@wdio/globals');

describe('Suite A - Test 19', () => {
  it('should load the BrowserStack demo site', async () => {
    await browser.url('https://bstackdemo.com/');
    await expect(browser).toHaveTitle(expect.stringContaining('StackDemo'));
  });

  it('should display the product grid', async () => {
    const grid = await $('[class*="shelf-container"]');
    await expect(grid).toBeDisplayed();
  });
});
