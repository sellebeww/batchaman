# Keputusan

- D001: Workspace sebagai akar monorepo agar tidak membuat direktori bertingkat yang tidak perlu.
- D002: Kelengkapan dan status waktu independen; data hilang tidak boleh menutupi pelampauan.
- D003: Profil ambang di-snapshot per batch agar impor baru tidak mengubah dasar laporan sejarah.
- D004: Log umum berantai juga merekam pembuatan batch, profil, pembatalan dan koreksi. Event makanan mempertahankan prevHash/hash; rantai diperiksa pada log keseluruhan.
- D005: Urungkan append-only lewat pembatalan, maksimal 10 detik; koreksi sesudahnya event baru dengan supersedes dan alasan.
- D006: Core memakai SHA-256 portable sinkron (@noble/hashes); transaksi IndexedDB tidak menunggu WebCrypto sehingga tidak kedaluwarsa saat hashing.
- D007: Flag kualitas mengikuti urutan input, sedangkan hasil paparan mengikuti waktu kejadian. Properti permutasi berlaku pada paparan/status waktu, bukan flag kualitas yang sengaja peka urutan.
- D008: Jika COOK_DONE hilang atau lebih lambat dari SERVE_START, paparan UNKNOWN, bukan 0. Suhu interval ongoing selalu dianggap tak diketahui.
