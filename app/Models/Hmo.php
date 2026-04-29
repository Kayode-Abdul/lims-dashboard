<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Syncable;

use App\Traits\HasLab;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Traits\Auditable;

class Hmo extends Model
{
    use Syncable, SoftDeletes, Auditable;

    use HasFactory, HasLab;

    protected $fillable = [
        'lab_id',
        'name',
        'type',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function patients()
    {
        return $this->hasMany(Patient::class);
    }

    public function testPrices()
    {
        return $this->hasMany(TestHmoPrice::class);
    }
}