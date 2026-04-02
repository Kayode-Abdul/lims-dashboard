<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Syncable;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasLab;
use App\Traits\Auditable;

class TestResult extends Model
{
    use Syncable, SoftDeletes;

    use HasFactory, HasLab, Auditable;

    protected $fillable = [
        'test_order_id',
        'result_value',
        'subtest_results',
        'result_type',
        'reference_range',
        'units',
        'is_abnormal',
        'verified_by',
        'verified_at',
        'notes',
        'lab_id',
    ];

    protected $casts = [
        'is_abnormal' => 'boolean',
        'verified_at' => 'datetime',
        'subtest_results' => 'array',
    ];

    public function testOrder()
    {
        return $this->belongsTo(TestOrder::class);
    }

    public function verifiedBy()
    {
        return $this->belongsTo(User::class , 'verified_by');
    }
}