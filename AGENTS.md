# Codex Instructions

## Windows PowerShell and UTF-8

This repository contains Korean text in Markdown, environment examples, comments, and filenames. When Codex reads files through Windows PowerShell, Korean text may appear as mojibake even when the file itself is valid UTF-8.

Observed in this repository:

- `Get-Content -Encoding UTF8` can still display broken Korean in tool output.
- `Get-ChildItem` can display Korean filenames and date strings as broken text.
- `[Console]::OutputEncoding.WebName` may be `utf-8`, while `$OutputEncoding.WebName` may still be `us-ascii`.
- `chcp` may report code page `949`.
- PowerShell profile loading may fail because of execution policy and add noisy Korean error output.

Treat this as a PowerShell output/transport encoding problem first, not as proof that the file is corrupted.

Before reading Korean or UTF-8 files with PowerShell, prefer a no-profile shell command and initialize output encoding:

```powershell
chcp 65001 > $null
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
Get-Content -Raw -Encoding UTF8 .\path\to\file.md
```

For Markdown, `.env`, `.env.example`, JSON, JavaScript, TypeScript, SQL, and config files, assume UTF-8 unless the file clearly indicates otherwise.

When editing files:

- Preserve UTF-8 encoding.
- Do not rewrite unrelated files only to normalize encoding.
- Do not treat mojibake seen in terminal output as the actual file contents without checking.
- Be careful not to quote secrets from `.env` files in chat responses.

When possible, use tools or commands that avoid PowerShell text re-encoding problems. If PowerShell output looks broken, retry with UTF-8 initialization before drawing conclusions.
