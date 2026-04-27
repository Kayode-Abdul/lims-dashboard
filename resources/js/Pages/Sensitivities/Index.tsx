import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Checkbox from '@/Components/Checkbox';
import { Search, Edit, Trash2, Activity } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface Sensitivity {
    id: number;
    name: string;
    type: 'number' | 'text';
    value: string;
    is_active: boolean;
}

export default function Index({ auth, sensitivities = [] }: PageProps<{ sensitivities: Sensitivity[] }>) {
    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        id: null as number | null,
        name: '',
        type: 'number' as 'number' | 'text',
        value: '',
        is_active: true,
    });

    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEditing && data.id) {
            patch(route('sensitivities.update', data.id), {
                onSuccess: () => {
                    reset();
                    setIsEditing(false);
                }
            });
        } else {
            post(route('sensitivities.store'), {
                onSuccess: () => reset()
            });
        }
    };

    const handleEdit = (sensitivity: Sensitivity) => {
        setIsEditing(true);
        clearErrors();
        setData({
            id: sensitivity.id,
            name: sensitivity.name,
            type: sensitivity.type,
            value: sensitivity.value,
            is_active: sensitivity.is_active,
        });
    };

    const handleDelete = (sensitivity: Sensitivity) => {
        if (confirm(`Are you sure you want to delete "${sensitivity.name}"?`)) {
            router.delete(route('sensitivities.destroy', sensitivity.id));
        }
    };

    const formatSensitivity = (sensitivity: Sensitivity) => {
        if (!sensitivity.value) return '[---]';
        if (sensitivity.type === 'number') {
            const count = parseInt(sensitivity.value) || 0;
            return `[${'+'.repeat(count)}]`;
        }
        return `[${sensitivity.value}]`;
    };

    const filteredSensitivities = sensitivities.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.value.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Test Sensitivities Configuration</h2>}
        >
            <Head title="Sensitivities" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Form Panel */}
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 border dark:border-gray-700">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                                    <Activity className="h-5 w-5 mr-2 text-indigo-500" />
                                    {isEditing ? 'Edit Sensitivity' : 'Create New Sensitivity'}
                                </h3>

                                <form onSubmit={submit} className="space-y-4">
                                    <div>
                                        <InputLabel htmlFor="name" value="Sensitivity Name" />
                                        <TextInput
                                            id="name"
                                            className="mt-1 block w-full"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                            placeholder="e.g., Reactive, Erythromycin"
                                        />
                                        <InputError message={errors.name} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="type" value="Type" />
                                        <select
                                            id="type"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm h-11"
                                            value={data.type}
                                            onChange={(e) => setData('type', e.target.value as 'number' | 'text')}
                                        >
                                            <option value="number">Numeric (e.g. [++])</option>
                                            <option value="text">Text (e.g. [ER])</option>
                                        </select>
                                        <InputError message={errors.type} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="value" value={data.type === 'number' ? "Default Number of '+' Symbols" : "Default Text Value"} />
                                        <TextInput
                                            id="value"
                                            className="mt-1 block w-full"
                                            value={data.value || ''}
                                            onChange={(e) => setData('value', e.target.value)}
                                            type={data.type === 'number' ? 'number' : 'text'}
                                            placeholder={data.type === 'number' ? "e.g. 2 for [++]" : "e.g. ER for [ER]"}
                                        />
                                        <InputError message={errors.value} className="mt-2" />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="is_active"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                        />
                                        <InputLabel htmlFor="is_active" value="Active" />
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
                                            {isEditing ? 'Update Sensitivity' : 'Create Sensitivity'}
                                        </PrimaryButton>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* List Panel */}
                        <div className="lg:col-span-2">
                            <div className="bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg overflow-hidden border dark:border-gray-700">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md leading-5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            placeholder="Search sensitivities..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Display Format</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Value</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {filteredSensitivities.map((s) => (
                                                <tr key={s.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${data.id === s.id ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''}`}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{s.name}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">
                                                            {formatSensitivity(s)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {s.value || 'N/A'} ({s.type})
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-[10px] leading-5 font-black uppercase rounded-full ${s.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                            {s.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-3">
                                                            <button onClick={() => handleEdit(s)} className="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400">
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                            <button onClick={() => handleDelete(s)} className="text-red-600 hover:text-red-900 dark:hover:text-red-400">
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredSensitivities.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400 italic">
                                                        No sensitivities defined.
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
