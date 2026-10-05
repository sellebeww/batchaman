# Berkontribusi

Gunakan Node 22.19+, pnpm sesuai packageManager, dan lockfile. Buat branch kecil; Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`). Jalankan `pnpm format`, `pnpm check`, `pnpm coverage`, `pnpm e2e`, `pnpm budget` sebelum PR. Instal browser melalui `pnpm exec playwright install chromium`.

Perubahan aturan paparan wajib diawali tes gagal, mempertahankan cakupan core >=90% baris/cabang, dan diperiksa terhadap DOMAIN.md. Core tidak mengimpor UI/DOM/Dexie dan menerima now eksplisit. Keputusan nontrivial ditulis di DECISIONS.md; fakta peraturan yang belum ditinjau ahli ditandai BELUM TERVERIFIKASI di OPEN_QUESTIONS.md.

Gunakan data sintetis saja. Jangan lampirkan ekspor dapur nyata, identitas orang, foto, kredensial, atau data insiden. Semua teks UI lewat i18n; jangan menambahkan status kelayakan makanan. Pertahankan banner UNVERIFIED, aksesibilitas 48px, dan fungsi offline. WON'T MVP: server/login/sync/IoT/GPS/AI/telemetri/push.

Untuk bug keamanan, ikuti SECURITY.md. Untuk perubahan ambang produksi, libatkan sanitarian/ahli gizi; PR kode bukan pengesahan ahli.
