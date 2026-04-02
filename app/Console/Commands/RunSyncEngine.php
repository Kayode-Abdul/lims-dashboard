<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RunSyncEngine extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'sync:run';

    /**
     * The console command description.
     */
    protected $description = 'Runs the offline-to-online background synchronization engine.';

    /**
     * The Live Server URL base
     */
    protected $liveServerUrl;

    public function __construct()
    {
        parent::__construct();
        $this->liveServerUrl = env('SYNC_LIVE_SERVER_URL', 'https://YOUR_LIVE_SERVER.com/api/sync');
    }

    /**
     * The definitive list of tables to sync
     */
    protected $tables = [
        'users', 'patients', 'test_categories', 'tests', 'test_orders',
        'test_results', 'audit_logs', 'appointments', 'specimens', 'payments',
        'labs', 'departments', 'hospitals', 'doctors', 'patient_classifications',
        'hmos', 'test_hmo_prices', 'test_hospital_prices', 'expenses'
    ];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Starting Offline Sync Engine...");

        // Dynamically set the live server URL from the Lab settings if available
        $lab = \App\Models\Lab::first(); // Assuming a single lab context for the desktop app
        if ($lab && $lab->sync_url) {
            $this->liveServerUrl = $lab->sync_url;
            $this->info("Using configured Sync URL: {$this->liveServerUrl}");
        }
        else {
            $this->liveServerUrl = env('SYNC_LIVE_SERVER_URL', 'https://YOUR_LIVE_SERVER.com/api/sync');
            $this->info("Using default Sync URL (from .env): {$this->liveServerUrl}");
        }

        // 1. Check Internet Connection
        if (!$this->isOnline()) {
            $this->warn("No internet connection detected. Aborting sync.");
            return Command::SUCCESS;
        }

        $this->info("Internet connection detected. Proceeding...");

        // 2. Perform PUSH (Send local unsynced data to Live Server)
        $this->pushLocalData();

        // 3. Perform PULL (Get new Live Server data down to local)
        $this->pullRemoteData();

        $this->info("Sync Cycle Complete.");
        return Command::SUCCESS;
    }

    /**
     * Gather local unsynced records and push them to the Live Server.
     */
    protected function pushLocalData()
    {
        $this->info("Gathering local records for Push...");
        $pushPayload = [];
        $recordsToMarkSynced = [];

        foreach ($this->tables as $tableName) {
            $unsyncedRecords = DB::table($tableName)->where('is_synced', false)->get();

            if ($unsyncedRecords->isNotEmpty()) {
                $pushPayload[$tableName] = $unsyncedRecords->toArray();

                // Keep track so we can mark them synced locally if the server successfully accepts them
                $recordsToMarkSynced[$tableName] = $unsyncedRecords->pluck('sync_id')->toArray();
            }
        }

        if (empty($pushPayload)) {
            $this->line("No local changes to push.");
            return;
        }

        $this->line("Sending Push payload to live server...");

        try {
            $response = Http::timeout(30)->post("{$this->liveServerUrl}/push", [
                'sync_data' => $pushPayload
            ]);

            if ($response->successful() && $response->json('status') === 'success') {
                $this->info("Push accepted by Live Server. Marking local records as synced.");

                // Mark locally as synced
                foreach ($recordsToMarkSynced as $tableName => $syncIds) {
                    DB::table($tableName)->whereIn('sync_id', $syncIds)->update(['is_synced' => true]);
                }

                // Now attempt to push any physical files associated with this payload
                $this->pushLocalFiles($pushPayload);
            }
            else {
                $this->error("Live Server rejected push payload: " . $response->body());
                Log::error("Sync Push Error: " . $response->body());
            }

        }
        catch (\Exception $e) {
            $this->error("Failed to push data: " . $e->getMessage());
        }
    }

    /**
     * Pull new records from the Live Server and merge them locally.
     */
    protected function pullRemoteData()
    {
        $this->info("Requesting Pull from Live Server...");

        // Find the most recent sync time we know about to ask the server for what's new since then
        $lastSyncTime = \Cache::get('last_successful_pull_time', '2000-01-01 00:00:00');

        try {
            $response = Http::timeout(30)->get("{$this->liveServerUrl}/pull", [
                'last_sync_time' => $lastSyncTime
            ]);

            if ($response->successful() && $response->json('status') === 'success') {
                $pullData = $response->json('sync_data', []);
                $serverTime = $response->json('server_time');

                if (empty($pullData)) {
                    $this->line("No new remote changes to pull.");
                }
                else {
                    $this->mergePulledData($pullData);
                }

                \Cache::put('last_successful_pull_time', $serverTime);
                $this->info("Pull successful. Horizon timestamp updated to {$serverTime}.");

            }
            else {
                $this->error("Failed to pull data: " . $response->body());
            }

        }
        catch (\Exception $e) {
            $this->error("Failed to pull data from server: " . $e->getMessage());
        }
    }

    /**
     * Merges pulled data carefully into the local SQLite/DB.
     */
    protected function mergePulledData(array $pullData)
    {
        DB::beginTransaction();

        try {
            foreach ($pullData as $tableName => $records) {
                foreach ($records as $recordData) {
                    if (empty($recordData['sync_id']))
                        continue;

                    $existingRecord = DB::table($tableName)->where('sync_id', $recordData['sync_id'])->first();

                    // Standardize record format (sometimes JSON decode makes arrays instead of objects)
                    $recordData = (array)$recordData;
                    unset($recordData['id']); // Never overwrite local auto-increments
                    $recordData['is_synced'] = true; // Data from server is inherently synced

                    if (!$existingRecord) {
                        DB::table($tableName)->insert($recordData);
                    }
                    else {
                        // Conflict resolution locally
                        $localTime = strtotime($existingRecord->last_modified_at ?? 'now');
                        $remoteTime = strtotime($recordData['last_modified_at'] ?? 'now');

                        if ($remoteTime > $localTime) {
                            DB::table($tableName)->where('sync_id', $recordData['sync_id'])->update($recordData);
                        }
                    }
                }
                $this->line("Merged pulled data for table: {$tableName}");
            }
            DB::commit();
        }
        catch (\Exception $e) {
            DB::rollBack();
            $this->error("Failed to merge pulled data: " . $e->getMessage());
            Log::error("Sync Merge Error: " . $e->getMessage());
        }
    }

    /**
     * Parse the pushed payload for file paths (logos, signatures) and upload the physical files to the Live Server.
     */
    protected function pushLocalFiles(array $pushPayload)
    {
        $fileFields = ['logo_path', 'header_image_path', 'footer_image_path', 'signature_path'];

        foreach ($pushPayload as $tableName => $records) {
            foreach ($records as $record) {
                // StdClass or array handling
                $recordArray = (array)$record;

                foreach ($fileFields as $field) {
                    if (!empty($recordArray[$field])) {
                        $localPath = storage_path('app/public/' . $recordArray[$field]);

                        if (file_exists($localPath)) {
                            // Upload the physical file to a dedicated media-sync endpoint on the live server
                            try {
                                Http::timeout(60)
                                    ->attach('file', file_get_contents($localPath), basename($localPath))
                                    ->post("{$this->liveServerUrl}/push-media", [
                                    'sync_id' => $recordArray['sync_id'] ?? null,
                                    'table' => $tableName,
                                    'field' => $field,
                                    'path' => $recordArray[$field]
                                ]);
                                $this->line("Successfully pushed physical media file: " . basename($localPath));
                            }
                            catch (\Exception $e) {
                                $this->error("Failed to push physical media file: " . $e->getMessage());
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Basic check to see if the machine handles outbound traffic.
     */
    protected function isOnline()
    {
        $connected = @fsockopen("www.google.com", 80);
        if ($connected) {
            fclose($connected);
            return true;
        }
        return false;
    }
}