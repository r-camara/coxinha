# UI Audit Screenshots

Captured by `pnpm screenshots` on 2026-04-21T03:23:03.773Z.
Base URL: http://localhost:1420
Viewports: 1440x900, 1024x768, 1920x1080
Routes: /, /notes, /agenda, /meetings, /settings

## Shots

| File | Route | Viewport | Notes |
|---|---|---|---|
| home-1440x900.png | / | 1440x900 |  |
| notes-1440x900.png | /notes | 1440x900 |  |
| agenda-1440x900.png | /agenda | 1440x900 |  |
| meetings-1440x900.png | /meetings | 1440x900 |  |
| settings-1440x900.png | /settings | 1440x900 |  |
| home-1024x768.png | / | 1024x768 |  |
| notes-1024x768.png | /notes | 1024x768 |  |
| agenda-1024x768.png | /agenda | 1024x768 |  |
| meetings-1024x768.png | /meetings | 1024x768 |  |
| settings-1024x768.png | /settings | 1024x768 |  |
| home-1920x1080.png | / | 1920x1080 |  |
| notes-1920x1080.png | /notes | 1920x1080 |  |
| agenda-1920x1080.png | /agenda | 1920x1080 |  |
| meetings-1920x1080.png | /meetings | 1920x1080 |  |
| settings-1920x1080.png | /settings | 1920x1080 |  |

## Console errors per viewport

### 1440x900
- Total error-level messages: 30
- Distinct: 2
- `TypeError: Cannot read properties of undefined (reading 'invoke')`
- `TypeError: Cannot read properties of undefined (reading 'transformCallback')`

### 1024x768
- Total error-level messages: 30
- Distinct: 2
- `TypeError: Cannot read properties of undefined (reading 'invoke')`
- `TypeError: Cannot read properties of undefined (reading 'transformCallback')`

### 1920x1080
- Total error-level messages: 30
- Distinct: 2
- `TypeError: Cannot read properties of undefined (reading 'invoke')`
- `TypeError: Cannot read properties of undefined (reading 'transformCallback')`

> Running in plain-browser mode means `window.__TAURI__` is missing,
> so data-bound views render error/empty states. Chrome/tokens/
> typography remain accurate for review.