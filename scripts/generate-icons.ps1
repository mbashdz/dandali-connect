Add-Type -AssemblyName System.Drawing

$sourcePath = "e:\Dandali\public\images\zaure-logo.jpg"
$bmp = [System.Drawing.Bitmap]::FromFile($sourcePath)

# 1. Find exact bounding box of the Emblem (left side of image, X < 420)
$minX = $bmp.Width
$minY = $bmp.Height
$maxX = 0
$maxY = 0

# Background color is roughly RGB(30, 30, 30)
$bgR = 30.0
$bgG = 30.0
$bgB = 30.0

for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt 420; $x++) {
        $c = $bmp.GetPixel($x, $y)
        $diff = [Math]::Max([Math]::Abs($c.R - $bgR), [Math]::Max([Math]::Abs($c.G - $bgG), [Math]::Abs($c.B - $bgB)))
        if ($diff -gt 25) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Detected Emblem Bounding Box: X=$minX..$maxX, Y=$minY..$maxY"

# Add small padding around emblem
$pad = 6
$cropX = [Math]::Max(0, $minX - $pad)
$cropY = [Math]::Max(0, $minY - $pad)
$cropW = ($maxX - $minX + 1) + ($pad * 2)
$cropH = ($maxY - $minY + 1) + ($pad * 2)

# 2. Create transparent emblem PNG by unmixing the #1E1E1E background
$emblemBmp = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($y = 0; $y -lt $cropH; $y++) {
    for ($x = 0; $x -lt $cropW; $x++) {
        $c = $bmp.GetPixel($cropX + $x, $cropY + $y)
        # Calculate how far this pixel is from the dark background (30,30,30)
        # Foreground Red channel is ~232..234, so (R - 30) / (233 - 30) gives exact alpha!
        $dr = [Math]::Max(0.0, ($c.R - $bgR))
        $dg = [Math]::Max(0.0, ($c.G - $bgG))
        $db = [Math]::Max(0.0, ($c.B - $bgB))
        
        $alphaNorm = $dr / 202.0
        if ($alphaNorm -gt 1.0) { $alphaNorm = 1.0 }
        if ($alphaNorm -lt 0.08) {
            $emblemBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            # Un-premultiply color from background
            $outR = [Math]::Min(255, [Math]::Max(0, [int]($bgR + ($c.R - $bgR) / $alphaNorm)))
            $outG = [Math]::Min(255, [Math]::Max(0, [int]($bgG + ($c.G - $bgG) / $alphaNorm)))
            $outB = [Math]::Min(255, [Math]::Max(0, [int]($bgB + ($c.B - $bgB) / $alphaNorm)))
            $outA = [Math]::Min(255, [Math]::Max(0, [int]($alphaNorm * 255.0)))
            $emblemBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($outA, $outR, $outG, $outB))
        }
    }
}

$emblemOutPath = "e:\Dandali\public\images\zaure-emblem.png"
$emblemBmp.Save($emblemOutPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Saved transparent emblem to $emblemOutPath ($cropW x $cropH)"

# 3. Helper function to generate square App Icons with the Emblem centered
function Save-EmblemAppIcon([int]$size, [string]$outPath, [bool]$isRound = $false, [double]$scale = 0.72) {
    $outBmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($outBmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 30, 30, 30))
    if ($isRound) {
        $g.Clear([System.Drawing.Color]::Transparent)
        $g.FillEllipse($bgBrush, 0, 0, $size - 1, $size - 1)
    } else {
        $g.Clear([System.Drawing.Color]::FromArgb(255, 30, 30, 30))
    }

    # Fit emblem within $scale of $size
    $maxDim = $size * $scale
    $ratio = [Math]::Min($maxDim / $cropW, $maxDim / $cropH)
    $drawW = [int]($cropW * $ratio)
    $drawH = [int]($cropH * $ratio)
    $drawX = [int](($size - $drawW) / 2)
    $drawY = [int](($size - $drawH) / 2)

    $g.DrawImage($emblemBmp, $drawX, $drawY, $drawW, $drawH)
    $bgBrush.Dispose()
    $g.Dispose()
    $outBmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $outBmp.Dispose()
}

# Generate Web & PWA Icons
Save-EmblemAppIcon 512 "e:\Dandali\public\images\zaure-icon.png" $false 0.74
Save-EmblemAppIcon 512 "e:\Dandali\public\icon-512.png" $false 0.74
Save-EmblemAppIcon 192 "e:\Dandali\public\icon-192.png" $false 0.74
Save-EmblemAppIcon 64  "e:\Dandali\public\favicon.png" $false 0.80

# Generate Android Mipmap Icons
$mipmaps = @{
    "mipmap-mdpi"    = 48
    "mipmap-hdpi"    = 72
    "mipmap-xhdpi"   = 96
    "mipmap-xxhdpi"  = 144
    "mipmap-xxxhdpi" = 192
}

$fgSizes = @{
    "mipmap-mdpi"    = 108
    "mipmap-hdpi"    = 162
    "mipmap-xhdpi"   = 216
    "mipmap-xxhdpi"  = 324
    "mipmap-xxxhdpi" = 432
}

foreach ($folder in $mipmaps.Keys) {
    $dir = "e:\Dandali\android\app\src\main\res\$folder"
    $sz = $mipmaps[$folder]
    $fgSz = $fgSizes[$folder]
    Save-EmblemAppIcon $sz "$dir\ic_launcher.png" $false 0.72
    Save-EmblemAppIcon $sz "$dir\ic_launcher_round.png" $true 0.68
    Save-EmblemAppIcon $fgSz "$dir\ic_launcher_foreground.png" $false 0.50
}

$emblemBmp.Dispose()
$bmp.Dispose()
Write-Host "All icons generated successfully!"
