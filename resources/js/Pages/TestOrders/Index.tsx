import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import {
    Plus,
    Search,
    Clock,
    Eye,
    Trash2,
    FlaskConical,
    DollarSign,
    Package,
    CheckCircle,
    Loader,
    TestTube,
    Building2,
    UserCircle,
    Edit
} from 'lucide-react';
import { useState, ChangeEvent } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

interface Patient {
    id: number;
    first_name: string;
    last_name: string;
    patient_id: string;
}

interface User {
    id: number;
    first_name: string;
    last_name: string;
}

interface GroupedOrder {
    order_number: string;
    patient_id: number;
    ordered_by: number;
    ordered_at: string;
    notes: string | null;
    total_price: string;
    total_discount: string;
    total_paid: string;
    test_count: number;
    tests: string[];
    balance: number;
    payment_status: 'pending' | 'partial' | 'paid';
    status: 'pending' | 'collected' | 'processing' | 'completed' | 'cancelled';
    patient: Patient;
    ordered_by_user: User;
    hospital?: { name: string } | null;
    doctor?: { name: string } | null;
}

interface PaginatedOrders {
    data: GroupedOrder[];
    links: any[];
    current_page: number;
    last_page: number;
    total: number;
}

export default function Index({ auth, orders, filters }: PageProps<{
    orders: PaginatedOrders;
    filters: { search?: string; status?: string };
}>) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('test-orders.index'), { search: searchTerm }, { preserveState: true });
    };

    const handleStatusFilter = (status: string) => {
        router.get(route('test-orders.index'), { ...filters, status }, { preserveState: true });
    };

    const deleteOrder = (orderNumber: string) => {
        if (confirm('Delete all tests in this order? This cannot be undone.')) {
            router.delete(route('test-orders.destroy-batch', orderNumber.replace(/\//g, '-')), {
                onSuccess: () => {
                    // Success handling is usually via Inertia redirection/flash
                }
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'collected': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'processing': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'partial': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
            case 'pending': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="h-3 w-3" />;
            case 'collected': return <TestTube className="h-3 w-3" />;
            case 'processing': return <Loader className="h-3 w-3 animate-spin" />;
            case 'completed': return <CheckCircle className="h-3 w-3" />;
            default: return <Clock className="h-3 w-3" />;
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Test Orders</h2>}
        >
            <Head title="Test Orders" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <TextInput
                                type="search"
                                placeholder="Search by order #, patient name..."
                                className="pl-10 w-full"
                                value={searchTerm}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.currentTarget.value)}
                            />
                        </form>

                        <div className="flex items-center gap-3">
                            <select
                                className="border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md shadow-sm text-sm"
                                value={filters.status || 'all'}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => handleStatusFilter(e.currentTarget.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="collected">Collected</option>
                                <option value="processing">Processing</option>
                                <option value="completed">Completed</option>
                            </select>

                            <Link href={route('test-orders.create')}>
                                <PrimaryButton>
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Order
                                </PrimaryButton>
                            </Link>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Total Orders</p>
                                    <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{orders.total}</p>
                                </div>
                                <Package className="h-8 w-8 text-indigo-500" />
                            </div>
                        </div>
                    </div>

                    {/* Orders Table */}
                    <div className="bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg border dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-900/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Order</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Patient & Tests</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Progress</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-gray-700">
                                    {orders.data.map((order) => (
                                        <tr key={order.order_number} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <Link href={route('test-orders.show-batch', order.order_number.replace('/', '-'))}>
                                                        <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono text-sm hover:underline cursor-pointer">
                                                            {order.order_number}
                                                        </span>
                                                    </Link>
                                                    <span className="text-[10px] text-gray-500 mt-1 flex items-center">
                                                        {order.ordered_at ? (
                                                            <>
                                                                {new Date(order.ordered_at).toLocaleDateString('en-GB')} {new Date(order.ordered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </>
                                                        ) : 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <Link href={route('patients.show', order.patient_id)} className="hover:underline cursor-pointer">
                                                        <span className="font-black text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400">
                                                            {order.patient?.first_name || 'Deleted'} {order.patient?.last_name || 'Patient'}
                                                        </span>
                                                    </Link>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {order.tests.slice(0, 3).map((test, i) => (
                                                            <span key={i} className="text-[10px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-medium">
                                                                {test}
                                                            </span>
                                                        ))}
                                                        {order.tests.length > 3 && (
                                                            <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">
                                                                +{order.tests.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                    {(order.hospital || order.doctor) && (
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            {order.hospital && (
                                                                <span className="text-[10px] text-gray-400 flex items-center">
                                                                    <Building2 className="h-2.5 w-2.5 mr-1" />
                                                                    {order.hospital.name}
                                                                </span>
                                                            )}
                                                            {order.doctor && (
                                                                <span className="text-[10px] text-gray-400 flex items-center">
                                                                    <UserCircle className="h-2.5 w-2.5 mr-1" />
                                                                    {order.doctor.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-xs text-gray-900 dark:text-gray-100">
                                                        <span className="font-bold">₦{parseFloat(order.total_price || '0').toLocaleString()}</span>
                                                        {parseFloat(order.total_discount || '0') > 0 && (
                                                            <span className="ml-1 text-green-600 text-[10px]">
                                                                (-₦{parseFloat(order.total_discount || '0').toLocaleString()})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${getPaymentStatusColor(order.payment_status)}`}>
                                                            {order.payment_status.toUpperCase()}
                                                        </span>
                                                        {(order.balance ?? 0) > 0 && (
                                                            <span className="text-[9px] font-bold text-red-500">
                                                                Bal: ₦{(order.balance ?? 0).toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit ${getStatusColor(order.status)}`}>
                                                    {getStatusIcon(order.status)}
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link
                                                        href={route('test-orders.show-batch', order.order_number.replace(/\//g, '-'))}
                                                        className="p-1.5 rounded hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-indigo-600"
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                    <Link
                                                        href={route('test-orders.edit-batch', order.order_number.replace(/\//g, '-'))}
                                                        className="p-1.5 rounded hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-amber-500"
                                                        title="Edit Order"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => deleteOrder(order.order_number)}
                                                        className="p-1.5 rounded hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-red-500"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {orders.data.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center">
                                                <FlaskConical className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                                <p className="text-gray-500 dark:text-gray-400">No orders found</p>
                                                <Link href={route('test-orders.create')} className="text-indigo-600 hover:underline text-sm mt-2 inline-block">
                                                    Create your first order
                                                </Link>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {orders.last_page > 1 && (
                            <div className="px-6 py-4 border-t dark:border-gray-700 flex justify-between items-center">
                                <span className="text-sm text-gray-500">
                                    Page {orders.current_page} of {orders.last_page}
                                </span>
                                <div className="flex gap-2">
                                    {orders.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`px-3 py-1 rounded text-sm ${link.active
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
