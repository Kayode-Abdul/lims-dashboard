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
import { useState, useMemo } from 'react';
import { Search, Trash2, Calendar, Filter } from 'lucide-react';
import { router } from '@inertiajs/react';

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
    label: string;
    date: string;
    revenue: number;
    orders: number;
}

interface TestPrice {
    id: number;
    test_id: number;
    hmo_id?: number;
    hospital_id?: number;
    price: string;
}

interface TestItem {
    id: number;
    test_name: string;
    test_code: string;
    price_walk_in: string;
    price_hmo: string;
    price_doctor_referred: string;
    hmo_prices?: TestPrice[];
    hospital_prices?: TestPrice[];
}

interface Stats {
    total_patients: number;
    total_tests: number;
    total_revenue: number;
    current_day_revenue: number;
    revenue_growth: number;
    current_day_orders: number;
    orders_growth: number;
    pending_results: number;
    recent_orders: RecentOrder[];
    trends: Trend[];
    can_view_stats: boolean;
    filters: {
        start_date: string;
        end_date: string;
    };
}

export default function Dashboard({
    auth,
    stats,
    tests = [],
    hmos = [],
    hospitals = []
}: PageProps<{
    stats: Stats,
    tests: TestItem[],
    hmos: Array<{ id: number; name: string }>,
    hospitals: Array<{ id: number; name: string }>
}>) {
    const currency = auth?.user?.lab?.currency || '₦';

    const [isStatsCollapsed, setIsStatsCollapsed] = useState(false);

    // Calculator State
    const [selectedCalcTests, setSelectedCalcTests] = useState<TestItem[]>([]);
    const [calcPatientType, setCalcPatientType] = useState('walk-in');
    const [calcHmoId, setCalcHmoId] = useState<number | ''>('');
    const [calcHospitalId, setCalcHospitalId] = useState<number | ''>('');
    const [calcSearch, setCalcSearch] = useState('');
    const [calcResults, setCalcResults] = useState<TestItem[]>([]);

    // Filter State
    const [startDate, setStartDate] = useState(stats.filters.start_date);
    const [endDate, setEndDate] = useState(stats.filters.end_date);

    const handleFilter = () => {
        router.get(route('dashboard'), {
            start_date: startDate,
            end_date: endDate,
        }, { preserveScroll: true, preserveState: true });
    };

    const canViewStats = stats.can_view_stats;

    const calculatePrice = (test: TestItem) => {
        let price = 0;
        if (calcPatientType === 'walk-in') {
            price = parseFloat(test.price_walk_in);
        } else if (calcPatientType === 'hmo' && calcHmoId) {
            const specificHmoPrice = test.hmo_prices?.find(p => p.hmo_id === calcHmoId);
            price = specificHmoPrice ? parseFloat(specificHmoPrice.price) : (parseFloat(test.price_hmo) || parseFloat(test.price_walk_in));
        } else if (calcPatientType === 'referred' && calcHospitalId) {
            const specificHospitalPrice = test.hospital_prices?.find(p => p.hospital_id === calcHospitalId);
            price = specificHospitalPrice ? parseFloat(specificHospitalPrice.price) : (parseFloat(test.price_doctor_referred) || parseFloat(test.price_walk_in));
        } else {
            price = parseFloat(test.price_walk_in);
        }
        return price;
    };

    const maxRevenue = Math.max(...stats.trends.map(t => t.revenue), 1);

    const statCards = [
        { label: 'Total Patients', value: stats.total_patients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', trend: null, link: route('patients.index') },
        { label: 'Pending Results', value: stats.pending_results, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', trend: null, link: route('test-orders.index', { status: 'pending' }) },
        {
            label: "Today's Revenue",
            value: `${currency}${Number(stats.current_day_revenue).toLocaleString()}`,
            icon: TrendingUp,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100',
            growth: stats.revenue_growth,
            link: route('accounting.index')
        },
        {
            label: "Today's Orders",
            value: stats.current_day_orders,
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

                    {/* Filter Section */}
                    {canViewStats && (
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700 flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-xs font-bold text-gray-500 uppercase">Analysis Period:</span>
                            </div>
                            <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="text-sm rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:ring-indigo-500 py-1"
                                />
                                <span className="text-gray-400">to</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="text-sm rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:ring-indigo-500 py-1"
                                />
                            </div>
                            <button
                                onClick={handleFilter}
                                className="inline-flex items-center px-4 py-1.5 bg-indigo-600 border border-transparent rounded-lg font-bold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 active:bg-indigo-900 focus:outline-none transition ease-in-out duration-150 shadow-sm"
                            >
                                <Filter className="h-3.5 w-3.5 mr-1.5" />
                                Apply Filter
                            </button>
                            <button
                                onClick={() => {
                                    const today = new Date().toISOString().split('T')[0];
                                    setStartDate(today);
                                    setEndDate(today);
                                    router.get(route('dashboard'), {
                                        start_date: today,
                                        end_date: today,
                                    });
                                }}
                                className="text-xs text-gray-500 hover:text-indigo-600 font-medium ml-auto"
                            >
                                Reset to Today
                            </button>
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center">
                                <Activity className="h-4 w-4 mr-2" />
                                Key Indicators
                            </h3>
                            {canViewStats && (
                                <button
                                    onClick={() => setIsStatsCollapsed(!isStatsCollapsed)}
                                    className="text-xs text-indigo-600 hover:text-indigo-500 font-bold uppercase tracking-tighter"
                                >
                                    {isStatsCollapsed ? 'Show Stats' : 'Collapse'}
                                </button>
                            )}
                        </div>

                        {canViewStats && !isStatsCollapsed && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                {statCards.map((stat, i) => {
                                    const displayValue = stat.value;

                                    return (
                                        <Link key={i} href={stat.link} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700 hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-400 transition-all group">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                                                    <stat.icon className="h-5 w-5" />
                                                </div>
                                                {stat.growth !== undefined && (
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
                                                    <Link href={route('test-orders.show-batch', order.order_number)} className="text-indigo-600 dark:text-indigo-400 hover:underline">
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
                                Daily Revenue Trend (7 Days)
                            </h3>
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
                                    {canViewStats ? (
                                        <div className="flex items-end justify-between h-48 gap-2">
                                            {stats.trends.map((t, i) => (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                                    <div className="relative w-full flex flex-col justify-end h-40">
                                                        <div
                                                            className="w-full bg-indigo-500/20 group-hover:bg-indigo-500/40 transition-all rounded-t-md"
                                                            style={{ height: `${(t.revenue / maxRevenue) * 100}%` }}
                                                        >
                                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10" >
                                                                {t.date}: {currency}{Number(t.revenue).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{t.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed dark:border-gray-700 rounded-xl">
                                            <ShieldCheck className="h-8 w-8 text-gray-300 mb-2" />
                                            <p className="text-xs text-gray-400 text-center px-4 italic">Revenue trends are restricted to administrative users.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                        {/* Quick Actions & Price Awareness */}
                        <div className="space-y-8">
                            {/* Price Awareness Tool */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 flex flex-col">
                                <div className="p-5 border-b dark:border-gray-700 bg-indigo-50/50 dark:bg-indigo-900/10">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                                        <Activity className="h-5 w-5 mr-2 text-indigo-600" />
                                        Quick Quote Tool
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">Instant price calculation for clients</p>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Patient Type</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['walk-in', 'hmo', 'referred'].map((type) => (
                                                    <button
                                                        key={type}
                                                        onClick={() => setCalcPatientType(type)}
                                                        className={`py-2 text-[10px] font-bold uppercase rounded-lg border transition-all ${calcPatientType === type
                                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-indigo-300'
                                                            }`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {calcPatientType === 'hmo' && (
                                            <div className="animate-in slide-in-from-left duration-200">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Select HMO</label>
                                                <select
                                                    value={calcHmoId}
                                                    onChange={(e) => setCalcHmoId(Number(e.target.value))}
                                                    className="w-full text-sm rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:ring-indigo-500"
                                                >
                                                    <option value="">Choose HMO...</option>
                                                    {hmos.map(hmo => <option key={hmo.id} value={hmo.id}>{hmo.name}</option>)}
                                                </select>
                                            </div>
                                        )}

                                        {calcPatientType === 'referred' && (
                                            <div className="animate-in slide-in-from-left duration-200">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Select Hospital</label>
                                                <select
                                                    value={calcHospitalId}
                                                    onChange={(e) => setCalcHospitalId(Number(e.target.value))}
                                                    className="w-full text-sm rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:ring-indigo-500"
                                                >
                                                    <option value="">Choose Hospital...</option>
                                                    {hospitals.map(hospital => <option key={hospital.id} value={hospital.id}>{hospital.name}</option>)}
                                                </select>
                                            </div>
                                        )}

                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Find Test</label>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Enter test name or code..."
                                                    className="w-full pl-10 text-sm rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:ring-indigo-600"
                                                    value={calcSearch}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setCalcSearch(val);
                                                        if (val.length > 1) {
                                                            const filtered = tests.filter(t =>
                                                                t.test_name.toLowerCase().includes(val.toLowerCase()) ||
                                                                t.test_code.toLowerCase().includes(val.toLowerCase())
                                                            ).slice(0, 5);
                                                            setCalcResults(filtered);
                                                        } else {
                                                            setCalcResults([]);
                                                        }
                                                    }}
                                                />
                                                {calcResults.length > 0 && (
                                                    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-xl z-20 overflow-hidden divide-y dark:divide-gray-700">
                                                        {calcResults.map(test => (
                                                            <button
                                                                key={test.id}
                                                                onClick={() => {
                                                                    if (!selectedCalcTests.some(t => t.id === test.id)) {
                                                                        setSelectedCalcTests([...selectedCalcTests, test]);
                                                                    }
                                                                    setCalcSearch('');
                                                                    setCalcResults([]);
                                                                }}
                                                                className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                                                            >
                                                                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{test.test_name}</div>
                                                                <div className="text-[10px] text-gray-500 font-mono">{test.test_code}</div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quote Summary */}
                                    {selectedCalcTests.length > 0 && (
                                        <div className="mt-6 space-y-3 animate-in fade-in zoom-in duration-300">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quote Summary</h4>
                                                <button onClick={() => setSelectedCalcTests([])} className="text-[10px] text-red-500 hover:font-bold">Clear All</button>
                                            </div>
                                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                                {selectedCalcTests.map(test => {
                                                    const price = calculatePrice(test);
                                                    return (
                                                        <div key={test.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/40 p-2 rounded-lg border dark:border-gray-700">
                                                            <div className="max-w-[150px]">
                                                                <div className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{test.test_name}</div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{currency}{price.toLocaleString()}</span>
                                                                <button onClick={() => setSelectedCalcTests(selectedCalcTests.filter(t => t.id !== test.id))} className="text-gray-400 hover:text-red-500">
                                                                    <Trash2 className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="pt-4 border-t-2 border-dashed dark:border-gray-700 flex justify-between items-center">
                                                <span className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase">Grand Total</span>
                                                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{currency}{selectedCalcTests.reduce((acc, test) => acc + calculatePrice(test), 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {selectedCalcTests.length === 0 && !calcSearch && (
                                        <div className="py-8 flex flex-col items-center justify-center border-2 border-dashed dark:border-gray-700 rounded-xl">
                                            <FlaskConical className="h-8 w-8 text-gray-300 mb-2" />
                                            <p className="text-xs text-gray-400 text-center px-4 italic">Select tests above to start generating a price quote.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

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
