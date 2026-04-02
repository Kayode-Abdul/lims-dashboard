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
        Schema::create('access_keys', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->foreignId('lab_id')->nullable()->constrained('labs')->onDelete('set null');
            $table->integer('duration_days');
            $table->boolean('is_activated')->default(false);
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('access_keys');
    }
};
