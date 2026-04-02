<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SyncController extends Controller
{
    /**
     * Handle the Push Request from the Offline Desktop App.
     * The offline app sends a payload of all locally created/updated records.
     */
    public function push(Request $request)
    {
        $payload = $request->input('sync_data', []);

        // Return early if nothing to sync
        if (empty($payload)) {
            return response()->json(['message' => 'No data provided', 'status' => 'success']);
        }

        DB::beginTransaction();

        try {
            // $payload format expected:
            // [
            //    'patients' => [ [record1], [record2] ],
            //    'test_orders' => [ [record1] ],
            // ]

            $syncResults = [];

            foreach ($payload as $tableName => $records) {
                // Security Check: Only allow syncing to specific business tables to prevent injection
                if (!in_array($tableName, $this->getAllowedSyncTables())) {
                    continue; // Skip unauthorized tables
                }

                $tableResults = ['inserted' => 0, 'updated' => 0, 'skipped' => 0];

                foreach ($records as $recordData) {
                    if (empty($recordData['sync_id'])) {
                        $tableResults['skipped']++;
                        continue;
                    }

                    // Look for the existing record on the live server via the globally unique sync_id
                    $existingRecord = DB::table($tableName)->where('sync_id', $recordData['sync_id'])->first();

                    // Remove fields that should not simply be blindly overwritten from the client
                    unset($recordData['id']); // Never overwrite the auto-increment ID on the live server
                    $recordData['is_synced'] = true; // Mark as successfully reached the live server

                    if (!$existingRecord) {
                        // Insert new record
                        DB::table($tableName)->insert($recordData);
                        $tableResults['inserted']++;
                    }
                    else {
                        // Conflict Resolution based on last_modified_at timestamp
                        $clientTime = strtotime($recordData['last_modified_at'] ?? 'now');
                        $serverTime = strtotime($existingRecord->last_modified_at ?? 'now');

                        if ($clientTime > $serverTime) {
                            // Client has a newer version, update the server
                            DB::table($tableName)->where('sync_id', $recordData['sync_id'])->update($recordData);
                            $tableResults['updated']++;
                        }
                        else {
                            // Server is already newer (or equal), ignore client update
                            $tableResults['skipped']++;
                        }
                    }
                }

                $syncResults[$tableName] = $tableResults;
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Sync push processed successfully.',
                'results' => $syncResults
            ]);

        }
        catch (\Exception $e) {
            DB::rollBack();
            Log::error('Offline Sync Push Failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return response()->json([
                'status' => 'error',
                'message' => 'An error occurred processing the sync data.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle the Pull Request from the Offline Desktop App.
     * The offline app requests any records updated since its last sync time.
     */
    public function pull(Request $request)
    {
        $lastSyncTime = $request->input('last_sync_time', '2000-01-01 00:00:00');
        $pullData = [];

        foreach ($this->getAllowedSyncTables() as $tableName) {
            // Find all records modified on the server AFTER the offline app last checked in
            $records = DB::table($tableName)
                ->where('last_modified_at', '>', $lastSyncTime)
                ->get();

            if ($records->isNotEmpty()) {
                $pullData[$tableName] = $records;
            }
        }

        return response()->json([
            'status' => 'success',
            'server_time' => now()->toDateTimeString(),
            'sync_data' => $pullData
        ]);
    }

    /**
     * Handle Cloud Login for new desktop installations.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (auth()->attempt($credentials)) {
            $user = auth()->user();
            $lab = $user->lab ?: \App\Models\Lab::find($user->lab_id);

            return response()->json([
                'status' => 'success',
                'user' => $user->makeVisible(['password']), // Password hash needed for local login
                'lab' => $lab,
                'message' => 'Authentication successful'
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Invalid credentials'
        ], 401);
    }

    /**
     * The definitive list of tables that the offline app is allowed to interact with.
     */
    protected function getAllowedSyncTables(): array
    {
        return [
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
    }
}