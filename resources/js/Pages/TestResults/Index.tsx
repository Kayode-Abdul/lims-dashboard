import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import axios from 'axios';
import {
    Search,
    FileText,
    CheckCircle,
    AlertTriangle,
    Clock,
    Shield,
    Download,
    Eye,
    Activity,
    User,
    Share2,
    Mail,
    Phone
} from 'lucide-react';
import { useState } from 'react';
import { formatDate } from '@/Utils/dateUtils';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PaginationComp from '@/Components/Pagination';

interface Patient {
    id: number;
    first_name: string;
    last_name: string;
    patient_id: string;
}

interface Test {
    id: number;
    test_name: string;
    test_code: string;
}

interface TestOrder {
    id: number;
    order_number: string;
    patient: Patient;
    test: Test;
}

interface TestResult {
    id: number;
    test_order_id: number;
    result_value: string | null;
    result_type: string | null;
    reference_range: string | null;
    units: string | null;
    is_abnormal: boolean;
    verified_by: number | null;
    verified_at: string | null;
    created_at: string;
    notes?: string | null;
    test_order: TestOrder;
    verified_by_user?: {
        first_name: string;
        last_name: string;
    };
}

interface GroupedResult {
    order_number: string;
    patient_id: number;
    patient: Patient;
    results: TestResult[];
    verified_at: string | null;
    is_abnormal: boolean;
    created_at: string;
}

interface PaginatedResults {
    data: GroupedResult[];
    links: any[];
    total: number;
}

