import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { ArrowLeft, Printer, Download, Shield, AlertTriangle, CheckCircle, Activity, User, Calendar, FileText, Upload, Check, Share2, Mail } from 'lucide-react';
import { useState } from 'react';
import { formatDate } from '@/Utils/dateUtils';
import React from 'react';
import axios from 'axios';

interface Lab {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    header_url?: string;
    footer_url?: string;
    pdf_margin_top?: string;
    web_margin_top?: string;
}

interface TestResult {
    id: number;
    test_order_id: number;
    result_value: string;
    result_type: string | null;
    reference_range: string | null;
    units: string | null;
    is_abnormal: boolean;
    notes: string | null;
    verified_by: number | null;
    verified_at: string | null;
    subtest_results: any;
    sensitivities?: any[];
    created_at: string;
    test_order: {
        id: number;
        order_number: string;
        ordered_at: string;
        sample_type?: string;
        patient: {
            id: number;
            patient_id: string;
            first_name: string;
            last_name: string;
            sex?: string;
            date_of_birth?: string;
            phone?: string;
            age?: number;
            patient_type?: string;
            hmo_type?: string;
            hmo?: {
                id: number;
                name: string;
            };
        };
        test: {
            id: number;
            test_name: string;
            test_code?: string;
            department?: string;
            parent_id?: number | null;
            subtest_definitions?: any[];
            category?: {
                id: number;
                name: string;
            };
        };
        hospital?: {
            id: number;
            name: string;
        };
        doctor?: {
            id: number;
            name: string;
        };
        lab: Lab;
        selected_subtests?: string[];
    };
    order_number: string;
    verified_by_user?: {
        id: number;
        first_name: string;
        last_name: string;
        signature_path?: string;
    };
    verifiedBy?: {
        id: number;
        first_name: string;
        last_name: string;
        signature_path?: string;
    };
}

