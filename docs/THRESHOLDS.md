# Verifikasi profil ambang

**Ambang batas belum diverifikasi oleh ahli. Jangan dipakai sebagai satu-satunya dasar keputusan keamanan pangan.**

Sumber bawaan di `packages/core/config/thresholds.default.json`. Semua profil memuat hotHoldC=60, coldMaxC=5, maxMinutesInDanger=120, warnFraction=0,75, realtimeToleranceMin=10, status=UNVERIFIED, source, verifiedBy=null, verifiedAt=null. Pada profil kering aturan waktu tidak diterapkan.

**BELUM TERVERIFIKASI**: [poster WHO Five Keys](https://www.who.int/docs/librariesprovider2/default-document-library/5keys_en.pdf) memuat anjuran umum tidak meninggalkan makanan matang di suhu ruang lebih dari dua jam. Ini bukan validasi angka untuk setiap jenis makanan, bukan kutipan aturan BGN/Kemenkes, dan bukan pembenaran klinis model interval aplikasi.

## Prosedur sebelum pilot

1. Sanitarian/ahli gizi meninjau jenis menu, rantai panas/dingin, alat ukur/kalibrasi, tahapan dan SOP tindak lanjut.
2. Pemeriksa mengidentifikasi pedoman resmi yang benar-benar berlaku. Rekam judul, penerbit, revisi/tanggal, halaman, konteks, dan alasan nilai dalam `source`. Jangan hanya menyalin angka internet.
3. Tinjau asumsi dua ujung suhu, konservatisme data kosong, batas peringatan, toleransi catatan belakangan, dan profil kering. Uji contoh bersama petugas.
4. Salin JSON default; isi ketiga profil, nilai yang disetujui, `status: "VERIFIED"`, identitas pemeriksa pada `verifiedBy`, ISO UTC pada `verifiedAt`. Identitas ini dikelola lokal; jangan commit data ahli nyata ke repo.
5. Impor di Data & cadangan → Impor profil ambang JSON. Aplikasi menolak VERIFIED tanpa metadata, mencatat perubahan di ledger, dan memakai profil baru **hanya untuk batch baru**.
6. Bandingkan laporan contoh dengan perhitungan manual ahli. Simpan persetujuan dan versi profil di luar repo. Buat cadangan perangkat.

VERIFIED berarti metadata lengkap, bukan verifikasi independen oleh perangkat. Batch lama mempertahankan ambang semula dan banner UNVERIFIED tetap muncul selama masih ada profil/batch yang belum diverifikasi. Jangan mengubah status sekadar untuk menyembunyikan banner.
