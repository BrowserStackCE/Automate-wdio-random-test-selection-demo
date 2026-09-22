const { expect } = require('chai');

describe('Suite B - Test 6', () => {
  it('should load the BrowserStack demo site', async () => {
    await browser.url('https://bstackdemo.com/');
    const title = await browser.getTitle();
    expect(title).to.include('StackDemo');
  });

  it('should display the search box', async () => {
    await browser.url('https://bstackdemo.com/');
    const searchBox = await $('input.px-4');
    await searchBox.waitForDisplayed({ timeout: 10000 });
    expect(await searchBox.isDisplayed()).to.be.true;
  });
});
