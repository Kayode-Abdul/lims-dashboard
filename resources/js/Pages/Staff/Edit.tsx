import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { PageProps, User as UserType } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Checkbox from '@/Components/Checkbox';
import { ArrowLeft, Save, User, Shield, Plus, Phone, Briefcase, DollarSign } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import axios from 'axios';

interface Department {
    id: number;
    name: string;
}

interface Role {
    id: number;
    name: string;
    permissions: string[];
}

export default function Edit({ auth, user, departments: initialDepartments, roles }: PageProps<{ user: UserType; departments: Department[]; roles: Role[] }>) {
    const [departments, setDepartments] = useState<Department[]>(initialDepartments || []);
    const [newDeptName, setNewDeptName] = useState('');
    const [addingDept, setAddingDept] = useState(false);



    const PERMISSIONS = [
        { id: 'dashboard.view', label: 'View Dashboard', category: 'General' },
        { id: 'patients.view', label: 'View Patients', category: 'Patients' },
        { id: 'patients.create', label: 'Create Patients', category: 'Patients' },
        { id: 'patients.edit', label: 'Edit Patients', category: 'Patients' },
        { id: 'orders.create', label: 'Create Orders', category: 'Tests' },
        { id: 'orders.view', label: 'View Orders', category: 'Tests' },
        { id: 'results.manage', label: 'Manage Results', category: 'Tests' },
        { id: 'results.verify', label: 'Verify Results (with Signature)', category: 'Tests' },
        { id: 'billing.manage', label: 'Manage Billing', category: 'Financial' },
        { id: 'accounting.view', label: 'View Accounting Dashboard', category: 'Financial' },
        { id: 'accounting.manage_income_source', label: 'Manage Income Source', category: 'Financial' },
        { id: 'staff.manage', label: 'Manage Staff', category: 'Administrative' },
        { id: 'lab.settings', label: 'Lab Settings', category: 'Administrative' },
        { id: 'audit.view', label: 'View Audit Logs', category: 'Administrative' },
        { id: 'referrals.manage', label: 'Manage Referrals', category: 'Administrative' },
    ];

    const { data, setData, post, processing, errors } = useForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        role: user.role || 'lab_tech',
        department: user.department || '',
        is_active: !!user.is_active,
        phone: user.phone || '',
        address: user.address || '',
        position: user.position || '',
        employment_type: user.employment_type || 'Full-time',
        bank_name: user.bank_name || '',
        account_number: user.account_number || '',
        permissions: (user as any).permissions || [] as string[],
        signature: null as File | null,
        _method: 'PATCH',
    });

    const togglePermission = (id: string) => {
        const current = [...data.permissions];
        const index = current.indexOf(id);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(id);
        }
        setData('permissions', current);
    };

    const handleAddDepartment = async () => {
        if (!newDeptName.trim()) return;
        setAddingDept(true);
        try {
            const response = await axios.post(route('departments.store'), { name: newDeptName });
            if (response.data.success) {
                setDepartments([...departments, response.data.department]);
                setData('department', response.data.department.name);
                setNewDeptName('');
            }
        } catch (error) {
            console.error('Failed to add department:', error);
        } finally {
            setAddingDept(false);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('staff.update', user.id), {
            forceFormData: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Edit Staff: {user.first_name} {user.last_name}</h2>}
        >
            <Head title={`Edit Staff - ${user.first_name}`} />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">

                    <Link
                        href={route('staff.index')}
                        className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-6"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Directory
                    </Link>

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                                <Shield className="h-5 w-5 mr-2 text-indigo-500" />
                                Administrative Profile Management
                            </h3>
                        </div>

                        <form onSubmit={submit} className="p-6 space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Basic Info Section */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-gray-500 uppercase flex items-center">
                                        <User className="h-4 w-4 mr-2" /> Personal Information
                                    </h4>

                                    <div>
                                        <InputLabel htmlFor="first_name" value="First Name" />
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

                                    <div>
                                        <InputLabel htmlFor="email" value="Official Email" />
                                        <TextInput
                                            id="email"
                                            type="email"
                                            className="mt-1 block w-full"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.email} className="mt-2" />
                                    </div>
                                </div>

                                {/* Employment Section */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-gray-500 uppercase flex items-center">
                                        <Save className="h-4 w-4 mr-2" /> System Credentials
                                    </h4>

                                    <div>
                                        <InputLabel htmlFor="role" value="Access Level / Role" />
                                        <select
                                            id="role"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={data.role}
                                            onChange={(e) => {
                                                const selectedRole = roles.find(r => r.name === e.target.value);
                                                setData((prev) => ({
                                                    ...prev,
                                                    role: e.target.value,
                                                    permissions: selectedRole ? (selectedRole.permissions || []) : prev.permissions,
                                                }));
                                            }}
                                        >
                                            <option value="" disabled>Select a role...</option>
                                            {roles.map(role => (
                                                <option key={role.id} value={role.name}>{role.name}</option>
                                            ))}
                                        </select>
                                        <InputError message={errors.role} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="department" value="Department Assignment" />
                                        <select
                                            id="department"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={data.department}
                                            onChange={(e) => setData('department', e.target.value)}
                                        >
                                            <option value="">N/A</option>
                                            {departments.map(dept => (
                                                <option key={dept.id} value={dept.name}>{dept.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Add New Department */}
                                    <div className="flex gap-2">
                                        <TextInput
                                            placeholder="Add new department..."
                                            className="flex-1 text-sm"
                                            value={newDeptName}
                                            onChange={(e) => setNewDeptName(e.target.value)}
                                        />
                                        <SecondaryButton
                                            type="button"
                                            onClick={handleAddDepartment}
                                            disabled={addingDept || !newDeptName.trim()}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </SecondaryButton>
                                    </div>

                                    <div className="pt-4 flex items-center gap-2">
                                        <Checkbox
                                            id="is_active"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                        />
                                        <InputLabel htmlFor="is_active" value="Account Status (Active)" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t dark:border-gray-700">
                                {/* Contact & Additional Section */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-gray-500 uppercase flex items-center">
                                        <Phone className="h-4 w-4 mr-2" /> Contact & Location
                                    </h4>

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
                                        <InputLabel htmlFor="address" value="Residential Address" />
                                        <textarea
                                            id="address"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            rows={2}
                                        />
                                        <InputError message={errors.address} className="mt-2" />
                                    </div>
                                </div>

                                {/* Bank & Payroll Section */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-gray-500 uppercase flex items-center">
                                        <DollarSign className="h-4 w-4 mr-2" /> Payroll Information
                                    </h4>

                                    <div>
                                        <InputLabel htmlFor="bank_name" value="Bank Name" />
                                        <TextInput
                                            id="bank_name"
                                            className="mt-1 block w-full"
                                            value={data.bank_name}
                                            onChange={(e) => setData('bank_name', e.target.value)}
                                        />
                                        <InputError message={errors.bank_name} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="account_number" value="Account Number" />
                                        <TextInput
                                            id="account_number"
                                            className="mt-1 block w-full"
                                            value={data.account_number}
                                            onChange={(e) => setData('account_number', e.target.value)}
                                        />
                                        <InputError message={errors.account_number} className="mt-2" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t dark:border-gray-700">
                                {/* Employment Details */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-gray-500 uppercase flex items-center">
                                        <Briefcase className="h-4 w-4 mr-2" /> Employment Details
                                    </h4>

                                    <div>
                                        <InputLabel htmlFor="position" value="Job Position / Title" />
                                        <TextInput
                                            id="position"
                                            className="mt-1 block w-full"
                                            value={data.position}
                                            onChange={(e) => setData('position', e.target.value)}
                                        />
                                        <InputError message={errors.position} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="employment_type" value="Employment Type" />
                                        <select
                                            id="employment_type"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={data.employment_type}
                                            onChange={(e) => setData('employment_type', e.target.value)}
                                        >
                                            <option value="Full-time">Full-time</option>
                                            <option value="Part-time">Part-time</option>
                                            <option value="Contract">Contract</option>
                                            <option value="Intern">Intern</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Signature Section */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-gray-500 uppercase flex items-center">
                                        <Save className="h-4 w-4 mr-2" /> Digital Signature
                                    </h4>

                                    {user.signature_path && (
                                        <div className="mb-4">
                                            <InputLabel value="Current Signature" />
                                            <div className="mt-2 p-2 border rounded-lg bg-gray-50 dark:bg-gray-900/50 inline-block">
                                                <img src={`/storage/${user.signature_path}`} alt="Signature" className="h-16 object-contain" />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <InputLabel htmlFor="signature" value="Upload New Signature" />
                                        <input
                                            id="signature"
                                            type="file"
                                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                            onChange={(e) => setData('signature', e.target.files ? e.target.files[0] : null)}
                                            accept="image/*"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">PNG or JPG, max 2MB. Recommended: Transparent PNG.</p>
                                        <InputError message={errors.signature} className="mt-2" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t dark:border-gray-700">
                                <h4 className="text-sm font-bold text-gray-500 uppercase flex items-center mb-4">
                                    <Shield className="h-4 w-4 mr-2" /> Granular Permissions
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {['General', 'Patients', 'Tests', 'Financial', 'Administrative'].map(category => (
                                        <div key={category} className="space-y-2">
                                            <h5 className="text-xs font-bold text-gray-400 uppercase border-b pb-1 mb-2">{category}</h5>
                                            {PERMISSIONS.filter(p => p.category === category).map(permission => (
                                                <label key={permission.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-1 rounded transition-colors">
                                                    <Checkbox
                                                        checked={data.permissions.includes(permission.id)}
                                                        onChange={() => togglePermission(permission.id)}
                                                    />
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">{permission.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t dark:border-gray-700 flex justify-end gap-4">
                                <Link
                                    href={route('staff.index')}
                                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                >
                                    Discard Changes
                                </Link>
                                <PrimaryButton disabled={processing}>
                                    Save Profile Updates
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
