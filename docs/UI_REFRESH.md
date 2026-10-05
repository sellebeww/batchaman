# Pembaruan UI dan identitas BatchAman

## Arah desain

Hijau hutan `#164B3B`, latar krem `#F6F5F0`, permukaan `#FFFEFA`, dan aksen jingga pada identitas. Warna status waktu tetap dibedakan dengan teks dan ikon. Font memakai font sistem; tidak ada permintaan font eksternal atau dependensi UI baru.

- Dasbor menampilkan jumlah batch, porsi dan batch dengan peringatan waktu untuk tanggal/pencarian aktif. Angka peringatan bukan penilaian kelayakan pangan.
- Filter Semua batch, Peringatan waktu, dan Belum lengkap membantu supervisi. Ringkasan tetap menunjukkan keseluruhan hasil tanggal/pencarian; filter kartu ditampilkan sebagai tombol terpilih.
- Kartu memisahkan status waktu dari kelengkapan. Segmen progres menghitung titik tercatat, termasuk PACKED yang direkomendasikan; bukan urutan pasti atau jaminan pangan.
- Navigasi desktop memakai ikon SVG lokal. Pada ponsel, navigasi bawah mempunyai target sentuh minimal 48px dan ruang bawah agar konten terakhir tetap dapat dijangkau.
- Link lewati navigasi, fokus keyboard jelas, teks galat, dan preferensi reduced motion tersedia. Peringatan UNVERIFIED tetap terlihat pada layar dan laporan.
- Alur dua ketukan, input suhu opsional, koreksi append-only, QR/cetak, pencadangan dan semua fitur MVP dipertahankan.

## Logo

Logo baru dibuat menggunakan skill imagegen atas permintaan pengguna: wadah makanan, jejak tiga titik, serta bentuk yang mengingatkan huruf b. Tidak menggunakan perisai, centang sertifikasi, atau simbol medis. Ini identitas produk, bukan label bahwa makanan memenuhi syarat tertentu.

Sumber transparan: [PNG asli](brand/batchaman-logo-original.png). Aset aplikasi: `apps/web/public/brand/batchaman-mark.png` (256px), `icon-192.png`, `icon-512.png`. Varian aplikasi hanya diperkecil dari hasil generasi; alpha dipertahankan. Ikon manifest menggunakan purpose `any`, sehingga tidak menjanjikan maskable safe area yang belum dirancang. Logo dibundel dan diprecache lokal; tidak ada fitur AI di aplikasi.

Gunakan ruang kosong di sekitar simbol dan teks BatchAman terpisah agar wordmark tetap tajam. Jangan memakai logo sebagai stempel persetujuan ahli. Screenshot hasil nyata ada di `docs/screenshots/`.

## Penyempurnaan alur dan pembaruan

- Pencarian kode, menu, dan tujuan tersedia di dasbor; jumlah hasil dan tombol hapus filter membantu pengguna kembali ke daftar lengkap.
- Hasil kosong menyediakan akses ke semua tanggal atau pembuatan batch. Tanggal historis diberi judul Ringkasan batch.
- Formulir menunjukkan total porsi tujuan dibanding porsi batch sebelum disimpan. Keterlambatan ditulis sebagai durasi melewati batas, bukan sisa waktu negatif.
- Label navigasi ponsel diperbesar; pergantian menu tidak memakai transisi warna yang menurunkan kontras sesaat.
- Versi aplikasi baru ditawarkan melalui tombol pembaruan setelah tersedia. Aplikasi tidak memuat ulang otomatis saat pengguna sedang mengisi formulir.
- Demo sebelum 06.00 WIB menggunakan contoh kemarin; kunjungan berikutnya tetap membuka tanggal contoh terakhir, tanpa menghapus data lokal.
