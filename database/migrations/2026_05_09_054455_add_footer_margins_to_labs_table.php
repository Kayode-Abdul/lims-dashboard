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
            $table->decimal('pdf_margin_bottom', 8, 2)->nullable()->after('pdf_margin_top');
            $table->decimal('web_margin_bottom', 8, 2)->nullable()->after('web_margin_top');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('labs', function (Blueprint $table) {
            $table->dropColumn(['pdf_margin_bottom', 'web_margin_bottom']);
        });
    }
};
