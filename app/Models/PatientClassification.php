<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Syncable;

use App\Traits\HasLab;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Traits\Auditable;

class PatientClassification extends Model
{
    use Syncable, SoftDeletes, Auditable;

    use HasFactory, HasLab;

    protected $fillable = [
        'lab_id',
        'name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function patients()
    {
        return $this->hasMany(Patient::class);
    }
}