# Rencana BatchAman

Alat bantu dapur gratis, open source, Bahasa Indonesia, PWA lokal. Tidak menyimpulkan keamanan pangan; tidak untuk kontrak pemerintah sebelum validasi. Semua data demo sintetis.

## Arsitektur

- Workspace ini adalah akar monorepo pnpm; apps/web (React/Vite/TypeScript/Tailwind), packages/core (domain murni/Zod), packages/sim (seed deterministik), scripts, docs, .github.
- IndexedDB/Dexie menyimpan profil, batch, tujuan, log append-only, metrik lokal. Transaksi atomik mengikat rantai hash dan perubahan data. Tidak ada akun, backend, sinkronisasi, sensor, AI, GPS, foto, telemetri, atau push.
- Core menerima `now` eksplisit; UTC disimpan, zona dapur dipakai saat tampil dan pencarian tanggal. Paparan dihitung per tujuan, agregat mengambil status waktu terburuk; kelengkapan selalu terpisah.
- Koreksi melalui supersedes; urungkan melalui catatan pembatalan append-only. Snapshot profil ambang pada batch mencegah perubahan ambang menulis ulang sejarah.
- Hash SHA-256 atas prevHash + JSON kanonik; ini deteksi kerusakan lokal, bukan bukti hukum atau perlindungan terhadap penyerang yang menghitung ulang seluruh rantai.
- Workbox precache seluruh aset runtime termasuk scanner fallback. CSV/JSON/cetak dibuat lokal, dengan peringatan ambang dan privasi.

## Risiko dan mitigasi

1. Klaim menyesatkan: banner UNVERIFIED permanen, bahasa status netral, laporan mencantumkan profil.
2. Salah hitung: TDD core, property tests, >90% baris/cabang; interval tanpa dua suhu yang memenuhi profil tetap paparan.
3. Jam salah/catatan belakangan: dua timestamp, flag terpisah, deteksi urutan dan jam perangkat; tidak mengklaim jam tepercaya.
4. Data hilang: persist best effort, cadangan harian, restore tervalidasi atomik; Safari bisa menghapus penyimpanan.
5. Perangkat lemah: target sentuh 48px, font lokal, JS awal <=200KB gzip, pengujian 320px/offline/CPU lambat.
6. Dependensi/deploy: gunakan versi terkunci; audit dan lisensi CI. Deployment nyata bergantung remote GitHub/akses yang tersedia.

## Urutan dan gerbang fase

0. PLAN, ASSUMPTIONS, OPEN_QUESTIONS konsisten; tanpa kode aplikasi.
1. Monorepo strict, lint/format, unit/e2e tooling, CI; jalankan lint/typecheck/test/build.
2. Core TDD: validasi, exposure, kualitas, hash, ambang; AC-09 dan cakupan >=90%.
3. Simulator deterministik N hari × M batch, enam skenario dan fixture.
4. Alur web onboarding/batch/QR/catat/dashboard/detail/insiden/ekspor/tentang; AC-01..06,10,11,13,14.
5. PWA offline, persist, backup/restore, metrik; AC-07,08,12,15.
6. E2E, axe, budget, audit keamanan/lisensi, Lighthouse dan audit adversarial.
7. Dokumen open source, screenshot, instalasi Android/iOS, workflow Pages DEMO.
8. Kit pilot etis dua minggu, template dan analisis CSV.

Setiap fase: jalankan tes yang tersedia, catat bukti/limitasi di PROGRESS, commit Conventional Commits, ringkasan <=5 baris, lanjut otomatis. Tidak menyatakan gerbang lulus tanpa hasil terukur. Kebutuhan manusia yang tidak menghalangi implementasi dicatat sebagai pertanyaan.
