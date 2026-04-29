<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Syncable;

use App\Traits\HasLab;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Traits\Auditable;

class TestHmoPrice extends Model
{
    use Syncable, SoftDeletes, Auditable;

    use HasFactory, HasLab;

    protected $fillable = [
        'lab_id',
        'test_id',
        'hmo_id',
        'price',
    ];

    public function test()
    {
        return $this->belongsTo(Test::class);
    }

    public function hmo()
    {
        return $this->belongsTo(Hmo::class);
    }
}