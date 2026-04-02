<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration {
    /**
     * The list of specific tables that need synchronization columns added to them.
     */
    protected $tables = [
        'users',
        'patients',
        'test_categories',
        'tests',
        'test_orders',
        'test_results',
        'audit_logs',
        'appointments',
        'specimens',
        'payments',
        'labs',
        'departments',
        'hospitals',
        'doctors',
        'patient_classifications',
        'hmos',
        'test_hmo_prices',
        'test_hospital_prices',
        'expenses'
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add columns without unique constraint yet
        foreach ($this->tables as $tableName) {
            if (!Schema::hasTable($tableName))
                continue;

            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                // Add columns carefully if they don't exist
                if (!Schema::hasColumn($tableName, 'sync_id')) {
                    $table->uuid('sync_id')->nullable()->after('id');
                }
                if (!Schema::hasColumn($tableName, 'is_synced')) {
                    $table->boolean('is_synced')->default(false)->after('sync_id');
                }
                if (!Schema::hasColumn($tableName, 'last_modified_at')) {
                    $table->timestamp('last_modified_at')->useCurrent()->after('is_synced');
                }
                if (!Schema::hasColumn($tableName, 'deleted_at')) {
                    $table->softDeletes();
                }
            });
        }

        // 2. Populate existing records one table at a time
        foreach ($this->tables as $tableName) {
            if (!Schema::hasTable($tableName))

                continue;

            // Note: We cannot query `id` universally if some tables don't use `id` as primary key.
            // But in Laravel, mostly they do. Let's make sure by grabbing all rows if count is small, or chunking by id.

            // Check if the table has an 'id' column
            if (!Schema::hasColumn($tableName, 'id'))
                continue;

            DB::table($tableName)->orderBy('id')->chunkById(500, function ($records) use ($tableName) {
                foreach ($records as $record) {
                    // It's possible to just use chunkById
                    // Actually, a simpler approach for MySQL since 8.0 or normal is just looping
                    DB::table($tableName)
                        ->where('id', $record->id)
                        ->update([
                        'sync_id' => Str::uuid()->toString(),
                        'is_synced' => false,
                    ]);
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach ($this->tables as $tableName) {
            if (!Schema::hasTable($tableName))
                continue;

            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (Schema::hasColumn($tableName, 'sync_id')) {
                    $table->dropColumn('sync_id');
                }
                if (Schema::hasColumn($tableName, 'is_synced')) {
                    $table->dropColumn('is_synced');
                }
                if (Schema::hasColumn($tableName, 'last_modified_at')) {
                    $table->dropColumn('last_modified_at');
                }
                if (Schema::hasColumn($tableName, 'deleted_at')) {
                // $table->dropSoftDeletes();
                }
            });
        }
    }
};