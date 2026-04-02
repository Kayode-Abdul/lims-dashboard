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
        Schema::table('hospitals', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('phone');
        });

        Schema::table('doctors', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('phone');
        });

        Schema::table('hmos', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('name');
        });

        Schema::table('patient_classifications', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hospitals', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });

        Schema::table('doctors', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });

        Schema::table('hmos', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });

        Schema::table('patient_classifications', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });
    }
};
