# Progres

## Fase 0 — selesai

- PLAN.md, ASSUMPTIONS.md, OPEN_QUESTIONS.md diperiksa konsisten terhadap permintaan.
- Workspace kosong; belum ada kode aplikasi. Node v25.2.1 tersedia; pnpm belum di PATH; corepack tersedia.
- Validasi: tiga dokumen wajib ada, placeholder dan keterbatasan eksplisit.
- Berikutnya: Fase 1 — bootstrap pnpm, tooling dan CI, lalu core TDD.

## Fase 1–8 — belum dikerjakan

Tidak ada klaim tes, cakupan, deployment atau skor performa sebelum pengukuran.

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
