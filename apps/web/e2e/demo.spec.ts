import { expect, test } from '@playwright/test';
for (const hour of ['00:30', '12:00'])
  test(`DEMO at ${hour} seeds past synthetic data, retains label and works offline`, async ({
    page,
    context,
  }) => {
    // Evaluate completed fixtures after their last event, independent of CI's clock.
    await page.clock.setFixedTime(new Date(`2026-10-06T${hour}:00+07:00`));
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /Hari ini|Ringkasan batch/, exact: true }),
    ).toBeVisible();
    await expect(page.getByText('DEMO · Data sintetis', { exact: true })).toBeVisible();
    await expect(page.locator('.batch-card')).toHaveCount(6);
    await expect(page.getByLabel('Cari kode, menu, atau tujuan')).toBeVisible();
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
    await expect(page.getByText('Jam perangkat perlu diperiksa', { exact: true })).toHaveCount(0);
  });
