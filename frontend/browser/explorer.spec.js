import {test,expect} from '@playwright/test';
test('compare, descriptive modes, year selection and real CSV download',async({page})=>{
 await page.goto('/');
 await expect(page.locator('.metric-site')).toHaveCount(1);
 await page.getByLabel('Explore',{exact:true}).selectOption('compare');
 await expect(page.locator('.metric-site')).toHaveCount(2);
 await page.getByLabel('Chart display').selectOption('anomaly');
 await page.getByLabel('Inspect a year',{exact:true}).selectOption('2000');
 await expect(page.locator('.inspector-values')).toContainText('2000');
 await expect(page.locator('.inspector-values')).toContainText('Can Tho');
 await page.getByLabel('Chart display').selectOption('moving');
 const downloadPromise=page.waitForEvent('download');
 await page.getByRole('button',{name:/Download CSV/}).click();
 expect((await downloadPromise).suggestedFilename()).toBe('trendearth-comparison-1991-2024.csv');
 await page.getByLabel('Explore',{exact:true}).selectOption('single');
 await page.getByLabel('Location',{exact:true}).selectOption('can-tho');
 await expect(page.locator('.metric-site')).toHaveCount(1);
 await expect(page.locator('.metric-site')).toContainText('Can Tho');
});
test('missing and invalid source states',async({page})=>{
 await page.route('**/data/hanoi.json',r=>r.fulfill({status:404,body:''}));
 await page.goto('/'); await expect(page.getByRole('alert')).toContainText('missing');
 await page.unroute('**/data/hanoi.json');
 await page.route('**/data/hanoi.json',r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));
 await page.getByRole('button',{name:'Try again'}).click();
 await expect(page.getByRole('alert')).toContainText('Invalid climate dataset');
});
for(const width of [1440,360])test(`layout and keyboard at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/');
 await expect(page.locator('.metric-site')).toHaveCount(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByLabel('Inspect a year',{exact:true}).focus();
 await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');
 await expect(page.getByLabel('Inspect a year',{exact:true})).toHaveValue('1992');
 await page.screenshot({path:`test-results/explorer-${width}.png`,fullPage:true});
});