export default function Index({ auth, results, filters }: PageProps<{
    results: PaginatedResults;
    filters: { search?: string };
}>) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [sharingResult, setSharingResult] = useState<GroupedResult | null>(null);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('test-results.index'), { search: searchTerm }, { preserveState: true });
    };

    const handleDownloadPdf = (orderNumber: string) => {
        window.open(route('test-results.pdf', orderNumber.replace('/', '-')));
    };

    const handleWhatsAppShare = async (group: GroupedResult) => {
        const orderSuffix = group.order_number.replace(/\//g, '-');
        const fileName = `LabReport_${orderSuffix}.pdf`;
        const pdfUrl = route('test-results.pdf', orderSuffix);

        try {
            // Try to share as a file if supported (Mobile)
            if (navigator.canShare && navigator.share) {
                const response = await axios.get(pdfUrl, { responseType: 'blob' });
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const file = new File([blob], fileName, { type: 'application/pdf' });

                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `Lab Report - ${group.order_number}`,
                        text: `Lab Report for ${group.patient.first_name} ${group.patient.last_name}`,
                    });
                    return;
                }
            }
        } catch (error) {
            console.error('Error sharing file:', error);
        }

        // Fallback for desktop or unsupported browsers
        let finalPdfUrl = `${window.location.protocol}//${window.location.host}${pdfUrl}`;
        
        try {
            // Fetch a zipped version for desktop to trigger easier download
            const zipResponse = await axios.get(route('test-results.zip', orderSuffix));
            if (zipResponse.data.url) {
                finalPdfUrl = zipResponse.data.url;
            }
        } catch (e) {
            console.error('Failed to get zip URL, using direct PDF link:', e);
        }

        const tests = group.results.map(r => `${r.test_order?.test?.test_name}: ${r.result_value} ${r.units || ''}`).join('\n');

        const stripHtml = (html: string) => {
            const tmp = document.createElement("DIV");
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || "";
        };

        const notesText = group.results.filter(res => res.notes).map(res => `Note: ${stripHtml(res.notes || '')}`).join('\n');

        const message = `*Laboratory Result Alert*\n\n` +
            `Patient: ${group.patient.first_name} ${group.patient.last_name}\n\n` +
            `Results:\n${tests}\n\n` +
            (notesText ? `${notesText}\n\n` : '') +
            `Status: ${group.verified_at ? 'Verified' : 'Preliminary'}\n` +
            `Ref: ${group.order_number}\n\n` +
            `Download Result: ${finalPdfUrl}`;

        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleEmailShare = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sharingResult) return;

        post(route('test-results.email', sharingResult.order_number.replace('/', '-')), {
            onSuccess: () => {
                setSharingResult(null);
                reset();
            }
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Laboratory Results</h2>}
        >
            <Head title="Test Results" />

            <div className="py-12 bg-white min-h-screen">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                        <div className="flex items-center space-x-4 flex-1">
                            <form onSubmit={handleSearch} className="relative w-full max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <TextInput
                                    className="pl-10 w-full"
                                    placeholder="Search by patient or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </form>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center text-sm text-gray-500">
                                <Activity className="h-4 w-4 mr-2 text-indigo-500" />
                                <strong>{results.total}</strong> Total Results
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.data.map((group) => (
                            <div key={group.order_number} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-5 border-b dark:border-gray-700 bg-white flex justify-between items-start">
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Order Ref</div>
                                        <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                            {group.order_number}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {group.verified_at ? (
                                            <span className="flex items-center text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                                                <Shield className="h-3 w-3 mr-1" /> VERIFIED
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-[10px] font-bold text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">
                                                <Clock className="h-3 w-3 mr-1" /> PRELIMINARY
                                            </span>
                                        )}
                                        {group.is_abnormal && (
                                            <span className="flex items-center text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded shadow-sm">
                                                <AlertTriangle className="h-3 w-3" />
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                            <User className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-gray-100 capitalize">
                                                {group.patient?.first_name || 'Unknown'} {group.patient?.last_name || 'Patient'}
                                            </div>
                                            <div className="text-xs text-gray-500 font-mono">
                                                {group.patient?.patient_id || ''}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg space-y-3">
                                        {group.results.map((res) => (
                                            <div key={res.id} className="flex justify-between items-center border-b dark:border-gray-700 last:border-0 pb-2 last:pb-0">
                                                <div className="flex-1">
                                                    <div className="text-[10px] font-bold text-gray-500 uppercase">Test Parameter</div>
                                                    <div className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate pr-2">
                                                        {res.test_order?.test?.test_name || 'Deleted Test'}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] font-bold text-gray-500 uppercase">Result</div>
                                                    <div className={`text-sm font-black ${res.is_abnormal
                                                        ? res.result_value?.includes('(High)') ? 'text-red-600'
                                                            : res.result_value?.includes('(Low)') ? 'text-blue-600'
                                                                : 'text-orange-600'
                                                        : 'text-green-600'
                                                        }`}>
                                                        {res.result_value?.replace(/ \((High|Low)\)/, '') || ''}
                                                        {res.is_abnormal && res.result_value && (
                                                            <span className={`ml-1 text-[9px] px-1 rounded ${res.result_value.includes('(High)')
                                                                ? 'bg-red-100 text-red-800'
                                                                : res.result_value.includes('(Low)')
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : 'bg-orange-100 text-orange-800'
                                                                }`}>
                                                                {res.result_value.includes('(High)') ? 'H' : res.result_value.includes('(Low)') ? 'L' : '!'}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] font-normal text-gray-500 ml-1">{res.units}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
                                        <div className="flex items-center text-xs text-gray-500">
                                            <FileText className="h-3.5 w-3.5 mr-1" />
                                            {formatDate(group.created_at)}
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleDownloadPdf(group.order_number)}
                                                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-indigo-600 transition-colors"
                                                title="Download PDF Report"
                                            >
                                                <Download className="h-4 w-4" />
                                            </button>
                                            <Link
                                                href={route('test-results.show', group.order_number.replace('/', '-'))}
                                                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-indigo-600 transition-colors"
                                                title="View & Print Report"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleWhatsAppShare(group)}
                                                className="p-1.5 rounded hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-400 hover:text-green-600 transition-colors"
                                                title="Share via WhatsApp"
                                            >
                                                <Phone className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setSharingResult(group)}
                                                className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-600 transition-colors"
                                                title="Share via Email"
                                            >
                                                <Mail className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {results.data.length === 0 && (
                            <div className="col-span-full py-12 text-center bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                                <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 italic">No laboratory results released yet.</p>
                            </div>
                        )}
                    </div>

                    <PaginationComp links={results.links} />
                </div>
            </div>

            {/* Email Share Modal */}
            <Modal show={sharingResult !== null} onClose={() => setSharingResult(null)}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                        <Share2 className="mr-2 h-5 w-5 text-indigo-500" />
                        Share Report via Email
                    </h2>

                    <form onSubmit={handleEmailShare} className="space-y-4">
                        <div>
                            <InputLabel htmlFor="email" value="Recipient Email Address" />
                            <TextInput
                                id="email"
                                type="email"
                                className="mt-1 block w-full"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="patient@example.com"
                                required
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <SecondaryButton onClick={() => setSharingResult(null)}>
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton disabled={processing}>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Report
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
