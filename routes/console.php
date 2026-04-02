<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Offline Native Desktop Synchronization Engine
// This handles the automatic push/pull of data from the Live Server every minute when online.
use Illuminate\Support\Facades\Schedule;

Schedule::command('sync:run')->everyMinute()->withoutOverlapping(5);