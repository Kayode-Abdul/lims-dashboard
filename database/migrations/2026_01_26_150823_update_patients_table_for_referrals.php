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
            $table->foreignId('hospital_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('hmo_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('patient_classification_id')->nullable()->constrained()->nullOnDelete();
            $table->string('age_group')->nullable(); // Adult, Child
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropConstrainedForeignId('hospital_id');
            $table->dropConstrainedForeignId('doctor_id');
            $table->dropConstrainedForeignId('hmo_id');
            $table->dropConstrainedForeignId('patient_classification_id');
            $table->dropColumn('age_group');
        });
    }
};
