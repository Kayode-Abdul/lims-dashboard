<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = [
            'users',
            'patients',
            'test_categories',
            'tests',
            'test_orders',
            'test_results',
            'specimens',
            'appointments',
            'payments',
            'audit_logs'
        ];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (!Schema::hasColumn($tableName, 'lab_id')) {
                    $table->foreignId('lab_id')->after('id')->nullable()->constrained('labs')->onDelete('cascade');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'users',
            'patients',
            'test_categories',
            'tests',
            'test_orders',
            'test_results',
            'specimens',
            'appointments',
            'payments',
            'audit_logs'
        ];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropForeign(['lab_id']);
                $table->dropColumn('lab_id');
            });
        }
    }
};
