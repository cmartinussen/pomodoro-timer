Add-Type -AssemblyName System.Drawing

function New-TomatoBitmap {
    param(
        [int]$Size
    )

    $bitmap = New-Object System.Drawing.Bitmap $Size, $Size
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

    try {
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $graphics.Clear([System.Drawing.Color]::Transparent)

        # Slightly scale up artwork so the icon occupies more of the canvas in taskbars.
        $iconScale = 1.08
        $graphics.TranslateTransform($Size / 2.0, $Size / 2.0)
        $graphics.ScaleTransform($iconScale, $iconScale)
        $graphics.TranslateTransform(-($Size / 2.0), -($Size / 2.0))

        $bodyRect = New-Object System.Drawing.RectangleF ($Size * 0.07), ($Size * 0.15), ($Size * 0.86), ($Size * 0.80)
        $bodyBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
            [System.Drawing.PointF]::new($bodyRect.Left, $bodyRect.Top),
            [System.Drawing.PointF]::new($bodyRect.Right, $bodyRect.Bottom),
            [System.Drawing.ColorTranslator]::FromHtml('#ff5a45'),
            [System.Drawing.ColorTranslator]::FromHtml('#c92a1c')
        )
        $outlinePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(120, 159, 31, 22), ($Size * 0.03))

        $leafColorLight = [System.Drawing.ColorTranslator]::FromHtml('#2fbf65')
        $leafColorDark = [System.Drawing.ColorTranslator]::FromHtml('#167a42')
        $leafBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
            [System.Drawing.PointF]::new($Size * 0.19, $Size * 0.03),
            [System.Drawing.PointF]::new($Size * 0.81, $Size * 0.30),
            $leafColorLight,
            $leafColorDark
        )
        $leafPoints = [System.Drawing.PointF[]]@(
            [System.Drawing.PointF]::new($Size * 0.24, $Size * 0.30),
            [System.Drawing.PointF]::new($Size * 0.38, $Size * 0.24),
            [System.Drawing.PointF]::new($Size * 0.46, $Size * 0.05),
            [System.Drawing.PointF]::new($Size * 0.54, $Size * 0.05),
            [System.Drawing.PointF]::new($Size * 0.62, $Size * 0.24),
            [System.Drawing.PointF]::new($Size * 0.76, $Size * 0.30),
            [System.Drawing.PointF]::new($Size * 0.83, $Size * 0.10),
            [System.Drawing.PointF]::new($Size * 0.87, $Size * 0.10),
            [System.Drawing.PointF]::new($Size * 0.79, $Size * 0.39),
            [System.Drawing.PointF]::new($Size * 0.50, $Size * 0.45),
            [System.Drawing.PointF]::new($Size * 0.21, $Size * 0.39),
            [System.Drawing.PointF]::new($Size * 0.13, $Size * 0.10),
            [System.Drawing.PointF]::new($Size * 0.17, $Size * 0.10)
        )
        $stemPen = New-Object System.Drawing.Pen ($leafColorDark, ($Size * 0.042))
        $highlightBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(56, 255, 255, 255))

        try {
            $graphics.FillEllipse($bodyBrush, $bodyRect)
            $graphics.DrawEllipse($outlinePen, $bodyRect)
            $graphics.FillPolygon($leafBrush, $leafPoints)
            $graphics.DrawArc($stemPen, $Size * 0.43, $Size * 0.07, $Size * 0.14, $Size * 0.11, 205, 130)
            $graphics.FillEllipse($highlightBrush, $Size * 0.18, $Size * 0.32, $Size * 0.27, $Size * 0.15)

            return $bitmap
        } finally {
            $bodyBrush.Dispose()
            $outlinePen.Dispose()
            $leafBrush.Dispose()
            $stemPen.Dispose()
            $highlightBrush.Dispose()
        }
    } finally {
        $graphics.Dispose()
    }
}

function New-TomatoIcon {
    param(
        [int]$Size,
        [string]$OutputPath
    )

    $bitmap = New-TomatoBitmap -Size $Size

    try {
        $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
        $bitmap.Dispose()
    }
}

function New-TomatoPngBytes {
    param(
        [int]$Size
    )

    $bitmap = New-TomatoBitmap -Size $Size
    $memoryStream = New-Object System.IO.MemoryStream

    try {
        $bitmap.Save($memoryStream, [System.Drawing.Imaging.ImageFormat]::Png)
        return $memoryStream.ToArray()
    } finally {
        $memoryStream.Dispose()
        $bitmap.Dispose()
    }
}

function New-IcoFromPngs {
    param(
        [object[]]$Images,
        [string]$IcoPath
    )

    $bitCount = 32
    $headerSize = 6
    $directoryEntrySize = 16
    $imageOffset = $headerSize + ($directoryEntrySize * $Images.Count)

    $stream = [System.IO.File]::Open($IcoPath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write)
    $writer = New-Object System.IO.BinaryWriter $stream

    try {
        $writer.Write([UInt16]0)
        $writer.Write([UInt16]1)
        $writer.Write([UInt16]$Images.Count)

        foreach ($image in $Images) {
            $entryWidth = if ($image.Size -ge 256) { 0 } else { [byte]$image.Size }
            $entryHeight = if ($image.Size -ge 256) { 0 } else { [byte]$image.Size }
            $entryBytes = [byte[]]$image.Bytes

            $writer.Write([byte]$entryWidth)
            $writer.Write([byte]$entryHeight)
            $writer.Write([byte]0)
            $writer.Write([byte]0)
            $writer.Write([UInt16]1)
            $writer.Write([UInt16]$bitCount)
            $writer.Write([UInt32]$entryBytes.Length)
            $writer.Write([UInt32]$imageOffset)

            $imageOffset += $entryBytes.Length
        }

        foreach ($image in $Images) {
            $writer.Write([byte[]]$image.Bytes)
        }
    } finally {
        $writer.Dispose()
        $stream.Dispose()
    }
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
New-TomatoIcon -Size 192 -OutputPath (Join-Path $root 'icon-192-v2.png')
New-TomatoIcon -Size 512 -OutputPath (Join-Path $root 'icon-512-v2.png')
$icoImages = @(16, 24, 32, 48, 64, 128, 256 | ForEach-Object {
    [pscustomobject]@{
        Size = $_
        Bytes = New-TomatoPngBytes -Size $_
    }
})
New-IcoFromPngs -Images $icoImages -IcoPath (Join-Path $root 'favicon-v2.ico')