Add-Type -AssemblyName System.Drawing

$srcPath = "e:\Dandali\public\images\zaure-logo.jpg"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found: $srcPath"
    exit 1
}

$srcBmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$origW = $srcBmp.Width
$origH = $srcBmp.Height
Write-Host "Original image dimensions: $origW x $origH"

# The logo has the 'Z' monogram on the left (approx from x: 0.05*W to 0.4*W, and y: 0.15*H to 0.85*H)
# or we can create an app launcher icon with the Z monogram centered with appropriate padding,
# and also full logo banner.

# Let's crop the 'Z' monogram for square app icons:
# Based on typical logo composition:
# The monogram is on the left half:
$cropSize = [Math]::Min($origH, [int]($origW * 0.45))
$cropX = [int]($origW * 0.03)
$cropY = [int](($origH - $cropSize) / 2)

Write-Host "Cropping Z monogram: X=$cropX, Y=$cropY, Size=$cropSize"

$cropRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropSize, $cropSize)
$zBmp = New-Object System.Drawing.Bitmap($cropSize, $cropSize)
$gCrop = [System.Drawing.Graphics]::FromImage($zBmp)
$gCrop.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gCrop.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gCrop.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gCrop.DrawImage($srcBmp, 0, 0, $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
$gCrop.Dispose()

# Save the cropped Z emblem to public/images/zaure-icon.png
$zBmp.Save("e:\Dandali\public\images\zaure-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Function to resize and save square launcher icon
function Save-Icon($bmp, $size, $outPath, $isRound = $false) {
    $parent = Split-Path -Parent $outPath
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Force -Path $parent | Out-Null
    }

    $dest = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Dark background matching logo background #1A1A1A
    $bgColor = [System.Drawing.ColorTranslator]::FromHtml("#1A1A1A")
    $bgBrush = New-Object System.Drawing.SolidBrush($bgColor)
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)

    if ($isRound) {
        # Clip to circle
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $path.AddEllipse(0, 0, $size, $size)
        $g.SetClip($path)
        $g.FillEllipse($bgBrush, 0, 0, $size, $size)
    }

    # Draw centered with a little padding (e.g. 10% on each side)
    $pad = [int]($size * 0.1)
    $drawSize = $size - (2 * $pad)
    $g.DrawImage($bmp, $pad, $pad, $drawSize, $drawSize)

    $g.Dispose()
    $dest.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
    Write-Host "Saved: $outPath ($size x $size)"
}

# Android mipmap sizes:
# mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192
$sizes = @{
    "android\app\src\main\res\mipmap-mdpi" = 48
    "android\app\src\main\res\mipmap-hdpi" = 72
    "android\app\src\main\res\mipmap-xhdpi" = 96
    "android\app\src\main\res\mipmap-xxhdpi" = 144
    "android\app\src\main\res\mipmap-xxxhdpi" = 192
}

foreach ($entry in $sizes.GetEnumerator()) {
    $dir = $entry.Key
    $sz = $entry.Value
    Save-Icon $zBmp $sz "e:\Dandali\$dir\ic_launcher.png" $false
    Save-Icon $zBmp $sz "e:\Dandali\$dir\ic_launcher_round.png" $true
    Save-Icon $zBmp $sz "e:\Dandali\$dir\ic_launcher_foreground.png" $false
}

# Also save web icons:
Save-Icon $zBmp 192 "e:\Dandali\public\icon-192.png" $false
Save-Icon $zBmp 512 "e:\Dandali\public\icon-512.png" $false
Save-Icon $zBmp 64 "e:\Dandali\public\favicon.png" $false

$zBmp.Dispose()
$srcBmp.Dispose()

Write-Host "All icons generated successfully!"
