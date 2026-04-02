<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Syncable;

use App\Traits\Auditable;
use App\Traits\HasLab;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Test extends Model
{
    use Syncable, SoftDeletes;

    use HasFactory, Auditable, HasLab;

    protected $fillable = [
        'test_code',
        'test_name',
        'description',
        'reference_range',
        'reference_range_male',
        'reference_range_female',
        'reference_range_adult',
        'reference_range_child',
        'units',
        'category_id',
        'price_walk_in',
        'price_hmo',
        'price_doctor_referred',
        'turnaround_time',
        'department',
        'is_active',
        'is_group',
        'has_subtests',
        'subtest_definitions',
        'parent_id',
        'lab_id',
    ];

    protected $casts = [
        'price_walk_in' => 'decimal:2',
        'price_hmo' => 'decimal:2',
        'price_doctor_referred' => 'decimal:2',
        'turnaround_time' => 'integer',
        'is_active' => 'boolean',
        'is_group' => 'boolean',
        'has_subtests' => 'boolean',
        'subtest_definitions' => 'array',
    ];

    public function category()
    {
        return $this->belongsTo(TestCategory::class , 'category_id');
    }

    public function testOrders()
    {
        return $this->hasMany(TestOrder::class);
    }

    public function hmoPrices()
    {
        return $this->hasMany(TestHmoPrice::class);
    }

    public function hospitalPrices()
    {
        return $this->hasMany(TestHospitalPrice::class);
    }

    public function parent()
    {
        return $this->belongsTo(Test::class , 'parent_id');
    }

    public function subTests()
    {
        return $this->hasMany(Test::class , 'parent_id');
    }
}