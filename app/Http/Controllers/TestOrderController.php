<?php

namespace App\Http\Controllers;

use App\Models\TestOrder;
use App\Models\Patient;
use App\Models\Test;
use App\Models\TestHmoPrice;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Requests\StoreTestOrderRequest;
use App\Http\Requests\UpdateTestOrderRequest;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class TestOrderController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('orders.view');
        // Get unique order numbers with aggregated data
        $query = TestOrder::query();

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $searchTerms = preg_split('/\s+/', trim($search));
            $query->where(function ($outer) use ($search, $searchTerms) {
                $outer->where('order_number', 'like', "%{$search}%")
                    ->orWhereHas('patient', function ($q) use ($search, $searchTerms) {
                        $q->where(function ($inner) use ($search, $searchTerms) {
                            foreach ($searchTerms as $term) {
                                $inner->where(function ($wordQuery) use ($term) {
                                                                    $wordQuery->where('first_name', 'like', "%{$term}%")
                                                                        ->orWhere('last_name', 'like', "%{$term}%");
                                                                });
                            }
                        });
                    });
            });
        }

        $query->select([
            'order_number',
            'patient_id',
            DB::raw('MAX(hospital_id) as hospital_id'),
            DB::raw('MAX(doctor_id) as doctor_id'),
            DB::raw('MAX(ordered_by) as ordered_by'),
            DB::raw('MAX(ordered_at) as ordered_at'),
            DB::raw('MAX(notes) as notes'),
            DB::raw('SUM(price) as total_price'),
            DB::raw('SUM(discount) as total_discount'),
            DB::raw('SUM(amount_paid) as total_paid'),
            DB::raw('COUNT(*) as test_count'),
            DB::raw('GROUP_CONCAT(DISTINCT status) as statuses'),
        ])
        ->groupBy('order_number', 'patient_id');

        $groupedOrders = $query->orderByRaw('SUBSTRING_INDEX(order_number, "/", -1) DESC')
            ->orderByRaw('CAST(SUBSTRING_INDEX(order_number, "/", 1) AS UNSIGNED) DESC')
            ->orderBy('ordered_at', 'desc')
            ->paginate(15)
            ->withQueryString();
        
        // Eager load relations for the paginated items
        $groupedOrders->load(['patient', 'orderedBy', 'hospital', 'doctor']);

        // Get test names for each order
        foreach ($groupedOrders as $order) {
            $order->tests = TestOrder::where('order_number', $order->order_number)
                ->with('test')
                ->get()
                ->pluck('test.test_name')
                ->toArray();

            // Calculate balance with explicit casting
            $paid = (float)($order->total_paid ?? 0);
            $price = (float)($order->total_price ?? 0);
            $discount = (float)($order->total_discount ?? 0);
            
            $netAmount = max(0, $price - $discount);
            $calculatedBalance = max(0, $netAmount - $paid);
            
            // Set balance explicitly on the model attributes for the frontend
            $order->setAttribute('balance', $calculatedBalance);

            // Determine overall payment status
            if ($price <= 0.01) {
                // No price set or free
                $order->payment_status = 'paid';
            } elseif ($netAmount <= 0.01) {
                // Fully discounted
                $order->payment_status = 'paid';
            } elseif ($calculatedBalance <= 0.01) {
                // Fully paid (balance is zero)
                $order->payment_status = 'paid';
            } elseif ($paid > 0) {
                // Partially paid
                $order->payment_status = 'partial';
            } else {
                // Not paid yet
                $order->payment_status = 'pending';
            }

            // Determine overall workflow status
            $statusArray = explode(',', $order->statuses);
            if (in_array('pending', $statusArray)) {
                $order->status = 'pending';
            }
            elseif (in_array('collected', $statusArray)) {
                $order->status = 'collected';
            }
            elseif (in_array('processing', $statusArray)) {
                $order->status = 'processing';
            }
            else {
                $order->status = 'completed';
            }
        }

        return Inertia::render('TestOrders/Index', [
            'orders' => $groupedOrders,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function show(string $orderNumber)
    {
        $this->authorize('orders.view');
        // Get all orders with the same order_number (the batch)
        $orders = TestOrder::with(['patient.hmo', 'test', 'orderedBy', 'result', 'hospital', 'doctor'])
            ->where('order_number', $orderNumber)
            ->get();

        if ($orders->isEmpty()) {
            abort(404);
        }

        $firstOrder = $orders->first();

        // Calculate batch totals
        $totalPrice = $orders->sum('price');
        $totalDiscount = $orders->sum('discount');
        $totalPaid = $orders->sum('amount_paid');
        $balance = max(0, ($totalPrice - $totalDiscount) - $totalPaid);

        return Inertia::render('TestOrders/Show', [
            'orderNumber' => $orderNumber,
            'patient' => $firstOrder->patient,
            'orderedBy' => $firstOrder->orderedBy,
            'hospital' => $firstOrder->hospital,
            'doctor' => $firstOrder->doctor,
            'orderedAt' => $firstOrder->ordered_at,
            'notes' => $firstOrder->notes,
            'orders' => $orders,
            'sensitivities' => \App\Models\Sensitivity::where('lab_id', auth()->user()->lab_id)
                ->where('is_active', true)
                ->get(),
            'summary' => [
                'totalPrice' => $totalPrice,
                'totalDiscount' => $totalDiscount,
                'totalPaid' => $totalPaid,
                'balance' => $balance,
                'paymentStatus' => ($totalPrice - $totalDiscount) <= 0.001 ? 'paid' : ($balance <= 0.01 ? 'paid' : ($totalPaid > 0 ? 'partial' : 'pending')),
            ],
        ]);
    }

    public function generateInvoice(string $orderNumber)
    {
        $this->authorize('orders.view');
        $orders = TestOrder::with(['patient.hmo', 'test', 'orderedBy', 'hospital', 'doctor'])
            ->where('order_number', $orderNumber)
            ->get();

        if ($orders->isEmpty()) {
            abort(404);
        }

        $lab = \App\Models\Lab::find(auth()->user()->lab_id);
        
        $totalPrice = $orders->sum('price');
        $totalDiscount = $orders->sum('discount');
        $totalPaid = $orders->sum('amount_paid');
        $balance = max(0, ($totalPrice - $totalDiscount) - $totalPaid);

        $pdf = Pdf::loadView('reports.invoice', [
            'orders' => $orders,
            'lab' => $lab,
            'totalPrice' => $totalPrice,
            'totalDiscount' => $totalDiscount,
            'totalPaid' => $totalPaid,
            'balance' => $balance,
            'patient' => $orders->first()->patient,
            'orderNumber' => $orderNumber,
            'orderedAt' => $orders->first()->ordered_at,
            'is_pdf' => true,
        ]);

        $patientName = Str::slug($orders->first()->patient->first_name . ' ' . $orders->first()->patient->last_name, '_');
        $safeOrderNumber = str_replace('/', '-', $orderNumber);
        return $pdf->download("Invoice_{$patientName}_{$safeOrderNumber}.pdf");
    }

    public function viewInvoice(string $orderNumber)
    {
        $this->authorize('orders.view');
        $orders = TestOrder::with(['patient.hmo', 'test', 'orderedBy', 'hospital', 'doctor'])
            ->where('order_number', $orderNumber)
            ->get();

        if ($orders->isEmpty()) {
            abort(404);
        }

        $lab = \App\Models\Lab::find(auth()->user()->lab_id);
        
        $totalPrice = $orders->sum('price');
        $totalDiscount = $orders->sum('discount');
        $totalPaid = $orders->sum('amount_paid');
        $balance = max(0, ($totalPrice - $totalDiscount) - $totalPaid);

        return view('reports.invoice', [
            'orders' => $orders,
            'lab' => $lab,
            'totalPrice' => $totalPrice,
            'totalDiscount' => $totalDiscount,
            'totalPaid' => $totalPaid,
            'balance' => $balance,
            'patient' => $orders->first()->patient,
            'orderNumber' => $orderNumber,
            'orderedAt' => $orders->first()->ordered_at,
            'is_pdf' => false,
        ]);
    }

    public function create()
    {
        $this->authorize('orders.create');
        return Inertia::render('TestOrders/Create', [
            'patients' => Patient::where('is_active', true)->get(['id', 'first_name', 'last_name', 'patient_id', 'patient_type', 'hmo_id', 'hospital_id', 'doctor_id', 'sex', 'phone']),
            'hospitals' => \App\Models\Hospital::where('is_active', true)->get(['id', 'name']),
            'doctors' => \App\Models\Doctor::where('is_active', true)->get(['id', 'name', 'hospital_id']),
            'tests' => Test::where('is_active', true)
            ->with(['hmoPrices', 'hospitalPrices'])
            ->get([
                'id',
                'test_name',
                'test_code',
                'price_walk_in',
                'price_hmo',
                'price_doctor_referred',
                'has_subtests',
                'subtest_definitions'
            ]),
            'hmos' => \App\Models\Hmo::where('is_active', true)->get(['id', 'name', 'type']),
            'classifications' => \App\Models\PatientClassification::all(['id', 'name']),
        ]);
    }

    public function store(StoreTestOrderRequest $request)
    {
        $this->authorize('orders.create');
        $validated = $request->validated();
        // Manually merge sample_type since it might not be in the StoreTestOrderRequest yet
        // Ideally we update the Request class, but for now we trust the controller modification or add it here
        $validated['sample_type'] = $request->input('sample_type');

        $patient = Patient::findOrFail($validated['patient_id']);
        $tests = Test::whereIn('id', $validated['test_ids'])->get();

        $discountInput = $validated['discount'] ?? 0;
        $discountType = $validated['discount_type'] ?? 'amount';

        $totalPrice = 0;
        foreach ($tests as $test) {
            $patient_type = $validated['patient_type'] ?? $patient->patient_type;
            $hmo_id = $validated['hmo_id'] ?? $patient->hmo_id;

            $price = $test->price_walk_in;

            if ($patient_type === 'hmo' && $hmo_id) {
                $hmoPrice = TestHmoPrice::where('test_id', $test->id)
                    ->where('hmo_id', $hmo_id)
                    ->first();

                $price = $hmoPrice ? $hmoPrice->price : ($test->price_hmo ?: $test->price_walk_in);
            }
            elseif ($patient_type === 'referred') {
                $hospital_id = $validated['hospital_id'] ?? $patient->hospital_id;
                $hospitalPrice = null;
                if ($hospital_id) {
                    $hospitalPrice = \App\Models\TestHospitalPrice::where('test_id', $test->id)
                        ->where('hospital_id', $hospital_id)
                        ->first();
                }
                $price = $hospitalPrice ? $hospitalPrice->price : ($test->price_doctor_referred ?: $test->price_walk_in);
            }

            $totalPrice += $price;
        }

        $totalDiscount = $discountType === 'percentage'
            ? ($totalPrice * $discountInput) / 100
            : $discountInput;

        $remainingPayment = $validated['amount_paid'];
        $createdOrders = 0;

        // Generate ONE order number for the entire batch
        // Generate order_number in ###/YY format (e.g., 001/26)
        $yearShort = date('y');
        $likePattern = '%/' . $yearShort;

        $lastOrder = TestOrder::withoutGlobalScopes()->where('order_number', 'LIKE', $likePattern)
            ->orderByRaw('CAST(SUBSTRING_INDEX(order_number, "/", 1) AS UNSIGNED) DESC')
            ->first();

        $sequence = $lastOrder
            ? intval(explode('/', $lastOrder->order_number)[0]) + 1
            : 1;

        $batchOrderNumber = str_pad($sequence, 3, '0', STR_PAD_LEFT) . '/' . $yearShort;

        // Ensure uniqueness
        while (TestOrder::withoutGlobalScopes()->where('order_number', $batchOrderNumber)->exists()) {
            $sequence++;
            $batchOrderNumber = str_pad($sequence, 3, '0', STR_PAD_LEFT) . '/' . $yearShort;
        }

        // Calculate total price for proportional discount distribution
        $totalPrice = 0;
        foreach ($tests as $test) {
            $patient_type = $validated['patient_type'] ?? $patient->patient_type;
            $hmo_id = $validated['hmo_id'] ?? $patient->hmo_id;

            $price = $test->price_walk_in;

            if ($patient_type === 'hmo' && $hmo_id) {
                $hmoPrice = TestHmoPrice::where('test_id', $test->id)
                    ->where('hmo_id', $hmo_id)
                    ->first();

                $price = $hmoPrice ? $hmoPrice->price : ($test->price_hmo ?: $test->price_walk_in);
            }
            elseif ($patient_type === 'referred') {
                $hospital_id = $validated['hospital_id'] ?? $patient->hospital_id;
                $hospitalPrice = null;
                if ($hospital_id) {
                    $hospitalPrice = \App\Models\TestHospitalPrice::where('test_id', $test->id)
                        ->where('hospital_id', $hospital_id)
                        ->first();
                }
                $price = $hospitalPrice ? $hospitalPrice->price : ($test->price_doctor_referred ?: $test->price_walk_in);
            }

            $totalPrice += $price;
        }

        foreach ($tests as $test) {
            $patient_type = $validated['patient_type'] ?? $patient->patient_type;
            $hmo_id = $validated['hmo_id'] ?? $patient->hmo_id;

            // Calculate price based on patient type and HMO
            $price = $test->price_walk_in;

            if ($patient_type === 'hmo' && $hmo_id) {
                $hmoPrice = TestHmoPrice::where('test_id', $test->id)
                    ->where('hmo_id', $hmo_id)
                    ->first();

                $price = $hmoPrice ? $hmoPrice->price : ($test->price_hmo ?: $test->price_walk_in);
            }
            elseif ($patient_type === 'referred') {
                $hospital_id = $validated['hospital_id'] ?? $patient->hospital_id;
                $hospitalPrice = null;
                if ($hospital_id) {
                    $hospitalPrice = \App\Models\TestHospitalPrice::where('test_id', $test->id)
                        ->where('hospital_id', $hospital_id)
                        ->first();
                }
                $price = $hospitalPrice ? $hospitalPrice->price : ($test->price_doctor_referred ?: $test->price_walk_in);
            }

            // Calculate proportional discount for this order
            $orderDiscount = $totalPrice > 0 ? round(($price / $totalPrice) * $totalDiscount, 2) : 0;
            $effectivePrice = max(0, $price - $orderDiscount);

            // Determine payment for this specific order
            if ($remainingPayment >= $effectivePrice) {
                $paymentForOrder = $effectivePrice;
                $paymentStatus = 'paid';
            }
            elseif ($remainingPayment > 0) {
                $paymentForOrder = $remainingPayment;
                $paymentStatus = 'partial';
            }
            else {
                $paymentForOrder = 0;
                $paymentStatus = 'pending';
            }

            $remainingPayment = max(0, $remainingPayment - $paymentForOrder);

            $subtestSelections = $validated['subtest_selections'] ?? [];
            $selectionsForThisTest = $subtestSelections[$test->id] ?? null;

            $order = TestOrder::create([
                'order_number' => $batchOrderNumber, // Same for all tests in batch
                'patient_id' => $patient->id,
                'patient_type' => $patient_type,
                'hmo_id' => $hmo_id,
                'test_id' => $test->id,
                'hospital_id' => $validated['hospital_id'] ?? null,
                'doctor_id' => $validated['doctor_id'] ?? null,
                'price' => $price,
                'discount' => $orderDiscount,
                'amount_paid' => $paymentForOrder,
                'payment_status' => $paymentStatus,
                'status' => 'pending',
                'ordered_by' => auth()->id(),
                'ordered_at' => now(),
                'notes' => $validated['notes'] ?? null,
                'lab_id' => auth()->user()->lab_id,
                'sample_type' => $validated['sample_type'] ?? null,
                'discount_type' => $discountType,
                'selected_subtests' => $selectionsForThisTest,
            ]);

            // Automatically create a Specimen record if sample_type is provided
            if (!empty($validated['sample_type'])) {
                $count = \App\Models\Specimen::withoutGlobalScopes()->whereDate('created_at', now()->today())->count() + 1;
                $sampleId = 'SMP-' . now()->format('Ymd') . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);

                while (\App\Models\Specimen::withoutGlobalScopes()->where('sample_id', $sampleId)->exists()) {
                    $count++;
                    $sampleId = 'SMP-' . now()->format('Ymd') . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
                }

                \App\Models\Specimen::create([
                    'sample_id' => $sampleId,
                    'test_order_id' => $order->id,
                    'sample_type' => $validated['sample_type'],
                    'collection_at' => now(),
                    'collected_by' => auth()->id(),
                    'status' => 'collected',
                    'lab_id' => auth()->user()->lab_id,
                ]);

                $order->update(['status' => 'collected']);
            }


            // Record Payment if allocated amount > 0
            if ($paymentForOrder > 0) {
                \App\Models\Payment::create([
                    'payment_id' => 'PAY-' . strtoupper(Str::random(8)),
                    'test_order_id' => $order->id,
                    'amount_paid' => $paymentForOrder,
                    'payment_method' => $validated['payment_method'],
                    'payment_date' => now(),
                    'processed_by' => auth()->id(),
                    'notes' => 'Initial payment for order ' . $batchOrderNumber,
                ]);
            }
            $createdOrders++;
        }

        return redirect()->route('test-orders.index')
            ->with('message', "{$createdOrders} test(s) ordered under {$batchOrderNumber}.");
    }

    public function updateStatus(Request $request, TestOrder $testOrder)
    {
        $this->authorize('orders.edit');
        $request->validate([
            'status' => 'required|in:pending,collected,processing,completed,cancelled',
        ]);

        $testOrder->update(['status' => $request->status]);

        return back()->with('message', 'Status updated successfully.');
    }

    public function updateBatchStatus(Request $request, string $orderNumber)
    {
        $this->authorize('orders.edit');
        $request->validate([
            'status' => 'required|in:pending,collected,processing,completed,cancelled',
        ]);

        TestOrder::where('order_number', $orderNumber)
            ->update(['status' => $request->status]);

        return back()->with('message', 'All tests marked as ' . $request->status);
    }

    public function edit(string $orderNumber)
    {
        $this->authorize('orders.edit');

        $orders = TestOrder::with(['patient', 'test'])
            ->where('order_number', $orderNumber)
            ->get();

        if ($orders->isEmpty()) abort(404);

        $firstOrder = $orders->first();

        return Inertia::render('TestOrders/Edit', [
            'orderNumber' => $orderNumber,
            'patient' => $firstOrder->patient,
            'orders' => $orders,
            'hospital' => $firstOrder->hospital,
            'doctor' => $firstOrder->doctor,
            'notes' => $firstOrder->notes,
            'sample_type' => $firstOrder->sample_type,
            'patients' => Patient::where('is_active', true)->get(['id', 'first_name', 'last_name', 'patient_id', 'patient_type', 'hmo_id', 'hospital_id', 'doctor_id', 'sex', 'phone']),
            'hospitals' => \App\Models\Hospital::where('is_active', true)->get(['id', 'name']),
            'doctors' => \App\Models\Doctor::where('is_active', true)->get(['id', 'name', 'hospital_id']),
            'tests' => Test::where('is_active', true)->with('hmoPrices')->get(['id', 'test_name', 'test_code', 'price_walk_in', 'price_hmo', 'price_doctor_referred', 'has_subtests', 'subtest_definitions']),
            'hmos' => \App\Models\Hmo::where('is_active', true)->get(['id', 'name', 'type']),
        ]);
    }

    public function updateBatch(Request $request, string $orderNumber)
    {
        $this->authorize('orders.edit');

        $validated = $request->validate([
            'test_ids' => 'required|array',
            'test_ids.*' => 'exists:tests,id',
            'discount' => 'required|numeric|min:0',
            'discount_type' => 'required|in:amount,percentage',
            'amount_paid' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'hospital_id' => 'nullable|exists:hospitals,id',
            'doctor_id' => 'nullable|exists:doctors,id',
            'sample_type' => 'nullable|string',
            'subtest_selections' => 'nullable|array',
            'patient_type' => 'nullable|string',
            'hmo_id' => 'nullable|exists:hmos,id',
        ]);

        DB::transaction(function () use ($orderNumber, $validated) {
            $existingOrders = TestOrder::where('order_number', $orderNumber)->get();
            $patient_id = $existingOrders->first()->patient_id;
            
            // Delete existing orders and related records that are NOT being updated easily
            // Actually, we can update or delete/re-create. Delete/re-create is easier for batch management.
            foreach ($existingOrders as $order) {
                // If the test is NOT in the new list, we delete its results/specimens?
                // User said: "remove the test". So yes.
                if (!in_array($order->test_id, $validated['test_ids'])) {
                     \App\Models\Payment::where('test_order_id', $order->id)->delete();
                     \App\Models\TestResult::where('test_order_id', $order->id)->delete();
                     \App\Models\Specimen::where('test_order_id', $order->id)->delete();
                     $order->delete();
                }
            }

            // Re-fetch existing tests after cleanup
            $remainingTestIds = TestOrder::where('order_number', $orderNumber)->pluck('test_id')->toArray();
            
            // Add new tests
            $newTestIds = array_diff($validated['test_ids'], $remainingTestIds);
            
            // Recalculate everything or just re-create everything? 
            // Re-creating is safer but loses IDs. Let's just update common fields for all and create new ones.
            
            // Update common fields for all remaining orders in this batch
            TestOrder::where('order_number', $orderNumber)->update([
                'patient_type' => $validated['patient_type'] ?? null,
                'hmo_id' => $validated['hmo_id'] ?? null,
                'hospital_id' => $validated['hospital_id'],
                'doctor_id' => $validated['doctor_id'],
                'notes' => $validated['notes'],
                'sample_type' => $validated['sample_type'],
            ]);

            // Handling price recalculation for the WHOLE batch is tricky if we delete/re-create some.
            // Let's just re-create all TestOrder records to ensure price/discount distribution is correct
            // BUT preserve results and specimens?
            
            // Better approach:
            // 1. Get all tests info
            $allTests = Test::whereIn('id', $validated['test_ids'])->get();
            $patient = Patient::findOrFail($patient_id);
            $totalPrice = 0;
            $prices = [];

            foreach ($allTests as $test) {
                // Price logic...
                $price = $test->price_walk_in;
                if ($patient->patient_type === 'hmo' && $patient->hmo_id) {
                    $hmoPrice = \App\Models\TestHmoPrice::where('test_id', $test->id)->where('hmo_id', $patient->hmo_id)->first();
                    $price = $hmoPrice ? $hmoPrice->price : ($test->price_hmo ?: $test->price_walk_in);
                } elseif ($patient->patient_type === 'referred' && $validated['hospital_id']) {
                    $hospitalPrice = \App\Models\TestHospitalPrice::where('test_id', $test->id)->where('hospital_id', $validated['hospital_id'])->first();
                    $price = $hospitalPrice ? $hospitalPrice->price : ($test->price_doctor_referred ?: $test->price_walk_in);
                }
                $prices[$test->id] = $price;
                $totalPrice += $price;
            }

            $totalDiscount = $validated['discount_type'] === 'percentage' ? ($totalPrice * $validated['discount']) / 100 : $validated['discount'];
            $remainingPayment = $validated['amount_paid'];

            // Loop through each test and update or create
            foreach ($validated['test_ids'] as $testId) {
                $orderPrice = $prices[$testId];
                $orderDiscount = $totalPrice > 0 ? round(($orderPrice / $totalPrice) * $totalDiscount, 2) : 0;
                $effectivePrice = max(0, $orderPrice - $orderDiscount);

                if ($remainingPayment >= $effectivePrice) {
                    $paymentForOrder = $effectivePrice;
                    $paymentStatus = 'paid';
                } elseif ($remainingPayment > 0) {
                    $paymentForOrder = $remainingPayment;
                    $paymentStatus = 'partial';
                } else {
                    $paymentForOrder = 0;
                    $paymentStatus = 'pending';
                }
                $remainingPayment = max(0, $remainingPayment - $paymentForOrder);

                $existingOrder = TestOrder::where([
                    'order_number' => $orderNumber,
                    'test_id' => $testId,
                    'patient_id' => $patient_id
                ])->first();

                $orderData = [
                    'patient_type' => $validated['patient_type'] ?? null,
                    'hmo_id' => $validated['hmo_id'] ?? null,
                    'hospital_id' => $validated['hospital_id'],
                    'doctor_id' => $validated['doctor_id'],
                    'price' => $orderPrice,
                    'discount' => $orderDiscount,
                    'amount_paid' => $paymentForOrder,
                    'payment_status' => $paymentStatus,
                    'notes' => $validated['notes'],
                    'sample_type' => $validated['sample_type'],
                    'discount_type' => $validated['discount_type'],
                    'selected_subtests' => isset($validated['subtest_selections'][$testId]) ? $validated['subtest_selections'][$testId] : null,
                    'lab_id' => auth()->user()->lab_id
                ];

                if ($existingOrder) {
                    $existingOrder->update($orderData);
                } else {
                    TestOrder::create(array_merge([
                        'order_number' => $orderNumber,
                        'test_id' => $testId,
                        'patient_id' => $patient_id,
                        'ordered_by' => auth()->id(),
                        'ordered_at' => now(),
                        'status' => 'pending'
                    ], $orderData));
                }
            }
        });

        return redirect()->route('test-orders.show-batch', $orderNumber)
            ->with('message', 'Order updated successfully.');
    }

    public function update(UpdateTestOrderRequest $request, TestOrder $testOrder)
    {
        $this->authorize('orders.edit');

        $testOrder->update($request->validated());

        return redirect()->route('test-orders.index')
            ->with('message', 'Order updated successfully.');
    }

    public function destroy(TestOrder $testOrder)
    {
        $this->authorize('orders.delete');

        $testOrder->delete();

        return redirect()->route('test-orders.index')
            ->with('message', 'Order deleted successfully.');
    }

    public function destroyBatch(string $orderNumber)
    {
        $this->authorize('orders.delete');


        DB::transaction(function () use ($orderNumber) {
            $orders = TestOrder::where('order_number', $orderNumber)->get();

            foreach ($orders as $order) {
                // Delete related payments
                \App\Models\Payment::where('test_order_id', $order->id)->delete();
                // Delete related results if any
                \App\Models\TestResult::where('test_order_id', $order->id)->delete();
                // Delete related specimens if any
                \App\Models\Specimen::where('test_order_id', $order->id)->delete();

                $order->delete();
            }
        });

        return redirect()->route('test-orders.index')
            ->with('message', 'Entire order ' . $orderNumber . ' has been deleted.');
    }
}