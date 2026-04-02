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
        $indexes = Schema::getIndexes('test_orders');
        $indexNames = array_column($indexes, 'name');

        Schema::table('test_orders', function (Blueprint $table) use ($indexNames) {
            // Drop unique if it exists. 
            // Standard Laravel naming: table_column_unique
            if (in_array('test_orders_order_number_unique', $indexNames)) {
                $table->dropUnique(['order_number']);
            }

            // Add regular index if it doesn't exist
            if (!in_array('test_orders_order_number_index', $indexNames)) {
                $table->index('order_number');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $indexes = Schema::getIndexes('test_orders');
        $indexNames = array_column($indexes, 'name');

        Schema::table('test_orders', function (Blueprint $table) use ($indexNames) {
            if (in_array('test_orders_order_number_index', $indexNames)) {
                $table->dropIndex(['order_number']);
            }

            if (!in_array('test_orders_order_number_unique', $indexNames)) {
                // Warning: This might fail if there are duplicate order numbers in the table
                try {
                    $table->unique(['order_number']);
                } catch (\Exception $e) {
                    // Log or handle the case where duplicates prevent restoring uniqueness
                }
            }
        });
    }
};
