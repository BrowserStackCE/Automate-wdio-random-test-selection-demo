const { expect } = require('chai');

describe('Suite C - Test 3', () => {
  it('should load the BrowserStack demo site', async () => {
    await browser.url('https://bstackdemo.com/');
    const title = await browser.getTitle();
    expect(title).to.include('StackDemo');
  });

  it('should display the Orders link', async () => {
    const orders = await $('a=Orders');
    await orders.waitForDisplayed({ timeout: 10000 });
    expect(await orders.isDisplayed()).to.be.true;
  });
});
