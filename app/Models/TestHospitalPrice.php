<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Syncable;

use App\Traits\HasLab;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TestHospitalPrice extends Model
{
    use Syncable, SoftDeletes;

    use HasFactory, HasLab;

    protected $fillable = [
        'lab_id',
        'test_id',
        'hospital_id',
        'price',
    ];

    public function test()
    {
        return $this->belongsTo(Test::class);
    }

    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }
}
