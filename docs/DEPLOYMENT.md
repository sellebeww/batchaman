# Deployment demo

Mode DEMO: `VITE_DEMO=true pnpm build`. Database `batchaman-demo-v1` terpisah dari `batchaman-v1`, seed sintetis otomatis saat kosong, label DEMO permanen. Data tetap lokal; aset statis saja yang dihosting. Jangan memakai demo publik untuk data operasional nyata.

GitHub Pages workflow menunggu CI sukses untuk commit main dari push, checkout SHA yang sama, build DEMO, upload artefak dan deploy. Tidak ada rahasia runtime atau backend. Base Vite relatif agar berfungsi di subpath repo.

Pengelola: buat repo, push main, aktifkan Pages dengan sumber GitHub Actions. Aktifkan private vulnerability reporting sebelum menerima laporan sensitif. Buka URL hasil deploy, periksa banner DEMO, tunggu SW ready, lalu uji offline. Catat URL dan SHA yang diuji di bawah.

## Deployment terverifikasi

- Repo: https://github.com/sellebeww/batchaman
- Demo: https://sellebeww.github.io/batchaman/
- Deployment pertama: https://github.com/sellebeww/batchaman/actions/runs/37279564950 (sukses, source e7dc37d).
- Browser sungguhan memverifikasi HTTP 200, enam batch sintetis, label DEMO, service worker terkontrol dan reload offline; tidak ada page error.
- Private vulnerability reporting aktif pada repo. Tidak ada data operasional yang dipublikasikan.
- Commit perbaikan berikutnya hanya diterbitkan setelah CI sukses; SHA deployment terbaru dicatat di PROGRESS.md.

## Rilis terbaru

Source `2a39fecaa2489eee015385cf2a05908d63fbff05` lulus [CI](https://github.com/sellebeww/batchaman/actions/runs/37306919230) dan [deployment](https://github.com/sellebeww/batchaman/actions/runs/37307143572). Pemeriksaan langsung pada URL publik membuktikan HTTP 200, enam batch sintetis, tombol langsung per tujuan, service worker aktif dan reload offline tanpa galat browser. [Bukti JSON](evidence/public-demo-verification.json) merekam waktu dan commit. Perubahan dokumentasi setelahnya tidak mengubah bundle yang diuji.
