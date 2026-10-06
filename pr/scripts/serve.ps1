# Simple static file server using .NET HttpListener
param(
    [int]$Port = 8080,
    [string]$Root = $PSScriptRoot + "\.."
)

$RootPath = (Resolve-Path $Root).Path
$Prefix = "http://localhost:$Port/"

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".svg"  = "image/svg+xml"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".ttf"  = "font/ttf"
    ".csv"  = "text/csv; charset=utf-8"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($Prefix)

try {
    $listener.Start()
    Write-Host "ApexFlow Server started at $Prefix"
    Write-Host "Serving files from $RootPath"
} catch {
    Write-Error "Failed to start server on $($Prefix): $_"
    exit 1
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($urlPath)) {
            $urlPath = "index.html"
        }

        # Normalize path
        $urlPath = [System.Uri]::UnescapeDataString($urlPath).Replace('/', '\')
        $filePath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($RootPath, $urlPath))

        # Security check: ensure path is within root
        if (-not $filePath.StartsWith($RootPath, [System.StringComparison]::OrdinalIgnoreCase)) {
            $response.StatusCode = 403
            $bytes = [System.Text.Encoding]::UTF8.GetBytes("Forbidden")
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
            
            $response.ContentType = $contentType
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.AddHeader("Cache-Control", "no-cache")

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $urlPath")
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
