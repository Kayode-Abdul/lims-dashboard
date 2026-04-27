import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Checkbox from '@/Components/Checkbox';
import { Search, Edit, Trash2, TestTube, Beaker, Activity, Clock, DollarSign, Folder, ShieldCheck, X, Plus } from 'lucide-react';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import { FormEventHandler, useState } from 'react';

interface Test {
    id: number;
    test_code: string;
    test_name: string;
    description: string | null;
    category_id: number;
    price_walk_in: string | number;
    price_hmo: string | number;
    price_doctor_referred: string | number;
    turnaround_time: number;
    department: string | null;
    reference_range: string | null;
    reference_range_male: string | null;
    reference_range_female: string | null;
    reference_range_adult: string | null;
    reference_range_child: string | null;
    units: string | null;
    is_active: boolean;
    is_group?: boolean;
    has_subtests?: boolean;
    has_sensitivity?: boolean;
    subtest_definitions?: Array<{
        id: string;
        name: string;
        reference_range: string;
        reference_range_male?: string;
        reference_range_female?: string;
        reference_range_adult?: string;
        reference_range_child?: string;
        units: string
    }>;
    parent_id?: number | null;
    category?: {
        id: number;
        name: string;
    }
    parent?: {
        id: number;
        test_name: string;
    } | null;
    sub_tests?: Test[];
    hmo_prices?: Array<{
        id: number;
        hmo_id: number;
        price: string;
        hmo?: { name: string };
    }>;
    hospital_prices?: Array<{
        id: number;
        hospital_id: number;
        price: string;
        hospital?: { name: string };
    }>;
}

interface GroupTest {
    id: number;
    test_name: string;
    test_code: string;
    is_group?: boolean;
    parent_id?: number | null;
}

interface Hospital {
    id: number;
    name: string;
}

interface Hmo {
    id: number;
    name: string;
}

