<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Syncable;

use App\Traits\Auditable;
use App\Traits\HasLab;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TestOrder extends Model
{
    use Syncable, SoftDeletes;

    use HasFactory, Auditable, HasLab;

    protected $fillable = [
        'order_number',
        'patient_id',
        'test_id',
        'hospital_id',
        'doctor_id',
        'ordered_by',
        'ordered_at',
        'price',
        'amount_paid',
        'discount',
        'payment_status',
        'status',
        'notes',
        'lab_id',
        'sample_type',
        'selected_subtests',
        'discount_type',
    ];

    protected $casts = [
        'ordered_at' => 'datetime',
        'selected_subtests' => 'array',
        'price' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'discount' => 'decimal:2',
    ];

    protected $appends = ['balance'];

    public function getBalanceAttribute()
    {
        return $this->price - $this->amount_paid - $this->discount;
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function test()
    {
        return $this->belongsTo(Test::class);
    }

    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function orderedBy()
    {
        return $this->belongsTo(User::class , 'ordered_by');
    }

    public function result()
    {
        return $this->hasOne(TestResult::class);
    }
}