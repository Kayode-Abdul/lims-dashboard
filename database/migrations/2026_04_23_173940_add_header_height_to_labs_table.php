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
        Schema::table('labs', function (Blueprint $table) {
            $table->decimal('pdf_margin_top', 8, 2)->default(1.2)->after('header_image_path');
            $table->decimal('web_margin_top', 8, 2)->default(1.8)->after('pdf_margin_top');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('labs', function (Blueprint $table) {
            $table->dropColumn(['pdf_margin_top', 'web_margin_top']);
        });
    }
};
