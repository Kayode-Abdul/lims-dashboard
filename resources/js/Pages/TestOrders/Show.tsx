import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import {
    ArrowLeft,
    User,
    FlaskConical,
    Clock,
    FileText,
    CheckCircle,
    TestTube,
    Loader,
    Package,
    CreditCard,
    Percent,
    Edit3,
    AlertTriangle,
    X,
    Shield,
    Tag,
    Info,
    Building2,
    UserCircle,
    Pencil,
    Edit,
    Plus,
    Trash2,
    DollarSign,
    Save,
    Activity,
    CheckCircle2,
    Upload
} from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import React, { useState, FormEvent, ChangeEvent } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

interface Patient {
    id: number;
    first_name: string;
    last_name: string;
    patient_id: string;
    email: string;
    phone: string;
    sex: string;
    date_of_birth: string;
    age_group?: string;
    patient_type?: string;
    hmo_type?: string;
    hmo?: { id: number; name: string } | null;
}

interface Test {
    id: number;
    test_name: string;
    test_code: string;
    turnaround_time: string;
    has_subtests: boolean;
    units?: string;
    reference_range?: string;
    reference_range_male?: string;
    reference_range_female?: string;
    reference_range_adult?: string;
    reference_range_child?: string;
    subtest_definitions?: any[];
}

interface User {
    id: number;
    first_name: string;
    last_name: string;
}

interface Hospital {
    id: number;
    name: string;
}

interface Doctor {
    id: number;
    name: string;
}

interface TestResult {
    id: number;
    result_value: string;
    units: string | null;
    reference_range: string | null;
    is_abnormal: boolean;
    verified_at: string | null;
    subtest_results?: any;
    notes?: string | null;
    interpretation?: string | null;
}

interface TestOrder {
    id: number;
    order_number: string;
    test_id: number;
    price: string;
    discount: string;
    amount_paid: string;
    payment_status: 'pending' | 'partial' | 'paid';
    status: 'pending' | 'collected' | 'processing' | 'completed' | 'cancelled';
    test: Test;
    result?: TestResult;
    selected_subtests?: string[] | null;
}

interface Summary {
    totalPrice: number;
    totalDiscount: number;
    totalPaid: number;
    balance: number;
    paymentStatus: 'paid' | 'partial' | 'pending';
}

