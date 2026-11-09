Add-Type -AssemblyName System.Drawing
$dir = Join-Path $PSScriptRoot '..\public\img\productos'
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
Get-ChildItem $dir -Filter *.jpg | Where-Object Length -gt 280KB | ForEach-Object {
  $q = 80
  do {
    $img = [System.Drawing.Image]::FromFile($_.FullName)
    $bmp = New-Object System.Drawing.Bitmap $img
    $img.Dispose()
    $p = New-Object System.Drawing.Imaging.EncoderParameters 1
    $p.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]$q)
    $tmp = "$($_.FullName).tmp"
    $bmp.Save($tmp, $codec, $p); $bmp.Dispose()
    $size = (Get-Item $tmp).Length
    $q -= 6
  } while ($size -gt 280KB -and $q -ge 50)
  Move-Item $tmp $_.FullName -Force
  "{0}: {1:N0} KB (q={2})" -f $_.Name, ($size / 1KB), ($q + 6)
}
