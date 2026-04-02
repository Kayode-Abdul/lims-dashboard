<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Syncable;

use App\Traits\Auditable;
use App\Traits\HasLab;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    use Syncable, SoftDeletes;

    use HasLab, Auditable;

    protected $fillable = [
        'amount',
        'category',
        'description',
        'entry_date',
        'lab_id',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'entry_date' => 'date',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
