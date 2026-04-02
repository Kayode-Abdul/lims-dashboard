import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { ArrowLeft, Save, Activity, User, Phone, Briefcase, Heart, Plus } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import Modal from '@/Components/Modal';

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
    blood_group?: string;
    genotype?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    nationality?: string;
    occupation?: string;
    marital_status?: string;
    next_of_kin?: string;
    next_of_kin_phone?: string;
    height?: number;
    weight?: number;
    bmi?: number;
    is_active: boolean;
}

interface MetadataItem {
    id: number;
    name: string;
}

interface Doctor extends MetadataItem {
    hospital_id: number;
}

export default function Edit({ auth, patient, classifications, hospitals, doctors, hmos }: PageProps<{
    patient: Patient,
    classifications: MetadataItem[],
    hospitals: MetadataItem[],
    doctors: Doctor[],
    hmos: MetadataItem[]
}>) {
    const { data, setData, put, processing, errors } = useForm({
        ...patient,
        patient_classification_id: patient.patient_classification_id || '',
        hospital_id: patient.hospital_id || '',
        doctor_id: patient.doctor_id || '',
        hmo_id: patient.hmo_id || '',
        age_group: patient.age_group || '',
        title: patient.title || '',
        other_names: patient.other_names || '',
        email: patient.email || '',
        phone: patient.phone || '',
        address: patient.address || '',
        city: patient.city || '',
        state: patient.state || '',
        nationality: patient.nationality || '',
        occupation: patient.occupation || '',
        marital_status: patient.marital_status || '',
        next_of_kin: patient.next_of_kin || '',
        next_of_kin_phone: patient.next_of_kin_phone || '',
        age_years: '' as string | number,
        age_months: '' as string | number,
        age_weeks: '' as string | number,
        age_days: '' as string | number,
        blood_group: patient.blood_group || '',
        genotype: patient.genotype || '',
        height: patient.height || '',
        weight: patient.weight || '',
        bmi: patient.bmi || '',
    });

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
        put(route('patients.update', patient.id));
    };

    // Modal states
    const [showingHospitalModal, setShowingHospitalModal] = useState(false);
    const [showingDoctorModal, setShowingDoctorModal] = useState(false);
    const [showingHmoModal, setShowingHmoModal] = useState(false);

    // Quick add forms
    const hospitalForm = useForm({ name: '', address: '', email: '', phone: '' });
    const doctorForm = useForm({ name: '', hospital_id: '', email: '', phone: '' });
    const hmoForm = useForm({ name: '' });

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

    const calculateBMI = (height: number, weight: number) => {
        if (height > 0 && weight > 0) {
            // Assuming height is in cm and weight is in kg
            const heightInMeters = height / 100;
            const bmiValue = weight / (heightInMeters * heightInMeters);
            setData('bmi', parseFloat(bmiValue.toFixed(1)));
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Edit Patient Record</h2>}
        >
            <Head title={`Edit ${patient.first_name} ${patient.last_name}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link
                            href={route('patients.show', patient.id)}
                            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to Patient Details
                        </Link>
                    </div>

                    <div className="bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg overflow-hidden">
                        <form onSubmit={submit} className="p-6 space-y-8">

                            {/* Personal Information */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center mb-4 pb-2 border-b dark:border-gray-700">
                                    <User className="h-5 w-5 mr-2 text-indigo-500" />
                                    Personal Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Visit Type & Reference Section */}
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
                                                    <button type="button" onClick={() => setShowingHmoModal(true)} className="text-xs text-indigo-500 hover:underline flex items-center">
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
                                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                            defaultValue={hmos.find(h => h.id === Number(data.hmo_id))?.name || ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const match = hmos.find(h => h.name === val);
                                                                if (match) setData('hmo_id', match.id);
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
                                                </div>
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
                                                            defaultValue={hospitals.find(h => h.id === Number(data.hospital_id))?.name || ''}
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
                                                            defaultValue={doctors.find(d => d.id === Number(data.doctor_id))?.name || ''}
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
                                    <div className="col-span-1">
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
                                    <div className="col-span-1">
                                        <InputLabel htmlFor="patient_id" value="Patient ID" />
                                        <TextInput
                                            id="patient_id"
                                            type="text"
                                            className="mt-1 block w-full bg-gray-100 dark:bg-gray-700"
                                            value={data.patient_id}
                                            disabled // Usually shouldn't change
                                        />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="first_name" value="First Name *" />
                                        <TextInput
                                            id="first_name"
                                            type="text"
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
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.last_name}
                                            onChange={(e) => setData('last_name', e.target.value)}
                                        />
                                        <InputError message={errors.last_name} className="mt-2" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="other_names" value="Other Names" />
                                        <TextInput
                                            id="other_names"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.other_names}
                                            onChange={(e) => setData('other_names', e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="sex" value="Gender" />
                                        <select
                                            id="sex"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={data.sex}
                                            onChange={(e) => setData('sex', e.target.value)}
                                        >
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
                                                    age_months: '',
                                                    age_weeks: '',
                                                    age_days: ''
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
                                    <div>
                                        <InputLabel htmlFor="marital_status" value="Marital Status" />
                                        <select
                                            id="marital_status"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={data.marital_status}
                                            onChange={(e) => setData('marital_status', e.target.value)}
                                        >
                                            <option value="">Select</option>
                                            <option value="Single">Single</option>
                                            <option value="Married">Married</option>
                                            <option value="Divorced">Divorced</option>
                                            <option value="Widowed">Widowed</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Contact & Social */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center mb-4 pb-2 border-b dark:border-gray-700">
                                    <Phone className="h-5 w-5 mr-2 text-green-500" />
                                    Contact & Location
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <InputLabel htmlFor="phone" value="Phone Number" />
                                        <TextInput
                                            id="phone"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                        />
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
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="occupation" value="Occupation" />
                                        <TextInput
                                            id="occupation"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.occupation}
                                            onChange={(e) => setData('occupation', e.target.value)}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <InputLabel htmlFor="address" value="Home Address" />
                                        <TextInput
                                            id="address"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="nationality" value="Nationality" />
                                        <TextInput
                                            id="nationality"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.nationality}
                                            onChange={(e) => setData('nationality', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Clinical Data */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center mb-4 pb-2 border-b dark:border-gray-700">
                                    <Activity className="h-5 w-5 mr-2 text-red-500" />
                                    Clinical Data
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div>
                                        <InputLabel htmlFor="blood_group" value="Blood Group" />
                                        <select
                                            id="blood_group"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={data.blood_group}
                                            onChange={(e) => setData('blood_group', e.target.value)}
                                        >
                                            <option value="">Unknown</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                        </select>
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="genotype" value="Genotype" />
                                        <select
                                            id="genotype"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={data.genotype}
                                            onChange={(e) => setData('genotype', e.target.value)}
                                        >
                                            <option value="">Unknown</option>
                                            <option value="AA">AA</option>
                                            <option value="AS">AS</option>
                                            <option value="SS">SS</option>
                                            <option value="AC">AC</option>
                                            <option value="SC">SC</option>
                                        </select>
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="height" value="Height (cm)" />
                                        <TextInput
                                            id="height"
                                            type="number"
                                            step="0.1"
                                            className="mt-1 block w-full"
                                            value={data.height}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                setData('height', val);
                                                calculateBMI(val, Number(data.weight));
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="weight" value="Weight (kg)" />
                                        <TextInput
                                            id="weight"
                                            type="number"
                                            step="0.1"
                                            className="mt-1 block w-full"
                                            value={data.weight}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                setData('weight', val);
                                                calculateBMI(Number(data.height), val);
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="bmi" value="BMI" />
                                        <TextInput
                                            id="bmi"
                                            type="number"
                                            className="mt-1 block w-full bg-gray-50 dark:bg-gray-800"
                                            value={data.bmi}
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Emergency Contact */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center mb-4 pb-2 border-b dark:border-gray-700">
                                    <Heart className="h-5 w-5 mr-2 text-pink-500" />
                                    Next of Kin / Emergency
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel htmlFor="next_of_kin" value="Next of Kin Name" />
                                        <TextInput
                                            id="next_of_kin"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.next_of_kin}
                                            onChange={(e) => setData('next_of_kin', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="next_of_kin_phone" value="Next of Kin Phone" />
                                        <TextInput
                                            id="next_of_kin_phone"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.next_of_kin_phone}
                                            onChange={(e) => setData('next_of_kin_phone', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-4 border-t dark:border-gray-700 pt-6">
                                <Link
                                    href={route('patients.show', patient.id)}
                                    className="text-sm text-gray-600 dark:text-gray-400 underline hover:text-gray-900 dark:hover:text-gray-100"
                                >
                                    Cancel
                                </Link>
                                <PrimaryButton disabled={processing} className="min-w-[120px] justify-center">
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Quick Add Hospital Modal */}
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

            {/* Quick Add Doctor Modal */}
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

            {/* Quick Add HMO Modal */}
            <Modal show={showingHmoModal} onClose={() => setShowingHmoModal(false)}>
                <form onSubmit={handleQuickAddHmo} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Add New HMO</h2>
                    <div className="mt-6 space-y-4">
                        <div>
                            <InputLabel htmlFor="hmo_name" value="HMO Name" />
                            <TextInput id="hmo_name" className="mt-1 block w-full" value={hmoForm.data.name} onChange={e => hmoForm.setData('name', e.target.value)} required />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setShowingHmoModal(false)}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={hmoForm.processing}>Add HMO</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
