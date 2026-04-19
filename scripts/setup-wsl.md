# Dev setup on Windows 11 + WSL2

## Windows side

1. **WSL2 Ubuntu** (if not installed):
   ```powershell
   wsl --install -d Ubuntu
   ```

2. **`.wslconfig` at `C:\Users\<you>\.wslconfig`**:
   ```ini
   [wsl2]
   networkingMode=mirrored
   dnsTunneling=true
   firewall=false
   autoProxy=true
   memory=12GB
   ```

   Restart WSL: `wsl --shutdown` in PowerShell.

3. **Docker Desktop** with "Use the WSL2 based engine" and the Ubuntu
   integration enabled (Settings → Resources → WSL Integration).

4. **WebView2 runtime** ships with Windows 11 by default. If missing:
   https://developer.microsoft.com/microsoft-edge/webview2/

5. (Optional) **CUDA Toolkit 12.6** for GPU builds on Windows:
   https://developer.nvidia.com/cuda-toolkit

## WSL side

```bash
# System packages
sudo apt update && sudo apt install -y \
  build-essential curl file pkg-config libssl-dev \
  libgtk-3-dev libwebkit2gtk-4.1-dev \
  libappindicator3-dev librsvg2-dev patchelf

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"

# Node + pnpm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g pnpm

# Clone the project
mkdir -p ~/projects
cd ~/projects
git clone <your-repo> coxinha
cd coxinha

# Dependencies
pnpm install

# Models
./scripts/download-models.sh
```

## Running

**Dev through WSL (Linux GUI via WSLg):**
```bash
cd ~/projects/coxinha
pnpm tauri dev
```

**Windows native build** (must run on Windows, not inside WSL):
```powershell
cd C:\Users\<you>\projects\coxinha
pnpm install
pnpm tauri build
```

Or let GitHub Actions (`release.yml`) build it when you push a tag.

## Tips

- The project **must** live under `/home/<you>/` in WSL, never in
  `/mnt/c/`. I/O performance drops about 10x on `/mnt/c/`.
- VS Code with the "Remote - WSL" extension opens the project
  natively inside WSL: `code ~/projects/coxinha`
- `cargo-watch` for backend hot-reload during dev:
  ```bash
  cargo install cargo-watch
  ```
