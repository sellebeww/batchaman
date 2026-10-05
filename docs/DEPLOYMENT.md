# Deployment demo

Mode DEMO: `VITE_DEMO=true pnpm build`. Database `batchaman-demo-v1` terpisah dari `batchaman-v1`, seed sintetis otomatis saat kosong, label DEMO permanen. Data tetap lokal; aset statis saja yang dihosting. Jangan memakai demo publik untuk data operasional nyata.

GitHub Pages workflow menunggu CI sukses untuk commit main dari push, checkout SHA yang sama, build DEMO, upload artefak dan deploy. Tidak ada rahasia runtime atau backend. Base Vite relatif agar berfungsi di subpath repo.

Pengelola: buat repo, push main, aktifkan Pages dengan sumber GitHub Actions. Aktifkan private vulnerability reporting sebelum menerima laporan sensitif. Buka URL hasil deploy, periksa banner DEMO, tunggu SW ready, lalu uji offline. Catat URL dan SHA yang diuji di bawah.

Status saat dokumen dibuat: source/workflow siap; URL publik belum diverifikasi. Diperbarui setelah deployment nyata berhasil.
