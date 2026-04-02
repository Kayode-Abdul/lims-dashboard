import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { Search, Edit, Trash2, Building2, MapPin, Mail, Phone, Plus, CreditCard } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface Hospital {
    id: number;
    name: string;
    address: string | null;
    email: string | null;
    phone: string | null;
}

export default function Index({ auth, hospitals, filters }: PageProps<{ hospitals: { data: Hospital[] }, filters: { search?: string } }>) {
    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        id: null as number | null,
        name: '',
        address: '',
        email: '',
        phone: '',
    });

    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEditing && data.id) {
            patch(route('hospitals.update', data.id), {
                onSuccess: () => {
                    reset();
                    setIsEditing(false);
                }
            });
        } else {
            post(route('hospitals.store'), {
                onSuccess: () => reset()
            });
        }
    };

    const handleEdit = (hospital: Hospital) => {
        setIsEditing(true);
        clearErrors();
        setData({
            id: hospital.id,
            name: hospital.name,
            address: hospital.address || '',
            email: hospital.email || '',
            phone: hospital.phone || '',
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('hospitals.index'), { search: searchTerm }, { preserveState: true });
    };

    const handleDelete = (hospital: Hospital) => {
        if (confirm(`Are you sure you want to delete the hospital "${hospital.name}"?`)) {
            router.delete(route('hospitals.destroy', hospital.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Hospitals</h2>}
        >
            <Head title="Hospitals" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Form Panel */}
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                                    <Building2 className="h-5 w-5 mr-2 text-indigo-500" />
                                    {isEditing ? 'Edit Hospital' : 'Create New Hospital'}
                                </h3>

                                <form onSubmit={submit} className="space-y-4">
                                    <div>
                                        <InputLabel htmlFor="name" value="Hospital Name" />
                                        <TextInput
                                            id="name"
                                            className="mt-1 block w-full"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                            placeholder="e.g., General Hospital"
                                        />
                                        <InputError message={errors.name} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="email" value="Email" />
                                        <TextInput
                                            id="email"
                                            type="email"
                                            className="mt-1 block w-full"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="contact@hospital.com"
                                        />
                                        <InputError message={errors.email} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="phone" value="Phone" />
                                        <TextInput
                                            id="phone"
                                            className="mt-1 block w-full"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            placeholder="+1234567890"
                                        />
                                        <InputError message={errors.phone} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="address" value="Address" />
                                        <textarea
                                            id="address"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            rows={3}
                                            placeholder="Full hospital address..."
                                        />
                                        <InputError message={errors.address} className="mt-2" />
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
                                            {isEditing ? 'Update Hospital' : 'Create Hospital'}
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
                                                placeholder="Search hospitals..."
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
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hospital</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Address</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {hospitals.data.map((hospital) => (
                                                <tr key={hospital.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${data.id === hospital.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mr-3">
                                                                <Building2 className="h-5 w-5 text-indigo-500" />
                                                            </div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                {hospital.name}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-col gap-1">
                                                            {hospital.email && <span className="flex items-center"><Mail className="h-3 w-3 mr-1" /> {hospital.email}</span>}
                                                            {hospital.phone && <span className="flex items-center"><Phone className="h-3 w-3 mr-1" /> {hospital.phone}</span>}
                                                            {!hospital.email && !hospital.phone && <span>No contact info</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-500 dark:text-gray-400 limit-lines-1 max-w-xs overflow-hidden text-ellipsis flex items-center">
                                                            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                                                            {hospital.address || 'No address'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-3">
                                                            <a href={route('hospitals.account', hospital.id)} className="text-emerald-600 hover:text-emerald-900 dark:hover:text-emerald-400" title="Financial Account">
                                                                <CreditCard className="h-5 w-5" />
                                                            </a>
                                                            <button onClick={() => handleEdit(hospital)} className="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400">
                                                                <Edit className="h-5 w-5" />
                                                            </button>
                                                            <button onClick={() => handleDelete(hospital)} className="text-red-600 hover:text-red-900 dark:hover:text-red-400">
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {hospitals.data.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                                        No hospitals found.
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
