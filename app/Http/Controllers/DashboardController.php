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
    public function index()
    {
        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();
        $prevMonth = $now->copy()->subMonth()->startOfMonth();
        $prevMonthEnd = $now->copy()->subMonth()->endOfMonth();

        // Revenue Stats
        $currentMonthRevenue = TestOrder::whereBetween('ordered_at', [$startOfMonth, $now])->sum('price');
        $prevMonthRevenue = TestOrder::whereBetween('ordered_at', [$prevMonth, $prevMonthEnd])->sum('price');
        $revenueGrowth = $prevMonthRevenue > 0
            ? (($currentMonthRevenue - $prevMonthRevenue) / $prevMonthRevenue) * 100
            : 100;

        // Orders Stats
        $currentMonthOrders = TestOrder::whereBetween('ordered_at', [$startOfMonth, $now])->count();
        $prevMonthOrders = TestOrder::whereBetween('ordered_at', [$prevMonth, $prevMonthEnd])->count();
        $ordersGrowth = $prevMonthOrders > 0
            ? (($currentMonthOrders - $prevMonthOrders) / $prevMonthOrders) * 100
            : 100;

        // Monthly trends (Last 6 months)
        $trends = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $trends[] = [
                'month' => $month->format('M'),
                'revenue' => TestOrder::whereMonth('ordered_at', $month->month)
                    ->whereYear('ordered_at', $month->year)
                    ->sum('price'),
                'orders' => TestOrder::whereMonth('ordered_at', $month->month)
                    ->whereYear('ordered_at', $month->year)
                    ->count(),
            ];
        }

        $stats = [
            'total_patients' => Patient::count(),
            'total_tests' => Test::count(),
            'total_revenue' => TestOrder::sum('price'),
            'current_month_revenue' => $currentMonthRevenue,
            'revenue_growth' => round($revenueGrowth, 1),
            'current_month_orders' => $currentMonthOrders,
            'orders_growth' => round($ordersGrowth, 1),
            'pending_results' => TestOrder::where('status', 'pending')->count(),
            'recent_orders' => TestOrder::has('patient')->with(['patient'])->latest('ordered_at')->take(5)->get(),
            'trends' => $trends
        ];

        return Inertia::render('Dashboard', [
            'stats' => $stats,
        ]);
    }
}
