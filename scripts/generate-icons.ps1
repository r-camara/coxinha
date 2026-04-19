# Generates the Tauri icon set from assets/icon.png.
# Windows-first: produces every asset referenced by tauri.conf.json
# plus a multi-entry isn't needed — a single 256x256 PNG-in-ICO is
# what modern Windows uses, and what Tauri embeds as the Win32
# resource.
param(
    [string]$Source = (Join-Path $PSScriptRoot '..\assets\icon.png'),
    [string]$OutDir = (Join-Path $PSScriptRoot '..\src-tauri\icons')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $Source)) {
    throw "source image not found: $Source"
}
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$src = [System.Drawing.Image]::FromFile((Resolve-Path $Source))
try {
    function Save-Resized([int]$size, [string]$outPath) {
        $bmp = New-Object System.Drawing.Bitmap $size, $size
        try {
            $g = [System.Drawing.Graphics]::FromImage($bmp)
            $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
            $g.CompositingQuality= [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
            $g.Clear([System.Drawing.Color]::Transparent)
            $g.DrawImage($src, 0, 0, $size, $size)
            $g.Dispose()
            $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
        } finally {
            $bmp.Dispose()
        }
        Write-Host "wrote $outPath"
    }

    Save-Resized 32  (Join-Path $OutDir '32x32.png')
    Save-Resized 128 (Join-Path $OutDir '128x128.png')
    Save-Resized 256 (Join-Path $OutDir '128x128@2x.png')
    # Tray icon — referenced by tauri.conf.json app.trayIcon.iconPath
    Save-Resized 128 (Join-Path $OutDir 'icon.png')

    # Build a single-entry 256x256 PNG-in-ICO. Accepted since Vista
    # and by every modern Tauri target.
    $tmpPng = Join-Path $OutDir '_tmp_256.png'
    Save-Resized 256 $tmpPng
    try {
        $pngBytes = [System.IO.File]::ReadAllBytes($tmpPng)
        $ms = New-Object System.IO.MemoryStream
        $bw = New-Object System.IO.BinaryWriter($ms)
        # ICONDIR
        $bw.Write([UInt16]0)      # reserved
        $bw.Write([UInt16]1)      # type = icon
        $bw.Write([UInt16]1)      # image count
        # ICONDIRENTRY
        $bw.Write([Byte]0)        # width 0 == 256
        $bw.Write([Byte]0)        # height 0 == 256
        $bw.Write([Byte]0)        # color count
        $bw.Write([Byte]0)        # reserved
        $bw.Write([UInt16]1)      # planes
        $bw.Write([UInt16]32)     # bpp
        $bw.Write([UInt32]$pngBytes.Length)
        $bw.Write([UInt32]22)     # offset to image data
        $bw.Write($pngBytes)
        $bw.Flush()
        $icoPath = Join-Path $OutDir 'icon.ico'
        [System.IO.File]::WriteAllBytes($icoPath, $ms.ToArray())
        $bw.Dispose()
        $ms.Dispose()
        Write-Host "wrote $icoPath"
    } finally {
        if (Test-Path $tmpPng) { Remove-Item $tmpPng -Force }
    }
} finally {
    $src.Dispose()
}

Write-Host "done."
