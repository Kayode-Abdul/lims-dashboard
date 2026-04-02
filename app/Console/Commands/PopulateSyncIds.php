<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Str;

class PopulateSyncIds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sync:populate-ids';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Populates the sync_id column for all existing records across all business tables.';

    protected $tables = [
        'users',
        'patients',
        'test_categories',
        'tests',
        'test_orders',
        'test_results',
        'audit_logs',
        'appointments',
        'specimens',
        'payments',
        'labs',
        'departments',
        'hospitals',
        'doctors',
        'patient_classifications',
        'hmos',
        'test_hmo_prices',
        'test_hospital_prices',
        'expenses'
    ];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Starting Sync ID population...");

        foreach ($this->tables as $tableName) {
            if (!Schema::hasTable($tableName)) {
                $this->warn("Table '{$tableName}' does not exist, skipping.");
                continue;
            }

            if (!Schema::hasColumn($tableName, 'sync_id')) {
                $this->error("Table '{$tableName}' does not have a sync_id column. Did you run the migration?");
                continue;
            }

            // Assume primary key is 'id' for most standard Laravel tables
            if (!Schema::hasColumn($tableName, 'id')) {
                $this->warn("Table '{$tableName}' does not have an 'id' column. Manual UUID population might be required.");
                continue;
            }

            $emptyRecordsCount = DB::table($tableName)->whereNull('sync_id')->count();
            if ($emptyRecordsCount === 0) {
                $this->line("Table '{$tableName}' is already fully populated.");
                continue;
            }

            $this->info("Populating {$emptyRecordsCount} records in '{$tableName}'...");

            $bar = $this->output->createProgressBar($emptyRecordsCount);

            DB::table($tableName)->whereNull('sync_id')->orderBy('id')->chunkById(500, function ($records) use ($tableName, $bar) {
                foreach ($records as $record) {
                    DB::table($tableName)->where('id', $record->id)->update([
                        'sync_id' => Str::uuid()->toString(),
                        'is_synced' => false,
                        'last_modified_at' => now(),
                    ]);
                    $bar->advance();
                }
            });

            $bar->finish();
            $this->newLine();
        }

        $this->info("Adding unique constraint to sync_id across all tables...");

        // We will execute raw SQL to add the unique constraint securely if it doesn't exist
        foreach ($this->tables as $tableName) {
            if (!Schema::hasTable($tableName) || !Schema::hasColumn($tableName, 'sync_id'))
                continue;

            try {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    $table->unique('sync_id');
                });
                $this->line("Added unique constraint to {$tableName}.sync_id");
            }
            catch (\Exception $e) {
                $this->line("Unique constraint might already exist on {$tableName}.sync_id or another error occurred.");
            }
        }

        $this->info("Sync ID population completed successfully!");
    }
}