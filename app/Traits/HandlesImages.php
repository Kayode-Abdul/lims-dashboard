<?php

namespace App\Traits;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

trait HandlesImages
{
    /**
     * Convert an image path to Base64 for PDF embedding.
     */
    public function imageToBase64($path)
    {
        if (!$path) return null;

        // Clean path to be relative to the public storage root
        $cleanPath = str_replace(['storage/', '/storage/'], '', $path);
        $cleanPath = ltrim($cleanPath, '/');

        // Attempt 1: Try multiple disks and path combinations
        $disks = ['public_html', 'public'];
        $prefixes = ['', 'app/public/', 'public/'];
        
        foreach ($disks as $disk) {
            if (!config("filesystems.disks.{$disk}")) continue;
            
            foreach ($prefixes as $prefix) {
                $checkPath = $prefix . $cleanPath;
                try {
                    if (Storage::disk($disk)->exists($checkPath)) {
                        $data = $this->getEncodedDataFromDisk($disk, $checkPath);
                        if ($data) return $data;
                    }
                } catch (\Exception $e) {
                    continue;
                }
            }
        }

        // Attempt 2: Direct filesystem paths (multiple variations)
        $potentialPaths = [
            public_path('storage/' . $cleanPath),
            storage_path('app/public/' . $cleanPath),
            storage_path($cleanPath),
            base_path('storage/app/public/' . $cleanPath),
            base_path($cleanPath),
            // Custom live server paths
            '/home/lbvimeolt/labcheck.wandgits.com.ng/storage/app/public/' . $cleanPath,
            '/home/lbvimeolt/labcheck.wandgits.com.ng/storage/' . $cleanPath,
            '/home/lbvimeolt/labcheck.wandgits.com.ng/public_html/storage/' . $cleanPath,
        ];

        foreach ($potentialPaths as $absPath) {
            if (empty($absPath)) continue;
            try {
                if (@file_exists($absPath) && is_readable($absPath)) {
                    $image = @file_get_contents($absPath);
                    if ($image) {
                        return $this->encodeBuffer($image, $absPath);
                    }
                }
            } catch (\Exception $e) {
                continue;
            }
        }

        // Attempt 3: Fetch via URL (Hardened)
        try {
            $url = filter_var($path, FILTER_VALIDATE_URL) ? $path : asset('storage/' . $cleanPath);
            return $this->externalImageToBase64($url);
        } catch (\Exception $e) {
            Log::error("Image Conversion Exhausted all attempts. Path: " . $path);
        }

        return null;
    }

    /**
     * Get encoded data from a specific storage disk.
     */
    private function getEncodedDataFromDisk($disk, $path)
    {
        try {
            $image = Storage::disk($disk)->get($path);
            if (!$image) return null;
            return $this->encodeBuffer($image, $path);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Encode raw image buffer to Base64 Data URI.
     */
    private function encodeBuffer($buffer, $source = '')
    {
        try {
            $finfo = new \finfo(FILEINFO_MIME_TYPE);
            $mimeType = $finfo->buffer($buffer);
            
            // Dompdf doesn't support WebP
            if ($mimeType === 'image/webp') {
                Log::warning("PDF Warning: WebP image detected (not supported by PDF engine): " . $source);
            }
            
            return 'data:' . $mimeType . ';base64,' . base64_encode($buffer);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Fetch external image and convert to Base64.
     */
    public function externalImageToBase64($url)
    {
        try {
            $image = null;
            
            if (ini_get('allow_url_fopen')) {
                $image = @file_get_contents($url);
            }
            
            if (!$image && function_exists('curl_version')) {
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
                curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                curl_setopt($ch, CURLOPT_TIMEOUT, 10);
                $image = curl_exec($ch);
                curl_close($ch);
            }

            if (!$image) return null;
            return $this->encodeBuffer($image, $url);
        } catch (\Exception $e) {
            return null;
        }
    }
}
