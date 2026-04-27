<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('test_orders', function (Blueprint $table) {
            $table->string('patient_type')->nullable()->after('patient_id')->comment('walk-in, hmo, or referred');
            $table->foreignId('hmo_id')->nullable()->after('doctor_id')->constrained('hmos')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('test_orders', function (Blueprint $table) {
            $table->dropForeign(['hmo_id']);
            $table->dropColumn(['patient_type', 'hmo_id']);
        });
    }
};
