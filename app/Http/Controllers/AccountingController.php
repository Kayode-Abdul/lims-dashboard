<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Payment;
use App\Models\TestOrder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use App\Models\Patient;
use App\Models\Hmo;
use App\Models\Hospital;
use App\Models\Doctor;
use Illuminate\Support\Str;

class AccountingController extends Controller
{
    public function index(Request $request): Response
    {
        $labId = auth()->user()->lab_id;
        $startDate = $request->get('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());

        // 1. Unified Income Query
        // We aggregate amount_paid from the payments table joined with test_orders to identify sources
        $incomeData = DB::table('payments')
            ->join('test_orders', 'payments.test_order_id', '=', 'test_orders.id')
            ->leftJoin('hospitals', 'test_orders.hospital_id', '=', 'hospitals.id')
            ->leftJoin('doctors', 'test_orders.doctor_id', '=', 'doctors.id')
            ->join('patients', 'test_orders.patient_id', '=', 'patients.id')
            ->leftJoin('hmos', 'patients.hmo_id', '=', 'hmos.id')
            ->whereNull('payments.deleted_at')
            ->whereNull('test_orders.deleted_at')
            ->where('payments.lab_id', $labId)
            ->whereBetween('payments.payment_date', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->select([
                DB::raw('SUM(payments.amount_paid) as total_amount'),
                DB::raw("CASE 
                    WHEN test_orders.hospital_id IS NOT NULL THEN 'Hospital'
                    WHEN test_orders.doctor_id IS NOT NULL THEN 'Doctor'
                    WHEN patients.hmo_id IS NOT NULL THEN 'HMO'
                    ELSE 'Walk-in'
                END as source_type"),
                DB::raw("CASE 
                    WHEN test_orders.hospital_id IS NOT NULL THEN COALESCE(hospitals.name, 'Unknown Hospital')
                    WHEN test_orders.doctor_id IS NOT NULL THEN COALESCE(doctors.name, 'Unknown Doctor')
                    WHEN patients.hmo_id IS NOT NULL THEN COALESCE(hmos.name, 'Unknown HMO')
                    ELSE 'Direct Customer'
                END as source_name")
            ])
            ->groupBy('source_type', 'source_name')
            ->havingRaw('SUM(payments.amount_paid) > 0')
            ->get();

        // 2. Expenses Query
        $expenses = Expense::with('creator')
            ->where('lab_id', $labId)
            ->whereBetween('entry_date', [$startDate, $endDate])
            ->orderBy('entry_date', 'desc')
            ->get();

        $totalIncome = $incomeData->sum('total_amount');
        $totalExpenses = $expenses->sum('amount');

        // 3. Billing Totals (from test_orders)
        $billingStats = TestOrder::where('lab_id', $labId)
            ->whereBetween('ordered_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->selectRaw('SUM(price - discount) as total_billed')
            ->selectRaw('SUM(amount_paid) as total_paid')
            ->first();

        $totalBilled = $billingStats->total_billed ?? 0;
        $outstanding = max(0, $totalBilled - ($billingStats->total_paid ?? 0));

        return Inertia::render('Accounting/Index', [
            'incomeData' => $incomeData,
            'expenses' => $expenses,
            'stats' => [
                'totalIncome' => $totalIncome,
                'totalExpenses' => $totalExpenses,
                'totalBilled' => $totalBilled,
                'outstanding' => $outstanding,
                'netProfit' => $totalIncome - $totalExpenses,
            ],
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ]
        ]);
    }

    public function storeExpense(Request $request)
    {
        if (!auth()->user()->hasPermission('expenses.manage')) {
            return back()->with('error', 'You do not have permission to record expenses.');
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'category' => 'required|string|max:255',
            'description' => 'required|string|max:500',
            'entry_date' => 'required|date',
        ]);

        Expense::create([
            ...$validated,
            'lab_id' => auth()->user()->lab_id,
            'created_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Expense recorded successfully.');
    }

    public function getSourcePatients(Request $request)
    {
        $labId = auth()->user()->lab_id;
        $sourceType = $request->source_type;
        $sourceName = $request->source_name;
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        $query = TestOrder::where('test_orders.lab_id', $labId)
            ->join('patients', 'test_orders.patient_id', '=', 'patients.id')
            ->leftJoin('hospitals', 'test_orders.hospital_id', '=', 'hospitals.id')
            ->leftJoin('doctors', 'test_orders.doctor_id', '=', 'doctors.id')
            ->leftJoin('hmos', 'patients.hmo_id', '=', 'hmos.id')
            ->select('test_orders.*')
            ->with(['patient', 'test', 'hospital', 'doctor']);

        // Filter by the SAME logic as the main Income Source Breakdown
        // This is based on orders that have payments in the current range
        $query->whereExists(function ($q) use ($startDate, $endDate) {
            $q->select(DB::raw(1))
                ->from('payments')
                ->whereNull('payments.deleted_at')
                ->whereColumn('payments.test_order_id', 'test_orders.id')
                ->whereBetween('payments.payment_date', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
        });

        if ($sourceType === 'Hospital') {
            $query->where('hospitals.name', $sourceName);
        } elseif ($sourceType === 'Doctor') {
            $query->where('doctors.name', $sourceName);
        } elseif ($sourceType === 'HMO') {
            $query->where('hmos.name', $sourceName);
        } else {
            // Walk-in
            $query->whereNull('test_orders.hospital_id')
                ->whereNull('test_orders.doctor_id')
                ->whereNull('patients.hmo_id');
        }

        $orders = $query->distinct('test_orders.id')->get();

        // Add period-specific payment amount to each order for the UI to show why it matches
        foreach ($orders as $order) {
            $order->period_payments = DB::table('payments')
                ->where('test_order_id', $order->id)
                ->whereNull('deleted_at')
                ->whereBetween('payment_date', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                ->sum('amount_paid');
        }

        return response()->json($orders);
    }

    public function batchPaySource(Request $request)
    {
        if (!auth()->user()->hasPermission('billing.manage')) {
            return back()->with('error', 'You do not have permission to manage billing.');
        }

        $validated = $request->validate([
            'source_type' => 'required|string',
            'source_name' => 'required|string',
            'payment_method' => 'required|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'fixed_amount' => 'nullable|numeric', // If user wants to pay a specific amount (not used yet but good for future)
        ]);

        $labId = auth()->user()->lab_id;
        $sourceType = $validated['source_type'];
        $sourceName = $validated['source_name'];

        $query = TestOrder::where('lab_id', $labId)
            ->whereRaw('price - discount > amount_paid');

        if ($validated['start_date'] && $validated['end_date']) {
            $query->whereBetween('ordered_at', [$validated['start_date'] . ' 00:00:00', $validated['end_date'] . ' 23:59:59']);
        }

        if ($sourceType === 'Hospital') {
            $query->whereHas('hospital', fn($q) => $q->where('name', $sourceName));
        } elseif ($sourceType === 'Doctor') {
            $query->whereHas('doctor', fn($q) => $q->where('name', $sourceName));
        } elseif ($sourceType === 'HMO') {
            $query->whereHas('patient.hmo', fn($q) => $q->where('name', $sourceName));
        } else {
            $query->whereNull('hospital_id')->whereNull('doctor_id')->whereHas('patient', fn($q) => $q->whereNull('hmo_id'));
        }

        $orders = $query->get();
        $count = 0;

        DB::transaction(function () use ($orders, $validated, &$count, $labId) {
            foreach ($orders as $order) {
                $balance = $order->price - $order->discount - $order->amount_paid;
                if ($balance <= 0) continue;

                $order->update([
                    'amount_paid' => $order->price - $order->discount,
                    'payment_status' => 'paid',
                ]);

                Payment::create([
                    'test_order_id' => $order->id,
                    'amount_paid' => $balance,
                    'payment_method' => $validated['payment_method'],
                    'payment_date' => now(),
                    'notes' => 'Bulk payment for ' . $validated['source_name'],
                    'payment_id' => 'PAY-' . strtoupper(Str::random(8)),
                    'processed_by' => auth()->id(),
                    'lab_id' => $labId,
                ]);
                $count++;
            }
        });

        return back()->with('success', "Processed payments for {$count} orders from {$sourceName}.");
    }
}
