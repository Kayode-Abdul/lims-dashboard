<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Syncable;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Support\Str;

use App\Traits\HasLab;

class Patient extends Model
{
    use Syncable, SoftDeletes;

    use HasFactory, Auditable, HasLab;

    protected static function booted()
    {
        static::creating(function ($patient) {
            if (!$patient->patient_id) {
                // Generate PAT-XXXX format (auto-incrementing)
                $lastPatient = static::withoutGlobalScopes()->where('patient_id', 'LIKE', 'PAT-%')
                    ->orderByRaw('CAST(SUBSTRING(patient_id, 5) AS UNSIGNED) DESC')
                    ->first();

                $sequence = $lastPatient
                    ? intval(substr($lastPatient->patient_id, 4)) + 1
                    : 1;

                $id = 'PAT-' . str_pad($sequence, 4, '0', STR_PAD_LEFT);

                while (static::withoutGlobalScopes()->where('patient_id', $id)->exists()) {
                    $sequence++;
                    $id = 'PAT-' . str_pad($sequence, 4, '0', STR_PAD_LEFT);
                }

                $patient->patient_id = $id;
            }

        });
    }


    protected $fillable = [
        'patient_type',
        'patient_id',
        'title',
        'first_name',
        'last_name',
        'other_names',
        'email',
        'phone',
        'date_of_birth',
        'sex',
        'address',
        'city',
        'state',
        'nationality',
        'blood_group',
        'genotype',
        'occupation',
        'marital_status',
        'next_of_kin',
        'next_of_kin_phone',
        'height',
        'weight',
        'bmi',
        'hospital_id',
        'doctor_id',
        'hmo_id',
        'hmo_type',
        'patient_classification_id',
        'age_group',
        'age_weeks',
        'age_days',
        'is_active',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'is_active' => 'boolean',
        'height' => 'decimal:2',
        'weight' => 'decimal:2',
        'bmi' => 'decimal:2',
    ];

    public function testOrders()
    {
        return $this->hasMany(TestOrder::class);
    }

    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function hmo()
    {
        return $this->belongsTo(Hmo::class);
    }

    public function classification()
    {
        return $this->belongsTo(PatientClassification::class , 'patient_classification_id');
    }
}