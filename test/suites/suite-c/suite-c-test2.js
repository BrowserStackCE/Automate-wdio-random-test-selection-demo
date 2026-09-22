const { expect } = require('chai');

describe('Suite C - Test 2', () => {
  it('should load the BrowserStack demo site', async () => {
    await browser.url('https://bstackdemo.com/');
    const title = await browser.getTitle();
    expect(title).to.include('StackDemo');
  });

  it('should display the Favourites link', async () => {
    const favourites = await $('a=Favourites');
    await favourites.waitForDisplayed({ timeout: 10000 });
    expect(await favourites.isDisplayed()).to.be.true;
  });
});
