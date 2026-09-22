const { expect } = require('chai');

describe('Suite A - Test 9', () => {
  it('should load the BrowserStack demo site', async () => {
    await browser.url('https://bstackdemo.com/');
    const title = await browser.getTitle();
    expect(title).to.include('StackDemo');
  });

  it('should display the product count heading', async () => {
    const heading = await $('h3');
    await heading.waitForDisplayed({ timeout: 10000 });
    expect(await heading.isDisplayed()).to.be.true;
  });
});
