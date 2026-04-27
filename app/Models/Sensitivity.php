<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sensitivity extends Model
{
    use \App\Traits\HasLab;

    protected $fillable = [
        'name',
        'type',
        'value',
        'lab_id',
        'is_active',
    ];

    public function lab()
    {
        return $this->belongsTo(Lab::class);
    }
}
