import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import { Search, Plus, Edit, Trash2, Eye, Phone, MapPin, Calendar, User } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface Patient {
    id: number;
    patient_id: string;
    patient_type: string;
    patient_classification_id?: number;
    hospital_id?: number;
    doctor_id?: number;
    hmo_id?: number;
    age_group?: 'Adult' | 'Child';
    title?: string;
    first_name: string;
    last_name: string;
    other_names?: string;
    date_of_birth?: string;
    sex?: string;
    phone?: string;
    email?: string;
    address?: string;
    is_active: boolean;
    hospital?: { name: string };
    doctor?: { name: string };
    hmo?: { name: string };
    classification?: { name: string };
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedPatients {
    data: Patient[];
    links: PaginationLinks[];
    current_page: number;
    last_page: number;
    total: number;
}

interface MetadataItem {
    id: number;
    name: string;
}

interface Doctor extends MetadataItem {
    hospital_id: number;
}

export default function Index({ auth, patients, filters, classifications, hospitals, doctors, hmos }: PageProps<{
    patients: PaginatedPatients,
    filters: { search?: string },
    classifications: MetadataItem[],
    hospitals: MetadataItem[],
    doctors: Doctor[],
    hmos: MetadataItem[]
}>) {
    const { data, setData, post, processing, errors, reset } = useForm({
        patient_type: 'walk-in',
        patient_classification_id: '' as string | number,
        hospital_id: '' as string | number,
        doctor_id: '' as string | number,
        hmo_id: '' as string | number,
        age_group: '' as 'Adult' | 'Child' | '',
        title: '',
        first_name: '',
        last_name: '',
        phone: '',
        sex: '',
        date_of_birth: '',
        age_years: '' as string | number,
        age_months: '' as string | number,
        age_weeks: '' as string | number,
    });

    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const calculateDob = (years: number | string, months: number | string, weeks: number | string) => {
        const d = new Date();
        if (years) d.setFullYear(d.getFullYear() - Number(years));
        if (months) d.setMonth(d.getMonth() - Number(months));
        if (weeks) d.setDate(d.getDate() - (Number(weeks) * 7));
        return d.toISOString().split('T')[0];
    };

    const handleAgeChange = (field: 'age_years' | 'age_months' | 'age_weeks', value: string) => {
        setData((prevData) => {
            const newData = { ...prevData, [field]: value };
            if (newData.age_years || newData.age_months || newData.age_weeks) {
                newData.date_of_birth = calculateDob(newData.age_years || 0, newData.age_months || 0, newData.age_weeks || 0);
            }
            return newData;
        });
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('patients.store'), {
            onSuccess: () => reset(),
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('patients.index'), { search: searchTerm }, { preserveState: true });
    };

    const deletePatient = (id: number) => {
        if (confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
            router.delete(route('patients.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Patient Register</h2>
                    <Link href={route('patients.create')}>
                        <PrimaryButton className="flex items-center">
                            <Plus className="h-4 w-4 mr-2" />
                            Full Registration
                        </PrimaryButton>
                    </Link>
                </div>
            }
        >
            <Head title="Patients" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                        {/* Quick Register Form */}
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 border border-indigo-100 dark:border-indigo-900/30">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                                    <Plus className="h-5 w-5 mr-2 text-indigo-500" />
                                    Fast Register
                                </h3>
                                <form onSubmit={submit} className="space-y-4">
                                    <div>
                                        <InputLabel htmlFor="patient_classification_id" value="Classification *" />
                                        <select
                                            id="patient_classification_id"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm text-sm"
                                            value={data.patient_classification_id}
                                            onChange={(e) => {
                                                const id = e.target.value;
                                                setData('patient_classification_id', id);
                                                const selected = classifications.find(c => c.id.toString() === id);
                                                if (selected) {
                                                    const name = selected.name.toLowerCase();
                                                    if (name.includes('hmo')) setData('patient_type', 'hmo');
                                                    else if (name.includes('referred')) setData('patient_type', 'referred');
                                                    else setData('patient_type', 'walk-in');
                                                }
                                            }}
                                            required
                                        >
                                            <option value="">Select</option>
                                            {classifications.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="first_name" value="First Name *" />
                                        <TextInput
                                            id="first_name"
                                            className="mt-1 block w-full text-sm"
                                            value={data.first_name}
                                            onChange={(e) => setData('first_name', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="last_name" value="Last Name" />
                                        <TextInput
                                            id="last_name"
                                            className="mt-1 block w-full text-sm"
                                            value={data.last_name}
                                            onChange={(e) => setData('last_name', e.target.value)}

                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel htmlFor="phone" value="Phone" />
                                            <TextInput
                                                id="phone"
                                                className="mt-1 block w-full text-sm"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="sex" value="Sex *" />
                                            <select
                                                id="sex"
                                                className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm text-sm"
                                                value={data.sex}
                                                onChange={(e) => setData('sex', e.target.value)}
                                                required
                                            >
                                                <option value="">Select</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <InputLabel value="Age (Years / Months / Weeks)" />
                                        <div className="grid grid-cols-3 gap-2 mt-1">
                                            <TextInput
                                                id="age_years"
                                                type="number"
                                                placeholder="Years"
                                                className="w-full text-sm"
                                                value={data.age_years}
                                                onChange={(e) => handleAgeChange('age_years', e.target.value)}
                                            />
                                            <TextInput
                                                id="age_months"
                                                type="number"
                                                placeholder="Months"
                                                className="w-full text-sm"
                                                value={data.age_months}
                                                onChange={(e) => handleAgeChange('age_months', e.target.value)}
                                            />
                                            <TextInput
                                                id="age_weeks"
                                                type="number"
                                                placeholder="Weeks"
                                                className="w-full text-sm"
                                                value={data.age_weeks}
                                                onChange={(e) => handleAgeChange('age_weeks', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <PrimaryButton disabled={processing} className="w-full justify-center">
                                            Register
                                        </PrimaryButton>
                                    </div>
                                    <p className="text-[10px] text-gray-500 text-center">
                                        For HMO/Referrals use <Link href={route('patients.create')} className="text-indigo-500 underline">Full Registration</Link>
                                    </p>
                                </form>

                                {(auth.user.role === 'admin' || auth.user.role === 'supervisor' || auth.user.role === 'lab_admin' || auth.user.is_super_admin) && (
                                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Management</h4>
                                        <div className="space-y-2">
                                            <Link href={route('hospitals.index')} className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-500 transition-colors">
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2"></div>
                                                Manage Hospitals
                                            </Link>
                                            <Link href={route('doctors.index')} className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-500 transition-colors">
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2"></div>
                                                Manage Doctors
                                            </Link>
                                            <Link href={route('hmos.index')} className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-500 transition-colors">
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2"></div>
                                                Manage HMOs
                                            </Link>
                                            <Link href={route('patient-classifications.index')} className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-500 transition-colors">
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2"></div>
                                                Classifications
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Patient List */}
                        <div className="lg:col-span-3">
                            <div className="bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg overflow-hidden">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                            Manage Patients
                                        </h3>
                                        <form onSubmit={handleSearch} className="flex gap-4 flex-1 max-w-md">
                                            <div className="relative flex-1">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Search className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md leading-5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                    placeholder="Search..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                            <PrimaryButton type="submit">Search</PrimaryButton>
                                        </form>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-900">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Patient ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {patients.data.map((patient) => (
                                                <tr key={patient.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                                                        <Link href={route('patients.show', patient.id)} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                                                            {patient.patient_id}
                                                        </Link>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Link href={route('patients.show', patient.id)} className="hover:underline cursor-pointer">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400">
                                                                {patient.title} {patient.first_name} {patient.last_name}
                                                            </div>
                                                        </Link>
                                                        <div className="flex gap-2 items-center mt-1">
                                                            <span className={`px-2 inline-flex text-[10px] leading-4 font-semibold rounded-full ${patient.patient_type === 'hmo' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                                                                patient.patient_type === 'referred' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                                }`}>
                                                                {patient.classification?.name || patient.patient_type.toUpperCase()}
                                                            </span>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {patient.sex}, {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('en-GB') : patient.age_group || 'N/A'}
                                                            </div>
                                                        </div>
                                                        {(patient.doctor || patient.hmo) && (
                                                            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 italic">
                                                                {patient.doctor ? `Ref: ${patient.doctor.name}` : `HMO: ${patient.hmo?.name}`}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                            <Phone className="h-4 w-4 mr-2" />
                                                            {patient.phone || 'N/A'}
                                                        </div>
                                                        <div className="flex items-center text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                            {patient.email || ''}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex space-x-2">
                                                            <Link href={route('patients.edit', patient.id)} className="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400">
                                                                <Edit className="h-5 w-5" />
                                                            </Link>
                                                            <Link href={route('patients.show', patient.id)} className="text-green-600 hover:text-green-900 dark:hover:text-green-400">
                                                                <Eye className="h-5 w-5" />
                                                            </Link>
                                                            <button 
                                                                onClick={() => deletePatient(patient.id)}
                                                                className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {patients.data.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                                        <div className="flex flex-col items-center">
                                                            <User className="h-12 w-12 text-gray-300 mb-4" />
                                                            <p>No patients found. Click "Full Registration" to register one.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700 dark:text-gray-400">
                                            Showing {patients.total > 0 ? ((patients.current_page - 1) * 10) + 1 : 0} to{' '}
                                            {Math.min(patients.current_page * 10, patients.total)} of {patients.total} results
                                        </div>
                                        <div className="flex space-x-1">
                                            {patients.links.map((link, i) => (
                                                <Link
                                                    key={i}
                                                    href={link.url || '#'}
                                                    className={`px-3 py-1 text-sm rounded-md transition-colors ${link.active
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                        } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                    preserveScroll
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
