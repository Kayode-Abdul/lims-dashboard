import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import {
    DollarSign,
    ArrowUpCircle,
    ArrowDownCircle,
    Wallet,
    Calendar,
    Plus,
    Trash2,
    PieChart,
    Filter,
    Eye,
    EyeOff
} from 'lucide-react';
import { formatDate } from '@/Utils/dateUtils';
import { FormEventHandler, useState } from 'react';

interface IncomeSource {
    total_amount: string | number;
    source_type: string;
    source_name: string;
}

interface Expense {
    id: number;
    amount: string | number;
    category: string;
    description: string;
    entry_date: string;
    creator: {
        first_name: string;
        last_name: string;
    };
}

interface Props extends PageProps {
    incomeData: IncomeSource[];
    expenses: Expense[];
    stats: {
        totalIncome: number;
        totalExpenses: number;
        netProfit: number;
    };
    filters: {
        start_date: string;
        end_date: string;
    };
}

export default function Index({ auth, stats, expenses, incomeData, filters }: Props) {
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);
    const [isAddingExpense, setIsAddingExpense] = useState(false);
    const [revealStats, setRevealStats] = useState(auth.user.role === 'admin' || auth.user.is_super_admin);
    const [selectedSource, setSelectedSource] = useState<IncomeSource | null>(null);
    const [sourcePatients, setSourcePatients] = useState<any[]>([]);
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [autoPayAll, setAutoPayAll] = useState(false);
    const [expenseCategories, setExpenseCategories] = useState(['Reagents', 'Equipment', 'Salaries', 'Utilities', 'Rent', 'Consumables', 'Marketing', 'Repairs', 'Other']);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const canManageFinance = auth.user.is_super_admin || (auth.user as any).permissions?.includes('billing.manage');

    const formatAmount = (amount: number) => {
        if (!revealStats && auth.user.role !== 'admin' && !auth.user.is_super_admin) {
            return '****';
        }
        return `₦${Number(amount).toLocaleString()}`;
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        amount: '',
        category: 'Reagents',
        description: '',
        entry_date: new Date().toISOString().split('T')[0],
    });

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('accounting.index'), {
            start_date: startDate,
            end_date: endDate,
        }, { preserveState: true });
    };

    const submitExpense: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('expenses.store'), {
            onSuccess: () => {
                reset();
                setIsAddingExpense(false);
            },
        });
    };

    const deleteExpense = (id: number) => {
        if (confirm('Are you sure you want to delete this expense record?')) {
            router.delete(route('expenses.destroy', id));
        }
    };

    const fetchSourcePatients = (source: IncomeSource) => {
        setLoadingPatients(true);
        setSourcePatients([]);
        fetch(route('accounting.source-patients') + `?source_type=${source.source_type}&source_name=${encodeURIComponent(source.source_name)}&start_date=${startDate}&end_date=${endDate}`)
            .then(res => res.json())
            .then(data => {
                setSourcePatients(data);
                setLoadingPatients(false);
            })
            .catch(err => {
                console.error(err);
                setLoadingPatients(false);
            });
    };

    const handleBatchPay = () => {
        if (!selectedSource) return;
        
        router.post(route('accounting.batch-pay'), {
            source_type: selectedSource.source_type,
            source_name: selectedSource.source_name,
            payment_method: 'Cash', // Default or prompt
            start_date: startDate,
            end_date: endDate
        }, {
            onSuccess: () => {
                setSelectedSource(null);
                setAutoPayAll(false);
            }
        });
    };

    const addCategory = () => {
        if (newCategoryName.trim() && !expenseCategories.includes(newCategoryName.trim())) {
            setExpenseCategories([...expenseCategories, newCategoryName.trim()]);
            setData('category', newCategoryName.trim());
            setNewCategoryName('');
            setIsAddingCategory(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Financial Overview & Accounting</h2>}
        >
            <Head title="Accounting" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Filter & Summary Bar */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                                <PrimaryButton type="submit" className="flex items-center gap-2">
                                    <Filter className="h-4 w-4" /> Filter
                                </PrimaryButton>
                                <button
                                    type="button"
                                    onClick={() => setRevealStats(!revealStats)}
                                    className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                                    title={revealStats ? "Hide Financials" : "Show Financials"}
                                >
                                    {revealStats ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </form>

                            {canManageFinance && (
                                <PrimaryButton
                                    onClick={() => setIsAddingExpense(!isAddingExpense)}
                                    className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" /> Record Expense
                                </PrimaryButton>
                            )}
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-xl border border-emerald-100 dark:border-emerald-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-emerald-600 dark:text-emerald-400 text-sm font-bold uppercase tracking-wider">Total Income</span>
                                    <ArrowUpCircle className="h-8 w-8 text-emerald-500" />
                                </div>
                                <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
                                    {formatAmount(stats.totalIncome)}
                                </div>
                            </div>

                            <div className="bg-rose-50 dark:bg-rose-900/20 p-6 rounded-xl border border-rose-100 dark:border-rose-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-rose-600 dark:text-rose-400 text-sm font-bold uppercase tracking-wider">Total Expenses</span>
                                    <ArrowDownCircle className="h-8 w-8 text-rose-500" />
                                </div>
                                <div className="text-3xl font-black text-rose-700 dark:text-rose-300">
                                    {formatAmount(stats.totalExpenses)}
                                </div>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-xl border border-amber-100 dark:border-amber-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-amber-600 dark:text-amber-400 text-sm font-bold uppercase tracking-wider">Net Profit</span>
                                    <Wallet className="h-8 w-8 text-amber-500" />
                                </div>
                                <div className="text-3xl font-black text-amber-700 dark:text-amber-300">
                                    {formatAmount(stats.netProfit)}
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-blue-600 dark:text-blue-400 text-sm font-bold uppercase tracking-wider">Total Billed</span>
                                    <PieChart className="h-8 w-8 text-blue-500" />
                                </div>
                                <div className="text-3xl font-black text-blue-700 dark:text-blue-300">
                                    {formatAmount((stats as any).totalBilled)}
                                </div>
                            </div>

                            <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl border border-orange-100 dark:border-orange-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-orange-600 dark:text-orange-400 text-sm font-bold uppercase tracking-wider">Outstanding</span>
                                    <DollarSign className="h-8 w-8 text-orange-500" />
                                </div>
                                <div className="text-3xl font-black text-orange-700 dark:text-orange-300">
                                    {formatAmount((stats as any).outstanding)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Record Expense Form (Collapsible) */}
                    {isAddingExpense && (
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 border-2 border-indigo-500 animate-in fade-in slide-in-from-top-4 duration-300">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                                <Plus className="h-5 w-5 text-indigo-500" /> New Expense Entry
                            </h3>
                            <form onSubmit={submitExpense} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div>
                                    <InputLabel htmlFor="amount" value="Amount (₦)" />
                                    <TextInput
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        className="mt-1 block w-full"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.amount} className="mt-2" />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <InputLabel htmlFor="category" value="Category" />
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingCategory(true)}
                                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center"
                                        >
                                            <Plus className="h-2.5 w-2.5 mr-0.5" /> ADD NEW
                                        </button>
                                    </div>
                                    {isAddingCategory ? (
                                        <div className="flex gap-1 animate-in zoom-in-95 duration-200">
                                            <TextInput
                                                className="block w-full h-8 text-xs"
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                placeholder="Category Name"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        addCategory();
                                                    }
                                                    if (e.key === 'Escape') setIsAddingCategory(false);
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={addCategory}
                                                className="bg-indigo-600 text-white p-1 rounded hover:bg-indigo-700"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsAddingCategory(false)}
                                                className="text-gray-400 p-1 hover:text-gray-600"
                                            >
                                                <EyeOff className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <select
                                            id="category"
                                            className="block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm h-11"
                                            value={data.category}
                                            onChange={(e) => setData('category', e.target.value)}
                                            required
                                        >
                                            {expenseCategories.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    )}
                                    <InputError message={errors.category} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="entry_date" value="Date" />
                                    <TextInput
                                        id="entry_date"
                                        type="date"
                                        className="mt-1 block w-full"
                                        value={data.entry_date}
                                        onChange={(e) => setData('entry_date', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.entry_date} className="mt-2" />
                                </div>
                                <div className="md:col-span-3">
                                    <InputLabel htmlFor="description" value="Description" />
                                    <TextInput
                                        id="description"
                                        className="mt-1 block w-full"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        required
                                        placeholder="e.g. Purchase of chemistry reagents from vendor X"
                                    />
                                    <InputError message={errors.description} className="mt-2" />
                                </div>
                                <div className="flex gap-2">
                                    <PrimaryButton className="w-full justify-center" disabled={processing}>
                                        Save Entry
                                    </PrimaryButton>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingExpense(false)}
                                        className="px-4 py-2 text-gray-500 hover:text-gray-700"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Income Source Breakdown */}
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 border-b dark:border-gray-700 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <PieChart className="h-5 w-5 text-emerald-500" /> Income by Source
                                </h3>
                            </div>
                            <div className="p-6 overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-xs font-bold text-gray-500 uppercase">
                                            <th className="pb-3 px-2">Source Type</th>
                                            <th className="pb-3 px-2">Account Name</th>
                                            <th className="pb-3 px-2 text-right">Total Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-gray-700">
                                        {incomeData.length > 0 ? incomeData.map((item, idx) => (
                                            <tr 
                                                key={idx} 
                                                className="text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                                onClick={() => {
                                                    setSelectedSource(item);
                                                    fetchSourcePatients(item);
                                                }}
                                            >
                                                <td className="py-3 px-2 font-medium">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase ${item.source_type === 'Walk-in' ? 'bg-blue-100 text-blue-700' :
                                                        item.source_type === 'HMO' ? 'bg-purple-100 text-purple-700' :
                                                            item.source_type === 'Hospital' ? 'bg-orange-100 text-orange-700' :
                                                                'bg-teal-100 text-teal-700'
                                                        }`}>
                                                        {item.source_type}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 text-gray-600 dark:text-gray-400 font-bold">{item.source_name}</td>
                                                <td className="py-3 px-2 text-right font-bold text-gray-900 dark:text-gray-100">₦{Number(item.total_amount).toLocaleString()}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={3} className="py-8 text-center text-gray-400 italic">No income records found for this period.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

            {/* Source Details Modal */}
            <Modal show={selectedSource !== null} onClose={() => setSelectedSource(null)} maxWidth="2xl">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold dark:text-gray-100">
                                {selectedSource?.source_name}
                            </h2>
                            <p className="text-sm text-gray-500">{selectedSource?.source_type} Source Analysis</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <label className="flex items-center text-xs font-bold text-indigo-600 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-gray-300 mr-1"
                                        checked={autoPayAll}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                if (confirm(`Are you sure you want to mark all ${sourcePatients.length} orders as PAID? This will create payment records for all of them.`)) {
                                                    setAutoPayAll(true);
                                                    handleBatchPay();
                                                }
                                            } else {
                                                setAutoPayAll(false);
                                            }
                                        }}
                                    />
                                    AUTO PAY ALL
                                </label>
                            </div>
                            <SecondaryButton onClick={() => setSelectedSource(null)}>Close</SecondaryButton>
                        </div>
                    </div>

                    <div className="overflow-x-auto border rounded-lg dark:border-gray-700">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr className="text-[10px] font-bold text-gray-500 uppercase">
                                    <th className="p-3">Patient</th>
                                    <th className="p-3">Order # / Date</th>
                                    <th className="p-3 text-right">Order Total</th>
                                    <th className="p-3 text-right">Discount</th>
                                    <th className="p-3 text-right text-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20">Paid in Period</th>
                                    <th className="p-3 text-right">Total Paid</th>
                                    <th className="p-3 text-right">Balance</th>
                                    <th className="p-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {loadingPatients ? (
                                    <tr><td colSpan={8} className="p-8 text-center">Loading patients...</td></tr>
                                ) : sourcePatients.length === 0 ? (
                                    <tr><td colSpan={8} className="p-8 text-center italic text-gray-500">No records found for this source in the selected period.</td></tr>
                                ) : sourcePatients.map((p: any) => (
                                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="p-3 font-medium dark:text-gray-200">
                                            {p.patient.first_name} {p.patient.last_name}
                                        </td>
                                        <td className="p-3">
                                            <div className="font-mono text-xs">{p.order_number}</div>
                                            <div className="text-[10px] text-gray-400">{formatDate(p.ordered_at)}</div>
                                        </td>
                                        <td className="p-3 text-right">₦{Number(p.price).toLocaleString()}</td>
                                        <td className="p-3 text-right text-orange-500">₦{Number(p.discount).toLocaleString()}</td>
                                        <td className="p-3 text-right text-indigo-700 font-black bg-indigo-50/30 dark:bg-indigo-900/10">
                                            ₦{Number(p.period_payments || 0).toLocaleString()}
                                        </td>
                                        <td className="p-3 text-right text-emerald-600 font-bold">₦{Number(p.amount_paid).toLocaleString()}</td>
                                        <td className="p-3 text-right text-red-500 font-bold">₦{(p.price - p.discount - p.amount_paid).toLocaleString()}</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                                p.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {p.payment_status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Summary Footer */}
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg flex justify-between items-center border dark:border-gray-700">
                        <span className="text-sm font-bold text-gray-500 uppercase">Period Total for Source:</span>
                        <span className="text-xl font-black text-indigo-600">
                            ₦{sourcePatients.reduce((acc, curr) => acc + Number(curr.period_payments || 0), 0).toLocaleString()}
                        </span>
                    </div>
                </div>
            </Modal>

                        {/* Recent Expenses List */}
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 border-b dark:border-gray-700 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <ArrowDownCircle className="h-5 w-5 text-rose-500" /> Expense Records
                                </h3>
                            </div>
                            <div className="p-6 overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-xs font-bold text-gray-500 uppercase">
                                            <th className="pb-3 px-2">Date</th>
                                            <th className="pb-3 px-2">Category / Desc</th>
                                            <th className="pb-3 px-2 text-right">Amount</th>
                                            <th className="pb-3 px-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-gray-700">
                                        {expenses.length > 0 ? expenses.map((expense) => (
                                            <tr key={expense.id} className="text-sm hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                <td className="py-3 px-2 text-gray-500 whitespace-nowrap">
                                                    {formatDate(expense.entry_date)}
                                                </td>
                                                <td className="py-3 px-2">
                                                    <div className="font-bold text-gray-800 dark:text-gray-200">{expense.category}</div>
                                                    <div className="text-xs text-gray-400 truncate max-w-[150px]">{expense.description}</div>
                                                </td>
                                                <td className="py-3 px-2 text-right font-bold text-rose-600">
                                                    ₦{Number(expense.amount).toLocaleString()}
                                                </td>
                                                <td className="py-3 px-2 text-right">
                                                    <button
                                                        onClick={() => deleteExpense(expense.id)}
                                                        className="text-gray-400 hover:text-rose-600 transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-gray-400 italic">No expenses recorded for this period.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
