# Batasan yang tidak boleh disembunyikan

- Ambang placeholder **UNVERIFIED**. Hasil waktu bukan penentuan kelayakan pangan. Tidak menggantikan SOP, SLHS, atau pengawasan petugas.
- Tidak ada sinkronisasi atau server. Riwayat terpecah jika perangkat berbeda mencatat bagian yang berbeda. Cadangan mengganti database, tidak merge. Jangan menjalankan pilot tanpa prosedur perjalanan perangkat yang jelas.
- Jam perangkat bisa salah; UTC hanya format, bukan jaminan waktu benar. Flag lompatan 24 jam heuristik dan bisa muncul setelah perangkat lama tidak dipakai.
- Dua suhu di ujung interval tidak membuktikan suhu sepanjang interval. Mesin menerapkan model yang diminta, bukan model mikrobiologi. Tanpa suhu dihitung konservatif; tanpa selesai masak jumlah paparan tidak diketahui.
- Profil DRY_LOW_RISK tidak dinilai berdasarkan waktu; label profil ini tidak membuktikan makanan berisiko rendah. Pemilihan profil harus diverifikasi ahli.
- Rantai hash hanya mendeteksi perubahan lokal yang tidak dihitung ulang. Tidak bisa mendeteksi penggantian seluruh rantai dengan hash baru, penghapusan ekor tanpa anchor eksternal, atau pengguna yang menguasai perangkat. **Bukan bukti hukum**.
- Tidak ada autentikasi. Siapa pun yang memegang perangkat dapat melihat catatan dan memasukkan data. Tidak ada tanda tangan ahli; VERIFIED adalah metadata yang diimpor.
- Semua data lokal bisa hilang ketika sistem membersihkan penyimpanan, browser dihapus, perangkat rusak/hilang, atau pengguna membersihkan data. Safari/iOS khususnya harus diasumsikan dapat menghapus data. `persist()` best effort. Cadangan di luar perangkat wajib.
- Peringatan tidak jalan saat aplikasi tertutup. Tab latar dapat menunda timer; evaluasi ulang dilakukan saat terlihat. Getar dan bunyi tidak dijamin; bunyi dapat dimatikan.
- Muat awal membutuhkan jaringan; setelah seluruh aset diprecache, alur berjalan offline. Versi service worker baru menunggu semua tab versi lama ditutup; tidak memaksa reload form.
- Pemindai kamera bisa gagal karena izin, pencahayaan, atau API perangkat. Input kode manual tetap tersedia. Pengujian iOS fisik dan printer belum dilakukan.
- CSV/JSON/PDF tidak terenkripsi. CSV menetralkan formula, tetapi aplikasi spreadsheet dapat mengubah format data jika diedit dan disimpan ulang.
- Penyimpanan satu ledger diproyeksikan ulang saat perubahan. Sesuai pilot kecil; pertumbuhan sangat besar akan memperlambat pembacaan/penulisan. Tidak ada pruning log. Batas cadangan 50 MB dan 100.000 entri bukan klaim performa pada ukuran tersebut.
- Nama/kode dapur tidak dapat diedit setelah onboarding di MVP; buat cadangan dan siapkan instalasi baru jika salah. Riwayat yang sudah tercatat tidak diubah diam-diam.
- Belum ada validasi lapangan, pengujian laboratorium, atau bukti nilai tambah terhadap checklist kertas. Tidak boleh dijual sebagai jaminan keamanan atau sistem resmi pemerintah.
