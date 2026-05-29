# wyn-skills

`wyn-skills` adalah CLI berbasis Node.js untuk memasang kumpulan AI skills ke direktori konfigurasi AI coding assistant/editor.

Installer membaca semua skill dari folder `skills/`, mengecek metadata masing-masing skill, lalu menyalin skill yang kompatibel ke target yang dipilih.

## Fitur

- Instal skill ke beberapa target: Antigravity, Antigravity CLI, Codex, Cursor, dan Gemini.
- Instal semua skill yang kompatibel, atau pilih skill tertentu dengan flag.
- Cek kompatibilitas target berdasarkan `metadata.json`.
- Cek versi terpasang lewat `.installed.json` agar skill versi sama tidak disalin ulang.

## Instalasi dan Penggunaan

Jalankan langsung dengan `npx`:

```bash
npx wyn-skills --codex
```

Format umum:

```bash
npx wyn-skills --<target> [--<skill-name> ...]
```

Contoh memasang semua skill yang kompatibel ke Codex:

```bash
npx wyn-skills --codex
```

Contoh memasang skill tertentu:

```bash
npx wyn-skills --codex --unit-testing
npx wyn-skills --antigravity-cli --code-style --integration-testing
```

## Target yang Didukung

| Flag | Target | Direktori Instalasi |
| :--- | :--- | :--- |
| `--antigravity` | Antigravity | `~/.gemini/antigravity/skills` |
| `--antigravity-cli` | Antigravity CLI | `~/.gemini/antigravity-cli/skills` |
| `--codex` | Codex | `~/.codex/skills` |
| `--cursor` | Cursor | `~/.cursor/skills` |
| `--gemini` | Gemini | `~/.gemini/skills` |

Catatan: installer mengenali semua target di atas, tetapi skill hanya akan dipasang jika `compatibleTargets` di metadata skill memuat target tersebut.

## Skill yang Tersedia

| Skill | Deskripsi | Target Kompatibel |
| :--- | :--- | :--- |
| `code-style` | Panduan code style Java untuk project Spring Boot dengan Lombok. | `antigravity`, `antigravity-cli`, `codex` |
| `integration-testing` | Pola integration testing Spring Boot dengan Testcontainers, WireMock, MockMvc, dan Awaitility. | `antigravity`, `antigravity-cli`, `codex` |
| `skill-creator` | Instruksi untuk membuat agent skill baru sesuai struktur project ini. | `antigravity`, `antigravity-cli`, `codex` |
| `unit-testing` | Panduan unit testing Spring Boot dengan JUnit 5 dan Mockito menggunakan Detroit Style TDD. | `antigravity`, `antigravity-cli`, `codex` |

Nama skill pada CLI mengikuti nama folder di dalam `skills/`.

## Struktur Project

```text
wyn-skills/
|-- bin/
|   `-- install.js
|-- skills/
|   |-- code-style/
|   |   |-- SKILL.md
|   |   `-- metadata.json
|   |-- integration-testing/
|   |   |-- SKILL.md
|   |   `-- metadata.json
|   |-- skill-creator/
|   |   |-- SKILL.md
|   |   `-- metadata.json
|   `-- unit-testing/
|       |-- SKILL.md
|       `-- metadata.json
|-- package.json
`-- README.md
```

## Menambahkan Skill Baru

Tambahkan folder baru di dalam `skills/`:

```text
skills/
`-- nama-skill-baru/
    |-- SKILL.md
    `-- metadata.json
```

`SKILL.md` harus diawali YAML frontmatter:

```markdown
---
name: nama-skill-baru
description: Deskripsi singkat skill
---
```

`metadata.json` wajib berisi informasi skill dan target yang kompatibel:

```json
{
  "name": "nama-skill-baru",
  "version": "1.0.0",
  "description": "Deskripsi singkat skill",
  "compatibleTargets": [
    "antigravity",
    "antigravity-cli",
    "codex"
  ]
}
```

## Lisensi

MIT
