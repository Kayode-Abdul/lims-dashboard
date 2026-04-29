<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\TestOrder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Requests\StorePaymentRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function storeBatch(Request $request)
    {
        $this->authorize('billing.manage');

        $validated = $request->validate([
            'order_number' => 'required|string|exists:test_orders,order_number',
            'amount_paid' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string',
            'payment_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $orders = TestOrder::where('order_number', $validated['order_number'])
            ->where('payment_status', '!=', 'paid')
            ->orderBy('id')
            ->get();

        if ($orders->isEmpty()) {
            return redirect()->back()->with('error', 'This order is already fully paid.');
        }

        $remainingPayment = (float) $validated['amount_paid'];

        DB::transaction(function () use ($orders, $validated, &$remainingPayment) {
            foreach ($orders as $order) {
                if ($remainingPayment <= 0)
                    break;

                $effectivePrice = (float) $order->price - (float) ($order->discount ?? 0);
                $balance = max(0, $effectivePrice - (float) $order->amount_paid);

                if ($balance <= 0)
                    continue;

                $paymentForOrder = min($remainingPayment, $balance);
                $newPaid = (float) $order->amount_paid + $paymentForOrder;

                // Update order status logic
                $status = 'partial';
                if ($newPaid >= $effectivePrice - 0.001) {
                    $status = 'paid';
                }

                $order->update([
                    'amount_paid' => $newPaid,
                    'payment_status' => $status,
                ]);

                // Create Payment Record
                Payment::create([
                    'test_order_id' => $order->id,
                    'amount_paid' => $paymentForOrder,
                    'payment_method' => $validated['payment_method'],
                    'payment_date' => $validated['payment_date'],
                    'notes' => $validated['notes'] ?? ('Batch payment for ' . $validated['order_number']),
                    'payment_id' => 'PAY-' . strtoupper(Str::random(8)),
                    'processed_by' => auth()->id(),
                    'lab_id' => auth()->user()->lab_id,
                ]);

                $remainingPayment -= $paymentForOrder;
            }
        });

        return redirect()->back()->with('message', 'Batch payment recorded successfully.');
    }

    public function index(Request $request)
    {
        $this->authorize('billing.manage');

        $query = Payment::with(['testOrder.patient', 'testOrder.test', 'processedBy']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('payment_id', 'like', "%{$search}%")
                ->orWhereHas('testOrder.patient', function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
        }

        $payments = $query->latest()->paginate(15)->withQueryString();

        // Calculate Stats
        $stats = [
            'total_collected' => Payment::sum('amount_paid'),
            'total_pending' => TestOrder::sum('price') - TestOrder::sum('amount_paid'),
            'completed_orders' => TestOrder::where('payment_status', 'paid')->count(),
            'partial_orders' => TestOrder::where('payment_status', 'partial')->count(),
        ];

        return Inertia::render('Payments/Index', [
            'payments' => $payments,
            'stats' => $stats,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(StorePaymentRequest $request)
    {
        $this->authorize('billing.manage');

        $validated = $request->validated();

        DB::transaction(function () use ($validated) {
            $order = TestOrder::findOrFail($validated['test_order_id']);

            // Create Payment Record
            Payment::create([
                ...$validated,
                'payment_id' => 'PAY-' . strtoupper(Str::random(8)),
                'processed_by' => auth()->id(),
            ]);

            // Update Order
            $newPaid = $order->amount_paid + $validated['amount_paid'];
            $status = 'partial';

            if ($newPaid >= $order->price) {
                $status = 'paid';
            }

            $order->update([
                'amount_paid' => $newPaid,
                'payment_status' => $status,
            ]);
        });

        return redirect()->back()->with('message', 'Payment recorded successfully.');
    }

    public function destroy(Payment $payment)
    {
        $this->authorize('billing.manage');

        DB::transaction(function () use ($payment) {
            $order = $payment->testOrder;

            // Revert Order Stats
            $newPaid = $order->amount_paid - $payment->amount_paid;
            $status = 'pending';

            if ($newPaid > 0) {
                $status = 'partial';
            }

            $order->update([
                'amount_paid' => $newPaid,
                'payment_status' => $status,
            ]);

            $payment->delete();
        });

        return redirect()->back()->with('message', 'Payment deleted and order updated.');
    }
}
