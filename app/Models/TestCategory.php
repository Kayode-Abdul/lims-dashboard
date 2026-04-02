<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Syncable;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Traits\HasLab;
use App\Traits\Auditable;

class TestCategory extends Model
{
    use Syncable, SoftDeletes;

    use HasFactory, Auditable, HasLab;

    protected $fillable = [
        'name',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function tests()
    {
        return $this->hasMany(Test::class, 'category_id');
    }
}
