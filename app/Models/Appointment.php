<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Syncable;

use Illuminate\Database\Eloquent\Model;
use App\Models\Patient;
use App\Models\Test;
use App\Traits\HasLab; // Added this line
use Illuminate\Database\Eloquent\Factories\HasFactory; // Added this line for HasFactory

class Appointment extends Model
{
    use Syncable, SoftDeletes;

    use HasFactory, HasLab; // Modified this line
    protected $fillable = [
        'patient_id',
        'test_id',
        'appointment_type',
        'doctor_name',
        'department',
        'scheduled_at',
        'duration',
        'status',
        'notes',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'duration' => 'integer',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function test()
    {
        return $this->belongsTo(Test::class);
    }
}
