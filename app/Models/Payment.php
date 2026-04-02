<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Syncable;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\Auditable;
use App\Traits\HasLab;

class Payment extends Model
{
    use Syncable, SoftDeletes;

    use HasFactory, Auditable, HasLab;

    protected $fillable = [
        'payment_id',
        'test_order_id',
        'amount_paid',
        'payment_method',
        'payment_date',
        'processed_by',
        'notes',
    ];

    protected $casts = [
        'payment_date' => 'datetime',
        'amount_paid' => 'decimal:2',
    ];

    public function testOrder()
    {
        return $this->belongsTo(TestOrder::class);
    }

    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
