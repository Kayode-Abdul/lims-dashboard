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
        Schema::table('patients', function (Blueprint $table) {
            if (!Schema::hasColumn('patients', 'age_weeks')) {
                $table->integer('age_weeks')->nullable()->after('age_group');
            }
            if (!Schema::hasColumn('patients', 'age_days')) {
                $table->integer('age_days')->nullable()->after('age_weeks');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn(['age_weeks', 'age_days']);
        });
    }
};
