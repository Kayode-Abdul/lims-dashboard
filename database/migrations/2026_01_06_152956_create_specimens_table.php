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
        Schema::create('specimens', function (Blueprint $table) {
            $table->id();
            $table->string('sample_id')->unique();
            $table->foreignId('test_order_id')->constrained()->onDelete('cascade');
            $table->string('sample_type');
            $table->timestamp('collection_at');
            $table->foreignId('collected_by')->constrained('users');
            $table->string('status')->default('collected'); // collected, processing, analyzed, stored, discarded
            $table->string('storage_location')->nullable();
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
        Schema::dropIfExists('specimens');
    }
};
