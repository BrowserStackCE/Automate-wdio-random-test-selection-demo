const { expect } = require('chai');

describe('Sample Test 1', () => {
  it('should load the BrowserStack demo site and verify the title', async () => {
    await browser.url('https://bstackdemo.com/');
    const title = await browser.getTitle();
    expect(title).to.include('StackDemo');
  });

  it('should find the search box on the page', async () => {
    const searchBox = await $('input.px-4');
    await searchBox.waitForDisplayed({ timeout: 10000 });
    expect(await searchBox.isDisplayed()).to.be.true;
  });
});
