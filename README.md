# wyn-skills 🚀

**wyn-skills** adalah alat bantu (CLI tool) berbasis Node.js yang dirancang untuk memudahkan instalasi dan pengelolaan AI skills/prompts khusus ke berbagai AI coding assistant dan editor pilihan Anda (seperti Antigravity, Cursor, Codex, dll.).

---

## 📋 Fitur Utama
- **Multi-Target Support**: Menginstal langsung ke direktori konfigurasi editor/assistant Anda secara otomatis.
- **Smart Update**: Melakukan pengecekan versi (`versioning`) agar tidak menginstal ulang jika skill sudah berada di versi terbaru.
- **Compatibility Check**: Memastikan skill hanya diinstal pada target editor yang kompatibel sesuai dengan metadata masing-masing skill.
- **Selective Installation**: Fleksibilitas untuk menginstal semua skill sekaligus atau memilih skill spesifik yang diinginkan.

---

## 🎯 Target Editor yang Didukung

| Parameter | Target Editor | Jalur Instalasi (Path) |
| :--- | :--- | :--- |
| `--antigravity` | Antigravity | `~/.gemini/antigravity/skills` |
| `--antigravity-cli` | Antigravity CLI | `~/.gemini/antigravity-cli/skills` |
| `--cursor` | Cursor | `~/.cursor/skills` |
| `--codex` | Codex | `~/.codex/skills` |
| `--gemini` | Gemini | `~/.gemini/skills` |

---

## 🚀 Cara Penggunaan

Anda dapat langsung menjalankan installer ini menggunakan `npx` tanpa harus memasangnya secara global.

### 1. Menginstal Semua Skill ke Target Tertentu
Gunakan parameter target untuk memasang seluruh skill yang kompatibel dengan target tersebut:

```bash
# Menginstal ke Cursor
npx wyn-skills --cursor

# Menginstal ke Antigravity CLI
npx wyn-skills --antigravity-cli
```

### 2. Menginstal Skill Spesifik ke Target Tertentu
Jika Anda hanya ingin memasang skill tertentu saja, tambahkan nama skill sebagai parameter tambahan setelah target:

```bash
# Hanya menginstal skill java-spring-boot ke Cursor
npx wyn-skills --cursor --java-spring-boot
```

---

## 🌟 Skill yang Tersedia

Berikut adalah skill yang sudah tersedia di repositori ini:

- **java-spring-boot**: Spring Boot backend expert.
- **skill-creator**: Agent skill untuk membantu AI assistant membuat skill baru sesuai dengan spesifikasi AgentSkills.

---

## 🛠️ Menambahkan Skill Baru

Semua skill diletakkan di dalam direktori `skills/`. Untuk menambahkan skill baru, ikuti struktur berikut:

```text
skills/
└── nama-skill-baru/
    ├── metadata.json
    └── [file-file skill lainnya...]
```

### Contoh `metadata.json`
Setiap skill **wajib** memiliki berkas `metadata.json` yang mendefinisikan informasi dasar dan target yang kompatibel:

```json
{
  "name": "nama-skill-baru",
  "version": "1.0.0",
  "description": "Deskripsi singkat mengenai keahlian AI ini",
  "compatibleTargets": [
    "antigravity",
    "antigravity-cli",
    "cursor"
  ]
}
```

---

## 📝 Lisensi
Proyek ini dilisensikan di bawah lisensi [MIT](LICENSE).
