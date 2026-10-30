// Run with an installed Playwright package; no production dependencies required.
// BASE_URL defaults to the local Python HTTP server. BROWSER=webkit selects Safari's engine.
const { chromium, webkit } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const engine = process.env.BROWSER === 'webkit' ? webkit : chromium;
  const browser = await engine.launch(engine === chromium ? {
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']
  } : {});
  let checks = 0;
  try {
    for (const viewport of [{width:375,height:667},{width:390,height:844},{width:430,height:932},{width:844,height:390},{width:1440,height:900}]) {
      const context = await browser.newContext({ viewport, hasTouch: true, isMobile: viewport.width < 1000 });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const base = process.env.BASE_URL || 'http://127.0.0.1:8000/';
      await page.goto(base, { waitUntil: 'load' });
      await page.waitForFunction(() => typeof window.openMenuPopup === 'function');
      await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
      assert.equal(await page.locator('#newsCards .card').count(), 6);
      assert.equal(await page.locator('#menuCards .card').count(), 3);
      assert.equal(await page.locator('#storeGrid .store-card').count(), 14);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal overflow');
      await page.evaluate(async () => {
        await Promise.all([...document.images].filter(img => img.hasAttribute('src')).map(img => {
          img.loading = 'eager'; return img.decode();
        }));
      });
      assert(await page.evaluate(() => [...document.images].filter(img=>img.hasAttribute('src')).every(img=>img.complete && img.naturalWidth > 0)), 'images decode');
      assert.equal(await page.locator('.social-icons a').count(), 4);
      checks += 6;
      await page.evaluate(async () => {
        await Promise.all([...document.querySelectorAll('.hero-slide')].map(async slide => {
          const image = new Image();
          image.src = getComputedStyle(slide).backgroundImage.slice(4, -1).replace(/^["']|["']$/g, '');
          await image.decode();
        }));
      });
      checks++;
      if (viewport.width <= 760) {
        const toggle = page.locator('#mobileNavToggle');
        await toggle.tap();
        assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
        assert(await page.locator('#nav').isVisible());
        await page.locator('#nav a[href="#news-anchor"]').tap();
        assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
        assert(!(await page.locator('#nav').isVisible()));
        await toggle.tap();
        await toggle.tap();
        assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
        await toggle.tap();
        await page.keyboard.press('Escape');
        assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
        // Outside tap must close, including after scrolling to another section.
        await toggle.tap();
        await page.locator('.story-inner p').tap();
        assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
        checks += 7;
      }
      const initial = await page.locator('.hero-slide.active').evaluate(el=>[...el.parentNode.children].indexOf(el));
      await page.locator('.hero-controls button').last().tap();
      const next = await page.locator('.hero-slide.active').evaluate(el=>[...el.parentNode.children].indexOf(el));
      assert.notEqual(initial,next);
      await page.locator('.official-feature-arrow.next').tap();
      assert.equal(await page.locator('.official-feature-slide').nth(1).getAttribute('aria-hidden'),'false');
      await page.locator('#newsPagination .page-number[data-page="2"]').tap();
      assert.match(await page.locator('#newsCards').innerText(), /第 2 頁/);
      await page.locator('#newsPagination .page-number[data-page="1"]').tap();
      await page.locator('#newsCards button').first().tap();
      assert(await page.locator('#articleOverlay').isVisible());
      assert.match(await page.locator('#articlePopupBody').innerText(), /秋意漸濃/);
      await page.locator('.article-close').tap();
      assert(!(await page.locator('#articleOverlay').isVisible()));
      checks += 6;
      await page.locator('#menuCards button').first().scrollIntoViewIfNeeded();
      const beforeMenuScroll = await page.evaluate(() => scrollY);
      await page.locator('#menuCards button').first().tap();
      assert.equal(await page.locator('#menuPopup').getAttribute('aria-hidden'),'false');
      assert(await page.locator('.menu-dish').first().isVisible());
      await page.locator('.menu-dish').first().tap();
      assert(await page.locator('#menuDishDetail').isVisible());
      await page.locator('.detail-back').tap();
      for (let i=0;i<3;i++) {
        await page.locator('#menuPopupTabs button').nth(i).tap();
        assert(await page.locator('.menu-dish').count() > 0);
      }
      await page.locator('.menu-popup-close').tap();
      assert.equal(await page.locator('#menuPopup').getAttribute('aria-hidden'),'true');
      assert.notEqual(await page.evaluate(()=>document.body.style.position),'fixed');
      assert(Math.abs(await page.evaluate(() => scrollY) - beforeMenuScroll) <= 1, 'restore background scroll after popup');
      checks += 8;
      checks++;
      await page.locator('#stores .filters button').filter({hasText:'南部'}).tap();
      assert.equal(await page.locator('#storeGrid .store-card').count(),2);
      await page.locator('#storeGrid .store-card').first().tap();
      assert(await page.locator('#locationModal').isVisible());
      assert.match(await page.locator('#locationTitle').innerText(), /台南/);
      assert.match(await page.locator('#locationMap').getAttribute('href'), /^https:\/\/www.google.com\/maps/);
      await page.locator('.location-close').tap();
      assert(!(await page.locator('#locationModal').isVisible()));
      checks += 5;
      const form = page.locator('#contactDemoForm');
      assert.equal(await form.evaluate(el=>el.checkValidity()),false);
      await form.locator('[name="name"]').fill('測試使用者');
      await form.locator('[name="email"]').fill('test@example.invalid');
      await form.locator('[name="topic"]').selectOption('餐點相關問題');
      await form.locator('[name="message"]').fill('僅供測試，不寄送留言。');
      await form.locator('[name="phone"]').fill('bad');
      assert.equal(await form.evaluate(el=>el.checkValidity()),false);
      await form.locator('[name="phone"]').fill('');
      assert.equal(await form.evaluate(el=>el.checkValidity()),true);
      await form.locator('button[type="submit"]').tap();
      assert.match(await page.locator('#contactDemoStatus').innerText(), /留言並未送出/);
      await page.locator('.privacy-open').tap();
      assert(await page.locator('#privacyPolicyModal').isVisible());
      await page.locator('.privacy-close').tap();
      assert(!(await page.locator('#privacyPolicyModal').isVisible()));
      assert.notEqual(await page.evaluate(()=>document.body.style.position),'fixed');
      assert.deepEqual(errors, []);
      checks += 8;
      await page.screenshot({path:`/tmp/timhowan-${engine.name()}-${viewport.width}.png`,fullPage:true});
      console.log(`PASS ${engine.name()} ${viewport.width}x${viewport.height}`);
      await context.close();
    }
    console.log(`PASS ${checks} assertions`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