export default function Show({ auth, results, lab, order_number }: PageProps<{ results: TestResult[]; lab?: Lab; order_number: string }>) {
    const [showingSignatureModal, setShowingSignatureModal] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        signature: null as File | null,
    });

    const firstResult = results[0];
    const verifiedBy = firstResult.verified_by_user || firstResult.verifiedBy;

    const handleSignatureClick = () => {
        if (auth.user.role === 'pathologist' || auth.user.role === 'admin') {
            setShowingSignatureModal(true);
        }
    };

    const handleSignatureSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('staff.update-signature', auth.user.id), {
            onSuccess: () => setShowingSignatureModal(false),
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const handleVerifyAll = () => {
        if (!confirm('Are you sure you want to verify all results in this report?')) return;

        results.filter(r => !r.verified_at).forEach(res => {
            router.post(route('test-results.verify', res.id), {}, {
                preserveScroll: true,
            });
        });
    };

    const logPrintAction = async () => {
        try {
            await axios.post(route('test-results.log-print'), {
                order_number: order_number,
                result_id: firstResult.id
            });
        } catch (error) {
            console.error('Failed to log print action', error);
        }
    };

    const handleWhatsAppShare = async () => {
        const fileName = `LabReport_${order_number.replace(/\//g, '-')}.pdf`;
        const pdfUrl = route('test-results.pdf', order_number.replace(/\//g, '-'));

        try {
            // Check if Web Share API supports file sharing
            if (navigator.canShare && navigator.share) {
                const response = await axios.get(pdfUrl, { responseType: 'blob' });
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const file = new File([blob], fileName, { type: 'application/pdf' });

                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `Lab Report - ${order_number}`,
                        text: `Lab Report for ${firstResult.test_order?.patient?.first_name} ${firstResult.test_order?.patient?.last_name}`,
                    });
                    return;
                }
            }
        } catch (error) {
            console.error('Error sharing file:', error);
        }

        // Fallback for desktop or unsupported browsers
        let finalPdfUrl = `${window.location.protocol}//${window.location.host}${pdfUrl}`;
        const orderSuffix = order_number.replace(/\//g, '-');

        try {
            // Fetch a zipped version for desktop to trigger easier download
            const zipResponse = await axios.get(route('test-results.zip', orderSuffix));
            if (zipResponse.data.url) {
                finalPdfUrl = zipResponse.data.url;
            }
        } catch (e) {
            console.error('Failed to get zip URL, using direct PDF link:', e);
        }

        const tests = results.map(r => `${r.test_order?.test?.test_name}: ${r.result_value} ${r.units || ''}`).join('\n');

        const isVerified = results.every(r => r.verified_at !== null);

        const message = `*Laboratory Result Alert*\n\n` +
            `Patient: ${firstResult.test_order?.patient?.first_name} ${firstResult.test_order?.patient?.last_name}\n\n` +
            `Results:\n${tests}\n\n` +
            `Status: ${isVerified ? 'Verified' : 'Preliminary'}\n` +
            `Ref: ${order_number}\n\n` +
            `Download Result: ${finalPdfUrl}\n\n`;

        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };


    const handleDownload = async () => {
        await logPrintAction();
        window.open(route('test-results.pdf', order_number.replace(/\//g, '-')), '_blank');
    };

    const handlePrint = async () => {
        await logPrintAction();
        // Temporarily blank the title to prevent browser from printing
        // URL, page title, and date in its header/footer margins
        const originalTitle = document.title;
        document.title = ' ';
        window.print();
        // Restore title after print dialog is handled
        setTimeout(() => { document.title = originalTitle; }, 1000);
    };

    const calculateAge = (dobString?: string) => {
        if (!dobString) return 'N/A';
        const dob = new Date(dobString);
        const diff_ms = Date.now() - dob.getTime();
        const age_dt = new Date(diff_ms);
        return Math.abs(age_dt.getUTCFullYear() - 1970);
    };

    const age = firstResult.test_order?.patient?.age || calculateAge(firstResult.test_order?.patient?.date_of_birth);

    // Simple Code 39 generator for SVG
    // QR Code Generator using reliable API for print robustness
    const renderQRCode = (text: string) => {
        const qrText = `VALID RESULT\n${lab?.name || 'Global Diagnostics'}\n${lab?.address || ''}\n${lab?.phone || ''}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrText)}`;
        return (
            <div className="flex flex-col items-start px-2">
                <img src={qrUrl} alt="QR Code" className="w-14 h-14 mb-1" />
                <div className="text-[10px] uppercase font-bold text-black-900">Scan to Verify</div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight print:hidden">Test Result Details</h2>}
        >
            <Head title={`Result - ${order_number}`}>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39+Extended&display=swap" rel="stylesheet" />
            </Head>

            <div className="py-12 bg-white min-h-screen print:py-0 print:m-0 print-content">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 print:w-full print:max-w-none print:px-0">
                    <div className="mb-6 flex justify-between items-center print:hidden">
                        <Link
                            href={route('test-results.index')}
                            className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to Results
                        </Link>
                        <div className="flex flex-wrap gap-2">
                            {(!results.every(r => r.verified_at) && (
                                auth.user.role === 'admin' ||
                                auth.user.role === 'pathologist' ||
                                (auth.user as any).permissions?.includes('results.verify')
                            )) && (
                                    <PrimaryButton
                                        onClick={handleVerifyAll}
                                        className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                                    >
                                        <Check className="h-4 w-4 mr-2" />
                                        Verify All
                                    </PrimaryButton>
                                )}
                            <SecondaryButton onClick={handlePrint} title="Print Report">
                                <Printer className="h-4 w-4" />
                            </SecondaryButton>
                            <PrimaryButton onClick={handleDownload} title="Download PDF">
                                <Download className="h-4 w-4" />
                            </PrimaryButton>
                            <SecondaryButton onClick={handleWhatsAppShare} className="bg-green-500 hover:bg-green-600 border-green-500 text-white" title="Share via WhatsApp">
                                <Share2 className="h-4 w-4 mr-2" />
                                WhatsApp
                            </SecondaryButton>
                        </div>
                    </div>

                    <div className="bg-white shadow-sm sm:rounded-lg overflow-hidden print:shadow-none">
                        {/* Header Image or Fallback */}
                        <div className="bg-white p-0 print:hidden text-center mb-6">
                            {lab?.header_url ? (
                                <img src={lab.header_url} alt="Header" className="w-full max-h-48 object-contain" />
                            ) : (
                                <div className="text-center">
                                    <h1 className="text-2xl font-bold text-blue-700">{lab?.name || 'GLOBAL DIAGNOSTICS'}</h1>
                                    <p className="text-xs text-black-900 uppercase tracking-widest">Laboratory Diagnostic Report</p>
                                </div>
                            )}
                        </div>

                        <div className="p-8 pb-2 pt-[6px] flex flex-col min-h-[60vh] gap-8 print:p-2 print:space-y-4 print:min-h-0 print:block">

                            {/* Header Info (Screen Only) */}
                            <div className="print:hidden  flex justify-between items-start">
                                <div>
                                    <h1 className="text-lg font-bold text-gray-900 flex items-center">
                                        <FileText className="mr-3 h-6 w-6 text-indigo-500" />
                                        Patient Report
                                    </h1>
                                    <p className="mt-1 text-xs text-black-900 dark:text-gray-400">
                                        Ref: <span className="font-mono font-medium">{order_number}</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    {results.every(r => r.verified_at) ? (
                                        <div className="flex flex-col items-end">
                                            <span className="flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-800 text-gray-100 dark:bg-green-900/200 dark:text-white-800">
                                                <Shield className="h-3 w-3 mr-1" /> VERIFIED
                                            </span>
                                            <span className="text-xs text-white-900 mt-1">
                                                {formatDate(new Date(Math.max(...results.map(r => new Date(r.verified_at!).getTime()))))}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-white-800 dark:bg-gray-900/30 dark:text-white-400">
                                            <Activity className="h-3 w-3 mr-1" /> PRELIMINARY
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Patient & Order Details Grid */}
                            <div className="grid grid-cols-2 gap-5 pb-2 pt-1 rounded-xl print:bg-white print:p-0">
                                <div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-[12px] text-gray-900 font-semibold">Name:</span>
                                            <span className="text-[12px] font-semibold text-gray-900 ">
                                                {firstResult.test_order?.patient?.first_name} {firstResult.test_order?.patient?.last_name}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[12px] text-gray-900 font-semibold">Patient ID:</span>
                                            <span className="text-[12px] font-mono text-gray-900 ">
                                                {firstResult.test_order?.patient?.patient_id}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[12px] text-gray-900 font-semibold">Gender / Age:</span>
                                            <span className="text-[12px] text-gray-900 ">
                                                {firstResult.test_order?.patient?.sex || 'N/A'} / {age}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[12px] text-gray-900 font-semibold">TEL:</span>
                                            <span className="text-[12px] text-gray-900 ">
                                                {firstResult.test_order?.patient?.phone || 'N/A'}
                                            </span>
                                        </div>
                                        {(!firstResult.test_order.hospital?.name && !firstResult.test_order.doctor?.name) ? (
                                            <>
                                                {firstResult.test_order?.patient?.patient_type === 'walk-in' ? (
                                                    <div className="flex justify-between">
                                                        <span className="text-[12px] text-gray-900 font-semibold">Patient Type:</span>
                                                        <span className="text-[12px] font-bold text-gray-900 uppercase">Walk in</span>
                                                    </div>
                                                ) : firstResult.test_order?.patient?.patient_type === 'hmo' ? (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span className="text-[12px] text-gray-900 font-semibold">HMO Name:</span>
                                                            <span className="text-[12px] font-bold text-gray-900">
                                                                {firstResult.test_order?.patient?.hmo?.name || 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-[12px] text-gray-900 font-semibold">HMO Type:</span>
                                                            <span className="text-[12px] font-bold text-gray-900 uppercase">
                                                                {firstResult.test_order?.patient?.hmo_type || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </>
                                                ) : null}
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-[12px] text-gray-900 font-semibold">Ref Hospital:</span>
                                                    <span className="text-[12px] text-gray-900">
                                                        {firstResult.test_order.hospital?.name || 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-[12px] text-gray-900 font-semibold">Ref Dr:</span>
                                                    <span className="text-[12px] text-gray-900">
                                                        {firstResult.test_order.doctor?.name || 'N/A'}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-[12px] text-gray-900 font-semibold">Test ID:</span>
                                            <span className="text-[12px] font-mono font-bold text-gray-900">
                                                {order_number}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[12px] text-gray-900 font-semibold">Sample Type:</span>
                                            <span className="text-[12px] text-gray-900">
                                                {firstResult.test_order?.sample_type || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[12px] text-gray-900 font-semibold">Ordered Date:</span>
                                            <span className="text-[12px] text-gray-900 ">
                                                {formatDate(firstResult.test_order.ordered_at)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[12px] text-gray-900 font-semibold">Report Date:</span>
                                            <span className="text-[12px] text-gray-900 ">
                                                {formatDate(new Date())}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Results Table */}
                            <div className="overflow-hidden">
                                <h1 className="text-center text-lg font-bold mb-4">Laboratory Report</h1>
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="bg-white">
                                            <th className="py-2 pr-6 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest group-header">Test Parameter</th>
                                            <th className="px-6 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest group-header">Result</th>
                                            <th className="px-6 py-2 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest text-wrap group-header">Ref Value/Unit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {results.map((res) => {
                                            const isChildTest = !!res.test_order?.test?.parent_id;
                                            return (
                                            <React.Fragment key={res.id}>
                                                <tr className={isChildTest ? 'bg-white' : 'bg-white'}>
                                                    <td className={`py-2 pr-6 whitespace-nowrap text-xs uppercase ${
                                                        isChildTest
                                                            ? 'font-semibold text-gray-700 dark:text-gray-300 italic'
                                                            : 'font-bold text-indigo-900 dark:text-indigo-100'
                                                    }`}>
                                                        {res.test_order?.test?.test_name}
                                                    </td>
                                                    <td className={`px-6 py-2 whitespace-nowrap text-xs font-bold ${res.is_abnormal ? 'text-red-600' : 'text-gray-900'}`}>
                                                        <div className="flex items-center gap-2">
                                                            {res.result_value?.replace(/ \((High|Low)\)/, '') || ''}

                                                            {res.is_abnormal && (
                                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[10px] font-black text-red-700 animate-pulse">
                                                                    {res.result_value?.includes('(High)') ? 'H' : res.result_value?.includes('(Low)') ? 'L' : '!'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-2 whitespace-nowrap text-xs font-bold text-indigo-800 dark:text-indigo-200 text-right">
                                                        {res.reference_range || ''} {res.units || ''}
                                                    </td>
                                                </tr>
                                                {(() => {
                                                    let lastSubName = '';
                                                    const subresultsObj = res.subtest_results && typeof res.subtest_results === 'object' ? res.subtest_results : {};
                                                    const definitions: any[] = res.test_order?.test?.subtest_definitions || [];
                                                    const selectedSubtests: string[] = res.test_order?.selected_subtests || [];

                                                    const orderedEntries: {key: string, sub: any}[] = [];

                                                    // Use definition arrays to establish strict ordering to combat JS integer-key string sorting
                                                    if (selectedSubtests && selectedSubtests.length > 0) {
                                                        selectedSubtests.forEach(defKey => {
                                                            const key = String(defKey);
                                                            if (subresultsObj[key]) {
                                                                orderedEntries.push({ key, sub: subresultsObj[key] });
                                                            }
                                                        });
                                                    } else if (definitions && definitions.length > 0) {
                                                        definitions.forEach(def => {
                                                            const key = String(def.id || def.name || def.investigation);
                                                            if (subresultsObj[key]) {
                                                                orderedEntries.push({ key, sub: subresultsObj[key] });
                                                            }
                                                        });
                                                    }

                                                    // Loop again to catch extras
                                                    Object.keys(subresultsObj).forEach(key => {
                                                        if (!orderedEntries.find(e => e.key === key)) {
                                                            orderedEntries.push({ key, sub: subresultsObj[key] });
                                                        }
                                                    });

                                                    return orderedEntries.map(({ key, sub }, idx: number) => {
                                                        const currentName = sub.name || sub.investigation || '';
                                                        const displayName = currentName === lastSubName ? '' : currentName;
                                                        lastSubName = currentName;

                                                        return (
                                                            <React.Fragment key={`${res.id}-sub-${key}`}>
                                                                <tr className="border-none">
                                                                    <td className="py-1 pr-6 text-xs font-medium text-black-900 dark:text-gray-400 italic">
                                                                        {displayName}
                                                                    </td>
                                                                    <td className={`px-6 py-1 text-xs font-bold ${sub.is_abnormal ? 'text-red-600' : 'text-gray-700'}`}>
                                                                        {sub.value}
                                                                    </td>
                                                                    <td className="px-6 py-1 text-xs text-black-900 dark:text-gray-400 text-right">
                                                                        {sub.reference_range || sub.reference_value || ''} {sub.units || ''}
                                                                    </td>
                                                                </tr>
                                                                {sub.additional_ranges?.map((ar: any, i: number) => (
                                                                    <tr key={`${res.id}-sub-${key}-ar-${i}`} className="border-none">
                                                                        <td className="py-1 pr-6 text-xs"></td>
                                                                        <td></td>
                                                                        <td className="px-6 py-1 text-xs text-gray-500 text-right">
                                                                            {ar.range || ar.reference_range || ''} {ar.units || ''}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                {sub.child_results?.map((child: any, i: number) => (
                                                                    <tr key={`${res.id}-sub-${key}-child-${i}`} className="border-none">
                                                                        <td className="py-1 pr-6 text-xs text-gray-500 italic"></td>
                                                                        <td className={`px-6 py-1 text-xs font-bold ${child.is_abnormal ? 'text-red-600' : 'text-gray-700'}`}>
                                                                            {child.value}
                                                                        </td>
                                                                        <td className="px-6 py-1 text-xs text-black-900 dark:text-gray-400 text-right">
                                                                            {child.reference_range || child.reference_value || ''} {child.units || ''}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </React.Fragment>
                                                        );
                                                    });
                                                })()}
                                                <tr className="h-4 border-none"><td colSpan={3} className="border-none"></td></tr>
                                            </React.Fragment>
                                        );
                                        })}
                                        {/* Aggregated Sensitivity Row */}
                                        {(() => {
                                            const allSensitivities: any[] = [];
                                            const seen = new Set<string>();
                                            results.forEach((res) => {
                                                if (res.sensitivities && Array.isArray(res.sensitivities)) {
                                                    res.sensitivities.forEach((s: any) => {
                                                        const label = s.name || s.sensitivity_name || '';
                                                        const val = s.type === 'number'
                                                            ? '+'.repeat(parseInt(s.value) || 0)
                                                            : (s.value || '');
                                                        const key = `${label}[${val}]`;
                                                        if (label && !seen.has(key)) {
                                                            seen.add(key);
                                                            allSensitivities.push({ label, val });
                                                        }
                                                    });
                                                }
                                            });
                                            if (allSensitivities.length === 0) return null;
                                            return (
                                                <tr className="border-none">
                                                    <td className="py-2 pr-6 text-xs font-bold text-indigo-900 dark:text-indigo-100 uppercase">Sensitivity</td>
                                                    <td colSpan={2} className="px-6 py-2 text-xs font-bold text-gray-900">
                                                        {allSensitivities.map((s, i) => (
                                                            <span key={i}>
                                                                {s.label}[{s.val}]{i < allSensitivities.length - 1 ? ', ' : ''}
                                                            </span>
                                                        ))}
                                                    </td>
                                                </tr>
                                            );
                                        })()}
                                    </tbody>
                                </table>
                            </div>

                            {/* Notes and Comments */}
                            <div className="space-y-4 pt-4 border-t border-dashed border-gray-200">
                                {results.map((res) => res.notes && (
                                    <div key={`note-${res.id}`} className="py-2">
                                        <h4 className="text-xs font-bold text-gray-800 dark:text-gray-800 mb-1">
                                            Comment:
                                        </h4>
                                        <div
                                            className="text-xs text-gray-900 dark:text-gray-900 prose dark:prose-invert max-w-none prose-sm"
                                            dangerouslySetInnerHTML={{ __html: res.notes || '' }}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Signatures */}
                            {/* Signatures (placed in fixed footer below for print) */}

                            {/* Unified Fixed Footer for Print - appears on all pages */}
                            <div className="hidden print:block fixed bottom-0 left-0 right-0 w-full px-[1.2cm] z-[9999]">
                                {/* Copy of signature and QR Code section for pinning */}
                                {(() => {
                                    const signaturePath = verifiedBy?.signature_path;
                                    const signerName = verifiedBy ? `${verifiedBy.first_name} ${verifiedBy.last_name}` : null;
                                    const dept = firstResult.test_order?.test?.department?.toLowerCase() || '';
                                    const cat = (firstResult.test_order?.test as any)?.category?.name?.toLowerCase() || '';
                                    const direction = dept.includes('x-ray') || dept.includes('radiology') || dept.includes('scan') || cat.includes('radiology') || cat.includes('x-ray') ? 'flex-row-reverse' : 'flex-row';
                                    
                                    return (
                                        <div className={`mb-[5px] flex w-full items-end justify-between border-t border-gray-100 pt-2 ${direction}`}>
                                            <div className="text-left space-y-1">
                                                {renderQRCode(order_number)}
                                            </div>

                                                     <div className="w-64 text-center relative flex flex-col items-center">
                                                         <div className="relative w-full flex justify-center">
                                                             {signaturePath ? (
                                                                 <div className="absolute bottom-[20px] left-0 right-0 flex justify-center pointer-events-none z-10">
                                                                     <img src={`/storage/${signaturePath}`} alt="Signature" className="h-20 max-w-[200px] object-contain" />
                                                                 </div>
                                                             ) : verifiedBy ? (
                                                                 <div className="absolute bottom-[20px] left-0 right-0 flex justify-center pointer-events-none z-10">
                                                                     <span className="font-script text-xl text-black">{signerName}</span>
                                                                 </div>
                                                             ) : null}
                                                             
                                                             <div className="w-full pt-1 mt-8">
                                                                 <p className="text-[9px] uppercase font-bold text-black">
                                                                     MED. LAB. SCIENTIST.
                                                                 </p>
                                                                 {verifiedBy && (
                                                                     <p className="text-[9px] text-black mt-0.5">{signerName}</p>
                                                                 )}
                                                             </div>
                                                         </div>
                                                     </div>
                                        </div>
                                    );
                                })()}

                                {/* Footer Image placeholder - invisible but takes up space during print to avoid overlapping physical letterhead */}
                                {lab?.footer_url ? (
                                    <img src={lab.footer_url} alt="Footer" className="w-full max-h-48 object-contain print-invisible" />
                                ) : (
                                    <div className="text-center text-xs text-gray-200 py-2 border-t border-gray-100 print-invisible">
                                        <p>{lab?.name || 'Global Diagnostics'} | {lab?.address}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Lab Footer for WEB view only */}
                        <div className="mt-8 print:hidden">
                            {lab?.footer_url ? (
                                <img src={lab.footer_url} alt="Footer" className="w-full max-h-48 object-contain" />
                            ) : (
                                <div className="text-center text-xs text-gray-100">
                                    <p>{lab?.name || 'Global Diagnostics'} | {lab?.address}</p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            {/* Signature Upload Modal */}
            <Modal show={showingSignatureModal} onClose={() => setShowingSignatureModal(false)}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                        <Upload className="mr-2 h-5 w-5 text-indigo-500" />
                        Update Digital Signature
                    </h2>

                    <form onSubmit={handleSignatureSubmit} className="space-y-4">
                        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900/30 mb-4">
                            <p className="text-xs text-indigo-700 dark:text-indigo-300">
                                This signature will be used on all lab reports you verify. Please use a clear signature on a white or transparent background.
                            </p>
                        </div>

                        <div>
                            <InputLabel htmlFor="signature" value="Select Signature Image" />
                            <input
                                id="signature"
                                type="file"
                                className="mt-1 block w-full text-xs text-black-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                onChange={(e) => setData('signature', e.target.files ? e.target.files[0] : null)}
                                accept="image/*"
                                required
                            />
                            <InputError message={errors.signature} className="mt-2" />
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <SecondaryButton onClick={() => setShowingSignatureModal(false)}>
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Uploading...' : 'Upload Signature'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Print Styles Override */}
            <style>{`
                @media print {
                    @page { 
                        margin: 0mm !important; 
                        padding: 0mm !important;
                        size: A4 portrait; 
                    }
                    /* Force hide ALL browser-generated headers/footers */
                    html {
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important; 
                        color-adjust: exact !important;
                        line-height: 1.1 !important;
                    }
                    /* Use padding on the content wrapper instead of page margins
                       so the browser has no margin space to print URLs/dates */
                    .print-content {
                        padding: ${(lab?.web_margin_top) || '1.80'}cm 1.2cm 5.0cm 1.2cm !important;
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        position: relative !important;
                        min-height: 100vh !important;
                        color: #000 !important;
                    }
                    .print-content * {
                        color: #000 !important;
                    }
                    .print-content .text-red-600, .print-content .abnormal {
                        color: #dc2626 !important; /* Keep abnormal red as requested previously, or black if user wants EVERYTHING black? User said "all the result data(labels and text) black". Let's use black. */
                    }
                    .print-content * {
                        color: #000 !important;
                    }
                    /* Hide navigation, buttons, footer, and all non-print elements */
                    nav, header, footer, button, .print\\:hidden, aside,
                    #app > div > nav, #app > header,
                    [role="navigation"] { 
                        display: none !important; 
                    }
                    .print\\:block { display: block !important; }
                    .bg-white { background-color: #ffffff !important; }
                    .min-h-screen { min-height: 0 !important; height: auto !important; }

                    /* Remove ALL table borders for print */
                    table, th, td, tr, thead, tbody, .overflow-hidden, .bg-white {
                        border: none !important;
                        border-bottom: none !important;
                        border-top: none !important;
                        border-left: none !important;
                        border-right: none !important;
                        border-width: 0 !important;
                        box-shadow: none !important;
                        border-collapse: collapse !important;
                        --tw-ring-offset-shadow: 0 0 #0000 !important;
                        --tw-ring-shadow: 0 0 #0000 !important;
                        --tw-shadow: 0 0 #0000 !important;
                    }
                    .border-t, .border-b, .border-l, .border-r, .border, .divide-y > * {
                         border: none !important;
                         border-width: 0 !important;
                    }
                    
                    /* Ensure signature and footer are clear */
                    .pt-12.mt-12, .dark\\:border-gray-700 {
                        border: none !important;
                        border-top-width: 0 !important;
                    }
                    
                    /* Barcode Visibility */
                    .barcode-font {
                        display: block !important;
                        visibility: visible !important;
                    }
                    
                    /* Signature and QR Code pinning for Print */
                    .print-signature-footer {
                        position: absolute !important;
                        bottom: 1.5cm !important;
                        left: 1.2cm !important;
                        right: 1.2cm !important;
                        border-top: none !important;
                        padding-top: 10px !important;
                        width: calc(100% - 2.4cm) !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: space-between !important;
                    }
                    .print-invisible {
                        visibility: hidden !important;
                    }
                }
                
                @import url('https://fonts.googleapis.com/css2?family=Libre+Barcode+39+Extended&display=swap');
                
                .barcode-font {
                    font-family: 'Libre Barcode 39 Extended', cursive !important;
                    text-transform: uppercase;
                }
            `}</style>
        </AuthenticatedLayout>
    );
}
