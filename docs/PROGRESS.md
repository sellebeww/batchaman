# Progres

## Status terkini

Fase 0–8 telah diimplementasikan; kualitas otomatis dan deployment pertama lulus. Verifikasi ahli, pilot dan perangkat fisik belum dilakukan. Catatan di bawah adalah riwayat, sehingga status tertunda pada fase awal dibaca bersama tindak lanjut terakhir.

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

## Penutupan kualitas dan publikasi

- 101 tes lulus; Vitest 4.1.11: core 99,11% baris / 95,41% cabang. E2E 9/9 operasional dan 1/1 DEMO; axe tanpa temuan serius/kritis.
- Lighthouse CI pertama 92 Performance / 100 Accessibility; demo Pages berhasil dipasang dan diuji offline pada URL publik.
- Audit menemukan dua advisori moderate alat tes; pembaruan Vitest menutup keduanya, audit ulang lokal nol advisori. CI mengulang seluruh gerbang pada commit perbaikan.
- Regresi dua ketukan untuk tujuan kedua diperbaiki dan diuji. Laporan lengkap: FINAL_REPORT.md; matriks: ACCEPTANCE.md.
- Berikutnya: konfirmasi CI/deployment perbaikan, lalu serahkan verifikasi ambang dan persiapan pilot kepada manusia.

## Rilis terverifikasi — 2026-10-05

- Source `2a39fec`: [CI 37306919230](https://github.com/sellebeww/batchaman/actions/runs/37306919230) sukses seluruh gerbang; 101 tes, 9 e2e, core 99,11% baris / 95,41% cabang.
- Lighthouse mobile **95 Performance / 100 Accessibility**, JS awal **142,79KiB gzip**, audit **nol advisori** dari registry npm CI.
- [Deployment 37307143572](https://github.com/sellebeww/batchaman/actions/runs/37307143572) sukses, termasuk 1 tes DEMO. URL publik diverifikasi offline di 320px: enam batch, tombol langsung tujuan kedua, SW aktif, tanpa galat browser.
- Bukti JSON disimpan di `docs/evidence/`; fase perangkat lunak 0–8 selesai. Commit setelah source ini hanya memperbarui bukti/dokumentasi.
- Langkah manusia berikutnya: verifikasi ambang/SOP oleh ahli, izin dapur pilot, prosedur perpindahan perangkat, uji perangkat/termometer/printer dan cadangan, lalu pilot dua minggu. Lihat FINAL_REPORT.md dan FIELD_TEST.md.
