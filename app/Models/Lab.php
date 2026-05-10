<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Syncable;

use Illuminate\Database\Eloquent\Model;

use App\Traits\Auditable;

class Lab extends Model
{
    use Syncable, SoftDeletes, Auditable, \App\Traits\HandlesImages;

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
        'pdf_margin_bottom',
        'web_margin_top',
        'web_margin_bottom',
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
        'pdf_margin_bottom' => 'decimal:2',
        'web_margin_top' => 'decimal:2',
        'web_margin_bottom' => 'decimal:2',
    ];

    protected $appends = ['logo_url', 'header_url', 'footer_url', 'header_base64', 'footer_base64'];
    
    public function getHeaderBase64Attribute()
    {
        return $this->imageToBase64($this->header_image_path);
    }

    public function getFooterBase64Attribute()
    {
        return $this->imageToBase64($this->footer_image_path);
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