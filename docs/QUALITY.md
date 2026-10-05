# Bukti kualitas (2026-10-05)

- 88 tes unit/properti/komponen/storage lulus sebelum kit pilot ditambahkan.
- Core: 100% baris, 97,5% cabang, 100% fungsi pada pengukuran Fase 5. Jalankan `pnpm coverage` untuk angka terbaru.
- Playwright: 9/9 lulus. Axe: tidak ada pelanggaran serius/kritis pada onboarding, buat batch, konfirmasi, detail, label, dasbor, penelusuran, data, tentang.
- Layar 320px tidak overflow setelah perbaikan URL panjang. Alur utama dan axe juga lulus dengan CPU diperlambat 6× (emulasi Chromium; bukan bukti perangkat Android 2GB nyata).
- JS awal: 142,02KiB gzip; gerbang `pnpm budget` menghitung entry + impor statis, mengecualikan chunk scanner/QR/simulator yang lazy. Total precache sekitar 905KiB mentah.
- Lisensi: 39 paket produksi diperiksa; MIT, ISC, Apache-2.0, dan dual Unlicense/Apache-2.0 (dipilih Apache-2.0). Daftar tanpa path perangkat di `dependency-licenses.json`.
- Lighthouse lokal: BELUM TERUKUR. Registry npm timeout saat mengunduh alat. Jangan mengklaim skor >=90 tanpa laporan JSON.
- Audit advisori dependensi: BELUM SELESAI, request registry timeout. CI wajib menjalankan `pnpm audit --audit-level high`; kegagalan jaringan bukan hasil audit bersih.
- Kategori PWA Lighthouse telah dihapus sejak v12 menurut [catatan resmi Google](https://developers.google.com/speed/docs/insights/release_notes). Maka skor PWA >=90 tidak tersedia pada Lighthouse modern; manifest, kontrol service worker, precache lazy assets, dan alur offline diuji eksplisit di Playwright. Ini penggantian metode ukur, bukan angka PWA rekaan.

## Audit adversarial

| Serangan/kondisi | Bukti | Hasil |
|---|---|---|
| Dua konfirmasi bersamaan | store AC-03 + e2e rapid double tap | Satu event/metrik |
| Undo setelah 10 detik | store AC-04 | Ditolak, gunakan supersedes |
| Catatan dimodifikasi/disisipkan/diurut ulang | core AC-09 | Verifikasi gagal |
| Cadangan rusak/foreign key tak ada | store + e2e restore | Data lama utuh |
| IndexedDB penuh | unit quota + e2e full storage | Galat manusiawi, tidak memberi sukses |
| Jam mundur | core flags + e2e backwards clock | Flag ditampilkan |
| IndexedDB dihapus | e2e storage cleared | Onboarding + pemberitahuan pemulihan |
| Kamera ditolak/tanpa BarcodeDetector | e2e fallback offline | Scanner lokal dimuat; kode manual tetap bekerja |
| Jaringan dimatikan + reload | e2e complete offline flow | Dua tujuan, 7 titik, QR dan restore berfungsi |
| Layar 320px | axe test | Overflow sumber diperbaiki |
| Reload sebelum transaksi selesai | offline regression | Pesan sukses lama dibersihkan saat konfirmasi baru dibuka |

## Batas bukti

Kamera fisik iOS, thermal printer 58mm/A6, ketahanan Safari terhadap eviction, kondisi tangan basah, sinar matahari, baterai dan Android 2GB perlu pengujian nyata. Tidak ada klaim telah diuji pada perangkat fisik. Tidak ada notifikasi saat aplikasi ditutup. Aturan kelayakan pangan belum divalidasi ahli.
