<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use App\Traits\Auditable;

class Role extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'lab_id',
        'name',
        'permissions',
    ];

    protected $casts = [
        'permissions' => 'array',
    ];

    public function lab(): BelongsTo
    {
        return $this->belongsTo(Laboratory::class, 'lab_id');
    }
}
