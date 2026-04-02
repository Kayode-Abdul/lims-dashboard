import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Checkbox from '@/Components/Checkbox';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { Edit, Plus, Mail, Phone } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface Lab {
    id: number;
    name: string;
    slug: string;
    email: string;
    phone: string;
    address: string;
    is_active: boolean;
    expires_at: string | null;
    users_count?: number;
}

interface PaginatedLabs {
    data: Lab[];
    links: any[];
    current_page: number;
    total: number;
}

export default function Index({ auth, labs }: PageProps<{ labs: PaginatedLabs }>) {
    const { data, setData, post, patch, processing, errors, reset } = useForm({
        id: null as number | null,
        name: '',
        email: '',
        phone: '',
        address: '',
        is_active: true,
        expires_at: '' as string | null,
    });

    const [isEditing, setIsEditing] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEditing && data.id) {
            patch(route('super-admin.labs.update', data.id), {
                onSuccess: () => {
                    setIsEditing(false);
                    setShowForm(false);
                    reset();
                }
            });
        } else {
            post(route('super-admin.labs.store'), {
                onSuccess: () => {
                    setShowForm(false);
                    reset();
                }
            });
        }
    };

    const handleEdit = (lab: Lab) => {
        setIsEditing(true);
        setShowForm(true);
        setData({
            id: lab.id,
            name: lab.name,
            email: lab.email || '',
            phone: lab.phone || '',
            address: lab.address || '',
            is_active: lab.is_active,
            expires_at: lab.expires_at ? lab.expires_at.split('T')[0] : '', // Extract date part for input
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Laboratory Network</h2>}
        >
            <Head title="Manage Labs" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Laboratories</h3>
                        <Link
                            href={route('super-admin.labs.create')}
                            className="inline-flex items-center px-4 py-2 bg-gray-800 dark:bg-gray-200 border border-transparent rounded-md font-semibold text-xs text-white dark:text-gray-800 uppercase tracking-widest hover:bg-gray-700 dark:hover:bg-white focus:bg-gray-700 dark:focus:bg-white active:bg-gray-900 dark:active:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Register New Lab
                        </Link>
                    </div>

                    {showForm && (
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 mb-6">
                            <h4 className="text-md font-medium mb-4">{isEditing ? 'Update Lab Details' : 'Register New Lab'}</h4>
                            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="name" value="Lab Name" />
                                    <TextInput id="name" className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="email" value="Official Email" />
                                    <TextInput id="email" type="email" className="mt-1 block w-full" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                                    <InputError message={errors.email} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="phone" value="Phone Number" />
                                    <TextInput id="phone" type="text" className="mt-1 block w-full" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                                    <InputError message={errors.phone} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="expires_at" value="Subscription Expiry" />
                                    <TextInput id="expires_at" type="date" className="mt-1 block w-full" value={data.expires_at || ''} onChange={(e) => setData('expires_at', e.target.value)} />
                                    <InputError message={errors.expires_at} className="mt-2" />
                                </div>
                                <div className="md:col-span-2">
                                    <InputLabel htmlFor="address" value="Physical Address" />
                                    <TextInput id="address" type="text" className="mt-1 block w-full" value={data.address} onChange={(e) => setData('address', e.target.value)} />
                                    <InputError message={errors.address} className="mt-2" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="flex items-center">
                                        <Checkbox
                                            name="is_active"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                        />
                                        <span className="ms-2 text-sm text-gray-600 dark:text-gray-400">Account Active</span>
                                    </label>
                                </div>
                                <div className="md:col-span-2 flex justify-end gap-2">
                                    <SecondaryButton onClick={() => {
                                        setShowForm(false);
                                        setIsEditing(false);
                                        reset();
                                    }}>Cancel</SecondaryButton>
                                    <PrimaryButton disabled={processing}>{isEditing ? 'Update Lab Details' : 'Register'}</PrimaryButton>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-900">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lab Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {labs.data.map((lab) => (
                                        <tr key={lab.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{lab.name}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs rounded-full ${lab.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {lab.is_active ? 'Active' : 'Disabled'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => handleEdit(lab)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
