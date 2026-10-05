import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function onboard(page: Page) {
  await page.goto('/');
  await page.getByLabel('Nama dapur', { exact: true }).fill('Dapur Sintetis');
  await page.getByLabel('Kode dapur').fill('SYN');
  await page.getByRole('button', { name: 'Simpan profil dapur' }).click();
  await expect(page.getByRole('heading', { name: 'Hari ini' })).toBeVisible();
}
async function create(page: Page, multi = false) {
  await page.getByRole('button', { name: 'Buat batch', exact: true }).first().click();
  await page.getByLabel('Nama menu').fill('Menu Sintetis');
  if (multi) {
    await page.getByLabel('Jumlah porsi', { exact: true }).first().fill('200');
    await page.getByRole('button', { name: 'Tambah tujuan' }).click();
  }
  await page.getByLabel('Label tujuan').first().fill('Tujuan Sintetis A');
  if (multi) await page.getByLabel('Label tujuan').nth(1).fill('Tujuan Sintetis B');
  await page.getByRole('button', { name: 'Buat batch', exact: true }).last().click();
  await expect(page.getByRole('heading', { name: 'Menu Sintetis', exact: true })).toBeVisible();
}
async function point(page: Page, name: string, destination = 'Tujuan Sintetis A') {
  const label = /Tiba di tujuan|Mulai dibagikan/.test(name) ? name + '.*' + destination : name;
  await page.getByRole('button', { name: new RegExp(label) }).click();
  await page.getByRole('button', { name: 'Konfirmasi titik', exact: true }).click();
  await expect(page.getByText('✓ Titik tercatat', { exact: true })).toBeVisible();
}
test('AC-01–05,10,11,13: full multi-drop journey, corrections, trace and label', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-05T00:00:00Z'));
  await onboard(page);
  await create(page, true);
  for (const name of [
    'Selesai masak',
    'Selesai kemas',
    'Dimuat',
    'Tiba di tujuan',
    'Mulai dibagikan',
  ])
    await point(page, name);
  await point(page, 'Tiba di tujuan', 'Tujuan Sintetis B');
  await point(page, 'Mulai dibagikan', 'Tujuan Sintetis B');
  await expect(page.getByText('Titik wajib lengkap · Pembagian dimulai')).toHaveCount(2);
  await page.getByRole('button', { name: 'Koreksi', exact: true }).first().click();
  await page.getByLabel('Waktu kejadian', { exact: true }).fill('2026-10-04T02:00');
  await page.getByLabel('Catatan / alasan koreksi').fill('Koreksi sintetis untuk pengujian');
  await page.getByRole('button', { name: 'Konfirmasi titik', exact: true }).click();
  await expect(page.getByText('Digantikan oleh koreksi')).toBeVisible();
  await expect(page.getByText('Diisi belakangan', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Cetak label QR', exact: true }).click();
  await expect(page.getByRole('img', { name: /Cetak label QR/ })).toBeVisible();
  await page.getByLabel('Ukuran label').selectOption('strip');
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByText(/Ambang batas belum diverifikasi oleh ahli/).first()).toBeVisible();
  await page.emulateMedia({ media: 'screen' });
  await page.getByRole('button', { name: 'Telusuri', exact: true }).click();
  await page.getByLabel('Cari kode, menu, atau tujuan').fill('Tujuan Sintetis B');
  await expect(page.getByText('Menu Sintetis', { exact: true })).toBeVisible();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Ekspor CSV', exact: true }).click();
  expect((await downloaded).suggestedFilename()).toContain('.csv');
});
test('AC-03–04: rapid double tap and undo preserves audit timeline', async ({ page }) => {
  await onboard(page);
  await create(page);
  await page.getByRole('button', { name: /Selesai masak/ }).click();
  await page.getByRole('button', { name: 'Konfirmasi titik' }).dblclick();
  await expect(page.locator('.timeline li')).toHaveCount(1);
  await page.getByRole('button', { name: 'Urungkan', exact: true }).click();
  await expect(page.locator('.timeline li')).toHaveCount(1);
  await expect(page.getByText('Dibatalkan', { exact: true })).toBeVisible();
  await point(page, 'Selesai masak');
  await expect(page.locator('.timeline li')).toHaveCount(2);
});
test('AC-12,13 and axe: primary screens, 320px layout, no third party requests', async ({
  page,
}) => {
  const external: string[] = [];
  page.on('request', (r) => {
    if (new URL(r.url()).origin !== 'http://127.0.0.1:4173') external.push(r.url());
  });
  await page.setViewportSize({ width: 320, height: 740 });
  await onboard(page);
  await create(page);
  for (const target of ['detail', 'Tentang & Batasan', 'Data & cadangan', 'Telusuri', 'Hari ini']) {
    if (target !== 'detail') await page.getByRole('button', { name: target, exact: true }).click();
    await expect(page.getByText(/Ambang batas belum diverifikasi oleh ahli/).first()).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
    ).toEqual([]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  expect(external).toEqual([]);
});
test('AC-06: warning, visibility reevaluation and mute control', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-05T00:00:00Z') });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'vibrate', {
      value: () => {
        (window as unknown as { vibrations: number }).vibrations =
          ((window as unknown as { vibrations?: number }).vibrations ?? 0) + 1;
        return true;
      },
    });
  });
  await onboard(page);
  await create(page);
  await point(page, 'Selesai masak');
  await page.clock.fastForward(91 * 60 * 1000);
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(page.getByText('△ Mendekati batas waktu')).toBeVisible();
  await page.clock.fastForward(31 * 60 * 1000);
  await expect(page.getByText('! Melewati batas waktu yang Anda tetapkan')).toBeVisible();
  expect(
    await page.evaluate(() => (window as unknown as { vibrations: number }).vibrations),
  ).toBeGreaterThan(1);
  await page.getByRole('button', { name: 'Data & cadangan', exact: true }).click();
  const sound = page.getByRole('button', { name: 'Bunyi peringatan', exact: true });
  await sound.click();
  await expect(page.getByRole('button', { name: 'Bunyi peringatan', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
test('AC-07,08,15: complete offline flow, reload, backup/restore and CSV metrics', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await onboard(page);
  await create(page, true);
  for (const name of [
    'Selesai masak',
    'Selesai kemas',
    'Dimuat',
    'Tiba di tujuan',
    'Mulai dibagikan',
  ])
    await point(page, name);
  await point(page, 'Tiba di tujuan', 'Tujuan Sintetis B');
  await point(page, 'Mulai dibagikan', 'Tujuan Sintetis B');
  await page.reload();
  await page.getByText('Menu Sintetis', { exact: true }).click();
  await expect(page.locator('.timeline li')).toHaveCount(7);
  await page.getByRole('button', { name: 'Cetak label QR', exact: true }).click();
  await expect(page.getByRole('img', { name: /Cetak label QR/ })).toBeVisible();
  await page.getByRole('button', { name: 'Data & cadangan', exact: true }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Unduh cadangan JSON', exact: true }).last().click();
  const backup = await pending,
    path = await backup.path();
  expect(readFileSync(path!, 'utf8')).toContain('Ambang batas belum diverifikasi oleh ahli');
  page.on('dialog', (d) => d.accept());
  await page.getByLabel('Pulihkan cadangan JSON').setInputFiles(path!);
  await expect(page.getByText('Cadangan dipulihkan.')).toBeVisible();
  const metrics = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Ekspor metrik CSV' }).click();
  expect((await metrics).suggestedFilename()).toBe('batchaman-metrik.csv');
  await page.getByLabel('Pulihkan cadangan JSON').setInputFiles({
    name: 'broken.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{broken'),
  });
  await expect(page.getByRole('alert')).toContainText('Berkas tidak cocok');
  await page.getByRole('button', { name: 'Telusuri', exact: true }).click();
  await page.getByLabel('Cari kode, menu, atau tujuan').fill('Tujuan Sintetis B');
  await expect(page.getByText('Menu Sintetis', { exact: true })).toBeVisible();
});
test('adversarial: full storage, backwards clock and storage cleared', async ({
  page,
  context,
}) => {
  await onboard(page);
  await create(page);
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    (window as unknown as { restorePut: () => void }).restorePut = () => {
      IDBObjectStore.prototype.put = original;
    };
    IDBObjectStore.prototype.put = function () {
      throw new DOMException('Full', 'QuotaExceededError');
    };
  });
  await page.getByRole('button', { name: /Selesai masak/ }).click();
  await page.getByRole('button', { name: 'Konfirmasi titik' }).click();
  await expect(page.getByRole('alert')).toContainText('Belum tersimpan');
  await page.evaluate(() => (window as unknown as { restorePut: () => void }).restorePut());
  await page.getByRole('button', { name: 'Konfirmasi titik' }).click();
  await expect(page.locator('.timeline li')).toHaveCount(1);
  await page.clock.setFixedTime(new Date('2020-01-01T00:00:00Z'));
  await point(page, 'Dimuat');
  await expect(page.getByText('Jam perangkat perlu diperiksa', { exact: true })).toBeVisible();
  const session = await context.newCDPSession(page);
  await session.send('Storage.clearDataForOrigin', {
    origin: 'http://127.0.0.1:4173',
    storageTypes: 'indexeddb',
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Mulai dari dapur Anda' })).toBeVisible();
  await expect(page.getByText(/Penyimpanan baru atau kosong/)).toBeVisible();
});
test('adversarial: no BarcodeDetector and camera denied retains manual fallback offline', async ({
  page,
  context,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'BarcodeDetector', { value: undefined }),
  );
  await onboard(page);
  await create(page);
  const code = await page.locator('.page-heading .code').textContent();
  await page.getByRole('button', { name: 'Hari ini', exact: true }).click();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Pindai QR', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Kamera tidak tersedia');
  await page.getByLabel('Kode batch manual').fill(code!);
  await page.getByRole('button', { name: 'Buka kode batch' }).click();
  await expect(page.getByRole('heading', { name: 'Menu Sintetis', exact: true })).toBeVisible();
});
test('axe: onboarding, creation, confirmation and label; six-fold CPU slowdown', async ({
  page,
  context,
}) => {
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  await page.goto('/');
  async function audit() {
    const result = await new AxeBuilder({ page }).analyze();
    expect(
      result.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
    ).toEqual([]);
  }
  await audit();
  await onboard(page);
  await page.getByRole('button', { name: 'Buat batch', exact: true }).first().click();
  await audit();
  await page.getByRole('button', { name: 'Hari ini', exact: true }).click();
  await create(page);
  await page.getByRole('button', { name: /Selesai masak/ }).click();
  await audit();
  await page.getByRole('button', { name: 'Konfirmasi titik' }).click();
  await expect(page.getByText('✓ Titik tercatat', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cetak label QR', exact: true }).click();
  await expect(page.getByRole('img', { name: /Cetak label QR/ })).toBeVisible();
  await audit();
});
test('synthetic screenshots and installability artifacts', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-05T04:00:00Z'));
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Coba dengan data sintetis' }).click();
  await expect(page.getByRole('heading', { name: 'Hari ini', exact: true })).toBeVisible();
  await expect(page.getByText('DEMO · Data sintetis', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/dashboard.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByText('Menu sintetis 2 · late-delivery', { exact: true }).click();
  await page.screenshot({ path: 'docs/screenshots/detail-mobile.png', fullPage: true });
  const manifest = await page.evaluate(async () => {
    const url = document.querySelector<HTMLLinkElement>('link[rel=manifest]')!.href;
    return (await fetch(url)).json();
  });
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.some((i: { sizes: string }) => i.sizes === '512x512')).toBe(true);
});
