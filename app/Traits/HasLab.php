<?php

namespace App\Traits;

use App\Models\Lab;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Session;

trait HasLab
{
    public static function bootHasLab()
    {
        static::creating(function ($model) {
            if (!$model->lab_id && auth()->check()) {
                $model->lab_id = auth()->user()->lab_id;
            }
        });

        static::addGlobalScope('lab', function (Builder $builder) {
            // Avoid recursion on User model during authentication
            if (static::class === \App\Models\User::class && !auth()->hasUser()) {
                return;
            }

            if (auth()->check() && !auth()->user()->is_super_admin) {
                $builder->where($builder->getQuery()->from . '.lab_id', auth()->user()->lab_id);
            }
        });
    }

    public function lab()
    {
        return $this->belongsTo(Lab::class);
    }
}
