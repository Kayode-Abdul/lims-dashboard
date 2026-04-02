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
            $table->dropColumn('price');
            $table->decimal('price_walk_in', 10, 2)->default(0.00)->after('category_id');
            $table->decimal('price_hmo', 10, 2)->default(0.00)->after('price_walk_in');
            $table->decimal('price_doctor_referred', 10, 2)->default(0.00)->after('price_hmo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tests', function (Blueprint $table) {
            $table->dropColumn(['price_walk_in', 'price_hmo', 'price_doctor_referred']);
            $table->decimal('price', 10, 2)->default(0.00)->after('category_id');
        });
    }
};
