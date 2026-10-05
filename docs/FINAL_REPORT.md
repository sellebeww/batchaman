# Laporan implementasi BatchAman

**Ambang batas belum diverifikasi oleh ahli. Jangan dipakai sebagai satu-satunya dasar keputusan keamanan pangan.**

## Status fase

| Fase | Status   | Bukti / batasan                                                                                      |
| ---- | -------- | ---------------------------------------------------------------------------------------------------- |
| 0    | Selesai  | PLAN, ASSUMPTIONS, OPEN_QUESTIONS sebelum kode aplikasi                                              |
| 1    | Selesai  | Monorepo strict, lint/typecheck/test/build, CI                                                       |
| 2    | Selesai  | Mesin paparan dan hash; cakupan di atas 90%                                                          |
| 3    | Selesai  | Seed deterministik, enam skenario sintetis                                                           |
| 4    | Selesai  | Alur MVP, QR, multi-tujuan, linimasa, ekspor                                                         |
| 5    | Selesai  | PWA/offline penuh, cadangan/pemulihan/metrik                                                         |
| 6    | Sebagian | Tes lokal/axe/budget/lisensi lulus; Lighthouse dan advisori menunggu CI; perangkat fisik belum diuji |
| 7    | Sebagian | Dokumen dan workflow DEMO lengkap; URL publik menunggu deployment                                    |
| 8    | Selesai  | Kit pilot, templat, analisis CSV dan 9 tes skrip                                                     |

## Hasil terukur

100 tes lokal lulus. Cakupan core 99,26% baris, 97,5% cabang, 100% fungsi. E2E operasional 9/9 lulus; axe tidak menemukan pelanggaran serius/kritis di semua layar utama. CPU 6× dan layar 320px diuji. JavaScript awal 142,16KiB gzip. 39 lisensi produksi diperiksa. Skor Lighthouse belum diisi sebelum laporan dihasilkan; kategori skor PWA modern tidak tersedia, diuji melalui alur offline/manifest/SW.

## AC-01–15

Seluruh kriteria memiliki implementasi dan bukti otomatis; [ACCEPTANCE.md](ACCEPTANCE.md) mencantumkan status dan nama tes untuk setiap AC. Bunyi/getar, kamera iOS dan printer fisik masih memerlukan pemeriksaan perangkat. Bukti otomatis bukan validasi keamanan pangan.

## Keputusan/asumsi penting

- Core murni menerima now; UTC disimpan, zona dapur dipakai untuk tampilan/filter.
- Suhu hilang dan interval ongoing dihitung konservatif; tanpa selesai masak paparan UNKNOWN.
- Kelengkapan/flag terpisah dari waktu; UNKNOWN tidak tertutup oleh OK dan tidak menutupi pelampauan.
- Snapshot ambang per batch; impor profil baru tidak mengubah sejarah.
- Ledger dan event berantai SHA-256; undo/koreksi tetap append-only. Bukan bukti hukum.
- Satu perangkat/prosedur lokal; tidak ada sinkronisasi. DEMO memakai database berbeda.

Rincian: [DECISIONS.md](DECISIONS.md), [ASSUMPTIONS.md](ASSUMPTIONS.md), [LIMITATIONS.md](LIMITATIONS.md).

## Pertanyaan manusia, urut dampak

1. Ahli mana yang memverifikasi ambang, model interval, jenis menu dan SOP tindakan? Pedoman resmi BGN/Kemenkes apa yang benar-benar berlaku? **BELUM TERVERIFIKASI**.
2. Dapur mana bersedia menjadi pilot dengan izin tertulis dan perlindungan staf?
3. Bagaimana satu perangkat mengikuti batch sampai semua tujuan, tanpa sinkronisasi?
4. Perangkat/termometer/printer apa yang akan diuji nyata dan bagaimana prosedur cadangannya?
5. Siapa yang mengelola retensi, akses ekspor, dan konsultasi hukum minimisasi data? Klaim hukum **BELUM TERVERIFIKASI**.

Daftar lengkap: [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).

## Langkah manusia sebelum uji lapangan

1. Sanitarian/ahli gizi meninjau dan menandatangani profil/SOP di luar repo, mengisi JSON terverifikasi, lalu memeriksa hasil contoh secara manual.
2. Pilih satu dapur pilot, dapatkan izin tertulis, jelaskan hak berhenti dan larangan menghukum individu kepada staf.
3. Sepakati perpindahan perangkat dan peran pencatat di setiap tujuan. Tanpa kesepakatan ini riwayat akan terpecah.
4. Siapkan Android sasaran, iOS jika dipakai, termometer yang diperiksa, daya cadangan, printer/kertas A6 atau 58mm. Uji scan label fisik, mode pesawat, reload dan restore.
5. Siapkan checklist kertas pembanding, tempat cadangan, pseudonim, retensi, dan petugas tindak lanjut. Jalankan dua minggu sesuai FIELD_TEST.md.
6. Tinjau hasil terhadap kriteria lanjut/ubah arah/berhenti. Jangan masuk kontrak atau klaim keamanan sebelum verifikasi ahli dan nilai tambah terukur.

## Risiko kegagalan paling nyata

- Staf tetap mengisi belakangan karena beban kerja: data terlihat rapi tetapi tidak berguna untuk keputusan.
- Catatan terpecah di perangkat pengantar/penerima karena MVP tidak punya sinkronisasi.
- Ambang/model dianggap sebagai jaminan keamanan meskipun belum divalidasi.
- Perangkat hilang atau penyimpanan dibersihkan tanpa cadangan di luar perangkat.
- Peringatan diabaikan karena bunyi dapur, layar, atau tidak ada SOP tindakan yang jelas.

Risiko tersebut tidak diselesaikan oleh cakupan tes tinggi. Pilot dapat menghasilkan keputusan berhenti; itu hasil yang sah.
