import { expect, test } from '@playwright/test';
test('DEMO build seeds only synthetic data, retains label and works offline', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hari ini', exact: true })).toBeVisible();
  await expect(page.getByText('DEMO · Data sintetis', { exact: true })).toBeVisible();
  await expect(page.locator('.batch-card')).toHaveCount(6);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.batch-card')).toHaveCount(6);
  await page.getByText('Menu sintetis 2 · late-delivery', { exact: true }).click();
  await expect(
    page.getByText('! Melewati batas waktu yang Anda tetapkan', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('DEMO · Data sintetis', { exact: true })).toBeVisible();
});
