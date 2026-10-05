# Bukti kualitas (2026-10-05)

- `pnpm check` dan `pnpm coverage`: **101/101 tes lulus**; lint/typecheck/build lulus.
- Core pada Vitest 4.1.11: **99,11% baris, 95,41% cabang, 100% fungsi**, di atas gerbang 90%. Angka sebelumnya memakai instrumentasi Vitest 3; gunakan pengukuran terbaru ini.
- Playwright operasional **9/9**, DEMO **1/1** lulus. Axe tanpa pelanggaran serius/kritis pada semua layar utama.
- Layar 320px tidak overflow; alur dan axe lulus dengan CPU 6×. Ini emulasi Chromium, bukan perangkat Android 2GB nyata.
- JS awal **142,79KiB gzip**, di bawah 200KiB. Gerbang menghitung entry + impor statis; scanner/QR/simulator lazy. Total precache sekitar 905KiB mentah.
- Lisensi: 39 paket produksi diperiksa; daftar di `dependency-licenses.json`, teks atribusi dibundel lokal.
- Lighthouse 13.5.0 mobile dari CI: **Performance 95 / Accessibility 100**. [Bukti pengukuran dan commit](evidence/lighthouse-summary.json).
- Audit 2026-10-05: **nol advisori** setelah Vitest/coverage-v8 dipatok 4.1.11 untuk menutup [GHSA-82fw-gwwq-j7x9](https://github.com/vitest-dev/vitest/security/advisories/GHSA-82fw-gwwq-j7x9). Dua advisori moderate sebelumnya berasal dari alat tes, bukan bundle produksi. Audit CI dari registry npm juga bersih; [bukti JSON](evidence/audit-summary.json).
- DEMO publik telah diverifikasi pada subpath Pages: HTTP 200, service worker, enam batch sintetis dan reload offline tanpa galat browser.
- Kategori PWA Lighthouse telah dihapus sejak v12 menurut [catatan resmi Google](https://developers.google.com/speed/docs/insights/release_notes). Maka skor PWA >=90 tidak tersedia pada Lighthouse modern; manifest, kontrol service worker, precache lazy assets, dan alur offline diuji eksplisit di Playwright. Ini penggantian metode ukur, bukan angka PWA rekaan.

## Audit adversarial

| Serangan/kondisi                             | Bukti                              | Hasil                                                     |
| -------------------------------------------- | ---------------------------------- | --------------------------------------------------------- |
| Dua konfirmasi bersamaan                     | store AC-03 + e2e rapid double tap | Satu event/metrik                                         |
| Undo setelah 10 detik                        | store AC-04                        | Ditolak, gunakan supersedes                               |
| Catatan dimodifikasi/disisipkan/diurut ulang | core AC-09                         | Verifikasi gagal                                          |
| Cadangan rusak/foreign key tak ada           | store + e2e restore                | Data lama utuh                                            |
| IndexedDB penuh                              | unit quota + e2e full storage      | Galat manusiawi, tidak memberi sukses                     |
| Jam mundur                                   | core flags + e2e backwards clock   | Flag ditampilkan                                          |
| IndexedDB dihapus                            | e2e storage cleared                | Onboarding + pemberitahuan pemulihan                      |
| Kamera ditolak/tanpa BarcodeDetector         | e2e fallback offline               | Scanner lokal dimuat; kode manual tetap bekerja           |
| Jaringan dimatikan + reload                  | e2e complete offline flow          | Dua tujuan, 7 titik, QR dan restore berfungsi             |
| Layar 320px                                  | axe test                           | Overflow sumber diperbaiki                                |
| Reload sebelum transaksi selesai             | offline regression                 | Pesan sukses lama dibersihkan saat konfirmasi baru dibuka |

## Batas bukti

Kamera fisik iOS, thermal printer 58mm/A6, ketahanan Safari terhadap eviction, kondisi tangan basah, sinar matahari, baterai dan Android 2GB perlu pengujian nyata. Tidak ada klaim telah diuji pada perangkat fisik. Tidak ada notifikasi saat aplikasi ditutup. Aturan kelayakan pangan belum divalidasi ahli.

## Regresi akhir

Dua ketukan juga dibuktikan untuk tujuan kedua, tanpa dropdown tambahan. Bukti lainnya mencakup bunyi/mute, permintaan persist saat onboarding, dan analisis pilot dari CSV ekspor asli. Semua hasil ini mengukur perilaku perangkat lunak; validasi ahli dan pilot belum dilakukan.
