import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { Search, Edit, Trash2, ShieldCheck, Plus } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface Hmo {
    id: number;
    name: string;
    type: string | null;
}

export default function Index({ auth, hmos, filters }: PageProps<{ hmos: { data: Hmo[] }, filters: { search?: string } }>) {
    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        id: null as number | null,
        name: '',
        type: '',
    });

    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEditing && data.id) {
            patch(route('hmos.update', data.id), {
                onSuccess: () => {
                    reset();
                    setIsEditing(false);
                }
            });
        } else {
            post(route('hmos.store'), {
                onSuccess: () => reset()
            });
        }
    };

    const handleEdit = (hmo: Hmo) => {
        setIsEditing(true);
        clearErrors();
        setData({
            id: hmo.id,
            name: hmo.name,
            type: hmo.type || '',
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('hmos.index'), { search: searchTerm }, { preserveState: true });
    };

    const handleDelete = (hmo: Hmo) => {
        if (confirm(`Are you sure you want to delete the HMO "${hmo.name}"?`)) {
            router.delete(route('hmos.destroy', hmo.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">HMOs</h2>}
        >
            <Head title="HMOs" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Form Panel */}
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                                    <ShieldCheck className="h-5 w-5 mr-2 text-indigo-500" />
                                    {isEditing ? 'Edit HMO' : 'Create New HMO'}
                                </h3>

                                <form onSubmit={submit} className="space-y-4">
                                    <div>
                                        <InputLabel htmlFor="name" value="HMO Name" />
                                        <TextInput
                                            id="name"
                                            className="mt-1 block w-full"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                            placeholder="e.g., NHIS, Reliance"
                                        />
                                        <InputError message={errors.name} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="type" value="HMO Type" />
                                        <TextInput
                                            id="type"
                                            className="mt-1 block w-full"
                                            value={data.type}
                                            onChange={(e) => setData('type', e.target.value)}
                                            placeholder="e.g., NHIS, Private, Corporate"
                                        />
                                        <InputError message={errors.type} className="mt-2" />
                                    </div>

                                    <div className="flex items-center justify-end mt-4 pt-4 border-t dark:border-gray-700">
                                        {isEditing && (
                                            <button
                                                type="button"
                                                onClick={() => { setIsEditing(false); reset(); }}
                                                className="mr-4 text-sm text-gray-600 dark:text-gray-400 underline"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <PrimaryButton disabled={processing}>
                                            {isEditing ? 'Update HMO' : 'Create HMO'}
                                        </PrimaryButton>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* List Panel */}
                        <div className="lg:col-span-2">
                            <div className="bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg overflow-hidden">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                    <form onSubmit={handleSearch} className="flex gap-4">
                                        <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Search className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md leading-5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                placeholder="Search HMOs..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <PrimaryButton type="submit">Search</PrimaryButton>
                                    </form>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-900">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">HMO Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {hmos.data.map((hmo) => (
                                                <tr key={hmo.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${data.id === hmo.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mr-3">
                                                                <ShieldCheck className="h-5 w-5 text-indigo-500" />
                                                            </div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                {hmo.name}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                            {hmo.type || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-3">
                                                            <button onClick={() => handleEdit(hmo)} className="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400">
                                                                <Edit className="h-5 w-5" />
                                                            </button>
                                                            <button onClick={() => handleDelete(hmo)} className="text-red-600 hover:text-red-900 dark:hover:text-red-400">
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {hmos.data.length === 0 && (
                                                <tr>
                                                    <td colSpan={2} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                                        No HMOs found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
