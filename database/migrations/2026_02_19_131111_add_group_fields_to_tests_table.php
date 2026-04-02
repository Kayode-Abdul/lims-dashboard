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
            $table->boolean('is_group')->default(false)->after('department');
            $table->unsignedBigInteger('parent_id')->nullable()->after('is_group');
            $table->foreign('parent_id')->references('id')->on('tests')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tests', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn(['is_group', 'parent_id']);
        });
    }
};
