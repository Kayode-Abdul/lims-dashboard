import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import {
    Users,
    FlaskConical,
    ClipboardList,
    Clock,
    CheckCircle,
    TrendingUp,
    Plus,
    Activity,
    ArrowRight,
    ShieldCheck,
} from 'lucide-react';
import ActivateSubscription from '@/Components/ActivateSubscription';
import { formatDate } from '@/Utils/dateUtils';
import { useState } from 'react';

interface RecentOrder {
    id: number;
    order_number: string;
    status: string;
    patient: {
        id: number;
        first_name: string;
        last_name: string;
    };
}

interface Trend {
    month: string;
    revenue: number;
    orders: number;
}

interface Stats {
    total_patients: number;
    total_tests: number;
    total_revenue: number;
    current_month_revenue: number;
    revenue_growth: number;
    current_month_orders: number;
    orders_growth: number;
    pending_results: number;
    recent_orders: RecentOrder[];
    trends: Trend[];
}

export default function Dashboard({ auth, stats }: PageProps<{ stats: Stats }>) {
    const [isStatsCollapsed, setIsStatsCollapsed] = useState(false);
    const maxRevenue = Math.max(...stats.trends.map(t => t.revenue), 1);

    const statCards = [
        { label: 'Total Patients', value: stats.total_patients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', trend: null, link: route('patients.index') },
        { label: 'Pending Results', value: stats.pending_results, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', trend: null, link: route('test-orders.index', { status: 'pending' }) },
        {
            label: 'Monthly Revenue',
            value: `₦${Number(stats.current_month_revenue).toLocaleString()}`,
            icon: TrendingUp,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100',
            growth: stats.revenue_growth,
            link: route('accounting.index')
        },
        {
            label: 'Monthly Orders',
            value: stats.current_month_orders,
            icon: ClipboardList,
            color: 'text-indigo-600',
            bg: 'bg-indigo-100',
            growth: stats.orders_growth,
            link: route('test-orders.index')
        },
    ];

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Laboratory Dashboard</h2>}
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8">
                    {!auth.user.is_super_admin && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Subscription Status</h4>
                                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                        Active until {auth.user.lab?.expires_at ? formatDate(auth.user.lab.expires_at) : 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <ActivateSubscription />
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center">
                                <Activity className="h-4 w-4 mr-2" />
                                Key Indicators
                            </h3>
                            <button
                                onClick={() => setIsStatsCollapsed(!isStatsCollapsed)}
                                className="text-xs text-indigo-600 hover:text-indigo-500 font-bold uppercase tracking-tighter"
                            >
                                {isStatsCollapsed ? 'Show Stats' : 'Collapse'}
                            </button>
                        </div>

                        {!isStatsCollapsed && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                {statCards.map((stat, i) => {
                                    const isAdmin = auth.user.role === 'admin' || auth.user.is_super_admin;
                                    const displayValue = (!isAdmin && (stat.label.includes('Revenue') || stat.label.includes('Stats')))
                                        ? '****'
                                        : stat.value.toLocaleString();

                                    return (
                                        <Link key={i} href={stat.link} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700 hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-400 transition-all group">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                                                    <stat.icon className="h-5 w-5" />
                                                </div>
                                                {stat.growth !== undefined && isAdmin && (
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.growth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {stat.growth >= 0 ? '+' : ''}{stat.growth}%
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                                                <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{displayValue}</p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Revenue Trends */}
                        <div className="lg:col-span-2 space-y-4">

                            {/* Recent Orders List */}
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                                    <TrendingUp className="h-5 w-5 mr-2 text-indigo-500" />
                                    Recent Diagnostic Orders
                                </h3>
                                <Link href={route('test-orders.index')} className="text-sm text-indigo-600 hover:text-indigo-500 font-medium flex items-center">
                                    View all <ArrowRight className="ml-1 h-3 w-3" />
                                </Link>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Order #</th>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Patient</th>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-gray-700">
                                        {stats.recent_orders.map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4 font-mono text-sm font-bold">
                                                    <Link href={route('test-orders.show-batch', order.order_number.replace('/', '-'))} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                                                        {order.order_number}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
                                                    {order.patient ? (
                                                        <Link href={route('patients.show', order.patient.id)} className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline">
                                                            {order.patient.first_name} {order.patient.last_name}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-gray-400 italic">Deleted Patient</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                                <Activity className="h-5 w-5 mr-2 text-indigo-500" />
                                Monthly Revenue Trend
                            </h3>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
                                <div className="flex items-end justify-between h-48 gap-2">
                                    {stats.trends.map((t, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                            <div className="relative w-full flex flex-col justify-end h-40">
                                                <div
                                                    className="w-full bg-indigo-500/20 group-hover:bg-indigo-500/40 transition-all rounded-t-md"
                                                    style={{ height: `${(t.revenue / maxRevenue) * 100}%` }}
                                                >
                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                        ₦{Number(t.revenue).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{t.month}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Quick Actions</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <Link
                                    href={route('patients.create')}
                                    className="p-4 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all flex items-center group shadow-sm hover:shadow-md"
                                >
                                    <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mr-4">
                                        <Plus className="h-5 w-5" />
                                    </div>
                                    <span className="font-bold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Add New Patient</span>
                                </Link>
                                <Link
                                    href={route('test-orders.create')}
                                    className="p-4 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all flex items-center group shadow-sm hover:shadow-md"
                                >
                                    <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center mr-4">
                                        <FlaskConical className="h-5 w-5" />
                                    </div>
                                    <span className="font-bold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Place New Order</span>
                                </Link>
                                <Link
                                    href={route('accounting.index')}
                                    className="p-4 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all flex items-center group shadow-sm hover:shadow-md"
                                >
                                    <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center mr-4">
                                        <TrendingUp className="h-5 w-5" />
                                    </div>
                                    <span className="font-bold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Financial Insights</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
