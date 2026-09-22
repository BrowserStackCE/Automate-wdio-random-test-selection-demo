const { expect } = require('chai');

describe('Suite C - Test 5', () => {
  it('should load the BrowserStack demo site', async () => {
    await browser.url('https://bstackdemo.com/');
    const title = await browser.getTitle();
    expect(title).to.include('StackDemo');
  });

  it('should display the Apple vendor filter', async () => {
    const appleFilter = await $('label=Apple');
    await appleFilter.waitForDisplayed({ timeout: 10000 });
    expect(await appleFilter.isDisplayed()).to.be.true;
  });
});
