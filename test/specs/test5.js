import { expect } from 'chai';

describe('Sample Test 5', () => {
  it('should load the BrowserStack demo site and verify the title', async () => {
    await browser.url('https://bstackdemo.com/');
    const title = await browser.getTitle();
    expect(title).to.include('StackDemo');
  });

  it('should find the app logo on the page', async () => {
    const logo = await $('img[alt="logo"]');
    await logo.waitForExist({ timeout: 10000 });
    expect(await logo.isExisting()).to.be.true;
  });
});
