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
        Schema::table('labs', function (Blueprint $table) {
            $table->string('header_image_path')->nullable()->after('logo_path');
            $table->string('footer_image_path')->nullable()->after('header_image_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('labs', function (Blueprint $table) {
            $table->dropColumn(['header_image_path', 'footer_image_path']);
        });
    }
};
