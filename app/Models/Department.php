<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Syncable;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Traits\Auditable;

class Department extends Model
{
    use Syncable, SoftDeletes, Auditable;

    use HasFactory;

    protected $fillable = [
        'lab_id',
        'name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function lab()
    {
        return $this->belongsTo(Lab::class);
    }

    public function users()
    {
        return $this->hasMany(User::class, 'department', 'name');
    }
}
