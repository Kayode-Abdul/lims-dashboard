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
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->foreignId('test_id')->nullable()->constrained('tests')->onDelete('set null');
            $table->string('appointment_type'); // Lab Test, X-Ray, etc.
            $table->string('doctor_name')->nullable();
            $table->string('department')->nullable();
            $table->dateTime('scheduled_at');
            $table->integer('duration')->default(30); // in minutes
            $table->string('status')->default('scheduled'); // scheduled, confirmed, completed, cancelled, no-show
            $table->text('notes')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
