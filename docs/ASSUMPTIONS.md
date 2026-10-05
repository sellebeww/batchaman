# Asumsi

- Akar workspace kosong dipakai langsung sebagai akar repo, tanpa folder batchaman bertingkat.
- Satu profil dapur aktif per perangkat; banyak tujuan per batch. Tidak ada pertukaran langsung antar perangkat; penelusuran hanya mencakup data lokal atau cadangan yang dipulihkan.
- 60°C, 5°C, 120 menit, 0,75 dan toleransi 10 menit adalah placeholder UNVERIFIED, termasuk pada profil DRY_LOW_RISK yang tidak menerapkan aturan waktu.
- Tanpa COOK_DONE tidak dapat menghitung paparan yang tak diketahui; tampilkan data tidak lengkap, bukan menyimpulkan waktu cukup. Titik setelah SERVE_START tidak memperpanjang perhitungan.
- Suhu sekarang tidak diasumsikan sama dengan pengukuran terakhir: ekor interval ongoing tanpa suhu dihitung paparan.
- Urutan tanggal kejadian menentukan paparan; urutan input dipakai hanya untuk flag kualitas. Duplikat identik diabaikan; konflik titik wajib harus dikoreksi melalui supersedes.
- Urungkan membuat record pembatalan, bukan menghapus log; batas 10 detik dihitung monotonic dalam sesi UI.
- Lompatan jam >24 jam antara catatan perangkat diberi flag konservatif, bukan kepastian jam salah; dapat berarti perangkat lama tidak dipakai.
- Angka porsi tujuan harus berjumlah sama dengan porsi batch. Suhu di luar -30..120 ditolak dan diminta diperiksa ulang; tidak disimpan sebagai pengukuran valid.
- Tidak ada email pelaporan/remote GitHub yang disediakan: dokumentasikan kanal privat yang harus disiapkan pengelola, jangan mengarang alamat.
