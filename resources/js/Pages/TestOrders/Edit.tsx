import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
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
    UserCircle,
    Save
} from 'lucide-react';
import { useState, useEffect } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';

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

interface Test {
    id: number;
    test_name: string;
    test_code: string;
    price_walk_in: string;
    price_hmo: string;
    price_doctor_referred: string;
    hmo_prices?: Array<{ hmo_id: number; price: string }>;
    hospital_prices?: Array<{ hospital_id: number; price: string }>;
    has_subtests?: boolean | number;
    subtest_definitions?: any[];
}

interface Order {
    id: number;
    test_id: number;
    price: string;
    discount: string;
    amount_paid: string;
    discount_type: 'amount' | 'percentage';
    test: Test;
    selected_subtests?: string[];
}

export default function Edit({ 
    auth, 
    orderNumber, 
    patient, 
    orders, 
    hospitals, 
    doctors, 
    tests, 
    hmos,
    notes,
    hospital,
    doctor,
    sample_type
}: PageProps<{
    orderNumber: string;
    patient: Patient;
    orders: Order[];
    hospitals: any[];
    doctors: any[];
    tests: Test[];
    hmos: any[];
    notes?: string;
    hospital?: any;
    doctor?: any;
    sample_type?: string;
}>) {
    const { data, setData, put, processing, errors } = useForm({
        test_ids: orders.map(o => o.test_id),
        hospital_id: hospital?.id?.toString() || '',
        doctor_id: doctor?.id?.toString() || '',
        discount: orders[0]?.discount_type === 'percentage' 
            ? (orders.reduce((acc, o) => acc + parseFloat(o.discount), 0) / orders.reduce((acc, o) => acc + parseFloat(o.price), 0) * 100).toFixed(2)
            : orders.reduce((acc, o) => acc + parseFloat(o.discount), 0).toFixed(2),
        discount_type: orders[0]?.discount_type || 'amount',
        amount_paid: orders.reduce((acc, o) => acc + parseFloat(o.amount_paid), 0).toFixed(2),
        notes: notes || '',
        sample_type: sample_type || '',
        subtest_selections: orders.reduce((acc, o) => {
            if (o.test.has_subtests && o.selected_subtests) {
                acc[o.test_id] = o.selected_subtests;
            }
            return acc;
        }, {} as Record<number, string[]>),
    });

    const [selectedTests, setSelectedTests] = useState<Test[]>(orders.map(o => o.test));
    const [configuringTest, setConfiguringTest] = useState<Test | null>(null);
    const [tempSelectedSubtests, setTempSelectedSubtests] = useState<string[]>([]);
    const [testInput, setTestInput] = useState('');
    const [selectedTestId, setSelectedTestId] = useState<string>('');
    const [hospitalInput, setHospitalInput] = useState(hospital?.name || '');
    const [doctorInput, setDoctorInput] = useState(doctor?.name || '');

    const [totalPrice, setTotalPrice] = useState(0);

    useEffect(() => {
        let total = 0;
        selectedTests.forEach(test => {
            let price = 0;
            switch (patient.patient_type) {
                case 'hmo':
                    const specificHmoPrice = test.hmo_prices?.find(p => p.hmo_id.toString() === patient.hmo_id?.toString());
                    price = specificHmoPrice ? parseFloat(specificHmoPrice.price) : (parseFloat(test.price_hmo) || parseFloat(test.price_walk_in));
                    break;
                case 'referred':
                    const specificHospitalPrice = test.hospital_prices?.find(p => p.hospital_id.toString() === data.hospital_id);
                    price = specificHospitalPrice ? parseFloat(specificHospitalPrice.price) : (parseFloat(test.price_doctor_referred) || parseFloat(test.price_walk_in));
                    break;
                default:
                    price = parseFloat(test.price_walk_in);
            }
            total += price;
        });
        setTotalPrice(total);
        setData('test_ids', selectedTests.map(t => t.id));
    }, [selectedTests, data.hospital_id]);

    const addTest = () => {
        if (!selectedTestId) return;
        const testToAdd = tests.find(t => t.id === parseInt(selectedTestId));
        if (testToAdd && !selectedTests.find(t => t.id === testToAdd.id)) {
            if (testToAdd.has_subtests && testToAdd.subtest_definitions && testToAdd.subtest_definitions.length > 0) {
                setConfiguringTest(testToAdd);
                setTempSelectedSubtests(testToAdd.subtest_definitions.map((s: any) => s.id || s.name || s.investigation));
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
        put(route('test-orders.update-batch', orderNumber.replace('/', '-')));
    };

    const discountValue = data.discount_type === 'percentage'
        ? (totalPrice * parseFloat(data.discount || '0')) / 100
        : parseFloat(data.discount || '0');

    const totalPayable = Math.max(0, totalPrice - discountValue);
    const balanceDue = Math.max(0, totalPayable - parseFloat(data.amount_paid || '0'));

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Edit Test Order: {orderNumber}</h2>}
        >
            <Head title={`Edit Order - ${orderNumber}`} />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <Link
                        href={route('test-orders.show-batch', orderNumber.replace('/', '-'))}
                        className="mb-6 inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Order Details
                    </Link>

                    <form onSubmit={submit} className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border dark:border-gray-700">
                            
                            {/* Left Side: Selections */}
                            <div className="space-y-6">
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center">
                                    <User className="h-10 w-10 text-indigo-500 mr-4" />
                                    <div>
                                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{patient.first_name} {patient.last_name}</p>
                                        <p className="text-xs text-gray-500">{patient.patient_id} • {patient.patient_type.toUpperCase()}</p>
                                    </div>
                                </div>

                                {patient.patient_type === 'referred' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel htmlFor="hospital_id" value="Hospital" />
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
                                                        const match = hospitals.find((h: any) => h.name === val);
                                                        if (match) setData('hospital_id', match.id.toString());
                                                        else setData('hospital_id', '');
                                                    }}
                                                    placeholder="Search hospital..."
                                                />
                                                <datalist id="hospital_list">
                                                    {hospitals.map((h: any) => <option key={h.id} value={h.name} />)}
                                                </datalist>
                                            </div>
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="doctor_id" value="Referring Doctor" />
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
                                                        const match = doctors.find((d: any) => d.name === val);
                                                        if (match) setData('doctor_id', match.id.toString());
                                                        else setData('doctor_id', '');
                                                    }}
                                                    placeholder="Search doctor..."
                                                />
                                                <datalist id="doctor_list">
                                                    {doctors.map((d: any) => <option key={d.id} value={d.name} />)}
                                                </datalist>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <InputLabel htmlFor="test_id" value="Add/Remove Tests *" />
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
                                    <div className="mt-4 space-y-2 border rounded-md p-2 dark:border-gray-700 max-h-48 overflow-y-auto">
                                        {selectedTests.map(test => (
                                            <div key={test.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-2 rounded text-sm">
                                                <div>
                                                    <span className="font-bold">{test.test_name}</span>
                                                    <span className="text-xs text-gray-500 ml-2">({test.test_code})</span>
                                                </div>
                                                <button type="button" onClick={() => removeTest(test.id)} className="text-red-500 hover:text-red-700">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <InputError message={errors.test_ids} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="sample_type" value="Sample Type" />
                                    <div className="mt-1 relative">
                                        <FlaskConical className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <TextInput
                                            id="sample_type"
                                            className="pl-10 block w-full"
                                            value={data.sample_type}
                                            onChange={(e) => setData('sample_type', e.target.value)}
                                            placeholder="e.g. Blood, Urine, etc."
                                        />
                                    </div>
                                    <InputError message={errors.sample_type} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="notes" value="Order Notes" />
                                    <textarea
                                        id="notes"
                                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm min-h-[80px]"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Right Side: Order Summary */}
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800/50 flex flex-col justify-between">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest border-b pb-2 dark:border-gray-700">Summary</h3>

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Subtotal:</span>
                                        <span className="font-bold">₦{totalPrice.toLocaleString()}</span>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="discount" value={`Discount (${data.discount_type === 'percentage' ? '%' : '₦'})`} />
                                        <div className="mt-1 flex gap-2">
                                            <TextInput
                                                id="discount"
                                                type="number"
                                                className="block w-full"
                                                value={data.discount}
                                                onChange={(e) => setData('discount', e.target.value)}
                                                onFocus={(e) => e.target.select()}
                                            />
                                            <select
                                                className="border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm text-sm"
                                                value={data.discount_type}
                                                onChange={(e) => setData('discount_type', e.target.value as 'amount' | 'percentage')}
                                            >
                                                <option value="amount">₦</option>
                                                <option value="percentage">%</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-sm font-bold border-t pt-2 dark:border-gray-700">
                                        <span>Total Payable:</span>
                                        <span className="text-indigo-600">₦{totalPayable.toLocaleString()}</span>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="amount_paid" value="Update Amount Paid" />
                                        <TextInput
                                            id="amount_paid"
                                            type="number"
                                            className="mt-1 block w-full font-bold text-green-600"
                                            value={data.amount_paid}
                                            onChange={(e) => setData('amount_paid', e.target.value)}
                                            onFocus={(e) => e.target.select()}
                                            max={totalPayable.toString()}
                                        />
                                    </div>

                                    {balanceDue > 0 && (
                                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded text-sm text-red-800 dark:text-red-400 flex justify-between items-center font-bold">
                                            <span>Remaining Balance:</span>
                                            <span>₦{balanceDue.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8">
                                    <PrimaryButton className="w-full justify-center py-4" disabled={processing || selectedTests.length === 0}>
                                        <Save className="mr-2 h-5 w-5" />
                                        Update Order Details
                                    </PrimaryButton>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Subtest Selection Modal */}
            <Modal show={!!configuringTest} onClose={() => setConfiguringTest(null)}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                        <FlaskConical className="mr-2 h-5 w-5 text-indigo-500" />
                        Configure Subtests: {configuringTest?.test_name}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Select which subtests to include in this investigation.
                    </p>

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
                        {configuringTest?.subtest_definitions?.map((sub: any) => {
                            const subId = (sub.id || sub.name || sub.investigation).toString();
                            return (
                                <label key={subId} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                                    tempSelectedSubtests.includes(subId)
                                    ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800'
                                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                }`}>
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500 mr-3"
                                        checked={tempSelectedSubtests.includes(subId)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setTempSelectedSubtests([...tempSelectedSubtests, subId]);
                                            } else {
                                                setTempSelectedSubtests(tempSelectedSubtests.filter(id => id !== subId));
                                            }
                                        }}
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {sub.name || sub.investigation}
                                    </span>
                                </label>
                            );
                        })}
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <PrimaryButton type="button" className="bg-gray-200 !text-gray-700 hover:bg-gray-300" onClick={() => setConfiguringTest(null)}>
                            Cancel
                        </PrimaryButton>
                        <PrimaryButton onClick={confirmSubtests} disabled={tempSelectedSubtests.length === 0}>
                            Confirm Selections
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
