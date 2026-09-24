export default async function(page) {
  await page.waitForFunction(() => window.__HOME_PLANNER_QA__?.snapshot().loaded, { timeout: 90000 })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: '../logs/web_cargada.png', fullPage: true })
  return await page.evaluate(() => ({state:window.__HOME_PLANNER_QA__?.snapshot(),objects:window.__HOME_PLANNER_QA__?.visibleObjects()}))
}
