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
        'is_active',
        'subscription_status',
        'payment_method',
        'expires_at',
        'sync_url',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'expires_at' => 'datetime',
    ];

    protected $appends = ['logo_url', 'header_url', 'footer_url'];

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