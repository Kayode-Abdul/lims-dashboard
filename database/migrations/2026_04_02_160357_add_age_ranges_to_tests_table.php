<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tests', function (Blueprint $table) {
            $table->string('reference_range_adult')->nullable()->after('reference_range_female');
            $table->string('reference_range_child')->nullable()->after('reference_range_adult');
        });
    }

    public function down(): void
    {
        Schema::table('tests', function (Blueprint $table) {
            $table->dropColumn(['reference_range_adult', 'reference_range_child']);
        });
    }
};
