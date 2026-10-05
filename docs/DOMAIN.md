# Domain dan glosarium

- **Batch**: satu kelompok produksi; satu menu, profil makanan, jumlah porsi, snapshot ambang.
- **Drop/tujuan**: penerima berlabel, porsi, rute/kendaraan opsional; bukan GPS atau identitas orang.
- **COOK_DONE / PACKED / LOADED**: selesai masak / selesai kemas / dimuat, berlaku untuk seluruh batch.
- **ARRIVED / SERVE_START**: tiba / mulai dibagikan, wajib memiliki dropId.
- **occurredAt**: waktu kejadian yang diklaim. **recordedAt**: jam perangkat ketika disimpan. Keduanya ISO UTC.
- **supersedes**: event koreksi baru merujuk event aktif yang sama tipe/batch/tujuan. Alasan wajib. Rantai koreksi tetap ada.
- **REVOKE**: pembatalan append-only entri biasa dalam 10 detik. Tidak menghapus event atau metrik mentah.

## Algoritme

Saring event aktif, kemudian ambil tiga tahap global + dua tahap tujuan terkait. Urutkan occurredAt, urutan jenis sebagai tie-breaker, lalu id. Hitung interval dari selesai masak sampai mulai dibagikan. Untuk batch berjalan tambahkan ujung `now` tanpa suhu, sehingga ekor konservatif selalu paparan.

Interval tidak dihitung sebagai paparan hanya jika suhu di **kedua** ujung memenuhi profil: hot >= hotHoldC atau cold <= coldMaxC. DRY_LOW_RISK tidak memiliki aturan waktu. Ini asumsi model, bukan bukti suhu di sepanjang perjalanan.

Paparan < warnFraction × limit → OK (UI: belum mendekati batas waktu); dari ambang peringatan hingga tepat limit → PERHATIAN; >limit → MELEWATI_BATAS. Sisa bisa negatif. Tanpa selesai masak atau urutan selesai masak setelah mulai dibagikan → UNKNOWN. Tidak mengarang waktu paparan yang hilang.

Kelengkapan independen: selesai masak, dimuat, tiba, mulai dibagikan wajib; kemas dianjurkan. Batch mengambil status waktu terburuk dan `incomplete` jika salah satu tujuan belum lengkap. UNKNOWN tidak boleh ditafsirkan sebagai waktu cukup.

Flag belakangan jika lag > toleransi (tepat toleransi bukan belakangan). Flag urutan membaca input asli dan urutan semantik; flag jam membaca recordedAt per perangkat serta waktu masa depan. Flag tidak mengubah pengukuran menjadi kebenaran. Core menerima `now`, tidak membaca jam sistem.

## Integritas

`hash = SHA256(prevHash + canonical(event tanpa hash/prevHash))`. JSON kanonik mengurutkan kunci rekursif, tanpa whitespace, menolak NaN/Infinity. Event memiliki rantai sendiri; ledger append-only membungkus event, metrik, profil, batch, pembatalan, tindak lanjut dengan rantai tambahan. Transaksi IndexedDB melindungi penulisan bersamaan. Head dan jumlah di backup mendeteksi kerusakan tak disengaja, bukan penyerang yang menulis ulang seluruh file.
