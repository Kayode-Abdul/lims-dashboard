import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import { ArrowLeft, User, Phone, Plus, Save, Activity } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface MetadataItem {
    id: number;
    name: string;
}

interface Hmo extends MetadataItem {
    type: string | null;
}

interface Doctor extends MetadataItem {
    hospital_id: number;
}

export default function Create({ auth, classifications, hospitals, doctors, hmos }: PageProps<{
    classifications: MetadataItem[],
    hospitals: MetadataItem[],
    doctors: Doctor[],
    hmos: Hmo[]
}>) {
    const { data, setData, post, processing, errors, reset } = useForm({
        patient_type: 'walk-in',
        patient_classification_id: '' as string | number,
        hospital_id: '' as string | number,
        doctor_id: '' as string | number,
        hmo_id: '' as string | number,
        hmo_type: '',
        age_group: '' as 'Adult' | 'Child' | '',
        title: '',
        first_name: '',
        last_name: '',
        other_names: '',
        email: '',
        phone: '',
        date_of_birth: '',
        age_years: '' as string | number,
        age_months: '' as string | number,
        age_weeks: '' as string | number,
        age_days: '' as string | number,
        sex: '',
        address: '',
        city: '',
        state: '',
        nationality: 'Nigerian',
        blood_group: '',
        genotype: '',
        occupation: '',
        marital_status: '',
        next_of_kin: '',
        next_of_kin_phone: '',
        height: '',
        weight: '',
        bmi: '',
        is_active: true,
    });

    // Modal states
    const [showingHospitalModal, setShowingHospitalModal] = useState(false);
    const [showingDoctorModal, setShowingDoctorModal] = useState(false);
    const [showingHmoModal, setShowingHmoModal] = useState(false);
    const [showingClassificationModal, setShowingClassificationModal] = useState(false);

    // Quick add forms
    const hospitalForm = useForm({ name: '', address: '', email: '', phone: '' });
    const doctorForm = useForm({ name: '', hospital_id: '', email: '', phone: '' });
    const hmoForm = useForm({ name: '', type: '' });
    const classificationForm = useForm({ name: '' });

    const calculateDob = (years: number | string, months: number | string, weeks: number | string, days: number | string) => {
        const d = new Date();
        if (years) d.setFullYear(d.getFullYear() - Number(years));
        if (months) d.setMonth(d.getMonth() - Number(months));
        if (weeks) d.setDate(d.getDate() - (Number(weeks) * 7));
        if (days) d.setDate(d.getDate() - Number(days));
        return d.toISOString().split('T')[0];
    };

    const handleAgeChange = (field: 'age_years' | 'age_months' | 'age_weeks' | 'age_days', value: string) => {
        setData((prevData) => {
            const newData = { ...prevData, [field]: value };
            if (newData.age_years || newData.age_months || newData.age_weeks || newData.age_days) {
                newData.date_of_birth = calculateDob(
                    newData.age_years || 0,
                    newData.age_months || 0,
                    newData.age_weeks || 0,
                    newData.age_days || 0
                );
            }
            return newData;
        });
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('patients.store'));
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

    const handleQuickAddDoctor = (e: React.FormEvent) => {
        e.preventDefault();
        doctorForm.post(route('doctors.store'), {
            onSuccess: () => {
                setShowingDoctorModal(false);
                doctorForm.reset();
            },
            preserveState: true,
        });
    };

    const handleQuickAddHmo = (e: React.FormEvent) => {
        e.preventDefault();
        hmoForm.post(route('hmos.store'), {
            onSuccess: () => {
                setShowingHmoModal(false);
                hmoForm.reset();
            },
            preserveState: true,
        });
    };

    const handleQuickAddClassification = (e: React.FormEvent) => {
        e.preventDefault();
        classificationForm.post(route('patient-classifications.store'), {
            onSuccess: () => {
                setShowingClassificationModal(false);
                classificationForm.reset();
            },
            preserveState: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Register New Patient</h2>}
        >
            <Head title="Register Patient" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link
                            href={route('patients.index')}
                            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to Patient Register
                        </Link>
                    </div>

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="p-8 space-y-8">

                            {/* Visit Type & Details Section */}
                            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                                <h3 className="text-lg font-medium text-indigo-900 dark:text-indigo-300 mb-4 flex items-center">
                                    <Activity className="h-5 w-5 mr-2" />
                                    Visit Type & Reference
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel htmlFor="patient_type" value="Visit Type *" />
                                        <select
                                            id="patient_type"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={data.patient_type}
                                            onChange={(e) => setData('patient_type', e.target.value)}
                                            required
                                        >
                                            <option value="walk-in">Walk-in (Direct)</option>
                                            <option value="hmo">HMO</option>
                                            <option value="referred">Doctor/Hospital Referred</option>
                                        </select>
                                        <InputError message={errors.patient_type} className="mt-2" />
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <InputLabel htmlFor="patient_classification_id" value="Classification (Optional)" />
                                            <button type="button" onClick={() => setShowingClassificationModal(true)} className="text-xs text-indigo-500 hover:underline flex items-center">
                                                <Plus className="h-3 w-3 mr-1" /> Add New
                                            </button>
                                        </div>
                                        <select
                                            id="patient_classification_id"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={data.patient_classification_id}
                                            onChange={(e) => setData('patient_classification_id', e.target.value)}
                                        >
                                            <option value="">Select Classification</option>
                                            {classifications.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {data.patient_type === 'hmo' && (
                                        <>
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <InputLabel htmlFor="hmo_id" value="Select HMO *" />
                                                    <button type="button" onClick={() => setShowingHmoModal(true)} className="text-xs text-indigo-500 hover:underline flex items-center">
                                                        <Plus className="h-3 w-3 mr-1" /> Add New
                                                    </button>
                                                </div>
                                                <input
                                                    list="hmo_list"
                                                    id="hmo_id"
                                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const match = hmos.find(h => h.name === val);
                                                        if (match) {
                                                            setData((prev) => ({
                                                                ...prev,
                                                                hmo_id: match.id,
                                                                hmo_type: match.type || prev.hmo_type
                                                            }));
                                                        }
                                                    }}
                                                    placeholder="Type to search HMO..."
                                                    required
                                                />
                                                <datalist id="hmo_list">
                                                    {hmos.map(h => (
                                                        <option key={h.id} value={h.name} />
                                                    ))}
                                                </datalist>
                                                <InputError message={errors.hmo_id} className="mt-2" />
                                            </div>

                                            <div>
                                                <InputLabel htmlFor="hmo_type" value="HMO Type" />
                                                <TextInput
                                                    id="hmo_type"
                                                    className="mt-1 block w-full"
                                                    value={data.hmo_type}
                                                    onChange={(e) => setData('hmo_type', e.target.value)}
                                                    placeholder="e.g., NHIS, Private, Silver"
                                                />
                                                <InputError message={errors.hmo_type} className="mt-2" />
                                            </div>
                                        </>
                                    )}

                                    {data.patient_type === 'referred' && (
                                        <>
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <InputLabel htmlFor="hospital_id" value="Hospital *" />
                                                    <button type="button" onClick={() => setShowingHospitalModal(true)} className="text-xs text-indigo-500 hover:underline flex items-center">
                                                        <Plus className="h-3 w-3 mr-1" /> Add New
                                                    </button>
                                                </div>
                                                <input
                                                    list="hospital_list"
                                                    id="hospital_id"
                                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const match = hospitals.find(h => h.name === val);
                                                        if (match) setData('hospital_id', match.id);
                                                    }}
                                                    placeholder="Type to search hospital..."
                                                    required
                                                />
                                                <datalist id="hospital_list">
                                                    {hospitals.map(h => (
                                                        <option key={h.id} value={h.name} />
                                                    ))}
                                                </datalist>
                                                <InputError message={errors.hospital_id} className="mt-2" />
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <InputLabel htmlFor="doctor_id" value="Referring Doctor *" />
                                                    <button type="button" onClick={() => setShowingDoctorModal(true)} className="text-xs text-indigo-500 hover:underline flex items-center">
                                                        <Plus className="h-3 w-3 mr-1" /> Add New
                                                    </button>
                                                </div>
                                                <input
                                                    list="doctor_list"
                                                    id="doctor_id"
                                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const match = doctors.find(d => d.name === val);
                                                        if (match) setData('doctor_id', match.id);
                                                    }}
                                                    placeholder="Type to search doctor..."
                                                    required
                                                />
                                                <datalist id="doctor_list">
                                                    {doctors
                                                        .filter(d => !data.hospital_id || d.hospital_id.toString() === data.hospital_id.toString())
                                                        .map(d => (
                                                            <option key={d.id} value={d.name} />
                                                        ))
                                                    }
                                                </datalist>
                                                <InputError message={errors.doctor_id} className="mt-2" />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Personal Bio Section */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center pb-2 border-b dark:border-gray-700">
                                    <User className="h-5 w-5 mr-2 text-indigo-500" />
                                    Personal Information
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <InputLabel htmlFor="title" value="Title" />
                                        <select
                                            id="title"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                        >
                                            <option value="">Select</option>
                                            <option value="Mr.">Mr.</option>
                                            <option value="Mrs.">Mrs.</option>
                                            <option value="Ms.">Ms.</option>
                                            <option value="Dr.">Dr.</option>
                                        </select>
                                    </div>

                                    <div className="md:col-span-1">
                                        <InputLabel htmlFor="first_name" value="First Name *" />
                                        <TextInput
                                            id="first_name"
                                            className="mt-1 block w-full"
                                            value={data.first_name}
                                            onChange={(e) => setData('first_name', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.first_name} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="last_name" value="Last Name" />
                                        <TextInput
                                            id="last_name"
                                            className="mt-1 block w-full"
                                            value={data.last_name}
                                            onChange={(e) => setData('last_name', e.target.value)}

                                        />
                                        <InputError message={errors.last_name} className="mt-2" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <InputLabel htmlFor="sex" value="Gender" />
                                        <select
                                            id="sex"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={data.sex}
                                            onChange={(e) => setData('sex', e.target.value)}
                                        >
                                            <option value="">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div className="md:col-span-1">
                                        <InputLabel htmlFor="date_of_birth" value="Date of Birth" />
                                        <TextInput
                                            id="date_of_birth"
                                            type="date"
                                            className="mt-1 block w-full"
                                            value={data.date_of_birth}
                                            onChange={(e) => {
                                                setData((prev) => ({
                                                    ...prev,
                                                    date_of_birth: e.target.value,
                                                    age_years: '',
                                                    age_months: ''
                                                }));
                                            }}
                                        />
                                        <InputError message={errors.date_of_birth} className="mt-2" />

                                        <div className="mt-4">
                                            <InputLabel value="Age Group" className="mb-2" />
                                            <div className="flex gap-4">
                                                <label className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="age_group"
                                                        value="Adult"
                                                        checked={data.age_group === 'Adult'}
                                                        onChange={(e) => setData('age_group', e.target.value as 'Adult' | 'Child')}
                                                        className="rounded-full border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Adult</span>
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="age_group"
                                                        value="Child"
                                                        checked={data.age_group === 'Child'}
                                                        onChange={(e) => setData('age_group', e.target.value as 'Adult' | 'Child')}
                                                        className="rounded-full border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Child</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <div>
                                            <InputLabel value="Age (Years / Months / Weeks / Days)" />
                                            <div className="grid grid-cols-4 gap-2 mt-1">
                                                <TextInput
                                                    id="age_years"
                                                    type="number"
                                                    placeholder="Yrs"
                                                    className="w-full"
                                                    value={data.age_years}
                                                    onChange={(e) => handleAgeChange('age_years', e.target.value)}
                                                />
                                                <TextInput
                                                    id="age_months"
                                                    type="number"
                                                    placeholder="Mths"
                                                    className="w-full"
                                                    value={data.age_months}
                                                    onChange={(e) => handleAgeChange('age_months', e.target.value)}
                                                />
                                                <TextInput
                                                    id="age_weeks"
                                                    type="number"
                                                    placeholder="Wks"
                                                    className="w-full"
                                                    value={data.age_weeks}
                                                    onChange={(e) => handleAgeChange('age_weeks', e.target.value)}
                                                />
                                                <TextInput
                                                    id="age_days"
                                                    type="number"
                                                    placeholder="Days"
                                                    className="w-full"
                                                    value={data.age_days}
                                                    onChange={(e) => handleAgeChange('age_days', e.target.value)}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Entering age will auto-calculate Date of Birth.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Section */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center pb-2 border-b dark:border-gray-700">
                                    <Phone className="h-5 w-5 mr-2 text-indigo-500" />
                                    Contact Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel htmlFor="phone" value="Phone Number" />
                                        <TextInput
                                            id="phone"
                                            className="mt-1 block w-full"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                        />
                                        <InputError message={errors.phone} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="email" value="Email Address" />
                                        <TextInput
                                            id="email"
                                            type="email"
                                            className="mt-1 block w-full"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                        />
                                        <InputError message={errors.email} className="mt-2" />
                                    </div>
                                </div>
                                <div>
                                    <InputLabel htmlFor="address" value="Home Address" />
                                    <TextInput
                                        id="address"
                                        className="mt-1 block w-full"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                    />
                                    <InputError message={errors.address} className="mt-2" />
                                </div>
                            </div>

                            <div className="flex items-center justify-end pt-6 gap-4 border-t dark:border-gray-700">
                                <Link
                                    href={route('patients.index')}
                                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                >
                                    Cancel
                                </Link>
                                <PrimaryButton disabled={processing} className="px-8">
                                    <Save className="h-4 w-4 mr-2" />
                                    Register Patient
                                </PrimaryButton>
                            </div>

                            {(auth.user.role === 'admin' || auth.user.role === 'supervisor' || auth.user.role === 'lab_admin' || auth.user.is_super_admin) && (
                                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
                                    <p className="text-xs text-gray-500 mb-2">Need to manage entities directly?</p>
                                    <div className="flex justify-center gap-4">
                                        <Link href={route('hospitals.index')} className="text-xs text-indigo-500 hover:underline">Manage Hospitals</Link>
                                        <Link href={route('doctors.index')} className="text-xs text-indigo-500 hover:underline">Manage Doctors</Link>
                                        <Link href={route('hmos.index')} className="text-xs text-indigo-500 hover:underline">Manage HMOs</Link>
                                        <Link href={route('patient-classifications.index')} className="text-xs text-indigo-500 hover:underline">Classifications</Link>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>

            {/* Quick Add Modals (Copied from Index for functionality) */}
            <Modal show={showingHospitalModal} onClose={() => setShowingHospitalModal(false)}>
                <form onSubmit={handleQuickAddHospital} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Add New Hospital</h2>
                    <div className="mt-6 space-y-4">
                        <div>
                            <InputLabel htmlFor="h_name" value="Hospital Name" />
                            <TextInput id="h_name" className="mt-1 block w-full" value={hospitalForm.data.name} onChange={e => hospitalForm.setData('name', e.target.value)} required />
                        </div>
                        <div>
                            <InputLabel htmlFor="h_phone" value="Phone" />
                            <TextInput id="h_phone" className="mt-1 block w-full" value={hospitalForm.data.phone} onChange={e => hospitalForm.setData('phone', e.target.value)} />
                        </div>
                        <div>
                            <InputLabel htmlFor="h_address" value="Address" />
                            <textarea id="h_address" className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md" value={hospitalForm.data.address} onChange={e => hospitalForm.setData('address', e.target.value)} />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setShowingHospitalModal(false)}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={hospitalForm.processing}>Add Hospital</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={showingDoctorModal} onClose={() => setShowingDoctorModal(false)}>
                <form onSubmit={handleQuickAddDoctor} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Add New Referring Doctor</h2>
                    <div className="mt-6 space-y-4">
                        <div>
                            <InputLabel htmlFor="d_h_id" value="Hospital" />
                            <select id="d_h_id" className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md" value={doctorForm.data.hospital_id} onChange={e => doctorForm.setData('hospital_id', e.target.value)} required>
                                <option value="">Select Hospital</option>
                                {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <InputLabel htmlFor="d_name" value="Doctor Name" />
                            <TextInput id="d_name" className="mt-1 block w-full" value={doctorForm.data.name} onChange={e => doctorForm.setData('name', e.target.value)} required />
                        </div>
                        <div>
                            <InputLabel htmlFor="d_phone" value="Phone" />
                            <TextInput id="d_phone" className="mt-1 block w-full" value={doctorForm.data.phone} onChange={e => doctorForm.setData('phone', e.target.value)} />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setShowingDoctorModal(false)}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={doctorForm.processing}>Add Doctor</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={showingHmoModal} onClose={() => setShowingHmoModal(false)}>
                <form onSubmit={handleQuickAddHmo} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Add New HMO</h2>
                    <div className="mt-6 space-y-4">
                        <div>
                            <InputLabel htmlFor="hmo_name" value="HMO Name" />
                            <TextInput id="hmo_name" className="mt-1 block w-full" value={hmoForm.data.name} onChange={e => hmoForm.setData('name', e.target.value)} required />
                        </div>
                        <div>
                            <InputLabel htmlFor="hmo_type_new" value="HMO Type" />
                            <TextInput id="hmo_type_new" className="mt-1 block w-full" value={hmoForm.data.type} onChange={e => hmoForm.setData('type', e.target.value)} placeholder="e.g. NHIS, Private" />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setShowingHmoModal(false)}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={hmoForm.processing}>Add HMO</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={showingClassificationModal} onClose={() => setShowingClassificationModal(false)}>
                <form onSubmit={handleQuickAddClassification} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Add New Patient Classification</h2>
                    <div className="mt-6 space-y-4">
                        <div>
                            <InputLabel htmlFor="cls_name" value="Classification Name" />
                            <TextInput id="cls_name" className="mt-1 block w-full" value={classificationForm.data.name} onChange={e => classificationForm.setData('name', e.target.value)} required />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setShowingClassificationModal(false)}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={classificationForm.processing}>Add Classification</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
