import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import {
    Search,
    Plus,
    Trash2,
    Eye,
    Package,
    MapPin,
    User,
    Calendar,
    Clock,
    Activity,
    FlaskConical
} from 'lucide-react';
import { useState } from 'react';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Pagination from '@/Components/Pagination';

interface Specimen {
    id: number;
    sample_id: string;
    test_order_id: number;
    sample_type: string;
    collection_at: string;
    status: 'collected' | 'processing' | 'analyzed' | 'stored' | 'discarded';
    storage_location: string | null;
    notes: string | null;
    created_at: string;
    test_order: {
        order_number: string;
        patient: {
            first_name: string;
            last_name: string;
        };
        test: {
            test_name: string;
        };
    };
    collector: {
        first_name: string;
        last_name: string;
    };
}

interface PaginatedSamples {
    data: Specimen[];
    total: number;
    links: any[];
}

export default function Index({ auth, samples, filters }: PageProps<{
    samples: PaginatedSamples;
    filters: { search?: string; status?: string };
}>) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [updatingSample, setUpdatingSample] = useState<Specimen | null>(null);

    const { data, setData, put, processing, errors, reset } = useForm({
        status: '',
        storage_location: '',
        notes: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('samples.index'), { ...filters, search: searchTerm }, { preserveState: true });
    };

    const handleStatusFilter = (status: string) => {
        router.get(route('samples.index'), { ...filters, status }, { preserveState: true });
    };

    const deleteSample = (id: number) => {
        if (confirm('Are you sure you want to delete this sample record?')) {
            router.delete(route('samples.destroy', id));
        }
    };

    const openUpdateModal = (sample: Specimen) => {
        setUpdatingSample(sample);
        setData({
            status: sample.status,
            storage_location: sample.storage_location || '',
            notes: sample.notes || '',
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!updatingSample) return;

        put(route('samples.update', updatingSample.id), {
            onSuccess: () => {
                setUpdatingSample(null);
                reset();
            }
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'collected': return 'bg-blue-100 text-blue-800';
            case 'processing': return 'bg-yellow-100 text-yellow-800';
            case 'analyzed': return 'bg-green-100 text-green-800';
            case 'stored': return 'bg-purple-100 text-purple-800';
            case 'discarded': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Specimen Management</h2>}
        >
            <Head title="Samples" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
                        <div className="flex items-center space-x-4 flex-1 w-full max-w-2xl">
                            <form onSubmit={handleSearch} className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <TextInput
                                    className="pl-10 w-full"
                                    placeholder="Search by Sample ID or Patient..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </form>
                            <select
                                className="border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md shadow-sm text-sm"
                                value={filters.status || ''}
                                onChange={(e) => handleStatusFilter(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="collected">Collected</option>
                                <option value="processing">Processing</option>
                                <option value="analyzed">Analyzed</option>
                                <option value="stored">Stored</option>
                                <option value="discarded">Discarded</option>
                            </select>
                        </div>
                        <div className="flex items-center text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-lg">
                            <FlaskConical className="h-4 w-4 mr-2" />
                            {samples.total} Samples Tracked
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {samples.data.map((sample) => (
                            <div key={sample.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all group">
                                <div className="p-5 border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 flex justify-between items-start">
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Specimen ID</div>
                                        <span className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400">
                                            {sample.sample_id}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openUpdateModal(sample)}
                                            className="p-1.5 rounded hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-indigo-600"
                                        >
                                            <Package className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteSample(sample.id)}
                                            className="p-1.5 rounded hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(sample.status)}`}>
                                            {sample.status}
                                        </span>
                                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded">
                                            {sample.sample_type}
                                        </span>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                            {sample.test_order?.patient?.first_name || 'Unknown'} {sample.test_order?.patient?.last_name || 'Patient'}
                                        </div>
                                        <div className="text-xs text-gray-500 font-medium">
                                            Testing: {sample.test_order?.test?.test_name || 'Deleted Test'}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 border-t dark:border-gray-700 pt-4">
                                        <div className="flex items-center text-xs text-gray-500">
                                            <Calendar className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                            {new Date(sample.collection_at).toLocaleString()}
                                        </div>
                                        <div className="flex items-center text-xs text-gray-500">
                                            <User className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                            By {sample.collector?.first_name || 'System'} {sample.collector?.last_name || ''}
                                        </div>
                                        {sample.storage_location && (
                                            <div className="flex items-center text-xs text-gray-500">
                                                <MapPin className="h-3.5 w-3.5 mr-2 text-indigo-400" />
                                                Loc: {sample.storage_location}
                                            </div>
                                        )}
                                    </div>

                                    {sample.notes && (
                                        <div className="text-[11px] text-gray-500 italic bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
                                            "{sample.notes}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {samples.data.length === 0 && (
                            <div className="col-span-full py-16 text-center bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
                                <FlaskConical className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 italic font-medium">No specimens found matching your criteria.</p>
                            </div>
                        )}
                    </div>
                    <Pagination links={samples.links} />
                </div>
            </div>

            {/* Update Sample Modal */}
            <Modal show={updatingSample !== null} onClose={() => setUpdatingSample(null)}>
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                        <Package className="mr-2 h-5 w-5 text-indigo-500" />
                        Update Specimen: {updatingSample?.sample_id}
                    </h2>

                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                            <InputLabel htmlFor="status" value="Processing Status" />
                            <select
                                className="mt-1 w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md shadow-sm"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value as any)}
                            >
                                <option value="collected">Collected</option>
                                <option value="processing">Processing</option>
                                <option value="analyzed">Analyzed</option>
                                <option value="stored">Stored</option>
                                <option value="discarded">Discarded</option>
                            </select>
                            <InputError message={errors.status} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="storage_location" value="Storage Location" />
                            <TextInput
                                id="storage_location"
                                className="mt-1 block w-full"
                                value={data.storage_location}
                                onChange={(e) => setData('storage_location', e.target.value)}
                                placeholder="e.g. Fridge A, Rack 4"
                            />
                            <InputError message={errors.storage_location} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="notes" value="Specimen Notes" />
                            <textarea
                                className="mt-1 w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md shadow-sm text-sm"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                rows={3}
                                placeholder="Any observations about the specimen..."
                            />
                            <InputError message={errors.notes} className="mt-2" />
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <SecondaryButton onClick={() => setUpdatingSample(null)}>
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton disabled={processing}>
                                Update Specimen
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
