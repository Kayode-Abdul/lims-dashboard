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
            ->leftJoin('hmos', DB::raw('COALESCE(test_orders.hmo_id, patients.hmo_id)'), '=', 'hmos.id')
            ->whereNull('payments.deleted_at')
            ->whereNull('test_orders.deleted_at')
            ->where('payments.lab_id', $labId)
            ->whereBetween('payments.payment_date', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->select([
                DB::raw('SUM(payments.amount_paid) as total_amount'),
                DB::raw("CASE 
                    WHEN test_orders.patient_type = 'referred' AND test_orders.hospital_id IS NOT NULL THEN 'Hospital'
                    WHEN test_orders.patient_type = 'referred' AND test_orders.doctor_id IS NOT NULL THEN 'Doctor'
                    WHEN test_orders.patient_type = 'hmo' AND test_orders.hmo_id IS NOT NULL THEN 'HMO'
                    WHEN test_orders.patient_type = 'walk-in' THEN 'Walk-in'
                    WHEN test_orders.hospital_id IS NOT NULL THEN 'Hospital'
                    WHEN test_orders.doctor_id IS NOT NULL THEN 'Doctor'
                    WHEN patients.hmo_id IS NOT NULL THEN 'HMO'
                    ELSE 'Walk-in'
                END as source_type"),
                DB::raw("CASE 
                    WHEN test_orders.patient_type = 'referred' AND test_orders.hospital_id IS NOT NULL THEN COALESCE(hospitals.name, 'Unknown Hospital')
                    WHEN test_orders.patient_type = 'referred' AND test_orders.doctor_id IS NOT NULL THEN COALESCE(doctors.name, 'Unknown Doctor')
                    WHEN test_orders.patient_type = 'hmo' AND test_orders.hmo_id IS NOT NULL THEN COALESCE(hmos.name, 'Unknown HMO')
                    WHEN test_orders.patient_type = 'walk-in' THEN 'Direct Customer'
                    WHEN test_orders.hospital_id IS NOT NULL THEN COALESCE(hospitals.name, 'Unknown Hospital')
                    WHEN test_orders.doctor_id IS NOT NULL THEN COALESCE(doctors.name, 'Unknown Doctor')
                    WHEN patients.hmo_id IS NOT NULL THEN COALESCE(hmos.name, 'Unknown HMO')
                    ELSE 'Direct Customer'
                END as source_name")
            ])
            ->groupBy('source_type', 'source_name')
            ->havingRaw('SUM(payments.amount_paid) > 0')
            ->paginate(10)->withQueryString();

        // 2. Expenses Query
        $expenses = Expense::with('creator')
            ->where('lab_id', $labId)
            ->whereBetween('entry_date', [$startDate, $endDate])
            ->orderBy('entry_date', 'desc')
            ->paginate(10)->withQueryString();

        $expenseCategories = Expense::where('lab_id', $labId)
            ->distinct()
            ->pluck('category')
            ->toArray();
        
        $defaultCategories = ['Reagents', 'Equipment', 'Salaries', 'Utilities', 'Rent', 'Consumables', 'Marketing', 'Repairs', 'Other'];
        $allCategories = array_values(array_unique(array_merge($defaultCategories, $expenseCategories)));

        // Calculation for total attributes
        $totalIncome = $incomeData->sum('total_amount') ?? DB::table('payments')
            ->where('lab_id', $labId)
            ->whereNull('deleted_at')
            ->whereBetween('payment_date', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->sum('amount_paid');
            
        $totalExpenses = DB::table('expenses')
            ->where('lab_id', $labId)
            ->whereBetween('entry_date', [$startDate, $endDate])
            ->sum('amount');


        // 3. Billing Totals (from test_orders)
        $billingStats = TestOrder::where('lab_id', $labId)
            ->whereBetween('ordered_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->selectRaw('SUM(price - discount) as total_billed')
            ->selectRaw('SUM(amount_paid) as total_paid')
            ->first();

        $totalBilled = $billingStats->total_billed ?? 0;
        $outstanding = max(0, $totalBilled - ($billingStats->total_paid ?? 0));

        return Inertia::render('Accounting/Index', [
            'incomeSources' => $incomeData,
            'expenses' => $expenses,
            'totalIncome' => $totalIncome,
            'totalExpenses' => $totalExpenses,
            'totalBilled' => $totalBilled,
            'outstanding' => $outstanding,
            'totalBalance' => $totalIncome - $totalExpenses,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'expenseCategories' => $allCategories,
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
            ->leftJoin('hmos', DB::raw('COALESCE(test_orders.hmo_id, patients.hmo_id)'), '=', 'hmos.id')
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
            $query->where(function($q) use ($sourceName) {
                $q->where('hospitals.name', $sourceName)
                  ->where(function($q2) {
                      $q2->where('test_orders.patient_type', 'referred')
                         ->orWhereNull('test_orders.patient_type');
                  });
            });
        } elseif ($sourceType === 'Doctor') {
            $query->where(function($q) use ($sourceName) {
                $q->where('doctors.name', $sourceName)
                  ->where(function($q2) {
                      $q2->where('test_orders.patient_type', 'referred')
                         ->orWhereNull('test_orders.patient_type');
                  });
            });
        } elseif ($sourceType === 'HMO') {
            $query->where(function($q) use ($sourceName) {
                $q->where('hmos.name', $sourceName)
                  ->where(function($q2) {
                      $q2->where('test_orders.patient_type', 'hmo')
                         ->orWhereNull('test_orders.patient_type');
                  });
            });
        } else {
            // Walk-in
            $query->where(function($q) {
                $q->where('test_orders.patient_type', 'walk-in')
                  ->orWhere(function($q2) {
                      $q2->whereNull('test_orders.patient_type')
                         ->whereNull('test_orders.hospital_id')
                         ->whereNull('test_orders.doctor_id')
                         ->whereNull('patients.hmo_id');
                  });
            });
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

        $query = TestOrder::where('test_orders.lab_id', $labId)
            ->join('patients', 'test_orders.patient_id', '=', 'patients.id')
            ->leftJoin('hospitals', 'test_orders.hospital_id', '=', 'hospitals.id')
            ->leftJoin('doctors', 'test_orders.doctor_id', '=', 'doctors.id')
            ->leftJoin('hmos', DB::raw('COALESCE(test_orders.hmo_id, patients.hmo_id)'), '=', 'hmos.id')
            ->select('test_orders.*')
            ->whereRaw('test_orders.price - test_orders.discount > test_orders.amount_paid');

        if ($validated['start_date'] && $validated['end_date']) {
            $query->whereBetween('test_orders.ordered_at', [$validated['start_date'] . ' 00:00:00', $validated['end_date'] . ' 23:59:59']);
        }

        if ($sourceType === 'Hospital') {
            $query->where(function($q) use ($sourceName) {
                $q->where('hospitals.name', $sourceName)
                  ->where(function($q2) {
                      $q2->where('test_orders.patient_type', 'referred')
                         ->orWhereNull('test_orders.patient_type');
                  });
            });
        } elseif ($sourceType === 'Doctor') {
            $query->where(function($q) use ($sourceName) {
                $q->where('doctors.name', $sourceName)
                  ->where(function($q2) {
                      $q2->where('test_orders.patient_type', 'referred')
                         ->orWhereNull('test_orders.patient_type');
                  });
            });
        } elseif ($sourceType === 'HMO') {
            $query->where(function($q) use ($sourceName) {
                $q->where('hmos.name', $sourceName)
                  ->where(function($q2) {
                      $q2->where('test_orders.patient_type', 'hmo')
                         ->orWhereNull('test_orders.patient_type');
                  });
            });
        } else {
            // Walk-in
            $query->where(function($q) {
                $q->where('test_orders.patient_type', 'walk-in')
                  ->orWhere(function($q2) {
                      $q2->whereNull('test_orders.patient_type')
                         ->whereNull('test_orders.hospital_id')
                         ->whereNull('test_orders.doctor_id')
                         ->whereNull('patients.hmo_id');
                  });
            });
        }

        $orders = $query->orderBy('test_orders.ordered_at', 'asc')->get();
        $count = 0;
        $fixedAmount = $validated['fixed_amount'] ?? null;
        $remainingAmount = $fixedAmount ? (float)$fixedAmount : INF;

        DB::transaction(function () use ($orders, $validated, &$count, $labId, &$remainingAmount) {
            foreach ($orders as $order) {
                if ($remainingAmount <= 0) break;

                $balance = $order->price - $order->discount - $order->amount_paid;
                if ($balance <= 0) continue;

                $paymentForOrder = min($balance, $remainingAmount);
                $remainingAmount -= $paymentForOrder;

                $order->update([
                    'amount_paid' => $order->amount_paid + $paymentForOrder,
                    'payment_status' => ($order->amount_paid + $paymentForOrder) >= ($order->price - $order->discount) ? 'paid' : 'partial',
                ]);

                Payment::create([
                    'test_order_id' => $order->id,
                    'amount_paid' => $paymentForOrder,
                    'payment_method' => $validated['payment_method'],
                    'payment_date' => now(),
                    'notes' => 'Bulk/Part payment for ' . $validated['source_name'],
                    'payment_id' => 'PAY-' . strtoupper(Str::random(8)),
                    'processed_by' => auth()->id(),
                    'lab_id' => $labId,
                ]);
                $count++;
            }
        });

        $message = "Processed payments for {$count} orders from {$sourceName}.";
        if ($fixedAmount) {
            $message .= " Applied ₦" . number_format($fixedAmount, 2);
        }
        return back()->with('success', $message);
    }

    public function destroyExpense(Expense $expense)
    {
        if (!auth()->user()->hasPermission('expenses.manage')) {
            return back()->with('error', 'You do not have permission to delete expenses.');
        }

        $expense->delete();

        return redirect()->back()->with('success', 'Expense record deleted successfully.');
    }
}
