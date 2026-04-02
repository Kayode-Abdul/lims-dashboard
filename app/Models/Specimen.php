<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Syncable;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\Auditable;
use App\Traits\HasLab;

class Specimen extends Model
{
    use Syncable, SoftDeletes;

    use HasFactory, HasLab, Auditable;

    protected $fillable = [
        'sample_id',
        'test_order_id',
        'sample_type',
        'collection_at',
        'collected_by',
        'status',
        'storage_location',
        'notes',
        'lab_id',
    ];

    protected $casts = [
        'collection_at' => 'datetime',
    ];

    public function testOrder()
    {
        return $this->belongsTo(TestOrder::class);
    }

    public function collector()
    {
        return $this->belongsTo(User::class , 'collected_by');
    }
}