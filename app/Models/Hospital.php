<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Syncable;

use App\Traits\HasLab;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Hospital extends Model
{
    use Syncable, SoftDeletes;

    use HasFactory, HasLab;

    protected $fillable = [
        'lab_id',
        'name',
        'address',
        'email',
        'phone',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function doctors()
    {
        return $this->hasMany(Doctor::class);
    }

    public function patients()
    {
        return $this->hasMany(Patient::class);
    }
}