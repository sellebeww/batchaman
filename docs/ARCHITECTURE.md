# Arsitektur

Domain murni di packages/core. Tidak mengimpor React, DOM, Dexie, atau membaca jam sistem. Waktu selalu argumen. Web mengatur jam, persistensi, getaran, audio dan unduhan. Simulator membangun data sintetis menggunakan domain yang sama.

## Dependensi dan alasan

- React + Vite + TypeScript strict: komponen, bundling lokal, pemeriksaan tipe.
- Tailwind: utilitas CSS saat build; tanpa layanan runtime.
- Dexie: transaksi IndexedDB atomik, antrean penulisan lintas tab; tidak memakai cloud.
- Zod: validasi batas impor dan input domain; schema strict menolak properti tak dikenal.
- @noble/hashes: SHA-256 sinkron portable tanpa DOM, Node crypto, atau await di transaksi IndexedDB. Hash bukan tanda tangan.
- qrcode: label QR lokal. @zxing/browser: fallback kamera, lazy loaded dan diprecache; input manual selalu ada.
- vite-plugin-pwa / Workbox: precache, navigasi offline; update menunggu reload agar form tidak hilang.
- Vitest, fast-check, Testing Library, fake-indexeddb: unit/property/komponen/storage.
- Playwright + axe: alur browser, offline, aksesibilitas.
- ESLint, Prettier, husky: pemeriksaan konsistensi ringan. tsx: skrip pilot TypeScript.

## Batas kepercayaan

JSON impor tidak dipercaya: ukuran dibatasi, schema divalidasi, foreign key dan hash diverifikasi sebelum transaksi penggantian. Pemulihan mengganti database lokal setelah konfirmasi eksplisit. File cadangan tidak terenkripsi. Semua ekspor membawa peringatan privasi dan status ambang. CSV melindungi sel dari formula spreadsheet.

Rantai log adalah satu urutan global per database, transaksi read-write mencegah dua tab memakai kepala rantai yang sama. Payload lengkap batch/kitchen/threshold ikut dirantai. Metrik tidak menjadi bukti integritas. Tanpa anchor eksternal, penghapusan ekor atau penulisan ulang seluruh rantai tidak bisa dideteksi; kepala dan jumlah di backup hanya mendeteksi kerusakan tak disengaja.

Antarmuka SyncAdapter dan SensorAdapter hanya tipe untuk masa depan. Tidak ada implementasi atau network call. Hosting hanya mengirim aset statis dari origin yang sama.
