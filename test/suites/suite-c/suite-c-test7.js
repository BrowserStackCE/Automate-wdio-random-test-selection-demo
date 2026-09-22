const { expect } = require('chai');

describe('Suite C - Test 7', () => {
  it('should load the BrowserStack demo site', async () => {
    await browser.url('https://bstackdemo.com/');
    const title = await browser.getTitle();
    expect(title).to.include('StackDemo');
  });

  it('should display the Sign In link', async () => {
    const signIn = await $('span=Sign In');
    await signIn.waitForDisplayed({ timeout: 10000 });
    expect(await signIn.isDisplayed()).to.be.true;
  });
});
