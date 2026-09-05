# Getting rendered assets into Google Drive

The Drive connector in Claude Code only sends content pasted inline, so it
handles text and cannot handle a 9 MB video.

## What works: Drive for Desktop through PowerShell

Google Drive for Desktop mounts as `G:` on the Windows side. WSL cannot see it,
because it is a virtual filesystem rather than a real drive, so `/mnt/g` reads
as empty and `ls` finds nothing. Windows can see it, so copy through PowerShell:

```
WIN=$(wslpath -w "$(realpath videos/pw-post-01-best-prompt-gone-1080x1920.mp4)")
powershell.exe -NoProfile -Command \
  "Copy-Item -LiteralPath '$WIN' -Destination 'G:\Mi unidad\buildcadence\PromptWallet' -Force"
```

Verify it reached the cloud, not just the local cache, before calling it done.
Sync takes a few seconds and the folder listing is empty until it finishes.

Target folder: https://drive.google.com/drive/folders/1SToRc7uLcvov_1IdoeLuQwEb5UJfDQnm

## Fallback: rclone

Installed at `~/.local/bin/rclone`. Needs a one-time authorization, which opens
a browser and stores the token locally. Worth doing only if Drive for Desktop is
not running.

```
! ~/.local/bin/rclone config create gdrive drive scope=drive
~/.local/bin/rclone copy videos/<file> gdrive:buildcadence/PromptWallet/ -P
```

## What does not work

- `/mnt/g` and `/mnt/c/Users/alons/Google Drive`. The first is empty, the second
  is a stale Backup and Sync folder last written May 2025 with no `buildcadence`
  in it.
- Base64 through the Drive connector. A 9 MB video is about 12 million
  characters, and a single wrong one yields a corrupt file that still passes a
  size check.
