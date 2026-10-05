# Kit uji lapangan: dua minggu, satu dapur

**Ambang batas belum diverifikasi oleh ahli. Jangan dipakai sebagai satu-satunya dasar keputusan keamanan pangan.**

Aplikasi berjalan paralel dengan checklist kertas yang sudah ada. Tidak mengganti SOP, SLHS atau pengawasan petugas. Tidak ada klaim nilai tambah sebelum hasil diukur; semua contoh di repo sintetis.

## Prasyarat etis dan operasional

- Izin tertulis kepala dapur dan penjelasan tujuan ke staf sebelum pengumpulan data.
- Tanpa merekam wajah atau nama; gunakan peran dan pseudonim opsional. Tidak ada GPS.
- Data tetap di perangkat, dengan cadangan yang dikendalikan dapur. Jelaskan akses, retensi, pemindahan dan cara penghentian; rujukan hukum **BELUM TERVERIFIKASI**, konsultasikan produksi dengan ahli hukum.
- Staf boleh berhenti kapan saja. Temuan pelanggaran tidak dipakai untuk menghukum individu.
- Ahli gizi/sanitarian memverifikasi profil dan SOP tindak lanjut, bukan sekadar mengisi VERIFIED. Baca THRESHOLDS.md.
- Tetapkan satu perangkat yang mengikuti batch atau satu titik pencatatan lokal yang disepakati. MVP tidak menyinkronkan catatan pengemudi/penerima di perangkat lain.
- Siapkan termometer terkalibrasi sesuai arahan ahli, perangkat Android target (dan iOS jika dipakai), charger/power bank, printer A6/58mm dan kertas. Uji label fisik, izin kamera, mode pesawat, restart, cadangan dan pemulihan.
- Sepakati petugas pendamping, tindakan ketika peringatan muncul, penanganan perangkat gagal, serta fallback checklist kertas. Jangan melakukan eksperimen yang menambah paparan makanan.

## Rancangan

Hari persiapan: dokumentasikan persetujuan, profil ambang, SOP, pembagian peran dan pelatihan singkat. Buat satu batch sintetis, lalu hapus instalasi demo melalui prosedur browser dan gunakan instalasi operasional terpisah.

Hari 1–14: gunakan aplikasi paralel dengan kertas pada satu dapur. Catat seluruh batch dalam cakupan yang telah disepakati, bukan hanya batch yang lancar. Observer boleh mencatat hambatan tanpa foto/nama. Jangan mengisi waktu mundur untuk mempercantik metrik; jika perlu entri belakangan, biarkan flag muncul.

Setiap akhir hari: ekspor CSV dan cadangan JSON, periksa rantai hash, simpan berkas pada tempat yang disepakati. Isi checklist pembanding berdasarkan kertas asli, bukan mengikuti warna aplikasi. Catat hari/perangkat yang gagal dan alasan data hilang. Jangan mengirim ekspor ke repo publik.

Hari 7: wawancara singkat dan perbaiki pelatihan/UX jika perlu; dokumentasikan perubahan supaya pembandingan tidak menyesatkan. Hari 14: ekspor seluruh riwayat lewat Telusuri → Semua tanggal → Ekspor CSV; analisis bersama staf dan ahli.

## Metrik utama

1. Persentase entri yang real-time (tanpa DIISI_BELAKANGAN). Target ≥ 70%.
2. Median durasi entri. Target < 15 detik.
3. Jumlah batch yang melewati batas menurut aplikasi tetapi lolos dari checklist kertas. Ini bukti nilai tambah.
4. Persentase batch dengan data lengkap.
5. Umpan balik kualitatif: apa yang menghambat, apa yang diabaikan.

“Bukti nilai tambah” di sini adalah temuan proses tambahan yang harus dikonfirmasi bersama petugas, bukan bukti kejadian penyakit atau jaminan kelayakan pangan. Ambang belum terverifikasi membatasi interpretasi angka.

Durasi dimulai ketika batch dipilih/layar pencatatan dibuka sampai konfirmasi selesai diajukan; koreksi dihitung sebagai pekerjaan entri. Catatan dibatalkan dikeluarkan dari metrik, tetapi tetap ada di log. Lag negatif (jam bermasalah) tidak diberi kredit real-time dan dilaporkan terpisah. Real-time memakai toleransi snapshot setiap batch; jangan mengubah toleransi untuk mencapai target. Kelengkapan batch memerlukan semua tujuan lengkap. Pembanding yang hilang tidak dianggap lolos kertas.

## Analisis dan templat

- `templates/paper-checklist-comparison.csv`: satu baris per batch, salin `batch_id` dari ekspor. `paper_flagged=true` jika checklist menandai temuan sesuai definisi pilot; `false` jika tidak. Jika tidak ada checklist, **jangan buat baris**. Kode dan tanggal membantu pemeriksaan manual.
- `templates/interview.md`: lima pertanyaan, jawaban tanpa nama.
- `templates/one-page-report.md`: ringkasan hasil, kualitas data dan keputusan.

```sh
pnpm pilot ekspor-aplikasi.csv checklist-kertas.csv ringkasan-pilot.md
```

Skrip membaca CSV ringkasan/linimasa aplikasi (termasuk metrik durasi/lag) dan CSV kertas. CSV metrik mandiri tetap dapat diekspor untuk analisis tambahan, tetapi tidak cukup untuk kelengkapan/temuan batch. Gunakan ekspor aplikasi versi ini, bukan menggabungkan file di spreadsheet yang mengubah tipe/format. Skrip menolak kolom hilang/angka invalid/identitas ganda dan menampilkan pembanding hilang. Tidak mengirim jaringan. Wawancara tetap diisi manusia.

## Keputusan setelah pilot (apa adanya)

- Berhenti atau ganti arah jika dalam 30 hari tidak ada dapur yang bersedia mencoba.
- Berhenti atau ganti arah jika lebih dari 30% catatan tetap diisi belakangan setelah dua minggu pemakaian.
- Ubah arah jika median durasi entri > 30 detik meski sudah dioptimalkan (artinya beban kerja terlalu tinggi).
- Jangan melanjutkan ke kontrak atau klaim keamanan sebelum ambang diverifikasi ahli dan pilot menunjukkan nilai tambah yang terukur.

Untuk lanjut, dokumentasikan izin yang masih berlaku, hasil verifikasi ahli, real-time ≥70%, median <15 detik sebagai target, kelengkapan dan temuan tambahan yang dapat dijelaskan. Jika hasil berada di antara target dan kriteria berhenti, putuskan perubahan terbatas dan uji ulang; jangan menyembunyikan kegagalan atau mengganti metrik setelah melihat hasil.
