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
        Schema::table('test_orders', function (Blueprint $table) {
            $table->enum('discount_type', ['amount', 'percentage'])->default('amount')->after('discount');
        });

        Schema::table('tests', function (Blueprint $table) {
            $table->enum('gender_target', ['male', 'female', 'both'])->default('both')->after('test_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('test_orders', function (Blueprint $table) {
            $table->dropColumn('discount_type');
        });

        Schema::table('tests', function (Blueprint $table) {
            $table->dropColumn('gender_target');
        });
    }
};