import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import {
    Plus,
    ArrowLeft,
    User,
    FlaskConical,
    CreditCard,
    FileText,
    X,
    Percent,
    Tag,
    Building2,
    UserCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import axios from 'axios';

interface Patient {
    id: number;
    first_name: string;
    last_name: string;
    patient_id: string;
    patient_type: string;
    hmo_id?: number | null;
    hmo_type?: string | null;
    hospital_id?: number | null;
    doctor_id?: number | null;
    sex: string;
    phone?: string;
}

interface Hospital {
    id: number;
    name: string;
}

interface Hmo {
    id: number;
    name: string;
    type: string | null;
}

interface Doctor {
    id: number;
    name: string;
    hospital_id?: number | null;
}

interface Test {
    id: number;
    test_name: string;
    test_code: string;
    price_walk_in: string;
    price_hmo: string;
    price_doctor_referred: string;
    hmo_prices?: Array<{
        hmo_id: number;
        price: string;
    }>;
    hospital_prices?: Array<{ hospital_id: number; price: string }>;
    has_subtests?: number | boolean;
    subtest_definitions?: any[];
}

export default function Create({ auth, patients: initialPatients, hospitals, doctors, tests, hmos, classifications }: PageProps<{
    patients: Patient[];
    hospitals: Hospital[];
    doctors: Doctor[];
    tests: Test[];
    hmos: Hmo[];
    classifications: { id: number; name: string }[];
}>) {
    const currency = auth?.user?.lab?.currency || '₦';

    const [patients, setPatients] = useState<Patient[]>(initialPatients);
    const [showPatientModal, setShowPatientModal] = useState(false);
    const [creatingPatient, setCreatingPatient] = useState(false);
    const [patientError, setPatientError] = useState('');

    const [showingHospitalModal, setShowingHospitalModal] = useState(false);
    const [showingDoctorModal, setShowingDoctorModal] = useState(false);
    const [showingHmoModal, setShowingHmoModal] = useState(false);

    const hospitalForm = useForm({ name: '', address: '', phone: '' });
    const doctorForm = useForm({ name: '', hospital_id: '', phone: '' });
    const hmoForm = useForm({ name: '', type: '' });

    const { data, setData, post, processing, errors } = useForm({
        patient_id: '',
        patient_type: 'walk-in',
        hmo_id: '' as string | number,
        hmo_type: '',
        test_ids: [] as number[],
        hospital_id: '',
        doctor_id: '',
        price: '0.00',
        discount: '0.00',
        amount_paid: '0.00',
        payment_method: 'Cash',
        notes: '',
        sample_type: '',
        discount_type: 'amount',
        subtest_selections: {} as Record<number, string[]>,
    });

    const [newPatient, setNewPatient] = useState({
        title: '',
        first_name: '',
        last_name: '',
        sex: '',
        phone: '',
        age: '' as string | number,
        age_months: '' as string | number,
        age_weeks: '' as string | number,
        age_days: '' as string | number,
        age_group: '' as 'Adult' | 'Child' | '',
        patient_type: 'walk-in' as 'walk-in' | 'hmo' | 'referred',
        referrer: '',
        patient_classification_id: '' as string | number,
        hmo_id: '' as string | number,
        hmo_type: '',
        hospital_id: '' as string | number,
        doctor_id: '' as string | number,
    });

    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [selectedTestId, setSelectedTestId] = useState<string>('');
    const [selectedTests, setSelectedTests] = useState<Test[]>([]);

    const [configuringTest, setConfiguringTest] = useState<Test | null>(null);
    const [tempSelectedSubtests, setTempSelectedSubtests] = useState<string[]>([]);

    // Datalist input states
    const [patientInput, setPatientInput] = useState('');
    const [hospitalInput, setHospitalInput] = useState('');
    const [doctorInput, setDoctorInput] = useState('');
    const [testInput, setTestInput] = useState('');

    useEffect(() => {
        if (data.patient_id) {
            const patient = patients.find(p => p.id === parseInt(data.patient_id as string));
            setSelectedPatient(patient || null);
            if (patient) {
                setPatientInput(`${patient.first_name} ${patient.last_name || ''} (${patient.patient_id}) ${patient.phone ? '- ' + patient.phone : ''}`);

                // Set visit type and referrals to patient's default
                setData(d => ({
                    ...d,
                    patient_type: patient.patient_type as any,
                    hmo_id: patient.hmo_id || '',
                    hmo_type: patient.hmo_type || '',
                    hospital_id: patient.hospital_id?.toString() || '',
                    doctor_id: patient.doctor_id?.toString() || '',
                }));
            }
        } else {
            setSelectedPatient(null);
            // Don't clear input if it's being typed, handled by onChange
        }
    }, [data.patient_id, patients]); // Be careful with loops here. 
    // Actually, relying on data.patient_id to set input might conflict with typing.
    // Better: Only set input if it's empty or explicitly selected via other means?
    // The issue: If I type "John", data.patient_id becomes empty. If I rely on this effect, it might clear input?
    // No, if I type "John", data.patient_id is empty, patient is undefined. 
    // If patient is undefined, I do NOTHING to input (don't clear it).

    // Sync Hospital Input
    useEffect(() => {
        const hospital = hospitals.find(h => h.id.toString() === data.hospital_id.toString());
        if (hospital) setHospitalInput(hospital.name);
        else if (!data.hospital_id) setHospitalInput('');
    }, [data.hospital_id, hospitals]);

    // Sync Doctor Input
    useEffect(() => {
        const doctor = doctors.find(d => d.id.toString() === data.doctor_id.toString());
        if (doctor) setDoctorInput(doctor.name);
        else if (!data.doctor_id) setDoctorInput('');
    }, [data.doctor_id, doctors]);

    // Recalculate total price when tests or visit type changes
    useEffect(() => {
        if (selectedTests.length > 0) {
            let total = 0;
            selectedTests.forEach(test => {
                let price = 0;
                switch (data.patient_type) {
                    case 'hmo':
                        const specificHmoPrice = test.hmo_prices?.find(p => p.hmo_id.toString() === data.hmo_id.toString());
                        if (specificHmoPrice) {
                            price = parseFloat(specificHmoPrice.price);
                        } else {
                            price = parseFloat(test.price_hmo) || parseFloat(test.price_walk_in);
                        }
                        break;
                    case 'referred':
                        const specificHospitalPrice = test.hospital_prices?.find(p => p.hospital_id?.toString() === data.hospital_id?.toString());
                        if (specificHospitalPrice) {
                            price = parseFloat(specificHospitalPrice.price);
                        } else {
                            price = parseFloat(test.price_doctor_referred) || parseFloat(test.price_walk_in);
                        }
                        break;
                    default:
                        price = parseFloat(test.price_walk_in);
                }
                total += price;
            });
            let discountValue = parseFloat(data.discount || '0');
            if (data.discount_type === 'percentage') {
                discountValue = (total * discountValue) / 100;
            }
            setData(d => ({ ...d, price: total.toFixed(2), test_ids: selectedTests.map(t => t.id) }));
        } else {
            setData(d => ({ ...d, price: '0.00', test_ids: [] }));
        }
    }, [data.patient_type, selectedTests, data.hmo_id, data.hospital_id, data.discount_type, data.discount]);

    // Adjust amount_paid when discount manually changes? No, handled above now.

    const addTest = () => {
        if (!selectedTestId) return;
        const testToAdd = tests.find(t => t.id === parseInt(selectedTestId));
        
        if (testToAdd) {
            // Duplicate check
            const alreadySelected = selectedTests.find(t => t.id === testToAdd.id);
            if (alreadySelected) {
                if ((window as any).toast) {
                    (window as any).toast.error(`${testToAdd.test_name} is already in your selection.`);
                }
                setSelectedTestId('');
                setTestInput('');
                return;
            }

            if (testToAdd.has_subtests && testToAdd.subtest_definitions && testToAdd.subtest_definitions.length > 0) {
                setConfiguringTest(testToAdd);
                setTempSelectedSubtests(testToAdd.subtest_definitions.map((s: any) => s.id));
                return;
            }
            setSelectedTests([...selectedTests, testToAdd]);
            setSelectedTestId('');
            setTestInput('');
        }
    };

    const confirmSubtests = () => {
        if (!configuringTest) return;
        setSelectedTests([...selectedTests, configuringTest]);
        setData('subtest_selections', {
            ...data.subtest_selections,
            [configuringTest.id]: tempSelectedSubtests
        });
        setConfiguringTest(null);
        setTempSelectedSubtests([]);
        setSelectedTestId('');
        setTestInput('');
    };

    const removeTest = (id: number) => {
        setSelectedTests(selectedTests.filter(t => t.id !== id));
        const newSelections = { ...data.subtest_selections };
        delete newSelections[id];
        setData('subtest_selections', newSelections);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('test-orders.store'));
    };

    const handleQuickAddHospital = (e: React.FormEvent) => {
        e.preventDefault();
        hospitalForm.post(route('hospitals.store'), {
            onSuccess: () => {
                setShowingHospitalModal(false);
                hospitalForm.reset();
                // Data will refresh via Inertia props
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
                // Data will refresh via Inertia props
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
                // Data will refresh via Inertia props
            },
            preserveState: true,
        });
    };

    const handleCreatePatient = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingPatient(true);
        setPatientError('');

        try {
            const response = await axios.post(route('patients.store'), newPatient, {
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (response.data.success && response.data.patient) {
                // Add to local list and select
                setPatients(prev => [...prev, response.data.patient]);
                setData(d => ({
                    ...d,
                    patient_id: response.data.patient.id.toString(),
                    patient_type: response.data.patient.patient_type,
                    hmo_id: response.data.patient.hmo_id || '',
                    hmo_type: response.data.patient.hmo_type || '',
                }));
                setShowPatientModal(false);
                setNewPatient({
                    title: '',
                    first_name: '',
                    last_name: '',
                    sex: '',
                    phone: '',
                    age: '',
                    age_months: '',
                    age_weeks: '',
                    age_days: '',
                    age_group: '',
                    patient_type: 'walk-in',
                    referrer: '',
                    patient_classification_id: '',
                    hmo_id: '',
                    hmo_type: '',
                    hospital_id: '',
                    doctor_id: '',
                });
            }
        } catch (error: any) {
            if (error.response?.data?.errors) {
                const errorMessages = Object.values(error.response.data.errors).flat().join(', ');
                setPatientError(errorMessages);
            } else {
                setPatientError('Failed to create patient. Please try again.');
            }
        } finally {
            setCreatingPatient(false);
        }
    };

    const discountValue = data.discount_type === 'percentage'
        ? (parseFloat(data.price) * parseFloat(data.discount || '0')) / 100
        : parseFloat(data.discount || '0');

    const totalPayable = Math.max(0, parseFloat(data.price) - discountValue);
    const balanceDue = Math.max(0, totalPayable - parseFloat(data.amount_paid || '0'));

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Create Test Order</h2>}
        >
            <Head title="Create Test Order" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <button
                        onClick={() => window.history.back()}
                        className="mb-6 flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Orders
                    </button>

                    <form onSubmit={submit} className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border dark:border-gray-700">
                            {/* Left Side: Selections */}
                            <div className="space-y-6">
                                <div>
                                    <InputLabel htmlFor="patient_id" value="Select Patient *" />
                                    <div className="mt-1 flex gap-2">
                                        <div className="relative flex-1">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                list="patient_list"
                                                id="patient_id"
                                                className="pl-10 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                value={patientInput}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setPatientInput(val);
                                                    const match = patients.find(p => `${p.first_name} ${p.last_name || ''} (${p.patient_id}) ${p.phone ? '- ' + p.phone : ''}`.trim() === val.trim());
                                                    if (match) setData('patient_id', match.id.toString());
                                                    else setData('patient_id', '');
                                                }}
                                                placeholder="Type to search patient..."
                                                required
                                            />
                                            <datalist id="patient_list">
                                                {patients.map(patient => (
                                                    <option key={patient.id} value={`${patient.first_name} ${patient.last_name || ''} (${patient.patient_id}) ${patient.phone ? '- ' + patient.phone : ''}`.trim()} />
                                                ))}
                                            </datalist>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowPatientModal(true)}
                                            className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                                            title="Quick Add Patient"
                                        >
                                            <Plus className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <InputError message={errors.patient_id} className="mt-2" />
                                </div>

                                {/* Patient Type for THIS order */}
                                <div>
                                    <InputLabel htmlFor="visit_type" value="Patient Type (for pricing) *" />
                                    <div className="mt-1 relative">
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <select
                                            id="visit_type"
                                            className="pl-10 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={data.patient_type}
                                            onChange={(e) => setData('patient_type', e.target.value)}
                                        >
                                            <option value="walk-in">Walk-in (Private)</option>
                                            <option value="hmo">HMO</option>
                                            <option value="referred">Doctor Referred</option>
                                        </select>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">This determines the price tier for this visit</p>
                                </div>

                                {data.patient_type === 'hmo' && (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <InputLabel htmlFor="hmo_id" value="Select HMO *" />
                                                <button type="button" onClick={() => setShowingHmoModal(true)} className="text-[10px] text-indigo-500 hover:underline flex items-center">
                                                    <Plus className="h-2 w-2 mr-1" /> Add New
                                                </button>
                                            </div>
                                            <select
                                                id="hmo_id"
                                                className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                value={data.hmo_id}
                                                onChange={(e) => {
                                                    const id = e.target.value;
                                                    setData('hmo_id', id);
                                                    const selectedHmo = hmos.find(h => h.id.toString() === id);
                                                    if (selectedHmo) {
                                                        setData('hmo_type', selectedHmo.type || '');
                                                    }
                                                }}
                                                required
                                            >
                                                <option value="">Select HMO...</option>
                                                {hmos.map(h => (
                                                    <option key={h.id} value={h.id}>{h.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="hmo_type" value="HMO Type" />
                                            <TextInput
                                                id="hmo_type"
                                                className="mt-1 block w-full"
                                                value={data.hmo_type}
                                                onChange={(e) => setData('hmo_type', e.target.value)}
                                                placeholder="e.g., NHIS, Private"
                                            />
                                        </div>
                                    </div>
                                )}

                                {data.patient_type === 'referred' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <InputLabel htmlFor="hospital_id" value="Hospital" />
                                                <button type="button" onClick={() => setShowingHospitalModal(true)} className="text-[10px] text-indigo-500 hover:underline flex items-center">
                                                    <Plus className="h-2 w-2 mr-1" /> Add New
                                                </button>
                                            </div>
                                            <div className="mt-1 relative">
                                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input
                                                    list="hospital_list"
                                                    id="hospital_id"
                                                    className="pl-10 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm text-sm"
                                                    value={hospitalInput}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setHospitalInput(val);
                                                        const match = hospitals.find(h => h.name === val);
                                                        if (match) setData('hospital_id', match.id.toString());
                                                        else setData('hospital_id', '');
                                                    }}
                                                    placeholder="Type to search hospital..."
                                                />
                                                <datalist id="hospital_list">
                                                    {hospitals.map(h => (
                                                        <option key={h.id} value={h.name} />
                                                    ))}
                                                </datalist>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <InputLabel htmlFor="doctor_id" value="Referring Doctor" />
                                                <button type="button" onClick={() => setShowingDoctorModal(true)} className="text-[10px] text-indigo-500 hover:underline flex items-center">
                                                    <Plus className="h-2 w-2 mr-1" /> Add New
                                                </button>
                                            </div>
                                            <div className="mt-1 relative">
                                                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input
                                                    list="doctor_list"
                                                    id="doctor_id"
                                                    className="pl-10 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm text-sm"
                                                    value={doctorInput}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setDoctorInput(val);
                                                        const match = doctors.find(d => d.name === val);
                                                        if (match) setData('doctor_id', match.id.toString());
                                                        else setData('doctor_id', '');
                                                    }}
                                                    placeholder="Type to search doctor..."
                                                />
                                                <datalist id="doctor_list">
                                                    {doctors
                                                        .filter(d => !data.hospital_id || d.hospital_id?.toString() === data.hospital_id.toString())
                                                        .map(d => (
                                                            <option key={d.id} value={d.name} />
                                                        ))
                                                    }
                                                </datalist>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <InputLabel htmlFor="test_id" value="Add Tests *" />
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <FlaskConical className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                list="test_list"
                                                id="test_id"
                                                className="pl-10 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                value={testInput}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setTestInput(val);
                                                    const match = tests.find(t => `${t.test_name} (${t.test_code})` === val);
                                                    if (match) setSelectedTestId(match.id.toString());
                                                    else setSelectedTestId('');
                                                }}
                                                placeholder="Type to search tests..."
                                            />
                                            <datalist id="test_list">
                                                {tests.map(test => (
                                                    <option key={test.id} value={`${test.test_name} (${test.test_code})`} />
                                                ))}
                                            </datalist>
                                        </div>
                                        <PrimaryButton type="button" onClick={addTest} disabled={!selectedTestId}>
                                            Add
                                        </PrimaryButton>
                                    </div>

                                    {/* Selected Tests List */}
                                    {selectedTests.length > 0 && (
                                        <div className="mt-4 space-y-2 border rounded-md p-2 dark:border-gray-700 max-h-48 overflow-y-auto">
                                            {selectedTests.map(test => (
                                                <div key={test.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-2 rounded text-sm">
                                                    <div>
                                                        <span className="font-bold">{test.test_name}</span>
                                                        <span className="text-gray-500 ml-2 text-xs">({test.test_code})</span>
                                                        {data.subtest_selections[test.id] && (
                                                            <div className="text-[10px] text-indigo-600 mt-1">
                                                                Selected: {
                                                                    test.subtest_definitions
                                                                        ?.filter((s: any) => data.subtest_selections[test.id].includes(s.id || s.investigation))
                                                                        .map((s: any) => s.name || s.investigation)
                                                                        .join(', ')
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button type="button" onClick={() => removeTest(test.id)} className="text-red-500 hover:text-red-700 p-1">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {errors.test_ids && <InputError message={errors.test_ids} className="mt-2" />}
                                </div>

                                <div>
                                    <InputLabel htmlFor="sample_type" value="Sample Type *" />
                                    <div className="mt-1 relative">
                                        <FlaskConical className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <TextInput
                                            id="sample_type"
                                            className="pl-10 block w-full"
                                            value={data.sample_type}
                                            onChange={(e) => setData('sample_type', e.target.value)}
                                            placeholder="e.g. Blood, Urine, etc."
                                            required
                                        />
                                    </div>
                                    <InputError message={errors.sample_type} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="notes" value="Order Notes" />
                                    <div className="mt-1 relative">
                                        <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <textarea
                                            id="notes"
                                            className="pl-10 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm min-h-[100px]"
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            placeholder="Clinical history, urgency, etc."
                                        />
                                    </div>
                                    <InputError message={errors.notes} className="mt-2" />
                                </div>
                            </div>

                            {/* Right Side: Order Summary */}
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800/50 flex flex-col justify-between">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest border-b pb-2 dark:border-gray-700">Payment Details</h3>

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Subtotal:</span>
                                        <span className="font-bold text-gray-900 dark:text-gray-100">
                                            {currency}{parseFloat(data.price).toLocaleString()}
                                        </span>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="discount" value={`Discount (${data.discount_type === 'percentage' ? '%' : currency})`} />
                                        <div className="mt-1 flex gap-2">
                                            <div className="relative flex-1">
                                                {data.discount_type === 'percentage' ? (
                                                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                ) : (
                                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                )}
                                                <TextInput
                                                    id="discount"
                                                    type="number"
                                                    className="pl-10 block w-full"
                                                    value={data.discount}
                                                    onChange={(e) => setData('discount', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    min="0"
                                                    max={data.discount_type === 'percentage' ? '100' : data.price}
                                                    step="any"
                                                />
                                            </div>
                                            <select
                                                className="border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm text-sm"
                                                value={data.discount_type}
                                                onChange={(e) => setData('discount_type', e.target.value as 'amount' | 'percentage')}
                                            >
                                                <option value="amount">Amount ({currency})</option>
                                                <option value="percentage">Percent (%)</option>
                                            </select>
                                        </div>
                                        <InputError message={errors.discount} className="mt-2" />
                                    </div>

                                    <div className="flex justify-between items-center text-sm font-bold border-t pt-2 dark:border-gray-700">
                                        <span className="text-gray-700 dark:text-gray-300">Total Payable:</span>
                                        <span className="text-indigo-600 dark:text-indigo-400">{currency}{totalPayable.toLocaleString()}
                                        </span>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="amount_paid" value="Amount Paid Now" />
                                        <div className="mt-1 relative">
                                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <TextInput
                                                id="amount_paid"
                                                type="number"
                                                className="pl-10 block w-full font-bold text-green-600"
                                                value={data.amount_paid}
                                                onChange={(e) => setData('amount_paid', e.target.value)}
                                                onFocus={(e) => e.target.select()}
                                                min="0"
                                                max={totalPayable.toString()}
                                                step="any"
                                                required
                                            />
                                        </div>
                                        <InputError message={errors.amount_paid} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="payment_method" value="Payment Method" />
                                        <select
                                            id="payment_method"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={data.payment_method}
                                            onChange={(e) => setData('payment_method', e.target.value)}
                                        >
                                            <option value="Cash">Cash</option>
                                            <option value="Transfer">Bank Transfer</option>
                                            <option value="Card">Card / POS</option>
                                            <option value="Insurance">Insurance / HMO</option>
                                        </select>
                                        <InputError message={errors.payment_method} className="mt-2" />
                                    </div>

                                    {balanceDue > 0 && (
                                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded text-sm text-red-800 dark:text-red-400 flex justify-between items-center font-bold">
                                            <span>Balance Due:</span>
                                            <span>{currency}{balanceDue.toLocaleString()}</span>
                                        </div>
                                    )}

                                </div>

                                <div className="mt-8 pt-6 border-t dark:border-gray-700">
                                    <PrimaryButton className="w-full justify-center py-4 text-lg" disabled={processing || selectedTests.length === 0}>
                                        <Plus className="mr-2 h-5 w-5" />
                                        Place Diagnostic Order{selectedTests.length > 1 ? 's' : ''} ({selectedTests.length})
                                    </PrimaryButton>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Quick Add Patient Modal */}
            <Modal show={showPatientModal} onClose={() => setShowPatientModal(false)} maxWidth="md">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                            <User className="mr-2 h-5 w-5 text-indigo-500" />
                            Quick Add Patient
                        </h2>
                        <button onClick={() => setShowPatientModal(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {patientError && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm whitespace-pre-wrap">
                            {patientError}
                        </div>
                    )}

                    <form onSubmit={handleCreatePatient} className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <InputLabel htmlFor="title" value="Title" />
                                <TextInput
                                    id="title"
                                    className="mt-1 block w-full"
                                    value={newPatient.title}
                                    onChange={(e) => setNewPatient({ ...newPatient, title: e.target.value })}
                                />
                            </div>
                            <div className="col-span-1">
                                <InputLabel htmlFor="sex" value="Sex *" />
                                <select
                                    id="sex"
                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md shadow-sm"
                                    value={newPatient.sex}
                                    onChange={(e) => setNewPatient({ ...newPatient, sex: e.target.value })}
                                    required
                                >
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="col-span-1">
                                <InputLabel htmlFor="age_group" value="Age Group" />
                                <select
                                    id="age_group"
                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md shadow-sm"
                                    value={newPatient.age_group}
                                    onChange={(e) => setNewPatient({ ...newPatient, age_group: e.target.value as any })}
                                >
                                    <option value="">Select Group</option>
                                    <option value="Adult">Adult</option>
                                    <option value="Child">Child</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="first_name" value="First Name *" />
                                <TextInput
                                    id="first_name"
                                    className="mt-1 block w-full"
                                    value={newPatient.first_name}
                                    onChange={(e) => setNewPatient({ ...newPatient, first_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="last_name" value="Last Name" />
                                <TextInput
                                    id="last_name"
                                    className="mt-1 block w-full"
                                    value={newPatient.last_name}
                                    onChange={(e) => setNewPatient({ ...newPatient, last_name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="phone" value="Phone Number" />
                            <TextInput
                                id="phone"
                                type="tel"
                                className="mt-1 block w-full"
                                value={newPatient.phone}
                                onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            <div>
                                <InputLabel htmlFor="age" value="Yrs" />
                                <TextInput
                                    id="age"
                                    type="number"
                                    className="mt-1 block w-full"
                                    value={newPatient.age}
                                    onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="age_months" value="Mths" />
                                <TextInput
                                    id="age_months"
                                    type="number"
                                    className="mt-1 block w-full"
                                    value={newPatient.age_months}
                                    onChange={(e) => setNewPatient({ ...newPatient, age_months: e.target.value })}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="age_weeks" value="Wks" />
                                <TextInput
                                    id="age_weeks"
                                    type="number"
                                    className="mt-1 block w-full"
                                    value={newPatient.age_weeks}
                                    onChange={(e) => setNewPatient({ ...newPatient, age_weeks: e.target.value })}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="age_days" value="Days" />
                                <TextInput
                                    id="age_days"
                                    type="number"
                                    className="mt-1 block w-full"
                                    value={newPatient.age_days}
                                    onChange={(e) => setNewPatient({ ...newPatient, age_days: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="referrer" value="Referrer" />
                            <TextInput
                                id="referrer"
                                className="mt-1 block w-full"
                                value={newPatient.referrer}
                                onChange={(e) => setNewPatient({ ...newPatient, referrer: e.target.value })}
                                placeholder="Walk-in, Dr Name, HMO"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="patient_type" value="Visit Type *" />
                                <select
                                    id="patient_type"
                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md shadow-sm"
                                    value={newPatient.patient_type}
                                    onChange={(e) => setNewPatient({ ...newPatient, patient_type: e.target.value as any })}
                                    required
                                >
                                    <option value="walk-in">Walk-in (Direct)</option>
                                    <option value="hmo">HMO</option>
                                    <option value="referred">Doctor/Hospital Referred</option>
                                </select>
                            </div>

                            <div>
                                <InputLabel htmlFor="new_patient_classification_id" value="Classification (Optional)" />
                                <select
                                    id="new_patient_classification_id"
                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md shadow-sm"
                                    value={newPatient.patient_classification_id}
                                    onChange={(e) => setNewPatient({ ...newPatient, patient_classification_id: e.target.value })}
                                >
                                    <option value="">Select Classification</option>
                                    {classifications.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {newPatient.patient_type === 'hmo' && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <InputLabel htmlFor="new_hmo_id" value="HMO Provider *" />
                                        <button type="button" onClick={() => setShowingHmoModal(true)} className="text-[10px] text-indigo-500 hover:underline flex items-center">
                                            <Plus className="h-2 w-2 mr-1" /> Add New
                                        </button>
                                    </div>
                                    <select
                                        id="new_hmo_id"
                                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md shadow-sm"
                                        value={newPatient.hmo_id}
                                        onChange={(e) => {
                                            const id = e.target.value;
                                            const selectedHmo = hmos.find(h => h.id.toString() === id);
                                            setNewPatient({
                                                ...newPatient,
                                                hmo_id: id,
                                                hmo_type: selectedHmo?.type || ''
                                            });
                                        }}
                                        required
                                    >
                                        <option value="">Select HMO...</option>
                                        {hmos?.map((h: any) => (
                                            <option key={h.id} value={h.id}>{h.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <InputLabel htmlFor="new_hmo_type" value="HMO Type" />
                                    <TextInput
                                        id="new_hmo_type"
                                        className="mt-1 block w-full"
                                        value={newPatient.hmo_type}
                                        onChange={(e) => setNewPatient({ ...newPatient, hmo_type: e.target.value })}
                                        placeholder="e.g., Gold, Silver"
                                    />
                                </div>
                            </div>
                        )}

                        {newPatient.patient_type === 'referred' && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <InputLabel htmlFor="new_hospital_id" value="Hospital *" />
                                        <button type="button" onClick={() => setShowingHospitalModal(true)} className="text-[10px] text-indigo-500 hover:underline flex items-center">
                                            <Plus className="h-2 w-2 mr-1" /> Add New
                                        </button>
                                    </div>
                                    <select
                                        id="new_hospital_id"
                                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md shadow-sm"
                                        value={newPatient.hospital_id || ''}
                                        onChange={(e) => setNewPatient({ ...newPatient, hospital_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Hospital...</option>
                                        {hospitals.map(h => (
                                            <option key={h.id} value={h.id}>{h.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <InputLabel htmlFor="new_doctor_id" value="Doctor" />
                                        <button type="button" onClick={() => setShowingDoctorModal(true)} className="text-[10px] text-indigo-500 hover:underline flex items-center">
                                            <Plus className="h-2 w-2 mr-1" /> Add New
                                        </button>
                                    </div>
                                    <select
                                        id="new_doctor_id"
                                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md shadow-sm"
                                        value={newPatient.doctor_id || ''}
                                        onChange={(e) => setNewPatient({ ...newPatient, doctor_id: e.target.value })}
                                    >
                                        <option value="">Select Doctor...</option>
                                        {doctors
                                            .filter(d => !newPatient.hospital_id || d.hospital_id?.toString() === newPatient.hospital_id.toString())
                                            .map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <SecondaryButton type="button" onClick={() => setShowPatientModal(false)}>
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton type="submit" disabled={creatingPatient}>
                                {creatingPatient ? 'Creating...' : 'Create & Select'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Subtest Selection Modal */}
            <Modal show={!!configuringTest} onClose={() => setConfiguringTest(null)}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                        Select Sub-tests for {configuringTest?.test_name}
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Choose which sub-tests to include in this investigation.
                    </p>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {configuringTest?.subtest_definitions?.map((s: any, idx: number) => {
                            const subtestId = s.id || `subtest-${idx}`;
                            return (
                                <label key={subtestId} className="flex items-center p-3 border dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500 mr-3"
                                        checked={tempSelectedSubtests.includes(subtestId)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setTempSelectedSubtests([...tempSelectedSubtests, subtestId]);
                                            } else {
                                                setTempSelectedSubtests(tempSelectedSubtests.filter(id => id !== subtestId));
                                            }
                                        }}
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-bold">{s.name || s.investigation}</div>
                                        <div className="text-xs text-gray-500">{s.reference_range || s.reference_value}</div>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setConfiguringTest(null)}>Cancel</SecondaryButton>
                        <PrimaryButton
                            onClick={confirmSubtests}
                            disabled={tempSelectedSubtests.length === 0}
                        >
                            Add {tempSelectedSubtests.length} Sub-tests
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>

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
                        <div>
                            <InputLabel htmlFor="h_type" value="HMO Type" />
                            <TextInput id="h_type" className="mt-1 block w-full" value={hmoForm.data.type} onChange={e => hmoForm.setData('type', e.target.value)} placeholder="e.g. NHIS, Private" />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setShowingHmoModal(false)}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={hmoForm.processing}>Add HMO</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout >
    );
}
