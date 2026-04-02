import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import {
    DollarSign,
    ArrowUpCircle,
    Calendar,
    Filter,
    ArrowLeft,
    Building2,
    Briefcase,
    TrendingUp,
    FileText,
    User
} from 'lucide-react';
import { formatDate } from '@/Utils/dateUtils';
import { useState } from 'react';

interface Hospital {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
}

interface Stats {
    total_orders: number;
    total_billed: string | number;
    total_discount: string | number;
    total_paid: string | number;
    outstanding: number;
}

interface Transaction {
    order_number: string;
    ordered_at: string;
    total_price: string | number;
    total_discount: string | number;
    total_paid: string | number;
    patient: {
        first_name: string;
        last_name: string;
    };
    doctor: {
        name: string;
    } | null;
}

interface PaginatedTransactions {
    data: Transaction[];
    total: number;
    current_page: number;
    last_page: number;
    links: any[];
}

interface Props extends PageProps {
    hospital: Hospital;
    stats: Stats;
    transactions: PaginatedTransactions;
    doctors: { id: number; name: string }[];
    filters: {
        start_date: string;
        end_date: string;
        doctor_id: string;
    };
}

export default function Account({ hospital, stats, transactions, doctors, filters }: Props) {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [doctorId, setDoctorId] = useState(filters.doctor_id || '');

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('hospitals.account', hospital.id), {
            start_date: startDate,
            end_date: endDate,
            doctor_id: doctorId,
        }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                            <ArrowLeft className="h-5 w-5 text-gray-500" />
                        </button>
                        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                            Hospital Financial Account: <span className="text-indigo-600 dark:text-indigo-400">{hospital.name}</span>
                        </h2>
                    </div>
                </div>
            }
        >
            <Head title={`Account - ${hospital.name}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Filter & Summary Bar */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 border-b dark:border-gray-700">
                        <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <TextInput
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="text-sm"
                                />
                                <span className="text-gray-500">to</span>
                                <TextInput
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="text-sm"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <select
                                    value={doctorId}
                                    onChange={(e) => setDoctorId(e.target.value)}
                                    className="border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm text-sm"
                                >
                                    <option value="">All Doctors</option>
                                    {doctors.map(doctor => (
                                        <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                                    ))}
                                </select>
                            </div>
                            <PrimaryButton type="submit" className="flex items-center gap-2">
                                <Filter className="h-4 w-4" /> Filter Report
                            </PrimaryButton>
                        </form>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">Total Orders</span>
                                    <FileText className="h-6 w-6 text-indigo-500" />
                                </div>
                                <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
                                    {stats.total_orders}
                                </div>
                            </div>

                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-xl border border-emerald-100 dark:border-emerald-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">Total Billed</span>
                                    <TrendingUp className="h-6 w-6 text-emerald-500" />
                                </div>
                                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                                    ₦{Number(stats.total_billed).toLocaleString()}
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">Total Paid</span>
                                    <ArrowUpCircle className="h-6 w-6 text-blue-500" />
                                </div>
                                <div className="text-2xl font-black text-blue-700 dark:text-blue-300">
                                    ₦{Number(stats.total_paid).toLocaleString()}
                                </div>
                            </div>

                            <div className="bg-rose-50 dark:bg-rose-900/20 p-6 rounded-xl border border-rose-100 dark:border-rose-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">Outstanding</span>
                                    <DollarSign className="h-6 w-6 text-rose-500" />
                                </div>
                                <div className="text-2xl font-black text-rose-700 dark:text-rose-300">
                                    ₦{Number(stats.outstanding).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transaction List */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 border-b dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-emerald-500" /> Detailed Transaction log
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-900/50">
                                    <tr className="text-xs font-bold text-gray-500 uppercase">
                                        <th className="py-4 px-6">Date</th>
                                        <th className="py-4 px-6">Order #</th>
                                        <th className="py-4 px-6">Patient</th>
                                        <th className="py-4 px-6">Doctor</th>
                                        <th className="py-4 px-6 text-right">Billed (₦)</th>
                                        <th className="py-4 px-6 text-right">Paid (₦)</th>
                                        <th className="py-4 px-6 text-right">Balance (₦)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-gray-700 text-sm">
                                    {transactions.data.length > 0 ? transactions.data.map((tx, idx) => {
                                        const balance = (Number(tx.total_price) - Number(tx.total_discount)) - Number(tx.total_paid);
                                        return (
                                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                                <td className="py-4 px-6 text-gray-500 whitespace-nowrap">
                                                    {formatDate(tx.ordered_at)}
                                                </td>
                                                <td className="py-4 px-6 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                    {tx.order_number}
                                                </td>
                                                <td className="py-4 px-6 font-medium text-gray-800 dark:text-gray-200">
                                                    {tx.patient.first_name} {tx.patient.last_name}
                                                </td>
                                                <td className="py-4 px-6 text-gray-500">
                                                    {tx.doctor?.name || '---'}
                                                </td>
                                                <td className="py-4 px-6 text-right font-bold text-gray-900 dark:text-gray-100">
                                                    {Number(tx.total_price).toLocaleString()}
                                                </td>
                                                <td className="py-4 px-6 text-right font-bold text-emerald-600">
                                                    {Number(tx.total_paid).toLocaleString()}
                                                </td>
                                                <td className={`py-4 px-6 text-right font-black ${balance > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                                                    {balance.toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-gray-400 italic">No transactions found for the selected filters.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
