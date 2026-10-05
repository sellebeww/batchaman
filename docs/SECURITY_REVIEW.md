# Review keamanan dan kekokohan — 2026-10-05

**Ambang batas belum diverifikasi oleh ahli. Jangan dipakai sebagai satu-satunya dasar keputusan keamanan pangan.**

Review ini mencakup kode core/web, data IndexedDB, cadangan, ekspor, kamera, CSP, dependensi dan pengujian browser. Ini review rekayasa dengan data sintetis, bukan pentest independen, sertifikasi, atau validasi keamanan pangan. Tidak ada data dapur nyata yang dikirim keluar.

## Temuan yang diperbaiki

| Temuan                                                             | Dampak                                                             | Perbaikan dan bukti                                                                                                                                                            |
| ------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cadangan memakai state tab yang tertinggal                         | Catatan dari tab lain bisa tidak masuk unduhan                     | Baca snapshot terbaru dari IndexedDB; tes `security: backup reads latest data written by another tab`                                                                          |
| Penanda cadangan bisa mengakui catatan yang masuk sesudah snapshot | Pengingat harian dapat hilang walau data terbaru belum dicadangkan | Bandingkan device ID dan kepala ledger sebelum menandai; tes `backup acknowledgement never hides writes made after the downloaded snapshot`                                    |
| Metrik bisa tidak cocok dengan event meskipun hash dihitung ulang  | Analisis pilot memberi jeda yang salah                             | Validasi recordedAt dan lag terhadap event; tes `restore rejects inconsistent %s even when ledger hashes match`                                                                |
| lastBackup hanya divalidasi sebagai string                         | Cadangan cacat dapat membuat tampilan tanggal gagal                | Validasi ISO; tes `restore rejects malformed backup timestamps without replacing local data`                                                                                   |
| Pembacaan gagal masih menyisakan view lama                         | Pengguna dapat mengira catatan lama adalah keadaan terkini         | Kosongkan proyeksi tampilan dan arahkan ke pemulihan; tes `security: integrity failure clears stale dashboard before recovery`                                                 |
| Kegagalan play video bisa membiarkan track kamera aktif            | Kamera terus berjalan sampai komponen ditutup                      | Hentikan track dan kontrol saat gagal; tes `camera tracks stop immediately when video initialization fails`                                                                    |
| Pemeriksaan jam hanya melihat batch/tujuan yang dipilih            | Jam mundur antarbatch pada perangkat sama bisa luput               | Gunakan riwayat perangkat lintas batch, abaikan duplikat identik; tes `clock rollback between different batches on the same device remains visible` dan isolasi perangkat lain |
| Tidak ada penghalang aplikasi saat di-embed                        | Kontrol pencatatan berpotensi dibungkus halaman lain               | Boot menolak frame; tes `security: embedded app cannot expose recording controls`. Ini pertahanan tambahan, bukan pengganti header server                                      |
| Proyeksi log melakukan pencarian berulang                          | Riwayat panjang memperlambat input                                 | Indeks sementara Map/Set untuk relasi, identitas dan titik aktif; seluruh pemeriksaan hash, undo dan koreksi tetap dijalankan                                                  |

## Pemeriksaan lain

- Input menu yang menyerupai HTML ditampilkan sebagai teks, tanpa elemen/handler yang dieksekusi: `security: untrusted menu is text, never executable markup`.
- CSP membatasi script, koneksi, font dan aset ke origin lokal; tes yang sama membuktikan fetch lintas origin diblokir. Kebijakan referrer `no-referrer` ditambahkan.
- Tidak ditemukan pemakaian eval, new Function, innerHTML atau dangerouslySetInnerHTML di kode aplikasi/core. UI menggunakan escaping React.
- Cadangan diperiksa schema strict, ukuran, relasi, kepala/jumlah dan rantai hash sebelum penggantian atomik. Pemulihan tetap meminta konfirmasi penggantian data.
- CSV mengutip sel dan menetralisasi prefiks formula. Ekspor bukan format terenkripsi; aplikasi tidak dapat mengendalikan perilaku editor spreadsheet setelah berkas diedit/disimpan ulang.
- Mode offline, reload, quota penuh, penyimpanan terhapus, jam mundur, ketuk ganda, koreksi, kamera ditolak dan scanner tanpa BarcodeDetector tetap diuji.
- Audit dependensi ulang pada tanggal review: nol advisori pada 662 dependensi melalui registry Yarn. CI memeriksa ulang registry npm sebelum deployment. Nol advisori berarti database audit tidak melaporkan masalah pada saat pemeriksaan, bukan bukti semua dependensi bebas celah.

Pengukuran lokal satu kali pada Node v25.2.1, 168 batch/896 event sintetis: proyeksi 271ms sebelum indeks dan 89ms sesudah. Ini indikasi optimasi, bukan benchmark terkendali atau bukti Android 2GB.

## Risiko yang masih ada

1. **Perangkat dikuasai pihak lain:** tidak ada akun/enkripsi aplikasi. Orang yang menguasai perangkat atau script origin dapat membaca data, menghapusnya, atau menulis ulang seluruh rantai beserta hash. Ledger bukan bukti hukum atau tanda tangan digital.
2. **Hosting:** CSP via meta tidak dapat menerapkan `frame-ancestors`. Untuk instalasi operasional pada host yang mendukung header, gunakan `Content-Security-Policy: frame-ancestors 'none'` dan kebijakan CSP lengkap, `X-Content-Type-Options: nosniff`, serta Permissions-Policy yang membatasi fitur tidak terpakai. Pemeriksaan frame JavaScript mengurangi permukaan UI, tetapi tidak setara penolakan frame oleh browser. Lihat [dokumentasi MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors).
3. **Aset origin yang sama:** GitHub Pages demo berada pada origin bersama situs milik akun yang sama. Perlakukan origin hosting sebagai batas kepercayaan; gunakan origin khusus untuk instalasi operasional dan kendalikan akses penerbitannya.
4. **Ketersediaan data:** browser/iOS dapat membersihkan penyimpanan. Unduhan dimulai tidak membuktikan berkas benar-benar disimpan. Buka dan uji pemulihan cadangan secara teratur di perangkat uji.
5. **Beban riwayat:** ledger masih ditulis sebagai satu dokumen; biaya baca/tulis bertambah dengan data. Batas impor 50MB/100.000 entri bukan jaminan responsif pada Android 2GB. Uji volume pilot pada perangkat nyata.
6. **Waktu dan pangan:** jam tidak tepercaya, pencatatan terlambat dan pengukuran suhu salah tetap mungkin. Ambang placeholder, model interval dan SOP harus diverifikasi ahli. Tidak ada peringatan saat aplikasi tertutup.

Referensi teknis tambahan: [OWASP CSV Injection](https://community.owasp.org/attacks/CSV_Injection), [MDN CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP). Review ini tidak mengubah status profil menjadi VERIFIED. Hasil akhir pengujian dan deployment dicatat dalam QUALITY.md dan PROGRESS.md.
