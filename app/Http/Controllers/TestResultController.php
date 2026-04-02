<?php

namespace App\Http\Controllers;

use App\Models\TestResult;
use App\Models\TestOrder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Requests\StoreTestResultRequest;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Mail;
use App\Mail\ResultShared;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;



class TestResultController extends Controller
{
    public function index(Request $request)
    {
        // Query to get unique order_numbers that have at least one test result
        $query = TestOrder::has('result')
            ->with(['patient'])
            ->select('order_number', 'patient_id')
            ->selectRaw('MAX(created_at) as latest_created_at')
            ->groupBy('order_number', 'patient_id');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhereHas('patient', function ($sq) use ($search) {
                        $sq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('patient_id', 'like', "%{$search}%")
                            ->orWhere(DB::raw("CONCAT(first_name, ' ', last_name)"), 'like', "%{$search}%");
                    });
            });
        }

        $groupedOrders = $query->orderBy('latest_created_at', 'desc')->paginate(15)->withQueryString();

        // Attach all results to each group
        $transformed = $groupedOrders->getCollection()->map(function ($order) {
            $order->results = TestResult::whereHas('testOrder', function ($q) use ($order) {
                $q->where('order_number', $order->order_number);
            })->with(['testOrder.test', 'verifiedBy', 'testOrder.patient'])
                ->orderBy('test_order_id', 'asc')
                ->get();

            if ($order->results->isEmpty()) return null;

            // Set aggregate properties for the UI
            $firstResult = $order->results->first();
            $order->patient = $firstResult->testOrder?->patient;
            $order->is_abnormal = $order->results->contains('is_abnormal', true);
            $order->created_at = $order->results->max('created_at');
            
            // Determine combined verification status
            $order->verified_at = $order->results->every(fn($r) => $r->verified_at !== null)
                ? $order->results->max('verified_at')
                : null;

            $order->results = $this->sortSubtests($order->results);
            return $order;
        })->filter()->values();

        $groupedOrders->setCollection($transformed);

        return Inertia::render('TestResults/Index', [
            'results' => $groupedOrders,
            'filters' => $request->only(['search']),
        ]);
    }

    public function show(string $orderNumber)
    {
        $orderNumber = str_replace('-', '/', $orderNumber);
        $results = TestResult::whereHas('testOrder', function ($q) use ($orderNumber) {
            $q->where('order_number', $orderNumber);
        })->with(['testOrder.patient.hmo', 'testOrder.test.category', 'verifiedBy', 'testOrder.lab', 'testOrder.hospital', 'testOrder.doctor'])->orderBy('test_order_id', 'asc')->get();

        if ($results->isEmpty()) {
            abort(404);
        }

        $firstResult = $results->first();

        $results = $this->sortSubtests($results);

        return Inertia::render('TestResults/Show', [
            'results' => $results,
            'lab' => $firstResult->testOrder?->lab,
            'order_number' => $orderNumber
        ]);
    }

    public function store(StoreTestResultRequest $request)
    {
        $validated = $request->validated();
        $testOrder = TestOrder::with('test')->findOrFail($validated['test_order_id']);

        if (empty($validated['reference_range'])) {
            $patient = $testOrder->patient;
            $test = $testOrder->test;

            // Determine age group
            $isChild = false;
            if ($patient->age_group === 'child') {
                $isChild = true;
            } elseif ($patient->age_group === 'adult') {
                $isChild = false;
            } elseif ($patient->date_of_birth) {
                $isChild = $patient->date_of_birth->diffInYears(now()) < 18;
            }

            // Priority: sex-specific > age-specific > general
            if ($patient->sex === 'Male' && !empty($test->reference_range_male)) {
                $validated['reference_range'] = $test->reference_range_male;
            } elseif ($patient->sex === 'Female' && !empty($test->reference_range_female)) {
                $validated['reference_range'] = $test->reference_range_female;
            } elseif ($isChild && !empty($test->reference_range_child)) {
                $validated['reference_range'] = $test->reference_range_child;
            } elseif (!$isChild && !empty($test->reference_range_adult)) {
                $validated['reference_range'] = $test->reference_range_adult;
            } else {
                $validated['reference_range'] = $test->reference_range;
            }
        }

        try {
            if (empty($validated['units'])) {
                $validated['units'] = $testOrder->test->units;
            }

            $result = TestResult::updateOrCreate(
            ['test_order_id' => $validated['test_order_id']],
                $validated
            );

            // Update order status if result or subtests are provided
            if (!empty($result->result_value) || !empty($result->subtest_results)) {
                $result->testOrder->update(['status' => 'completed']);
            }

            return redirect()->route('test-orders.index')
                ->with('message', 'Result recorded successfully.');
        } catch (\Exception $e) {
            Log::error("Failed to save test result: " . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to save result. Please check your inputs and try again.');
        }
    }

    public function verify(Request $request, TestResult $testResult)
    {
        $this->authorize('verify', $testResult);

        $testResult->update([
            'verified_by' => auth()->id(),
            'verified_at' => now(),
        ]);

        return redirect()->back()->with('message', 'Result verified successfully.');
    }

    public function downloadPdf(string $orderNumber)
    {
        $orderNumber = str_replace('-', '/', $orderNumber);
        $results = TestResult::whereHas('testOrder', function ($q) use ($orderNumber) {
            $q->where('order_number', $orderNumber);
        })->with(['testOrder.patient.hmo', 'testOrder.test.category', 'verifiedBy', 'testOrder.lab', 'testOrder.hospital', 'testOrder.doctor'])->orderBy('test_order_id', 'asc')->get();

        if ($results->isEmpty()) {
            abort(404);
        }

        $firstResult = $results->first();
        $lab = $firstResult->testOrder->lab;

        // Convert images to Base64 for PDF
        $lab->header_base64 = $this->imageToBase64($lab->header_image_path);
        $lab->footer_base64 = $this->imageToBase64($lab->footer_image_path);

        $results = $this->sortSubtests($results);
        
        foreach ($results as $result) {
            if ($result->verifiedBy && $result->verifiedBy->signature_path) {
                $result->verifiedBy->signature_base64 = $this->imageToBase64($result->verifiedBy->signature_path);
            }
        }

        // Generate QR Code Base64
        $qrText = "VALID RESULT\n" . 
                  ($lab->name ?? 'Global Diagnostics') . "\n" . 
                  ($lab->address ?? '') . "\n" . 
                  ($lab->phone ?? '');
        $qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" . urlencode($qrText);
        $lab->qr_code_base64 = $this->externalImageToBase64($qrCodeUrl);

        // Log the download
        \App\Models\AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'downloaded_pdf',
            'table_name' => 'test_results',
            'record_id' => $firstResult->id, // Use the first result ID as reference
            'new_values' => ['order_number' => $orderNumber],
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'lab_id' => auth()->user()->lab_id
        ]);

        $pdf = Pdf::loadView('reports.lab_report', [
            'results' => $results,
            'lab' => $lab
        ]);

        $safeOrderNumber = str_replace('/', '-', $orderNumber);
        return $pdf->download("Lab_Report_{$safeOrderNumber}.pdf");
    }

    public function generateZip(string $orderNumber)
    {
        $orderNumber = str_replace('-', '/', $orderNumber);
        $safeOrderNumber = str_replace('/', '-', $orderNumber);
        $zipName = "Lab_Report_{$safeOrderNumber}.zip";
        $pdfName = "Lab_Report_{$safeOrderNumber}.pdf";
        
        $directory = public_path('pdfs');
        if (!file_exists($directory)) {
            mkdir($directory, 0755, true);
        }

        $zipPath = $directory . '/' . $zipName;

        // If file exists and is recent (last 30 mins), return it
        if (file_exists($zipPath) && (time() - filemtime($zipPath) < 1800)) {
            return response()->json(['url' => asset('pdfs/' . $zipName)]);
        }

        // Generate PDF
        $results = TestResult::whereHas('testOrder', function ($q) use ($orderNumber) {
            $q->where('order_number', $orderNumber);
        })->with(['testOrder.patient.hmo', 'testOrder.test.category', 'verifiedBy', 'testOrder.lab', 'testOrder.hospital', 'testOrder.doctor'])->orderBy('test_order_id', 'asc')->get();

        if ($results->isEmpty()) abort(404);

        $lab = $results->first()->testOrder->lab;
        $lab->header_base64 = $this->imageToBase64($lab->header_image_path);
        $lab->footer_base64 = $this->imageToBase64($lab->footer_image_path);
        
        $results = $this->sortSubtests($results);

        foreach ($results as $result) {
            if ($result->verifiedBy && $result->verifiedBy->signature_path) {
                $result->verifiedBy->signature_base64 = $this->imageToBase64($result->verifiedBy->signature_path);
            }
        }

        // QR Code
        $qrText = "VALID RESULT\n" . ($lab->name ?? 'Global Diagnostics') . "\n" . ($lab->address ?? '') . "\n" . ($lab->phone ?? '');
        $qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" . urlencode($qrText);
        $lab->qr_code_base64 = $this->externalImageToBase64($qrCodeUrl);

        $pdf = Pdf::loadView('reports.lab_report', ['results' => $results, 'lab' => $lab]);
        $pdfContent = $pdf->output();

        // Create Zip
        $zip = new \ZipArchive();
        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === TRUE) {
            $zip->addFromString($pdfName, $pdfContent);
            $zip->close();
            return response()->json(['url' => asset('pdfs/' . $zipName)]);
        }

        return response()->json(['error' => 'Failed to generate zip'], 500);
    }

    public function logPrint(Request $request)
    {
        $request->validate([
            'order_number' => 'required|string',
            'result_id' => 'required|integer'
        ]);

        \App\Models\AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'printed_report',
            'table_name' => 'test_results',
            'record_id' => $request->result_id,
            'new_values' => ['order_number' => $request->order_number],
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'lab_id' => auth()->user()->lab_id
        ]);

        return response()->json(['message' => 'Print logged successfully']);
    }

    public function email(Request $request, string $orderNumber)
    {
        $orderNumber = str_replace('-', '/', $orderNumber);
        $request->validate([
            'email' => 'required|email',
        ]);

        $results = TestResult::whereHas('testOrder', function ($q) use ($orderNumber) {
            $q->where('order_number', $orderNumber);
        })->with(['testOrder.patient.hmo', 'testOrder.test.category', 'verifiedBy', 'testOrder.lab', 'testOrder.hospital', 'testOrder.doctor'])->orderBy('test_order_id', 'asc')->get();

        if ($results->isEmpty()) {
            abort(404);
        }

        $lab = $results->first()->testOrder->lab;
        // Convert images to Base64 for PDF
        $lab->header_base64 = $this->imageToBase64($lab->header_image_path);
        $lab->footer_base64 = $this->imageToBase64($lab->footer_image_path);

        $results = $this->sortSubtests($results);
        
        foreach ($results as $result) {
            if ($result->verifiedBy && $result->verifiedBy->signature_path) {
                $result->verifiedBy->signature_base64 = $this->imageToBase64($result->verifiedBy->signature_path);
            }
        }

        // Generate QR Code Base64
        $qrText = "VALID RESULT\n" . 
                  ($lab->name ?? 'Global Diagnostics') . "\n" . 
                  ($lab->address ?? '') . "\n" . 
                  ($lab->phone ?? '');
        $qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" . urlencode($qrText);
        $lab->qr_code_base64 = $this->externalImageToBase64($qrCodeUrl);

        $pdf = Pdf::loadView('reports.lab_report', [
            'results' => $results,
            'lab' => $lab
        ]);
        $pdfContent = $pdf->output();

        Mail::to($request->email)->send(new ResultShared($results->first(), $pdfContent));

        return redirect()->back()->with('message', 'Full lab report sent successfully via email.');
    }

    private function imageToBase64($path)
    {
        if (!$path || !Storage::disk('public')->exists($path)) {
            return null;
        }

        try {
            $image = Storage::disk('public')->get($path);
            $type = Storage::disk('public')->mimeType($path);
            return 'data:' . $type . ';base64,' . base64_encode($image);
        } catch (\Exception $e) {
            Log::error("Failed to convert image to base64: " . $e->getMessage());
            return null;
        }
    }

    private function externalImageToBase64($url)
    {
        try {
            $image = file_get_contents($url);
            if ($image === false) return null;
            $base64 = base64_encode($image);
            return 'data:image/png;base64,' . $base64;
        } catch (\Exception $e) {
            Log::error("Failed to fetch external image to base64: " . $e->getMessage());
            return null;
        }
    }

    private function sortSubtests($results)
    {
        foreach ($results as $result) {
            $definitions = $result->testOrder->test->subtest_definitions ?? [];
            $selectedSubtests = (array)($result->testOrder->selected_subtests ?? []);
            $resultsData = (array)($result->subtest_results ?? []);

            if (empty($resultsData)) continue;
            if (empty($definitions)) continue;

            // Build a set of definition keys for quick lookup
            $relevantDefs = !empty($selectedSubtests)
                ? array_filter($definitions, function($d) use ($selectedSubtests) {
                    $id = strval($d['id'] ?? $d['name'] ?? $d['investigation'] ?? '');
                    return in_array($id, $selectedSubtests);
                })
                : $definitions;

            $defKeys = [];
            foreach ($relevantDefs as $def) {
                $defKeys[] = strval($def['id'] ?? $def['name'] ?? $def['investigation'] ?? '');
            }
            $defKeySet = array_flip($defKeys);

            // Walk through the original saved order and group extras with the
            // definition-based entry that precedes them.
            // Result: [ defKey1 => [defKey1, extra1, extra2], defKey2 => [defKey2], ... ]
            $groups = [];          // defKey => [key1, key2, ...]
            $orphanExtras = [];    // extras that appear before any definition entry
            $currentDefKey = null;
            $originalKeys = array_keys($resultsData);

            foreach ($originalKeys as $key) {
                if (isset($defKeySet[$key])) {
                    $currentDefKey = $key;
                    if (!isset($groups[$currentDefKey])) {
                        $groups[$currentDefKey] = [];
                    }
                    $groups[$currentDefKey][] = $key;
                } else {
                    // This is an extra/custom entry
                    if ($currentDefKey !== null) {
                        $groups[$currentDefKey][] = $key;
                    } else {
                        $orphanExtras[] = $key;
                    }
                }
            }

            // Now rebuild in definition order, with each group's extras right after
            $sorted = [];

            // Place orphan extras first (extras before any definition)
            foreach ($orphanExtras as $key) {
                if (isset($resultsData[$key])) {
                    $sorted[$key] = $resultsData[$key];
                }
            }

            // Place definition entries in definition order, each followed by its extras
            foreach ($defKeys as $defKey) {
                if (isset($groups[$defKey])) {
                    foreach ($groups[$defKey] as $key) {
                        if (isset($resultsData[$key])) {
                            $sorted[$key] = $resultsData[$key];
                        }
                    }
                } elseif (isset($resultsData[$defKey])) {
                    // Definition exists in results but had no group entry
                    $sorted[$defKey] = $resultsData[$defKey];
                }
            }

            // Finally, add any remaining keys not yet placed (safety net)
            foreach ($resultsData as $key => $val) {
                if (!isset($sorted[$key])) {
                    $sorted[$key] = $val;
                }
            }

            $result->subtest_results = $sorted;
        }
        return $results;
    }
}