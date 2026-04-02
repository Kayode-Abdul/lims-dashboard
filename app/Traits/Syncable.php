<?php

namespace App\Traits;

use Illuminate\Support\Str;

trait Syncable
{
    /**
     * Boot the Syncable trait for a model.
     *
     * @return void
     */
    public static function bootSyncable()
    {
        static::creating(function ($model) {
            if (empty($model->sync_id)) {
                $model->sync_id = (string)Str::uuid();
            }
            if (!isset($model->is_synced)) {
                $model->is_synced = false;
            }
            if (empty($model->last_modified_at)) {
                $model->last_modified_at = $model->freshTimestamp();
            }
        });

        static::updating(function ($model) {
            // When a model is updated locally, it is no longer synced with the live server
            // Only flip this if the update isn't explicitly coming from a Sync job
            if (!$model->isDirty('is_synced')) {
                $model->is_synced = false;
                $model->last_modified_at = $model->freshTimestamp();
            }
        });
    }
}