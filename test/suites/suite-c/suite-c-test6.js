const { expect } = require('chai');

describe('Suite C - Test 6', () => {
  it('should load the BrowserStack demo site', async () => {
    await browser.url('https://bstackdemo.com/');
    const title = await browser.getTitle();
    expect(title).to.include('StackDemo');
  });

  it('should display the Samsung vendor filter', async () => {
    const samsungFilter = await $('label=Samsung');
    await samsungFilter.waitForDisplayed({ timeout: 10000 });
    expect(await samsungFilter.isDisplayed()).to.be.true;
  });
});
