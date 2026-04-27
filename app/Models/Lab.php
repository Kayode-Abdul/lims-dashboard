<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Syncable;

use Illuminate\Database\Eloquent\Model;

class Lab extends Model
{
    use Syncable, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'email',
        'phone',
        'address',
        'logo_path',
        'header_image_path',
        'footer_image_path',
        'pdf_margin_top',
        'web_margin_top',
        'is_active',
        'subscription_status',
        'payment_method',
        'expires_at',
        'sync_url',
        'currency',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'expires_at' => 'datetime',
        'pdf_margin_top' => 'decimal:2',
        'web_margin_top' => 'decimal:2',
    ];

    protected $appends = ['logo_url', 'header_url', 'footer_url', 'header_base64', 'footer_base64'];
    
    public function getHeaderBase64Attribute()
    {
        if (!$this->header_image_path) return null;
        $path = storage_path('app/public/' . $this->header_image_path);
        if (!file_exists($path)) return null;
        $type = pathinfo($path, PATHINFO_EXTENSION);
        $data = file_get_contents($path);
        return 'data:image/' . $type . ';base64,' . base64_encode($data);
    }

    public function getFooterBase64Attribute()
    {
        if (!$this->footer_image_path) return null;
        $path = storage_path('app/public/' . $this->footer_image_path);
        if (!file_exists($path)) return null;
        $type = pathinfo($path, PATHINFO_EXTENSION);
        $data = file_get_contents($path);
        return 'data:image/' . $type . ';base64,' . base64_encode($data);
    }

    public function getLogoUrlAttribute()
    {
        return $this->logo_path ? asset('storage/' . $this->logo_path) : null;
    }

    public function getHeaderUrlAttribute()
    {
        return $this->header_image_path ? asset('storage/' . $this->header_image_path) : null;
    }

    public function getFooterUrlAttribute()
    {
        return $this->footer_image_path ? asset('storage/' . $this->footer_image_path) : null;
    }

    public function isExpired()
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function users()
    {
        return $this->belongsToMany(User::class)->withPivot('is_active')->withTimestamps();
    }

    public function accessKeys()
    {
        return $this->hasMany(AccessKey::class);
    }
}