interface TestCategory {
    id: number;
    name: string;
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedTests {
    data: Test[];
    links: PaginationLinks[];
    current_page: number;
    last_page: number;
    total: number;
}

export default function Index({ auth, tests, categories, hmos, hospitals, groupTests, allTests, filters }: PageProps<{
    tests: PaginatedTests,
    categories: TestCategory[],
    hmos: Hmo[],
    hospitals: Hospital[],
    groupTests: GroupTest[],
    allTests: GroupTest[],
    filters: { search?: string, category?: string }
}>) {
    const currency = auth?.user?.lab?.currency || '₦';

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        id: null as number | null,
        test_code: '',
        test_name: '',
        description: '',
        category_id: '' as string | number,
        price_walk_in: '0' as string | number,
        price_hmo: '0' as string | number,
        price_doctor_referred: '0' as string | number,
        turnaround_time: 24,
        department: 'Laboratory',
        reference_range: '',
        reference_range_male: '',
        reference_range_female: '',
        reference_range_adult: '',
        reference_range_child: '',
        units: '',
        is_active: true,
        is_group: false,
        has_subtests: false,
        has_sensitivity: false,
        subtest_definitions: [{
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            reference_range: '',
            reference_range_male: '',
            reference_range_female: '',
            reference_range_adult: '',
            reference_range_child: '',
            units: '',
            additional_ranges: []
        }] as Array<{
            id: string;
            name: string;
            reference_range: string;
            reference_range_male?: string;
            reference_range_female?: string;
            reference_range_adult?: string;
            reference_range_child?: string;
            units: string;
            additional_ranges?: Array<{ label: string, range: string, units: string }>;
        }>,
        parent_id: null as number | null,
        hmo_prices: {} as Record<number, string | number>,
        hospital_prices: {} as Record<number, string | number>,
    });

    const [activePriceTab, setActivePriceTab] = useState<'hmo' | 'hospital'>('hmo');
    const [applyToAllHospitals, setApplyToAllHospitals] = useState(false);

    const [managingHmoPricesFor, setManagingHmoPricesFor] = useState<Test | null>(null);
    const [managingHospitalPricesFor, setManagingHospitalPricesFor] = useState<Test | null>(null);
    const [applyToAllHmos, setApplyToAllHmos] = useState(false);
    const [showingCategoryModal, setShowingCategoryModal] = useState(false);

    const categoryForm = useForm({ name: '', description: '' });
    const hmoPriceForm = useForm({
        test_id: '',
        hmo_id: '',
        price: '',
    });

    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [categoryFilter, setCategoryFilter] = useState(filters.category || '');

    const departments = [
        'X-Ray',
        'General Lab',
        'Ultrasound Scan',
    ];

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEditing && data.id) {
            patch(route('tests.update', data.id), {
                onSuccess: () => {
                    setIsEditing(false);
                    reset();
                }
            });
        } else {
            post(route('tests.store'), {
                onSuccess: () => reset()
            });
        }
    };

    const addSubTest = (subTestId: number) => {
        if (!data.id) return;
        router.post(route('tests.toggle-group', subTestId), {
            parent_id: data.id
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                // The page will reload with updated data
            }
        });
    };

    const removeSubTest = (subTestId: number) => {
        router.post(route('tests.toggle-group', subTestId), {
            parent_id: null
        }, {
            preserveScroll: true,
            preserveState: true
        });
    };

    const handleEdit = (test: Test) => {
        setIsEditing(true);
        clearErrors();
        setData({
            id: test.id,
            test_code: test.test_code,
            test_name: test.test_name,
            description: test.description || '',
            category_id: test.category_id,
            price_walk_in: test.price_walk_in,
            price_hmo: test.price_hmo,
            price_doctor_referred: test.price_doctor_referred,
            turnaround_time: test.turnaround_time,
            department: test.department || 'Laboratory',
            reference_range: test.reference_range || '',
            reference_range_male: (test as any).reference_range_male || '',
            reference_range_female: (test as any).reference_range_female || '',
            reference_range_adult: (test as any).reference_range_adult || '',
            reference_range_child: (test as any).reference_range_child || '',
            units: test.units || '',
            is_active: test.is_active,
            hmo_prices: (test.hmo_prices || []).reduce((acc, p) => {
                acc[p.hmo_id] = p.price;
                return acc;
            }, {} as Record<number, string | number>),
            hospital_prices: (test.hospital_prices || []).reduce((acc, p) => {
                acc[p.hospital_id] = p.price;
                return acc;
            }, {} as Record<number, string | number>),
            is_group: test.is_group || false,
            has_subtests: test.has_subtests || false,
            has_sensitivity: test.has_sensitivity || false,
            subtest_definitions: (test.subtest_definitions || [{
                id: Math.random().toString(36).substr(2, 9),
                name: '',
                reference_range: '',
                reference_range_male: '',
                reference_range_female: '',
                reference_range_adult: '',
                reference_range_child: '',
                units: '',
                additional_ranges: []
            }]).map((s: any) => ({
                ...s,
                additional_ranges: s.additional_ranges || []
            })),
            parent_id: test.parent_id || null,
        });
    };

    const addSubtestDefinition = () => {
        setData('subtest_definitions', [
            ...data.subtest_definitions,
            {
                id: Math.random().toString(36).substr(2, 9),
                name: '',
                reference_range: '',
                reference_range_male: '',
                reference_range_female: '',
                reference_range_adult: '',
                reference_range_child: '',
                units: '',
                additional_ranges: []
            }
        ]);
    };

    const removeSubtestDefinition = (index: number) => {
        const newDefs = [...data.subtest_definitions];
        if (newDefs.length > 1) {
            newDefs.splice(index, 1);
            setData('subtest_definitions', newDefs);
        }
    };

    const updateSubtestDefinition = (index: number, field: string, value: string) => {
        const newDefs = [...data.subtest_definitions];
        newDefs[index] = { ...newDefs[index], [field]: value } as any;
        setData('subtest_definitions', newDefs);
    };

    const addAdditionalRange = (subIndex: number) => {
        const newDefs = [...data.subtest_definitions];
        const sub = newDefs[subIndex];
        const additional_ranges = sub.additional_ranges || [];
        newDefs[subIndex] = {
            ...sub,
            additional_ranges: [...additional_ranges, { label: '', range: '', units: '' }]
        } as any;
        setData('subtest_definitions', newDefs);
    };

    const removeAdditionalRange = (subIndex: number, rangeIndex: number) => {
        const newDefs = [...data.subtest_definitions];
        const sub = newDefs[subIndex];
        const additional_ranges = [...(sub.additional_ranges || [])];
        additional_ranges.splice(rangeIndex, 1);
        newDefs[subIndex] = { ...sub, additional_ranges } as any;
        setData('subtest_definitions', newDefs);
    };

    const updateAdditionalRange = (subIndex: number, rangeIndex: number, field: string, value: string) => {
        const newDefs = [...data.subtest_definitions];
        const sub = newDefs[subIndex];
        const additional_ranges = [...(sub.additional_ranges || [])];
        additional_ranges[rangeIndex] = { ...additional_ranges[rangeIndex], [field]: value };
        newDefs[subIndex] = { ...sub, additional_ranges } as any;
        setData('subtest_definitions', newDefs);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('tests.index'), {
            search: searchTerm,
            category: categoryFilter
        }, { preserveState: true });
    };

    const handleDelete = (test: Test) => {
        if (confirm(`Are you sure you want to delete the test "${test.test_name}"?`)) {
            router.delete(route('tests.destroy', test.id));
        }
    };

    const handleSaveHmoPrice = (e: React.FormEvent) => {
        e.preventDefault();
        hmoPriceForm.post(route('test-hmo-prices.store'), {
            onSuccess: () => {
                hmoPriceForm.reset('hmo_id', 'price');
                // The list will refresh via Inertia
            }
        });
    };

    const handleQuickAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        categoryForm.post(route('test-categories.store'), {
            onSuccess: () => {
                setShowingCategoryModal(false);
                categoryForm.reset();
            },
            preserveState: true,
        });
    };

    const handleDeleteHmoPrice = (id: number) => {
        if (confirm('Delete this HMO price?')) {
            router.delete(route('test-hmo-prices.destroy', id), {
                preserveScroll: true
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Test Catalog</h2>}
        >
            <Head title="Test Catalog" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Form Panel */}
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                                    <Beaker className="h-5 w-5 mr-2 text-indigo-500" />
                                    {isEditing ? 'Edit Test Definition' : 'Add New Test'}
                                </h3>

                                <form onSubmit={submit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel htmlFor="test_code" value="Test Code" />
                                            <TextInput
                                                id="test_code"
                                                className="mt-1 block w-full"
                                                value={data.test_code}
                                                onChange={(e) => setData('test_code', e.target.value)}
                                                required
                                                placeholder="e.g., HEM001"
                                            />
                                            <InputError message={errors.test_code} className="mt-2" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="turnaround_time" value="TAT (Hours)" />
                                            <TextInput
                                                id="turnaround_time"
                                                type="number"
                                                className="mt-1 block w-full"
                                                value={data.turnaround_time}
                                                onChange={(e) => setData('turnaround_time', parseInt(e.target.value))}
                                                required
                                            />
                                            <InputError message={errors.turnaround_time} className="mt-2" />
                                        </div>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="test_name" value="Test Name" />
                                        <TextInput
                                            id="test_name"
                                            className="mt-1 block w-full"
                                            value={data.test_name}
                                            onChange={(e) => setData('test_name', e.target.value)}
                                            required
                                            placeholder="e.g., Full Blood Count"
                                        />
                                        <InputError message={errors.test_name} className="mt-2" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <InputLabel htmlFor="category_id" value="Category" />
                                                <button type="button" onClick={() => setShowingCategoryModal(true)} className="text-[10px] text-indigo-500 hover:underline flex items-center">
                                                    <Plus className="h-2 w-2 mr-1" /> Add New
                                                </button>
                                            </div>
                                            <select
                                                id="category_id"
                                                className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                value={data.category_id}
                                                onChange={(e) => setData('category_id', e.target.value)}
                                                required
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                            <InputError message={errors.category_id} className="mt-2" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="department" value="Department" />
                                            <select
                                                id="department"
                                                className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                value={data.department || ''}
                                                onChange={(e) => setData('department', e.target.value)}
                                            >
                                                {departments.map(dept => (
                                                    <option key={dept} value={dept}>{dept}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="has_subtests"
                                                checked={data.has_subtests}
                                                onChange={(e) => setData('has_subtests', e.target.checked)}
                                            />
                                            <InputLabel htmlFor="has_subtests" value="Has Subtests" />
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="has_sensitivity"
                                                checked={data.has_sensitivity}
                                                onChange={(e) => setData('has_sensitivity', e.target.checked)}
                                            />
                                            <InputLabel htmlFor="has_sensitivity" value="Requires Sensitivity" />
                                        </div>
                                    </div>

                                    {data.has_subtests && (
                                        <div className="space-y-4 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-800 animate-in slide-in-from-top duration-300">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">Subtest Components</h4>
                                                <button
                                                    type="button"
                                                    onClick={addSubtestDefinition}
                                                    className="p-1 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <InputError message={errors.subtest_definitions as any} className="mt-2" />

                                            <div className="space-y-3">
                                                {data.subtest_definitions.map((sub, index) => (
                                                    <div key={index} className="flex gap-2 items-start group">
                                                        <div className="flex-1 space-y-2">
                                                            <TextInput
                                                                className="w-full text-xs"
                                                                value={sub.name}
                                                                onChange={(e) => updateSubtestDefinition(index, 'name', e.target.value)}
                                                                placeholder="Investigation Name"
                                                                required
                                                            />
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <TextInput
                                                                    className="w-full text-xs"
                                                                    value={sub.reference_range}
                                                                    onChange={(e) => updateSubtestDefinition(index, 'reference_range', e.target.value)}
                                                                    placeholder="Ref. Range (General)"
                                                                />
                                                                <TextInput
                                                                    className="w-full text-xs"
                                                                    value={sub.units}
                                                                    onChange={(e) => updateSubtestDefinition(index, 'units', e.target.value)}
                                                                    placeholder="Units"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <TextInput
                                                                    className="w-full text-xs"
                                                                    value={sub.reference_range_male}
                                                                    onChange={(e) => updateSubtestDefinition(index, 'reference_range_male', e.target.value)}
                                                                    placeholder="Male Range"
                                                                />
                                                                <TextInput
                                                                    className="w-full text-xs"
                                                                    value={sub.reference_range_female}
                                                                    onChange={(e) => updateSubtestDefinition(index, 'reference_range_female', e.target.value)}
                                                                    placeholder="Female Range"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <TextInput
                                                                    className="w-full text-xs"
                                                                    value={sub.reference_range_adult}
                                                                    onChange={(e) => updateSubtestDefinition(index, 'reference_range_adult', e.target.value)}
                                                                    placeholder="Adult Range"
                                                                />
                                                                <TextInput
                                                                    className="w-full text-xs"
                                                                    value={sub.reference_range_child}
                                                                    onChange={(e) => updateSubtestDefinition(index, 'reference_range_child', e.target.value)}
                                                                    placeholder="Child Range"
                                                                />
                                                            </div>

                                                            {/* Additional Ranges */}
                                                            {sub.additional_ranges && sub.additional_ranges.map((range: any, rIndex: number) => (
                                                                <div key={rIndex} className="space-y-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700">
                                                                    <div className="flex justify-between items-center">
                                                                        <TextInput
                                                                            className="w-full text-[10px] h-7"
                                                                            value={range.label}
                                                                            onChange={(e) => updateAdditionalRange(index, rIndex, 'label', e.target.value)}
                                                                            placeholder="Label (e.g. Children 0-5y)"
                                                                        />
                                                                        <button type="button" onClick={() => removeAdditionalRange(index, rIndex)} className="ml-1 text-red-500">
                                                                            <X className="h-3 w-3" />
                                                                        </button>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <TextInput
                                                                            className="w-full text-xs h-7"
                                                                            value={range.range}
                                                                            onChange={(e) => updateAdditionalRange(index, rIndex, 'range', e.target.value)}
                                                                            placeholder="Range"
                                                                        />
                                                                        <TextInput
                                                                            className="w-full text-xs h-7"
                                                                            value={range.units}
                                                                            onChange={(e) => updateAdditionalRange(index, rIndex, 'units', e.target.value)}
                                                                            placeholder="Units"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <button 
                                                                type="button" 
                                                                onClick={() => addAdditionalRange(index)}
                                                                className="text-[10px] text-indigo-500 hover:text-indigo-700 flex items-center"
                                                            >
                                                                <Plus className="h-2 w-2 mr-1" /> Add More Range/Unit
                                                            </button>
                                                        </div>
                                                        {data.subtest_definitions.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeSubtestDefinition(index)}
                                                                className="mt-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {!data.has_subtests && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <InputLabel htmlFor="reference_range" value="Default Ref. Value" />
                                                    <TextInput
                                                        id="reference_range"
                                                        className="mt-1 block w-full"
                                                        value={data.reference_range}
                                                        onChange={(e) => setData('reference_range', e.target.value)}
                                                        placeholder="e.g., 3.5 - 5.5"
                                                    />
                                                    <InputError message={errors.reference_range} className="mt-2" />
                                                </div>
                                                <div>
                                                    <InputLabel htmlFor="units" value="Default Units" />
                                                    <TextInput
                                                        id="units"
                                                        className="mt-1 block w-full"
                                                        value={data.units}
                                                        onChange={(e) => setData('units', e.target.value)}
                                                        placeholder="e.g., mmol/L"
                                                    />
                                                    <InputError message={errors.units} className="mt-2" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <InputLabel htmlFor="reference_range_male" value="Male Ref. Range" />
                                                    <TextInput
                                                        id="reference_range_male"
                                                        className="mt-1 block w-full"
                                                        value={data.reference_range_male}
                                                        onChange={(e) => setData('reference_range_male', e.target.value)}
                                                        placeholder="Male values"
                                                    />
                                                </div>
                                                <div>
                                                    <InputLabel htmlFor="reference_range_female" value="Female Ref. Range" />
                                                    <TextInput
                                                        id="reference_range_female"
                                                        className="mt-1 block w-full"
                                                        value={data.reference_range_female}
                                                        onChange={(e) => setData('reference_range_female', e.target.value)}
                                                        placeholder="Female values"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <InputLabel htmlFor="reference_range_adult" value="Adult Ref. Range" />
                                                    <TextInput
                                                        id="reference_range_adult"
                                                        className="mt-1 block w-full"
                                                        value={data.reference_range_adult}
                                                        onChange={(e) => setData('reference_range_adult', e.target.value)}
                                                        placeholder="Adult values"
                                                    />
                                                </div>
                                                <div>
                                                    <InputLabel htmlFor="reference_range_child" value="Child Ref. Range" />
                                                    <TextInput
                                                        id="reference_range_child"
                                                        className="mt-1 block w-full"
                                                        value={data.reference_range_child}
                                                        onChange={(e) => setData('reference_range_child', e.target.value)}
                                                        placeholder="Child values"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700">
                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                                            <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                                            Pricing Tiers ({currency})
                                        </h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <InputLabel htmlFor="price_walk_in" value="Walk-in Price" />
                                                <TextInput
                                                    id="price_walk_in"
                                                    type="number"
                                                    className="mt-1 block w-full"
                                                    value={data.price_walk_in}
                                                    onChange={(e) => setData('price_walk_in', e.target.value)}
                                                    required
                                                />
                                                <InputError message={errors.price_walk_in} className="mt-2" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <InputLabel htmlFor="price_hmo" value="HMO Price" />
                                                    <TextInput
                                                        id="price_hmo"
                                                        type="number"
                                                        className="mt-1 block w-full"
                                                        value={data.price_hmo}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setData('price_hmo', val);
                                                            if (applyToAllHmos) {
                                                                const newPrices = { ...data.hmo_prices };
                                                                hmos.forEach(h => {
                                                                    newPrices[h.id] = val;
                                                                });
                                                                setData('hmo_prices', newPrices);
                                                            }
                                                        }}
                                                        required
                                                    />
                                                    <InputError message={errors.price_hmo} className="mt-2" />
                                                </div>
                                                <div>
                                                    <InputLabel htmlFor="price_doctor_referred" value="Doctor Referred" />
                                                    <TextInput
                                                        id="price_doctor_referred"
                                                        type="number"
                                                        className="mt-1 block w-full"
                                                        value={data.price_doctor_referred}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setData('price_doctor_referred', val);
                                                            if (applyToAllHospitals) {
                                                                const newPrices = { ...data.hospital_prices };
                                                                hospitals.forEach(h => {
                                                                    newPrices[h.id] = val;
                                                                });
                                                                setData('hospital_prices', newPrices);
                                                            }
                                                        }}
                                                        required
                                                    />
                                                    <InputError message={errors.price_doctor_referred} className="mt-2" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Override Pricing Tabs */}
                                    <div className="mt-4 border-t dark:border-gray-700 pt-4">
                                        <div className="flex border-b dark:border-gray-700 mb-4">
                                            <button
                                                type="button"
                                                onClick={() => setActivePriceTab('hmo')}
                                                className={`pb-2 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activePriceTab === 'hmo'
                                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                            >
                                                HMO Overrides
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActivePriceTab('hospital')}
                                                className={`pb-2 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activePriceTab === 'hospital'
                                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                            >
                                                Hospital Overrides
                                            </button>
                                        </div>

                                        {activePriceTab === 'hmo' ? (
                                            <div className="animate-in fade-in duration-300">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">HMO Specific Prices</h4>
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox
                                                            id="apply_to_all_hmos"
                                                            checked={applyToAllHmos}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                setApplyToAllHmos(checked);
                                                                if (checked && data.price_hmo) {
                                                                    const newPrices = { ...data.hmo_prices };
                                                                    hmos.forEach(h => {
                                                                        newPrices[h.id] = data.price_hmo;
                                                                    });
                                                                    setData('hmo_prices', newPrices);
                                                                }
                                                            }}
                                                        />
                                                        <label htmlFor="apply_to_all_hmos" className="text-[10px] text-gray-500 cursor-pointer">apply default to all</label>
                                                    </div>
                                                </div>
                                                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                    {hmos.map(hmo => (
                                                        <div key={hmo.id} className="flex items-center gap-3">
                                                            <div className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                                                                {hmo.name}
                                                            </div>
                                                            <div className="w-32">
                                                                <TextInput
                                                                    type="number"
                                                                    className="block w-full text-sm py-1"
                                                                    value={data.hmo_prices?.[hmo.id] || ''}
                                                                    onChange={(e) => {
                                                                        const newPrices = { ...data.hmo_prices };
                                                                        newPrices[hmo.id] = e.target.value;
                                                                        setData('hmo_prices', newPrices);
                                                                    }}
                                                                    placeholder={`${currency} 0.00`}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {hmos.length === 0 && (
                                                        <p className="text-xs text-gray-500 italic">No HMOs defined.</p>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="animate-in fade-in duration-300">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hospital Specific Prices</h4>
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox
                                                            id="apply_to_all_hospitals"
                                                            checked={applyToAllHospitals}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                setApplyToAllHospitals(checked);
                                                                if (checked && data.price_doctor_referred) {
                                                                    const newPrices = { ...data.hospital_prices };
                                                                    hospitals.forEach(h => {
                                                                        newPrices[h.id] = data.price_doctor_referred;
                                                                    });
                                                                    setData('hospital_prices', newPrices);
                                                                }
                                                            }}
                                                        />
                                                        <label htmlFor="apply_to_all_hospitals" className="text-[10px] text-gray-500 cursor-pointer">apply default to all</label>
                                                    </div>
                                                </div>
                                                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                    {hospitals.map(hospital => (
                                                        <div key={hospital.id} className="flex items-center gap-3">
                                                            <div className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                                                                {hospital.name}
                                                            </div>
                                                            <div className="w-32">
                                                                <TextInput
                                                                    type="number"
                                                                    className="block w-full text-sm py-1"
                                                                    value={data.hospital_prices?.[hospital.id] || ''}
                                                                    onChange={(e) => {
                                                                        const newPrices = { ...data.hospital_prices };
                                                                        newPrices[hospital.id] = e.target.value;
                                                                        setData('hospital_prices', newPrices);
                                                                    }}
                                                                    placeholder={`${currency} 0.00`}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {hospitals.length === 0 && (
                                                        <p className="text-xs text-gray-500 italic">No hospitals defined.</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="description" value="Instructions / Notes" />
                                        <textarea
                                            id="description"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            rows={2}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="is_active"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                        />
                                        <InputLabel htmlFor="is_active" value="Available for Order" />
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
                                            {isEditing ? 'Update Test' : 'Add to Catalog'}
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
                                                placeholder="Search by name or code..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <select
                                            className="border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={categoryFilter}
                                            onChange={(e) => setCategoryFilter(e.target.value)}
                                        >
                                            <option value="">All Categories</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                        <PrimaryButton type="submit">Filter</PrimaryButton>
                                    </form>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-900">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Test Details</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pricing</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {tests.data.map((test) => (
                                                <tr key={test.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${data.id === test.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                                        {test.test_name}
                                                                    </span>
                                                                    {test.is_group && (
                                                                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                                                            GROUP
                                                                        </span>
                                                                    )}
                                                                    {test.parent && (
                                                                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                                            ↳ {test.parent.test_name}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">
                                                                    {test.test_code}
                                                                </div>
                                                                {test.is_group && test.sub_tests && test.sub_tests.length > 0 && (
                                                                    <div className="mt-1 text-[10px] text-gray-500">
                                                                        Sub-tests: {test.sub_tests.map(s => s.test_name).join(', ')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                            <Folder className="h-4 w-4 mr-1 text-gray-400" />
                                                            {test.category?.name || 'Uncategorized'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {test.department}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center text-xs justify-between w-32 border-b dark:border-gray-700 pb-1">
                                                                <span className="text-gray-500">Walk-in:</span>
                                                                <span className="font-bold text-gray-900 dark:text-gray-100">{currency}{Number(test.price_walk_in).toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex items-center text-xs justify-between w-32 border-b dark:border-gray-700 pb-1">
                                                                <span className="text-gray-500">HMO:</span>
                                                                <span className="font-bold text-gray-900 dark:text-gray-100">{currency}{Number(test.price_hmo).toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex items-center text-xs justify-between w-32">
                                                                <span className="text-gray-500">Ref:</span>
                                                                <span className="font-bold text-gray-900 dark:text-gray-100">{currency}{Number(test.price_doctor_referred).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center text-[10px] text-gray-500 mt-2">
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            {test.turnaround_time}h TAT
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${test.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                            {test.is_active ? 'Available' : 'Disabled'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-3">
                                                            <button onClick={() => handleEdit(test)} className="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400">
                                                                <Edit className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setManagingHmoPricesFor(test);
                                                                    hmoPriceForm.setData('test_id', test.id.toString());
                                                                }}
                                                                className="text-green-600 hover:text-green-900 dark:hover:text-green-400"
                                                                title="Manage HMO Specific Prices"
                                                            >
                                                                <ShieldCheck className="h-5 w-5" />
                                                            </button>
                                                            <button onClick={() => handleDelete(test)} className="text-red-600 hover:text-red-900 dark:hover:text-red-400">
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {tests.total > 15 && (
                                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-gray-700 dark:text-gray-400">
                                                Showing {((tests.current_page - 1) * 15) + 1} to {Math.min(tests.current_page * 15, tests.total)} of {tests.total} tests
                                            </div>
                                            <div className="flex space-x-1">
                                                {tests.links.map((link, i) => (
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
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* HMO Prices Modal */}
            <Modal show={managingHmoPricesFor !== null} onClose={() => setManagingHmoPricesFor(null)} maxWidth="lg">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-gray-700">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                                <ShieldCheck className="mr-2 h-5 w-5 text-green-500" />
                                HMO Specific Prices
                            </h2>
                            <p className="text-sm text-gray-500">{managingHmoPricesFor?.test_name}</p>
                        </div>
                        <button onClick={() => setManagingHmoPricesFor(null)} className="text-gray-400 hover:text-gray-600">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Current Prices List */}
                        <div>
                            <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">Configured HMO Prices</h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                {managingHmoPricesFor?.hmo_prices?.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">No specific HMO prices set. Defaulting to standard HMO price.</p>
                                ) : (
                                    managingHmoPricesFor?.hmo_prices?.map(price => (
                                        <div key={price.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700">
                                            <div>
                                                <div className="text-sm font-bold">{price.hmo?.name}</div>
                                                <div className="text-xs text-green-600 dark:text-green-400 font-mono">{currency}{parseFloat(price.price).toLocaleString()}</div>
                                            </div>
                                            <button onClick={() => handleDeleteHmoPrice(price.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-colors">
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Add New Price Form */}
                        <div className="bg-gray-50 dark:bg-gray-900/30 p-4 rounded-xl border dark:border-gray-700">
                            <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">Add/Update HMO Price</h3>
                            <form onSubmit={handleSaveHmoPrice} className="space-y-4">
                                <div>
                                    <InputLabel htmlFor="hmo_id" value="HMO" />
                                    <select
                                        id="hmo_id"
                                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm text-sm"
                                        value={hmoPriceForm.data.hmo_id}
                                        onChange={e => hmoPriceForm.setData('hmo_id', e.target.value)}
                                        required
                                    >
                                        <option value="">Select HMO</option>
                                        {hmos.map(hmo => (
                                            <option key={hmo.id} value={hmo.id} disabled={!!managingHmoPricesFor?.hmo_prices?.find(p => p.hmo_id === hmo.id)}>
                                                {hmo.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <InputLabel htmlFor="hmo_price" value="Price ({currency})" />
                                    <TextInput
                                        id="hmo_price"
                                        type="number"
                                        className="mt-1 block w-full"
                                        value={hmoPriceForm.data.price}
                                        onChange={e => hmoPriceForm.setData('price', e.target.value)}
                                        required
                                        placeholder="0.00"
                                    />
                                </div>
                                <PrimaryButton className="w-full justify-center" disabled={hmoPriceForm.processing}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Save Price
                                </PrimaryButton>
                            </form>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t dark:border-gray-700 flex justify-end">
                        <SecondaryButton onClick={() => setManagingHmoPricesFor(null)}>Close</SecondaryButton>
                    </div>
                </div>
            </Modal>

            {/* Quick Add Category Modal */}
            <Modal show={showingCategoryModal} onClose={() => setShowingCategoryModal(false)}>
                <form onSubmit={handleQuickAddCategory} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Add New Category</h2>
                    <div className="mt-6 space-y-4">
                        <div>
                            <InputLabel htmlFor="cat_name" value="Category Name" />
                            <TextInput id="cat_name" className="mt-1 block w-full" value={categoryForm.data.name} onChange={e => categoryForm.setData('name', e.target.value)} required />
                        </div>
                        <div>
                            <InputLabel htmlFor="cat_desc" value="Description" />
                            <textarea id="cat_desc" className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md" value={categoryForm.data.description} onChange={e => categoryForm.setData('description', e.target.value)} />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setShowingCategoryModal(false)}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={categoryForm.processing}>Add Category</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
