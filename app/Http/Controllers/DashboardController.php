<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\Test;
use App\Models\TestOrder;
use App\Models\TestResult;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $canViewStats = $user->is_super_admin || 
                        in_array($user->role, ['admin', 'lab_admin']) || 
                        ($user->permissions && (
                            in_array('audit.view', $user->permissions) || 
                            in_array('accounting.view', $user->permissions) ||
                            in_array('View System Audit Logs', $user->permissions) ||
                            in_array('View Financial Reports', $user->permissions)
                        ));

        $startDate = $request->get('start_date', Carbon::today()->toDateString());
        $endDate = $request->get('end_date', Carbon::today()->toDateString());

        $now = Carbon::now();
        
        // Stats in range
        $rangeOrders = TestOrder::whereBetween('ordered_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
        $totalOrdersInRange = $rangeOrders->count();
        $totalRevenueInRange = $canViewStats ? $rangeOrders->sum('price') : 0;

        // Comparison (Previous Period of same duration)
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);
        $days = $start->diffInDays($end) + 1;
        
        $prevStart = $start->copy()->subDays($days);
        $prevEnd = $end->copy()->subDays($days);

        $prevRangeOrders = TestOrder::whereBetween('ordered_at', [$prevStart . ' 00:00:00', $prevEnd . ' 23:59:59']);
        $prevOrdersCount = $prevRangeOrders->count();
        $prevRevenueSum = $canViewStats ? $prevRangeOrders->sum('price') : 0;

        $revenueGrowth = $prevRevenueSum > 0
            ? (($totalRevenueInRange - $prevRevenueSum) / $prevRevenueSum) * 100
            : ($totalRevenueInRange > 0 ? 100 : 0);

        $ordersGrowth = $prevOrdersCount > 0
            ? (($totalOrdersInRange - $prevOrdersCount) / $prevOrdersCount) * 100
            : ($totalOrdersInRange > 0 ? 100 : 0);

        // Daily trends (Always last 7 days regardless of filter for visual consistency, or should it follow filter?)
        // Let's make it follow filter if range is <= 31 days, otherwise keep last 7 days?
        // User asked for "date range will handle that" for full details. 
        // Let's make trends follow range if range is small enough.
        
        $trends = [];
        $trendStart = $start;
        $trendEnd = $end;
        
        // If range is > 14 days, just show last 14 days in trend for readability
        if ($days > 14) {
            $trendStart = $end->copy()->subDays(13);
        }

        for ($date = $trendStart->copy(); $date->lte($trendEnd); $date->addDay()) {
            $trends[] = [
                'label' => $date->format('D'),
                'date' => $date->format('M d'),
                'revenue' => $canViewStats ? TestOrder::whereDate('ordered_at', $date->toDateString())->sum('price') : 0,
                'orders' => TestOrder::whereDate('ordered_at', $date->toDateString())->count(),
            ];
        }

        $stats = [
            'total_patients' => Patient::whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])->count(),
            'total_tests' => Test::count(),
            'total_revenue' => $canViewStats ? TestOrder::sum('price') : 0,
            'current_day_revenue' => $totalRevenueInRange,
            'revenue_growth' => round($revenueGrowth, 1),
            'current_day_orders' => $totalOrdersInRange,
            'orders_growth' => round($ordersGrowth, 1),
            'pending_results' => TestOrder::where('status', 'pending')
                ->whereBetween('ordered_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                ->count(),
            'recent_orders' => TestOrder::has('patient')->with(['patient'])->latest('ordered_at')->take(5)->get(),
            'trends' => $trends,
            'can_view_stats' => $canViewStats,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ]
        ];

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'tests' => Test::where('is_active', true)
                ->with(['hmoPrices', 'hospitalPrices'])
                ->get(['id', 'test_name', 'test_code', 'price_walk_in', 'price_hmo', 'price_doctor_referred']),
            'hmos' => \App\Models\Hmo::where('is_active', true)->get(['id', 'name']),
            'hospitals' => \App\Models\Hospital::where('is_active', true)->get(['id', 'name']),
        ]);
    }
}
