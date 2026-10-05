# Keamanan

Versi 0.1.x adalah prototipe untuk validasi. Jangan mengirim data dapur nyata, nama orang, kredensial, atau cadangan produksi ke issue publik.

Laporkan kerentanan melalui tab **Security → Report a vulnerability** pada repo resmi jika private vulnerability reporting sudah diaktifkan. Jika belum tersedia, buat issue minimal “Memerlukan kanal pelaporan privat” tanpa detail eksploit atau data sensitif; pengelola harus menyediakan kanal privat sebelum pertukaran detail. Tidak ada alamat email rekaan atau SLA respons yang dijanjikan.

Sertakan versi/commit, browser/OS, langkah reproduksi dengan data sintetis, dampak dan usulan mitigasi. Setelah kanal privat tersedia, pengelola menilai dampak, mereproduksi, menyiapkan perbaikan dan pemberitahuan terkoordinasi.

Model ancaman: input JSON/CSV rusak, manipulasi event, XSS, kehilangan data perangkat, formula spreadsheet, dan risiko dependency. CSP tanpa skrip eksternal/eval, aset/font lokal, validasi strict dan relasi, transaksi atomik, serta hash chain membantu membatasi risiko. Tidak ada login, enkripsi perangkat oleh aplikasi, waktu tepercaya, atau anchor hash eksternal; baca LIMITATIONS.md. Perangkat yang dikuasai penyerang berada di luar jaminan integritas.

CI wajib audit dependensi dan lisensi. Timeout audit tidak boleh dilaporkan sebagai tidak ada kerentanan. Pengelola wajib menilai advisori baru, mengunci upgrade, dan menjalankan ulang tes offline serta core.
