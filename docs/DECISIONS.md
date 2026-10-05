# Keputusan

- D001: Workspace sebagai akar monorepo agar tidak membuat direktori bertingkat yang tidak perlu.
- D002: Kelengkapan dan status waktu independen; data hilang tidak boleh menutupi pelampauan.
- D003: Profil ambang di-snapshot per batch agar impor baru tidak mengubah dasar laporan sejarah.
- D004: Log umum berantai juga merekam pembuatan batch, profil, pembatalan dan koreksi. Event makanan mempertahankan prevHash/hash; rantai diperiksa pada log keseluruhan.
- D005: Urungkan append-only lewat pembatalan, maksimal 10 detik; koreksi sesudahnya event baru dengan supersedes dan alasan.
