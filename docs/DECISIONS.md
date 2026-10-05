# Keputusan

- D001: Workspace sebagai akar monorepo agar tidak membuat direktori bertingkat yang tidak perlu.
- D002: Kelengkapan dan status waktu independen; data hilang tidak boleh menutupi pelampauan.
- D003: Profil ambang di-snapshot per batch agar impor baru tidak mengubah dasar laporan sejarah.
- D004: Log umum berantai juga merekam pembuatan batch, profil, pembatalan dan koreksi. Event makanan mempertahankan prevHash/hash; rantai diperiksa pada log keseluruhan.
- D005: Urungkan append-only lewat pembatalan, maksimal 10 detik; koreksi sesudahnya event baru dengan supersedes dan alasan.
- D006: Core memakai SHA-256 portable sinkron (@noble/hashes); transaksi IndexedDB tidak menunggu WebCrypto sehingga tidak kedaluwarsa saat hashing.
- D007: Flag kualitas mengikuti urutan input, sedangkan hasil paparan mengikuti waktu kejadian. Properti permutasi berlaku pada paparan/status waktu, bukan flag kualitas yang sengaja peka urutan.
- D008: Jika COOK_DONE hilang atau lebih lambat dari SERVE_START, paparan UNKNOWN, bukan 0. Suhu interval ongoing selalu dianggap tak diketahui.
- D009: Penyimpanan memakai satu dokumen ledger dalam transaksi Dexie. Proyeksi hanya dibentuk dari entri log yang diverifikasi, sehingga data batch/tujuan/profil tidak menjadi tabel mutable terpisah. Dua rantai saling mengikat: event sesuai rumus yang diminta, dan ledger membungkus event beserta metrik/perubahan profil. Ini memperjelas D004.
- D010: Duplikat titik aktif ditolak/dikembalikan sebagai catatan yang sama, bahkan setelah dua detik; pengulangan yang disengaja harus memakai koreksi. Urungkan koreksi tidak didukung agar tidak menghidupkan kembali sejarah secara ambigu.
- D011: Bunyi default nonaktif agar tidak mengejutkan dapur. Pengguna dapat mengaktifkan; gesture mengaktifkan AudioContext. Banner dan getar tetap otomatis jika didukung.
- D012: Label QR hanya memuat kode batch lokal. Penerima di perangkat lain membutuhkan cadangan yang dipindahkan dengan prosedur terkontrol; QR bukan sinkronisasi atau tautan publik.
- D013: Apache-2.0 dipilih untuk lisensi permisif dengan grant paten eksplisit. MIT lebih ringkas tetapi tidak eksplisit soal paten; AGPL mewajibkan berbagi source untuk penggunaan jaringan dan dapat menambah friksi adopsi. Ini pilihan teknis/proyek, bukan nasihat hukum.
- D014: Gerbang lisensi mengizinkan dual Unlicense OR Apache-2.0 dengan memilih opsi Apache-2.0. Daftar komponen disimpan tanpa path lokal.
- D015: Lighthouse >=12 tidak memiliki kategori PWA. Performance/Accessibility tetap gerbang >=90; PWA diuji melalui manifest, kontrol SW, dan seluruh alur offline, tanpa mengarang skor.
- D016: Agregat UNKNOWN diprioritaskan di atas OK, tetapi tetap di bawah PERHATIAN/MELEWATI_BATAS. Tujuan yang belum dapat dihitung tidak boleh tampak telah terjawab oleh tujuan lain; kelengkapan tetap terpisah.
- D017: CSV harian menyertakan metrik pada baris event agar skrip pilot cukup menerima dua berkas (ekspor aplikasi dan checklist kertas). Entri dibatalkan dikecualikan dari metrik, koreksi tetap dihitung, lag negatif tidak memperoleh kredit real-time; pembanding hilang dilaporkan eksplisit.
- D018: Demo Pages memakai database terpisah dan label DEMO permanen. Seed sintetis tidak menggantikan data operasional dan tidak ada data dapur nyata di bundle/repo.