export default function Show({ auth, orderNumber, patient, orderedBy, hospital, doctor, orderedAt, notes, orders, summary }: PageProps<{
    orderNumber: string;
    patient: Patient;
    orderedBy: User;
    hospital: Hospital | null;
    doctor: Doctor | null;
    orderedAt: string;
    notes: string | null;
    orders: TestOrder[];
    summary: Summary;
}>) {
    const [resultModalOrder, setResultModalOrder] = useState<TestOrder | null>(null);
    const [adjustUnitVisible, setAdjustUnitVisible] = useState<Record<string, boolean>>({});
    const [adjustRangeVisible, setAdjustRangeVisible] = useState<Record<string, boolean>>({});
    const { data, setData, post, processing, errors, reset } = useForm({
        test_order_id: 0,
        result_value: '',
        units: '',
        reference_range: '',
        is_abnormal: false,
        notes: '',
        interpretation: '', // Only 'high' or 'low'
        subtest_results: {} as Record<string, any>,
    });

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const paymentForm = useForm({
        order_number: orderNumber,
        amount_paid: summary.balance,
        payment_method: 'Cash',
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const openResultModal = (order: TestOrder) => {
        setResultModalOrder(order);
        let currentInterpretation = '';
        let cleanValue = order.result?.result_value || '';

        if (order.result?.is_abnormal) {
            if (cleanValue.includes('(High)')) {
                currentInterpretation = 'high';
                cleanValue = cleanValue.replace(' (High)', '');
            } else if (cleanValue.includes('(Low)')) {
                currentInterpretation = 'low';
                cleanValue = cleanValue.replace(' (Low)', '');
            }
        }

        const subtestResults: any = {};
        const hasSubtests = !!order.test.has_subtests;
        const subtestDefinitions = order.test.subtest_definitions || [];
        const existingSubResults = order.result?.subtest_results || {};

        // Determine if patient is a child (used for age-based range selection)
        const isChild = (() => {
            if (patient?.age_group === 'child') return true;
            if (patient?.age_group === 'adult') return false;
            if (patient?.date_of_birth) {
                const dob = new Date(patient.date_of_birth);
                const today = new Date();
                let age = today.getFullYear() - dob.getFullYear();
                const m = today.getMonth() - dob.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
                return age < 18;
            }
            return false;
        })();

        const subtestSelections = (order.selected_subtests && order.selected_subtests.length > 0)
            ? order.selected_subtests
            : (hasSubtests ? subtestDefinitions.map((d: any) => d.id || d.name || d.investigation) : []);

        // Helper to build entry object
        const buildEntry = (subId: string, isDef: boolean) => {
            const existing = existingSubResults[subId] || {};
            const definition = isDef ? subtestDefinitions.find((d: any) =>
                (d.id && String(d.id) === String(subId)) ||
                (d.name && String(d.name) === String(subId)) ||
                (d.investigation && String(d.investigation) === String(subId))
            ) : null;

            let subRef = existing.reference_range || definition?.reference_range || definition?.reference_value || '';
            // Priority: sex-specific > age-specific > general
            if (patient?.sex === 'Male' && definition?.reference_range_male) {
                subRef = definition.reference_range_male;
            } else if (patient?.sex === 'Female' && definition?.reference_range_female) {
                subRef = definition.reference_range_female;
            } else if (isChild && definition?.reference_range_child) {
                subRef = definition.reference_range_child;
            } else if (!isChild && definition?.reference_range_adult) {
                subRef = definition.reference_range_adult;
            }

            return {
                name: existing.name || definition?.name || definition?.investigation || subId,
                value: existing.value || '',
                units: existing.units || definition?.units || '',
                reference_range: subRef,
                additional_ranges: definition?.additional_ranges || [],
                is_abnormal: existing.is_abnormal || false,
                interpretation: existing.interpretation || '',
            };
        };

        const finalSubResults: any = {};
        if (subtestSelections && subtestSelections.length > 0) {
            const defKeySet = new Set(subtestSelections.map(id => String(id)));
            const groups: Record<string, string[]> = {};
            const orphanExtras: string[] = [];
            let currentDefKey: string | null = null;
            const originalKeys = Object.keys(existingSubResults);

            for (const key of originalKeys) {
                if (defKeySet.has(key)) {
                    currentDefKey = key;
                    if (!groups[currentDefKey]) groups[currentDefKey] = [];
                    groups[currentDefKey].push(key);
                } else {
                    if (currentDefKey !== null) {
                        if (!groups[currentDefKey]) groups[currentDefKey] = [];
                        groups[currentDefKey].push(key);
                    } else {
                        orphanExtras.push(key);
                    }
                }
            }

            // 1. Orphan extras first
            orphanExtras.forEach(key => {
                finalSubResults[key] = buildEntry(key, false);
            });

            // 2. Definitions followed by their extras
            subtestSelections.forEach((defKey: string) => {
                const key = String(defKey);
                if (groups[key]) {
                    groups[key].forEach(subKey => {
                        finalSubResults[subKey] = buildEntry(subKey, subKey === key);
                    });
                } else {
                    finalSubResults[key] = buildEntry(key, true);
                }
            });

            // 3. Ensure any missed existing results are included
            Object.keys(existingSubResults).forEach(key => {
                if (!finalSubResults[key]) {
                    finalSubResults[key] = buildEntry(key, false);
                }
            });
        } else {
            // No definitions, just load all existing results
            Object.keys(existingSubResults).forEach(key => {
                finalSubResults[key] = buildEntry(key, false);
            });
        }

        let mainRef = order.result?.reference_range || order.test.reference_range || '';

        // Priority: sex-specific > age-specific > general
        if (patient?.sex === 'Male' && order.test.reference_range_male) {
            mainRef = order.test.reference_range_male;
        } else if (patient?.sex === 'Female' && order.test.reference_range_female) {
            mainRef = order.test.reference_range_female;
        } else if (isChild && order.test.reference_range_child) {
            mainRef = order.test.reference_range_child;
        } else if (!isChild && order.test.reference_range_adult) {
            mainRef = order.test.reference_range_adult;
        }

        setData({
            test_order_id: order.id,
            result_value: cleanValue || '',
            units: order.result?.units || order.test.units || '',
            reference_range: mainRef,
            is_abnormal: order.result?.is_abnormal || false,
            notes: order.result?.notes || '',
            interpretation: currentInterpretation,
            subtest_results: finalSubResults,
        });
    };

    const closeResultModal = () => {
        setResultModalOrder(null);
        reset();
    };

    const addExtraSubtest = () => {
        const id = `extra-${Date.now()}`;
        setData('subtest_results', {
            ...data.subtest_results,
            [id]: {
                name: '',
                value: '',
                units: '',
                reference_range: '',
                is_abnormal: false,
                interpretation: '',
                is_custom: true
            }
        });
    };

    const addSubtestRow = (id: string, name: string) => {
        const newId = `extra-${Date.now()}`;
        const newEntry = {
            name: name,
            value: '',
            units: data.subtest_results[id]?.units || '',
            reference_range: data.subtest_results[id]?.reference_range || '',
            is_abnormal: false,
            interpretation: 'normal',
            is_custom: true
        };

        const updated: Record<string, any> = {};
        let foundLastId = id;

        // Find the last item with the same name that comes after the clicked row
        Object.entries(data.subtest_results).forEach(([subId, res]: [string, any]) => {
            if (res.name === name) {
                foundLastId = subId;
            }
        });

        Object.entries(data.subtest_results).forEach(([subId, res]) => {
            updated[subId] = res;
            if (subId === foundLastId) {
                updated[newId] = newEntry;
            }
        });

        setData('subtest_results', updated);
    };

    const removeSubtest = (id: string) => {
        const updated = { ...data.subtest_results };
        delete updated[id];
        setData('subtest_results', updated);
    };

    const submitResult = (e: FormEvent) => {
        e.preventDefault();

        let finalValue = data.result_value;
        let isAbnormal = data.is_abnormal;

        if (data.interpretation === 'high') {
            finalValue = `${data.result_value} (High)`;
            isAbnormal = true;
        } else if (data.interpretation === 'low') {
            finalValue = `${data.result_value} (Low)`;
            isAbnormal = true;
        }

        const processedSubtestResults: any = {};
        let subtestIsAbnormal = false;

        if (Object.keys(data.subtest_results).length > 0) {
            Object.entries(data.subtest_results).forEach(([id, res]) => {
                let val = res.value;
                if (res.interpretation === 'high') {
                    val = `${res.value} (High)`;
                    subtestIsAbnormal = true;
                } else if (res.interpretation === 'low') {
                    val = `${res.value} (Low)`;
                    subtestIsAbnormal = true;
                }

                processedSubtestResults[id] = {
                    ...res,
                    value: val,
                    is_abnormal: res.is_abnormal || (res.interpretation !== ''),
                };
            });

            if (subtestIsAbnormal) isAbnormal = true;
        }

        if (Object.keys(data.subtest_results).length > 0 && (!finalValue || finalValue === '')) {
            finalValue = '';
        }

        router.post(route('test-results.store'), {
            test_order_id: data.test_order_id,
            result_value: finalValue,
            units: data.units,
            reference_range: data.reference_range,
            is_abnormal: isAbnormal,
            notes: data.notes,
            interpretation: data.interpretation,
            subtest_results: processedSubtestResults,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                closeResultModal();
            },
        } as any);
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

    const updateTestStatus = (orderId: number, status: string) => {
        router.patch(route('test-orders.update-status', orderId), { status }, { preserveScroll: true });
    };

    const updateAllStatus = (status: string) => {
        router.patch(route('test-orders.update-batch-status', orderNumber.replace('/', '-')), { status }, { preserveScroll: true });
    };

    const submitPayment = (e: FormEvent) => {
        e.preventDefault();
        paymentForm.post(route('payments.store'), {
            onSuccess: () => {
                setShowPaymentModal(false);
                paymentForm.reset();
            }
        });
    };

    const overallPaymentStatus = summary.paymentStatus;

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Order Details</h2>}
        >
            <Head title={`Order ${orderNumber}`} />

            <div className="py-12">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-center justify-between">
                        <Link
                            href={route('test-orders.index')}
                            className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition-colors"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Orders
                        </Link>
                        <div className="flex gap-2">
                            <Link
                                href={route('test-orders.edit-batch', orderNumber.replace('/', '-'))}
                                className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:border-indigo-900 focus:ring ring-indigo-300 disabled:opacity-25 transition ease-in-out duration-150 shadow-sm"
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Order
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6 mb-6 border dark:border-gray-700">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <Package className="h-6 w-6 text-indigo-500" />
                                    <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 font-mono">
                                        {orderNumber}
                                    </h1>
                                </div>
                                <p className="text-sm text-gray-500 mt-1 flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {new Date(orderedAt).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <SecondaryButton onClick={() => updateAllStatus('collected')}>
                                    <TestTube className="h-4 w-4 mr-1" />
                                    Mark All Collected
                                </SecondaryButton>
                                <SecondaryButton onClick={() => updateAllStatus('processing')}>
                                    <Loader className="h-4 w-4 mr-1" />
                                    Mark All Processing
                                </SecondaryButton>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6 border dark:border-gray-700">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest border-b pb-2 mb-4 dark:border-gray-700">
                                    Patient Information
                                </h3>
                                <div className="flex items-center">
                                    <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-lg mr-4">
                                        {(patient?.first_name || '?').charAt(0)}{(patient?.last_name || '?').charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-gray-100">
                                            {patient?.first_name || ''} {patient?.last_name || 'Anonymous'}
                                        </p>
                                        <p className="text-sm text-indigo-600 dark:text-indigo-400">{patient?.patient_id || 'N/A'}</p>
                                        <p className="text-xs text-gray-500">{patient?.phone || 'No phone'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6 border dark:border-gray-700">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest border-b pb-2 mb-4 dark:border-gray-700">
                                    Tests Ordered ({orders.length})
                                </h3>
                                <div className="space-y-3">
                                    {orders?.map((order) => (
                                        <div key={order.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <FlaskConical className="h-5 w-5 text-indigo-500 mr-3" />
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-gray-100">{order.test?.test_name || 'Unknown Test'}</p>
                                                        <p className="text-xs text-gray-500">{order.test?.test_code}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                            ₦{parseFloat(order.price).toLocaleString()}
                                                        </p>
                                                        {parseFloat(order.discount) > 0 && (
                                                            <p className="text-[10px] text-green-600">-₦{parseFloat(order.discount).toLocaleString()}</p>
                                                        )}
                                                    </div>
                                                    <select
                                                        value={order.status}
                                                        onChange={(e: ChangeEvent<HTMLSelectElement>) => updateTestStatus(order.id, e.target.value)}
                                                        className={`text-xs font-bold rounded-md border-0 ${getStatusColor(order.status)}`}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="collected">Collected</option>
                                                        <option value="processing">Processing</option>
                                                        <option value="completed">Completed</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="mt-3 pt-3 border-t dark:border-gray-700 flex items-center justify-between">
                                                {order.result ? (
                                                    <div className="flex items-center gap-4">
                                                        <div>
                                                            <span className="text-xs text-gray-500">Result:</span>
                                                            <span className={`ml-2 font-bold ${order.result.is_abnormal ? 'text-red-600' : 'text-green-600'}`}>
                                                                {(order.result.result_value || '').replace(/ \((High|Low)\)/, '')}
                                                                {order.result.units && <span className="text-xs text-gray-500 ml-1">{order.result.units}</span>}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {order.result.verified_at && (
                                                                <span className="flex items-center text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">
                                                                    <CheckCircle className="h-3 w-3 mr-1" /> VERIFIED
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">No result entered</span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => openResultModal(order)}
                                                    className="flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                                                >
                                                    <Edit3 className="h-3.5 w-3.5 mr-1" />
                                                    {order.result ? 'Edit Result' : 'Enter Result'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {notes && (
                                <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6 border dark:border-gray-700">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest border-b pb-2 mb-4 dark:border-gray-700">
                                        Order Notes
                                    </h3>
                                    <div 
                                        className="text-gray-700 dark:text-gray-300 text-sm prose dark:prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{ __html: notes || '' }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6 border dark:border-gray-700">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest border-b pb-2 mb-4 dark:border-gray-700">
                                    Payment Summary
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Subtotal:</span>
                                        <span className="font-bold text-gray-900 dark:text-gray-100">
                                            ₦{summary.totalPrice.toLocaleString()}
                                        </span>
                                    </div>
                                    {summary.totalDiscount > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 flex items-center">
                                                <Percent className="h-3 w-3 mr-1" />
                                                Discount:
                                            </span>
                                            <span className="font-bold text-green-600">
                                                -₦{summary.totalDiscount.toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-sm border-t pt-2 dark:border-gray-700">
                                        <span className="text-gray-700 dark:text-gray-300 font-bold">Total Payable:</span>
                                        <span className="font-black text-indigo-600 dark:text-indigo-400">
                                            ₦{(summary.totalPrice - summary.totalDiscount).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 flex items-center">
                                            <CreditCard className="h-3 w-3 mr-1" />
                                            Amount Paid:
                                        </span>
                                        <span className="font-bold text-green-600">
                                            ₦{summary.totalPaid.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className={`p-3 rounded-lg flex justify-between items-center border ${summary.balance > 0
                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-800 dark:text-red-400'
                                        : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800 text-green-800 dark:text-green-400'
                                        }`}>
                                        <span className="text-xs font-bold uppercase">Balance:</span>
                                        <span className="font-black text-lg">₦{summary.balance.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Status</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-black uppercase tracking-wider ${getPaymentStatusColor(overallPaymentStatus)}`}>
                                        {overallPaymentStatus}
                                    </span>
                                </div>

                                {summary.balance > 0 && (
                                    <PrimaryButton
                                        className="w-full mt-4 justify-center"
                                        onClick={() => setShowPaymentModal(true)}
                                    >
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        Record Payment
                                    </PrimaryButton>
                                )}
                            </div>

                            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6 border dark:border-gray-700 space-y-4">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest border-b pb-2 mb-3 dark:border-gray-700">
                                    Visit Details
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center text-sm">
                                        <Tag className="h-4 w-4 mr-2 text-gray-400" />
                                        <span className="text-gray-500 mr-2">Type:</span>
                                        <span className="font-bold text-gray-900 dark:text-gray-100 uppercase">
                                            {patient?.patient_type === 'hmo' ? 'HMO' : patient?.patient_type === 'referred' ? 'Doctor Referred' : 'Walk-in'}
                                        </span>
                                    </div>
                                    {patient?.patient_type === 'hmo' && (
                                        <div className="flex items-center text-sm">
                                            <Shield className="h-4 w-4 mr-2 text-gray-400" />
                                            <span className="text-gray-500 mr-2">HMO:</span>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">{patient.hmo?.name}</span>
                                        </div>
                                    )}
                                    {patient?.patient_type === 'referred' && (
                                        <>
                                            <div className="flex items-center text-sm">
                                                <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                                                <span className="text-gray-500 mr-2">Hospital:</span>
                                                <span className="font-medium text-gray-900 dark:text-gray-100">{hospital?.name}</span>
                                            </div>
                                            <div className="flex items-center text-sm">
                                                <UserCircle className="h-4 w-4 mr-2 text-gray-400" />
                                                <span className="text-gray-500 mr-2">Doctor:</span>
                                                <span className="font-medium text-gray-900 dark:text-gray-100">{doctor?.name}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals for Result and Payment - (Reduced for brevity but should be restored) */}
            <Modal show={resultModalOrder !== null} onClose={closeResultModal} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <FlaskConical className="h-5 w-5 text-indigo-500" />
                        Result for: <span className="text-indigo-600">{resultModalOrder?.test?.test_name}</span>
                    </h2>
                    <form onSubmit={submitResult} className="space-y-4">
                        <div className="flex gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700">
                            <div className="flex-1">
                                <InputLabel htmlFor="result_value" value="Result Value" />
                                <TextInput
                                    id="result_value"
                                    className="mt-1 block w-full text-lg font-bold"
                                    value={data.result_value}
                                    onChange={(e) => setData('result_value', e.target.value)}
                                    required={Object.keys(data.subtest_results).length === 0}
                                    autoFocus
                                />
                            </div>
                            <div className="flex flex-col justify-end">
                                <InputLabel value="Interpretation" className="mb-2" />
                                <div className="flex gap-2">
                                    {['Normal', 'High', 'Low'].map((opt) => (
                                        <label key={opt} className={`flex items-center px-3 py-1.5 rounded-md border cursor-pointer transition-colors ${data.interpretation === opt.toLowerCase()
                                            ? 'bg-indigo-600 border-indigo-600 text-white'
                                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-indigo-400'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="interpretation"
                                                className="hidden"
                                                value={opt.toLowerCase()}
                                                checked={data.interpretation === opt.toLowerCase()}
                                                onChange={(e) => setData('interpretation', e.target.value)}
                                            />
                                            <span className="text-xs font-bold">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="units" value="Units" />
                                <TextInput
                                    id="units"
                                    className="mt-1 block w-full"
                                    value={data.units}
                                    onChange={(e) => setData('units', e.target.value)}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="reference_range" value="Reference Range" />
                                <TextInput
                                    id="reference_range"
                                    className="mt-1 block w-full"
                                    value={data.reference_range}
                                    onChange={(e) => setData('reference_range', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-4 border dark:border-gray-700">
                            <div className="flex justify-between items-center border-b pb-2">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Result Parameters / Details</h3>
                                <button
                                    type="button"
                                    onClick={addExtraSubtest}
                                    className="text-[10px] font-bold text-indigo-600 flex items-center hover:text-indigo-800"
                                >
                                    <Plus className="h-3 w-3 mr-1" /> Add Parameter
                                </button>
                            </div>

                            <div className="space-y-4">
                                {(() => {
                                    const nameCounts: Record<string, number> = {};
                                    return Object.entries(data.subtest_results).map(([subId, res]: [string, any]) => {
                                        const isCustom = subId.startsWith('extra-') || res.is_custom;
                                        const baseName = res.name || 'Unnamed Parameter';
                                        nameCounts[baseName] = (nameCounts[baseName] || 0) + 1;
                                        const occurrence = nameCounts[baseName];
                                        const displayName = occurrence > 1 ? `${baseName} (${occurrence})` : baseName;

                                        return (
                                            <div key={subId} className="grid grid-cols-1 gap-2 border-b dark:border-gray-800 last:border-0 pb-3 last:pb-0">
                                                <div className="flex justify-between items-center">
                                                    {isCustom ? (
                                                        <div className="flex items-center gap-2 flex-1 mr-4">
                                                            <TextInput
                                                                className="text-xs h-7 w-full font-bold"
                                                                placeholder="Parameter Name (e.g., Description)"
                                                                value={res.name}
                                                                onChange={(e) => setData('subtest_results', {
                                                                    ...data.subtest_results,
                                                                    [subId]: { ...res, name: e.target.value }
                                                                })}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeSubtest(subId)}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                {displayName}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => addSubtestRow(subId, res.name)}
                                                                className="text-indigo-500 hover:text-indigo-700 p-1 rounded-full hover:bg-indigo-50 transition-colors"
                                                                title="Add another value for this subtest"
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {!isCustom && (
                                                        <div className="text-right">
                                                            <span className="text-[10px] text-gray-500 block">{res.reference_range} {res.units}</span>
                                                            {res.additional_ranges && res.additional_ranges.map((ar: any, ari: number) => (
                                                                <span key={ari} className="text-[9px] text-gray-400 block">{ar.label}: {ar.range} {ar.units}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-4">
                                                    <div className="flex-1">
                                                        <TextInput
                                                            className="w-full"
                                                            value={res.value || ''}
                                                            onChange={(e) => setData('subtest_results', {
                                                                ...data.subtest_results,
                                                                [subId]: { ...res, value: e.target.value }
                                                            })}
                                                            placeholder="Enter result..."
                                                        />
                                                    </div>
                                                    <div className="flex gap-1">
                                                        {['Normal', 'High', 'Low'].map((opt) => (
                                                            <button
                                                                key={opt}
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setData('subtest_results', {
                                                                        ...data.subtest_results,
                                                                        [subId]: {
                                                                            ...res,
                                                                            interpretation: opt.toLowerCase(),
                                                                            is_abnormal: opt.toLowerCase() !== 'normal'
                                                                        }
                                                                    });
                                                                }}
                                                                className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${res.interpretation === opt.toLowerCase()
                                                                    ? (opt === 'Normal' ? 'bg-green-600 border-green-600 text-white' : 'bg-red-600 border-red-600 text-white')
                                                                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                                    }`}
                                                            >
                                                                {opt[0]}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}

                                {Object.keys(data.subtest_results).length === 0 && !resultModalOrder?.test?.has_subtests && (
                                    <p className="text-[10px] text-gray-400 italic text-center py-2">Click "Add Parameter" to add multiple result fields.</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 space-y-4 border-t dark:border-gray-700 pt-4">
                            <div>
                                <InputLabel htmlFor="notes" value="General Notes / Interpretation" className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1" />
                                <Editor
                                    id="notes"
                                    tinymceScriptSrc="https://cdn.tiny.cloud/1/wqcgqqxw8t0fhzdprrtbk0nzk9smphpwizfjclw7atf82iiz/tinymce/6/tinymce.min.js"
                                    value={data.notes}
                                    onEditorChange={(content: string) => setData('notes', content)}
                                    init={{
                                        height: 200,
                                        menubar: false,
                                        plugins: [
                                            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                                            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                                        ],
                                        toolbar: 'undo redo | blocks | ' +
                                            'bold italic forecolor | alignleft aligncenter ' +
                                            'alignright alignjustify | bullist numlist outdent indent | ' +
                                            'removeformat | help',
                                        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                                        skin: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oxide-dark' : 'oxide',
                                        content_css: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default',
                                    }}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <SecondaryButton onClick={closeResultModal}>Cancel</SecondaryButton>
                                <PrimaryButton disabled={processing}>Save Result</PrimaryButton>
                            </div>
                        </div>
                    </form>
                </div>
            </Modal>

            <Modal show={showPaymentModal} onClose={() => setShowPaymentModal(false)} maxWidth="sm">
                <div className="p-6">
                    <h2 className="text-lg font-bold mb-4">Record Payment</h2>
                    <form onSubmit={submitPayment} className="space-y-4">
                        <div>
                            <InputLabel htmlFor="pay_amount" value="Amount" />
                            <TextInput
                                id="pay_amount"
                                type="number"
                                className="mt-1 block w-full"
                                value={paymentForm.data.amount_paid}
                                onChange={(e) => paymentForm.setData('amount_paid', e.target.value as any)}
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <SecondaryButton onClick={() => setShowPaymentModal(false)}>Cancel</SecondaryButton>
                            <PrimaryButton disabled={paymentForm.processing}>Save Payment</PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
