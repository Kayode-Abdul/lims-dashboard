<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

trait Auditable
{
    public static function bootAuditable()
    {
        static::created(function ($model) {
            $model->logAction('created');
        });

        static::updated(function ($model) {
            $model->logAction('updated');
        });

        static::deleted(function ($model) {
            $model->logAction('deleted');
        });
    }

    protected function logAction($action)
    {
        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'table_name' => $this->getTable(),
            'record_id' => $this->id,
            'old_values' => $action === 'updated' ? array_intersect_key($this->getOriginal(), $this->getDirty()) : null,
            'new_values' => $action !== 'deleted' ? $this->getDirty() : null,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
