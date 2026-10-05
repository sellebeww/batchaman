# Progres

## Fase 0 — selesai

- PLAN.md, ASSUMPTIONS.md, OPEN_QUESTIONS.md diperiksa konsisten terhadap permintaan.
- Workspace kosong; belum ada kode aplikasi. Node v25.2.1 tersedia; pnpm belum di PATH; corepack tersedia.
- Validasi: tiga dokumen wajib ada, placeholder dan keterbatasan eksplisit.
- Berikutnya: Fase 1 — bootstrap pnpm, tooling dan CI, lalu core TDD.

## Fase 1 — selesai

- Monorepo pnpm, TypeScript strict, ESLint/Prettier, Vitest/Playwright, husky, CI dibuat.
- `pnpm check`: lint, typecheck, 1 tes fondasi, build lulus. JS fondasi 69,22KB gzip.
- pnpm via corepack, cache lokal `.corepack`; gunakan `COREPACK_HOME="$PWD/.corepack" corepack pnpm ...` pada mesin ini.
- Berikutnya: Fase 2 TDD core. Audit/dependency modernization dilakukan pada Fase 6; lockfile merekam versi aktual.

## Fase 2 — selesai

- TDD: 60 tes gagal sebelum implementasi; 65 tes kemudian lulus (termasuk empat properti fast-check).
- Cakupan core: baris 100%, cabang 95,72%, fungsi 100%. AC-09 tamper/insert/reorder/head lulus.
- Tiga zona, lintas tengah malam, tiap profil, duplikat, multi-tujuan, supersedes, titik hilang, suhu kosong dan jam mundur tercakup.
- Berikutnya: simulator deterministik; validasi relasi koreksi/restore ditambahkan pada lapisan persistensi.

## Fase 3 — selesai

- Simulator berseed menghasilkan N hari × M batch, kode unik, seluruh data berlabel sintetis.
- Enam skenario menjadi fixture: normal, terlambat, suhu kosong, entri belakangan, jam bergeser, multi-tujuan.
- 73 tes total lulus; lint/typecheck/build lulus.
- Berikutnya: Fase 4 aplikasi web; persistensi dasar dibangun bersama alur agar input tidak sekadar tersimpan di memori.

## Fase 4 — selesai

- Onboarding, batch multi-tujuan, catat dua ketukan, koreksi/urungkan, dasbor, insiden, CSV/cetak, QR A6/58mm, tentang dan tindak lanjut supervisor tersedia.
- `pnpm check`: 87 tes lulus, lint/typecheck/build lulus; JS utama 145,43KB gzip.
- Playwright: 4/4 lulus (alur multi-tujuan, double tap/undo, peringatan/visibility, jaringan keluar/axe/320px).
- Axe tanpa pelanggaran serius/kritis pada detail, tentang, data, telusuri, dasbor. Overflow URL sumber di 320px ditemukan dan diperbaiki.
- Berikutnya: Fase 5 precache PWA dan pembuktian alur offline/restore. Kamera fisik dan hasil printer tetap memerlukan uji perangkat.

## Fase 5 — selesai

- Service worker mem-precache 16 aset (~905KiB mentah), termasuk QR/scanner fallback; tidak ada CDN.
- 7/7 Playwright lulus: alur penuh dua tujuan offline, reload, backup/restore, metrik CSV, impor rusak, kamera ditolak, penyimpanan penuh/terhapus, jam mundur.
- Temuan: pesan sukses lama dapat terlihat sebelum transaksi baru selesai. Pesan sekarang dihapus saat membuka konfirmasi baru; regression offline lulus.
- Permintaan persist saat onboarding dan tombol ulang, pengingat cadangan harian, serta restore atomik tersedia.
- Berikutnya: Fase 6 audit dependensi/lisensi, anggaran, Lighthouse, dan perluasan axe/perangkat lambat.

## Fase 6 — sebagian, menunggu pemeriksaan jaringan

- 88 tes lokal dan 9 e2e lulus; axe seluruh layar utama dan CPU 6× lulus.
- Gerbang JS awal lulus; 39 lisensi produksi diperiksa dan gerbang lisensi ditambahkan ke CI.
- Audit advisori dan pemasangan Lighthouse lokal terhambat timeout registry. CI mengukur Lighthouse 13.5.0 mobile dan mengarsip bukti; belum mengklaim skor.
- PWA Lighthouse modern tidak mempunyai kategori skor; diganti bukti installability/offline eksplisit, dijelaskan dalam QUALITY.md.
- Pekerjaan dokumentasi/kit pilot tidak bergantung jaringan, dilanjutkan sambil menyiapkan pengukuran CI.

## Fase 7 — dokumentasi selesai, publikasi menunggu push/CI

- README Indonesia + English, screenshot sintetis, Apache-2.0, panduan kontribusi, perilaku, keamanan, changelog, domain, ambang, batasan, template issue/PR tersedia.
- Mode DEMO seed otomatis dan database terpisah; Pages hanya deploy setelah CI main sukses.
- `pnpm check` tetap lulus setelah bootstrap demo. URL akan dicatat setelah publikasi nyata, bukan sekadar workflow.
- Berikutnya: kit pilot/analisis CSV, lalu validasi paket akhir dan deployment.

## Fase 8 — implementasi selesai, validasi akhir berjalan

- FIELD_TEST.md, tiga templat, dan analyze-pilot.ts tersedia. Empat kriteria berhenti/ubah arah disalin apa adanya.
- Analisis membaca ekspor aplikasi + checklist kertas, menghitung real-time/median/temuan tambahan/kelengkapan, dan menandai pembanding hilang serta jam bermasalah.
- Fixture end-to-end skrip memakai simulator dan fungsi ekspor aplikasi, bukan CSV rekaan yang tidak cocok format.
- Temuan review agregasi UNKNOWN diperbaiki dengan regression test. Berikutnya: seluruh tes/cakupan/e2e, format, commit, push CI dan Pages.

## Validasi akhir Fase 8 — selesai lokal

- `pnpm check` + `pnpm coverage`: 100 tes lulus; core 99,26% baris, 97,5% cabang.
- E2E operasional 9/9 lulus; bundle awal 142,16KiB gzip. Pilot parser diuji terhadap BOM/CRLF, kutip/newline, pembanding hilang/ganda, serta kolom metrik hilang.
- Gerbang yang tersisa: CI advisori/Lighthouse dan URL Pages. Verifikasi ahli serta pilot nyata tetap pekerjaan manusia.
