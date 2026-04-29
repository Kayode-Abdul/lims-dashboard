<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\Auditable;

class AccessKey extends Model
{
    use Auditable;

    protected $fillable = [
        'key',
        'lab_id',
        'duration_days',
        'is_activated',
        'activated_at',
        'expires_at',
        'created_by',
    ];

    protected $casts = [
        'is_activated' => 'boolean',
        'activated_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function lab()
    {
        return $this->belongsTo(Lab::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
