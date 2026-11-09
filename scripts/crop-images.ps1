# Recorta las fotos originales (sin alterar color ni forma) a formato 4:5
# y extrae el logo circular con fondo transparente.
# Uso: powershell -ExecutionPolicy Bypass -File scripts/crop-images.ps1
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$src  = Join-Path $root 'originales'   # fotos originales sin editar
$out  = Join-Path $root 'public\img\productos'
New-Item -ItemType Directory -Force $out | Out-Null

$jpeg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
$ep = New-Object System.Drawing.Imaging.EncoderParameters 1
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 88L

function Crop($file, $name, $x, $y, $w, $h) {
  $img = [System.Drawing.Image]::FromFile((Join-Path $src $file))
  $s = $img.Width / 1200.0   # coordenadas definidas sobre 1200 px de ancho
  $rect = New-Object System.Drawing.Rectangle ([int]($x*$s)), ([int]($y*$s)), ([int]($w*$s)), ([int]($h*$s))
  $bmp = New-Object System.Drawing.Bitmap 960, 1200
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.DrawImage($img, (New-Object System.Drawing.Rectangle 0,0,960,1200), $rect, 'Pixel')
  $bmp.Save((Join-Path $out "$name.jpg"), $jpeg, $ep)
  $g.Dispose(); $bmp.Dispose(); $img.Dispose()
  Write-Host "ok $name"
}

Crop 'WhatsApp Image 2026-11-02 at 7.59.23 PM (4).jpeg' 'manilla-balines-cordon'  80    0 1040 1300
Crop 'WhatsApp Image 2026-11-02 at 7.59.22 PM (1).jpeg' 'manilla-balines-medalla' 160  150 1040 1300
Crop 'WhatsApp Image 2026-11-02 at 7.59.22 PM (2).jpeg' 'dije-piedras-colores'    225  290  760  950
Crop 'WhatsApp Image 2026-11-02 at 7.59.22 PM.jpeg'     'aretes-dijes'            310  400  640  800
Crop 'WhatsApp Image 2026-11-02 at 7.59.23 PM.jpeg'     'duo-cadena-topos'        100  300 1000 1250
Crop 'WhatsApp Image 2026-11-02 at 7.59.23 PM (1).jpeg' 'cadena-caballero'          0   50 1200 1500
Crop 'WhatsApp Image 2026-11-02 at 7.59.23 PM (2).jpeg' 'cadena-trebol'            80  200 1040 1300
Crop 'WhatsApp Image 2026-11-02 at 7.59.23 PM (3).jpeg' 'cadena-medalla'          160  100  960 1200

# Logo: círculo de la captura de Instagram, sin redibujar ni deformar.
$img = [System.Drawing.Image]::FromFile((Join-Path $src 'WhatsApp Image 2026-11-02 at 8.04.35 PM.jpeg'))
$s = $img.Width / 736.0
$cx = 368*$s; $cy = 724*$s; $r = 229*$s   # radio ajustado al aro dorado para excluir el botón de edición de Instagram
$size = 600
$bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'; $g.InterpolationMode = 'HighQualityBicubic'
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse(0, 0, $size, $size)
$g.SetClip($path)
$srcRect = New-Object System.Drawing.RectangleF ([float]($cx-$r)), ([float]($cy-$r)), ([float](2*$r)), ([float](2*$r))
$g.DrawImage($img, (New-Object System.Drawing.RectangleF 0,0,$size,$size), $srcRect, 'Pixel')
$bmp.Save((Join-Path $root 'public\img\logo.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose(); $img.Dispose()
Write-Host "ok logo ($($img.Width) px)"
