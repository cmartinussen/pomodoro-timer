Add-Type -AssemblyName System.Drawing

function New-TomatoIcon {
    param(
        [int]$Size,
        [string]$OutputPath
    )

    $bitmap = New-Object System.Drawing.Bitmap $Size, $Size
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

    try {
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $graphics.Clear([System.Drawing.Color]::Transparent)

        $bodyRect = New-Object System.Drawing.RectangleF ($Size * 0.125), ($Size * 0.19), ($Size * 0.75), ($Size * 0.75)
        $bodyBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
            [System.Drawing.PointF]::new($bodyRect.Left, $bodyRect.Top),
            [System.Drawing.PointF]::new($bodyRect.Right, $bodyRect.Bottom),
            [System.Drawing.ColorTranslator]::FromHtml('#ff5a45'),
            [System.Drawing.ColorTranslator]::FromHtml('#c92a1c')
        )
        $outlinePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(120, 159, 31, 22), ($Size * 0.035))

        $leafColorLight = [System.Drawing.ColorTranslator]::FromHtml('#2fbf65')
        $leafColorDark = [System.Drawing.ColorTranslator]::FromHtml('#167a42')
        $leafBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
            [System.Drawing.PointF]::new($Size * 0.25, $Size * 0.08),
            [System.Drawing.PointF]::new($Size * 0.75, $Size * 0.33),
            $leafColorLight,
            $leafColorDark
        )
        $leafPoints = [System.Drawing.PointF[]]@(
            [System.Drawing.PointF]::new($Size * 0.31, $Size * 0.33),
            [System.Drawing.PointF]::new($Size * 0.42, $Size * 0.27),
            [System.Drawing.PointF]::new($Size * 0.48, $Size * 0.12),
            [System.Drawing.PointF]::new($Size * 0.52, $Size * 0.12),
            [System.Drawing.PointF]::new($Size * 0.58, $Size * 0.27),
            [System.Drawing.PointF]::new($Size * 0.69, $Size * 0.33),
            [System.Drawing.PointF]::new($Size * 0.75, $Size * 0.19),
            [System.Drawing.PointF]::new($Size * 0.78, $Size * 0.19),
            [System.Drawing.PointF]::new($Size * 0.72, $Size * 0.40),
            [System.Drawing.PointF]::new($Size * 0.50, $Size * 0.44),
            [System.Drawing.PointF]::new($Size * 0.28, $Size * 0.40),
            [System.Drawing.PointF]::new($Size * 0.22, $Size * 0.19),
            [System.Drawing.PointF]::new($Size * 0.25, $Size * 0.19)
        )
        $stemPen = New-Object System.Drawing.Pen ($leafColorDark, ($Size * 0.05))
        $highlightBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(56, 255, 255, 255))

        try {
            $graphics.FillEllipse($bodyBrush, $bodyRect)
            $graphics.DrawEllipse($outlinePen, $bodyRect)
            $graphics.FillPolygon($leafBrush, $leafPoints)
            $graphics.DrawArc($stemPen, $Size * 0.45, $Size * 0.12, $Size * 0.18, $Size * 0.12, 210, 120)
            $graphics.FillEllipse($highlightBrush, $Size * 0.26, $Size * 0.34, $Size * 0.22, $Size * 0.14)
            $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        } finally {
            $bodyBrush.Dispose()
            $outlinePen.Dispose()
            $leafBrush.Dispose()
            $stemPen.Dispose()
            $highlightBrush.Dispose()
        }
    } finally {
        $graphics.Dispose()
        $bitmap.Dispose()
    }
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
New-TomatoIcon -Size 192 -OutputPath (Join-Path $root 'icon-192-v2.png')
New-TomatoIcon -Size 512 -OutputPath (Join-Path $root 'icon-512-v2.png')