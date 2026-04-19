# Icons

Put the app icons here:

- `32x32.png` (tray + Windows)
- `128x128.png` (Linux + fallback)
- `128x128@2x.png` (Retina)
- `icon.ico` (Windows installer)
- `icon.icns` (macOS)
- `icon.png` (Linux tray)

Generate them from a single 1024x1024 `coxinha.png`:

```bash
pnpm tauri icon path/to/coxinha.png
```

The command writes all required sizes into `src-tauri/icons/`.
