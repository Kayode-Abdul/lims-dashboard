import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import {
    Search,
    Plus,
    Trash2,
    Eye,
    DollarSign,
    CreditCard,
    Receipt,
    CheckCircle,
    Clock,
    XCircle,
    TrendingUp,
    Wallet,
    User
} from 'lucide-react';
import { useState } from 'react';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { formatDate } from '@/Utils/dateUtils';

interface Payment {
    id: number;
    payment_id: string;
    test_order_id: number;
    amount_paid: number;
    payment_method: string;
    payment_date: string;
    notes: string | null;
    created_at: string;
    test_order: {
        order_number: string;
        price: number;
        amount_paid: number;
        payment_status: 'pending' | 'partial' | 'paid';
        patient: {
            first_name: string;
            last_name: string;
        };
        test: {
            test_name: string;
        };
    };
    processed_by: {
        first_name: string;
        last_name: string;
    };
}

interface PaginatedPayments {
    data: Payment[];
    total: number;
    links: any[];
}

interface Stats {
    total_collected: number;
    total_pending: number;
    completed_orders: number;
    partial_orders: number;
}

export default function Index({ auth, payments, stats, filters }: PageProps<{
    payments: PaginatedPayments;
    stats: Stats;
    filters: { search?: string };
}>) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [showingDetails, setShowingDetails] = useState<Payment | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('payments.index'), { search: searchTerm }, { preserveState: true });
    };

    const deletePayment = (id: number) => {
        if (confirm('Are you sure you want to delete this payment record? This will revert the order status.')) {
            router.delete(route('payments.destroy', id));
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Billing & Payments</h2>}
        >
            <Head title="Payments" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                                <DollarSign className="h-5 w-5 text-green-500" />
                                <span className="text-xs font-bold text-gray-400 uppercase">Total Collected</span>
                            </div>
                            <div className="text-2xl font-black text-gray-900 dark:text-white">
                                {formatCurrency(stats.total_collected)}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                                <Clock className="h-5 w-5 text-yellow-500" />
                                <span className="text-xs font-bold text-gray-400 uppercase">Total Pending</span>
                            </div>
                            <div className="text-2xl font-black text-gray-900 dark:text-white">
                                {formatCurrency(stats.total_pending)}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                                <CheckCircle className="h-5 w-5 text-indigo-500" />
                                <span className="text-xs font-bold text-gray-400 uppercase">Paid Orders</span>
                            </div>
                            <div className="text-2xl font-black text-gray-900 dark:text-white">
                                {stats.completed_orders}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                                <TrendingUp className="h-5 w-5 text-blue-500" />
                                <span className="text-xs font-bold text-gray-400 uppercase">Partial Payments</span>
                            </div>
                            <div className="text-2xl font-black text-gray-900 dark:text-white">
                                {stats.partial_orders}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
                        <div className="flex items-center space-x-4 flex-1 w-full max-w-md">
                            <form onSubmit={handleSearch} className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <TextInput
                                    className="pl-10 w-full"
                                    placeholder="Search by Payment ID or Patient..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </form>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Payment ID</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Patient</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Amount Paid</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Method</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status After</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {payments.data.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                                {payment.payment_id}
                                            </div>
                                            <div className="text-[10px] text-gray-500">Ref: {payment.test_order?.order_number || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                {payment.test_order?.patient?.first_name || 'Unknown'} {payment.test_order?.patient?.last_name || ''}
                                            </div>
                                            <div className="text-[10px] text-gray-500">{payment.test_order?.test?.test_name || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-green-600">
                                            {formatCurrency(payment.amount_paid)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                                {payment.payment_method === 'Cash' ? <DollarSign className="h-3 w-3 mr-1" /> : <CreditCard className="h-3 w-3 mr-1" />}
                                                {payment.payment_method}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${payment.test_order?.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {payment.test_order?.payment_status || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                            {formatDate(payment.payment_date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => setShowingDetails(payment)}
                                                    className="p-1.5 rounded hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-indigo-600"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => deletePayment(payment.id)}
                                                    className="p-1.5 rounded hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {payments.data.length === 0 && (
                            <div className="py-16 text-center">
                                <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 italic font-medium">No transactions recorded yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            <Modal show={showingDetails !== null} onClose={() => setShowingDetails(null)}>
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                        <Receipt className="mr-2 h-5 w-5 text-indigo-500" />
                        Transaction Receipt: {showingDetails?.payment_id}
                    </h2>

                    <div className="space-y-6">
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-dashed dark:border-gray-700">
                            <div className="flex justify-between items-start mb-6 pb-6 border-b border-dashed dark:border-gray-700">
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Patient Name</div>
                                    <div className="text-lg font-black text-gray-900 dark:text-white uppercase">
                                        {showingDetails?.test_order.patient.first_name} {showingDetails?.test_order.patient.last_name}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Date Paid</div>
                                    <div className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                        {showingDetails && new Date(showingDetails.payment_date).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-700">
                                    <span className="text-sm font-bold text-gray-500">Service rendered:</span>
                                    <span className="text-sm font-black text-gray-800 dark:text-gray-100">{showingDetails?.test_order.test.test_name}</span>
                                </div>
                                <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-700">
                                    <span className="text-sm font-bold text-gray-500">Order Total:</span>
                                    <span className="text-sm font-black text-indigo-600">{showingDetails && formatCurrency(Number(showingDetails.test_order.price))}</span>
                                </div>
                                <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
                                    <span className="text-sm font-black text-green-800 dark:text-green-300 uppercase">Amount Paid:</span>
                                    <span className="text-xl font-black text-green-600">{showingDetails && formatCurrency(Number(showingDetails.amount_paid))}</span>
                                </div>
                                <div className="flex justify-between items-center p-3">
                                    <span className="text-sm font-bold text-gray-500 uppercase">Remaining Balance:</span>
                                    <span className={`text-sm font-black ${showingDetails && (Number(showingDetails.test_order.price) - Number(showingDetails.test_order.amount_paid)) > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                        {showingDetails && formatCurrency(
                                            // Backend provides 'price' and 'amount_paid' which are sufficient.
                                            // If 'balance' attribute is available in JSON, use it, otherwise calc.
                                            // The backend appends 'balance', so we can assume it's there if interface updated.
                                            // But even without updating interface, the calc is robust:
                                            Number(showingDetails.test_order.price) - Number(showingDetails.test_order.amount_paid)
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-[11px] text-gray-500 uppercase tracking-wider font-bold">
                        <div className="flex items-center">
                            <User className="h-3 w-3 mr-2 text-indigo-400" />
                            Processed By: {showingDetails?.processed_by.first_name} {showingDetails?.processed_by.last_name}
                        </div>
                        <div className="flex items-center">
                            <Wallet className="h-3 w-3 mr-2 text-blue-400" />
                            Method: {showingDetails?.payment_method}
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3 pt-6 border-t dark:border-gray-700">
                        <SecondaryButton onClick={() => setShowingDetails(null)}>
                            Close
                        </SecondaryButton>
                        <PrimaryButton onClick={() => window.print()}>
                            Print Receipt
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
