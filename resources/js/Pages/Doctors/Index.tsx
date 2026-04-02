import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { Plus, Search, Edit, Trash2, UserCog, Mail, Phone, Building2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';

interface Hospital {
    id: number;
    name: string;
}

interface Doctor {
    id: number;
    name: string;
    hospital_id: number;
    email: string | null;
    phone: string | null;
    hospital?: Hospital;
}

export default function Index({ auth, doctors, hospitals, filters }: PageProps<{ doctors: { data: Doctor[] }, hospitals: Hospital[], filters: { search?: string } }>) {
    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        id: null as number | null,
        name: '',
        hospital_id: '' as string | number,
        email: '',
        phone: '',
    });

    const [isEditing, setIsEditing] = useState(false);
    const [showingHospitalModal, setShowingHospitalModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const hospitalForm = useForm({
        name: '',
        address: '',
        phone: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEditing && data.id) {
            patch(route('doctors.update', data.id), {
                onSuccess: () => {
                    reset();
                    setIsEditing(false);
                }
            });
        } else {
            post(route('doctors.store'), {
                onSuccess: () => reset()
            });
        }
    };

    const handleEdit = (doctor: Doctor) => {
        setIsEditing(true);
        clearErrors();
        setData({
            id: doctor.id,
            name: doctor.name,
            hospital_id: doctor.hospital_id,
            email: doctor.email || '',
            phone: doctor.phone || '',
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('doctors.index'), { search: searchTerm }, { preserveState: true });
    };

    const handleDelete = (doctor: Doctor) => {
        if (confirm(`Are you sure you want to delete the doctor "${doctor.name}"?`)) {
            router.delete(route('doctors.destroy', doctor.id));
        }
    };

    const handleQuickAddHospital = (e: React.FormEvent) => {
        e.preventDefault();
        hospitalForm.post(route('hospitals.store'), {
            onSuccess: () => {
                setShowingHospitalModal(false);
                hospitalForm.reset();
            },
            preserveState: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Doctors</h2>}
        >
            <Head title="Doctors" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Form Panel */}
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                                    <UserCog className="h-5 w-5 mr-2 text-indigo-500" />
                                    {isEditing ? 'Edit Doctor' : 'Create New Doctor'}
                                </h3>

                                <form onSubmit={submit} className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <InputLabel htmlFor="hospital_id" value="Hospital" />
                                            <button
                                                type="button"
                                                onClick={() => setShowingHospitalModal(true)}
                                                className="text-xs text-indigo-500 hover:underline flex items-center"
                                            >
                                                <Plus className="h-3 w-3 mr-1" /> Add New
                                            </button>
                                        </div>
                                        <select
                                            id="hospital_id"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={data.hospital_id}
                                            onChange={(e) => setData('hospital_id', e.target.value)}
                                            required
                                        >
                                            <option value="">Select a hospital</option>
                                            {hospitals.map((hospital) => (
                                                <option key={hospital.id} value={hospital.id}>
                                                    {hospital.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.hospital_id} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="name" value="Doctor Name" />
                                        <TextInput
                                            id="name"
                                            className="mt-1 block w-full"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                            placeholder="Dr. John Doe"
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
                                            placeholder="doctor@example.com"
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
                                            {isEditing ? 'Update Doctor' : 'Create Doctor'}
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
                                                placeholder="Search doctors..."
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
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Doctor</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hospital</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {doctors.data.map((doctor) => (
                                                <tr key={doctor.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${data.id === doctor.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mr-3">
                                                                <UserCog className="h-5 w-5 text-indigo-500" />
                                                            </div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                {doctor.name}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        <div className="flex items-center">
                                                            <Building2 className="h-4 w-4 mr-1 text-gray-400" />
                                                            {doctor.hospital?.name || 'Unknown Hospital'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-col gap-1">
                                                            {doctor.email && <span className="flex items-center"><Mail className="h-3 w-3 mr-1" /> {doctor.email}</span>}
                                                            {doctor.phone && <span className="flex items-center"><Phone className="h-3 w-3 mr-1" /> {doctor.phone}</span>}
                                                            {!doctor.email && !doctor.phone && <span>No contact info</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-3">
                                                            <button onClick={() => handleEdit(doctor)} className="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400">
                                                                <Edit className="h-5 w-5" />
                                                            </button>
                                                            <button onClick={() => handleDelete(doctor)} className="text-red-600 hover:text-red-900 dark:hover:text-red-400">
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {doctors.data.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                                        No doctors found.
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

            <Modal show={showingHospitalModal} onClose={() => setShowingHospitalModal(false)}>
                <form onSubmit={handleQuickAddHospital} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                        <Building2 className="mr-2 h-5 w-5 text-indigo-500" />
                        Quick Add Hospital
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="h_name" value="Hospital Name *" />
                            <TextInput
                                id="h_name"
                                className="mt-1 block w-full"
                                value={hospitalForm.data.name}
                                onChange={(e) => hospitalForm.setData('name', e.target.value)}
                                required
                            />
                            <InputError message={hospitalForm.errors.name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="h_phone" value="Phone" />
                            <TextInput
                                id="h_phone"
                                className="mt-1 block w-full"
                                value={hospitalForm.data.phone}
                                onChange={(e) => hospitalForm.setData('phone', e.target.value)}
                            />
                            <InputError message={hospitalForm.errors.phone} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="h_address" value="Address" />
                            <textarea
                                id="h_address"
                                className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md shadow-sm"
                                value={hospitalForm.data.address}
                                onChange={(e) => hospitalForm.setData('address', e.target.value)}
                            />
                            <InputError message={hospitalForm.errors.address} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setShowingHospitalModal(false)}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton disabled={hospitalForm.processing}>
                            {hospitalForm.processing ? 'Adding...' : 'Add Hospital'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
