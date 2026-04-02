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
        Schema::table('tests', function (Blueprint $table) {
            $table->boolean('has_subtests')->default(false)->after('is_group');
            $table->json('subtest_definitions')->nullable()->after('has_subtests');
        });

        Schema::table('test_orders', function (Blueprint $table) {
            $table->json('selected_subtests')->nullable()->after('price');
        });

        Schema::table('test_results', function (Blueprint $table) {
            $table->json('subtest_results')->nullable()->after('result_value');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tests', function (Blueprint $table) {
            $table->dropColumn(['has_subtests', 'subtest_definitions']);
        });

        Schema::table('test_orders', function (Blueprint $table) {
            $table->dropColumn('selected_subtests');
        });

        Schema::table('test_results', function (Blueprint $table) {
            $table->dropColumn('subtest_results');
        });
    }

};