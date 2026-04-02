import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Checkbox from '@/Components/Checkbox';
import { Search, Edit, Trash2, Eye, Phone, Mail, User, ShieldCheck, Activity, Plus } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import axios from 'axios';
import { Shield } from 'lucide-react';

const PERMISSIONS = [
    { id: 'dashboard.view', label: 'View Dashboard Statistics', category: 'General' },
    { id: 'patients.view', label: 'View Patient Directory', category: 'Patients' },
    { id: 'patients.create', label: 'Register New Patients', category: 'Patients' },
    { id: 'patients.edit', label: 'Update Patient Information', category: 'Patients' },
    { id: 'patients.delete', label: 'Delete Patient Records', category: 'Patients' },
    { id: 'orders.view', label: 'View Diagnostic Orders', category: 'Tests' },
    { id: 'orders.create', label: 'Place New Diagnostic Orders', category: 'Tests' },
    { id: 'orders.edit', label: 'Modify Existing Orders', category: 'Tests' },
    { id: 'orders.delete', label: 'Cancel/Delete Orders', category: 'Tests' },
    { id: 'samples.collect', label: 'Collect & Manage Specimens', category: 'Tests' },
    { id: 'results.enter', label: 'Enter Test Results', category: 'Tests' },
    { id: 'results.edit', label: 'Modify Entered Results', category: 'Tests' },
    { id: 'results.verify', label: 'Verify/Validate Results', category: 'Tests' },
    { id: 'results.delete', label: 'Delete Result Records', category: 'Tests' },
    { id: 'accounting.view', label: 'View Financial Reports', category: 'Financial' },
    { id: 'billing.manage', label: 'Manage Payments & Invoices', category: 'Financial' },
    { id: 'expenses.manage', label: 'Manage Lab Expenses', category: 'Financial' },
    { id: 'staff.manage', label: 'Manage Staff & Privileges', category: 'Administrative' },
    { id: 'lab.settings', label: 'Configure Lab Settings', category: 'Administrative' },
    { id: 'catalog.manage', label: 'Manage Test Catalog & Prices', category: 'Administrative' },
    { id: 'referrals.manage', label: 'Manage Referral Sources (Hospitals/Doctors)', category: 'Administrative' },
    { id: 'hmos.manage', label: 'Manage HMO Partners', category: 'Administrative' },
    { id: 'audit.view', label: 'View System Audit Logs', category: 'Administrative' },
];

interface StaffMember {
    id: number;
    staff_no: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    department: string;
    is_active: boolean;
    phone?: string;
    address?: string;
    position?: string;
    employment_type?: string;
    bank_name?: string;
    account_number?: string;
    permissions?: string[];
    signature_path?: string;
}

interface Department {
    id: number;
    name: string;
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedStaff {
    data: StaffMember[];
    links: PaginationLinks[];
    current_page: number;
    last_page: number;
    total: number;
}

export default function Index({ auth, staff, departments: initialDepartments, filters }: PageProps<{
    staff: PaginatedStaff,
    departments: Department[],
    filters: { search?: string, role?: string }
}>) {
    const [departments, setDepartments] = useState<Department[]>(initialDepartments);
    const [newDeptName, setNewDeptName] = useState('');
    const [addingDept, setAddingDept] = useState(false);

    const { data, setData, post, patch, processing, errors, reset, clearErrors, transform } = useForm({
        id: null as number | null,
        first_name: '',
        last_name: '',
        email: '',
        role: 'lab_tech',
        department: '',
        is_active: true,
        password: '',
        password_confirmation: '',
        phone: '',
        address: '',
        position: '',
        employment_type: 'Full-time',
        bank_name: '',
        account_number: '',
        permissions: [] as string[],
        signature: null as File | null,
    });

    const [isEditing, setIsEditing] = useState(false);
    const [memberToEdit, setMemberToEdit] = useState<StaffMember | null>(null);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const roles = [
        { value: 'admin', label: 'Administrator' },
        { value: 'supervisor', label: 'Supervisor' },
        { value: 'pathologist', label: 'Pathologist' },
        { value: 'lab_tech', label: 'Lab Technician' },
    ];

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
        if (data.id) {
            transform((data) => ({
                ...data,
                _method: 'patch',
            }));
            post(route('staff.update', data.id), {
                onSuccess: () => {
                    setIsEditing(false);
                    reset();
                }
            });
        } else {
            post(route('staff.store'), {
                onSuccess: () => {
                    setIsEditing(false);
                    reset();
                }
            });
        }
    };

    const togglePermission = (permissionId: string) => {
        const current = [...data.permissions];
        if (current.includes(permissionId)) {
            setData('permissions', current.filter(id => id !== permissionId));
        } else {
            setData('permissions', [...current, permissionId]);
        }
    };

    const handleEdit = (member: StaffMember) => {
        setIsEditing(true);
        setMemberToEdit(member);
        clearErrors();
        setData({
            id: member.id,
            first_name: member.first_name,
            last_name: member.last_name,
            email: member.email,
            role: member.role,
            department: member.department || '',
            is_active: !!member.is_active,
            password: '',
            password_confirmation: '',
            phone: member.phone || '',
            address: member.address || '',
            position: member.position || '',
            employment_type: member.employment_type || 'Full-time',
            bank_name: member.bank_name || '',
            account_number: member.account_number || '',
            permissions: member.permissions || [],
            signature: null,
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('staff.index'), { search: searchTerm }, { preserveState: true });
    };

    const handleDeactivate = (member: StaffMember) => {
        if (confirm(`Are you sure you want to deactivate ${member.first_name}?`)) {
            router.delete(route('staff.destroy', member.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Staff Register</h2>}
        >
            <Head title="Staff Management" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Edit Panel */}
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                                    {isEditing ? (data.id ? 'Manage Staff Member' : 'Add New Staff Member') : 'Staff Directory'}
                                </h3>
                                <div className="mb-4">
                                    {!isEditing && (
                                        <PrimaryButton
                                            onClick={() => {
                                                setIsEditing(true);
                                                clearErrors();
                                                reset();
                                            }}
                                            className="w-full justify-center"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add New Staff Member
                                        </PrimaryButton>
                                    )}
                                </div>

                                {isEditing ? (
                                    <form onSubmit={submit} className="space-y-4">
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
                                                required
                                            />
                                            <InputError message={errors.last_name} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="email" value="Email" />
                                            <TextInput
                                                id="email"
                                                type="email"
                                                className="mt-1 block w-full bg-gray-50 dark:bg-gray-700"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                onBlur={async (e) => {
                                                    if (e.target.value && !data.id) {
                                                        const res = await axios.get(route('staff.check-email'), { params: { email: e.target.value } });
                                                        if (res.data.exists) {
                                                            // @ts-ignore
                                                            if (window.toast) {
                                                                // @ts-ignore
                                                                window.toast.error('This email is already registered to another staff member.');
                                                            } else {
                                                                alert('Warning: This email is already registered to another staff member.');
                                                            }
                                                        }
                                                    }
                                                }}
                                                required
                                            />
                                            <InputError message={errors.email} className="mt-2" />
                                        </div>

                                        {!data.id && (
                                            <>
                                                <div>
                                                    <InputLabel htmlFor="password" value="Password" />
                                                    <TextInput
                                                        id="password"
                                                        type="password"
                                                        className="mt-1 block w-full"
                                                        value={data.password}
                                                        onChange={(e) => setData('password', e.target.value)}
                                                        required
                                                    />
                                                    <InputError message={errors.password} className="mt-2" />
                                                </div>

                                                <div>
                                                    <InputLabel htmlFor="password_confirmation" value="Confirm Password" />
                                                    <TextInput
                                                        id="password_confirmation"
                                                        type="password"
                                                        className="mt-1 block w-full"
                                                        value={data.password_confirmation}
                                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                                        required
                                                    />
                                                    <InputError message={errors.password_confirmation} className="mt-2" />
                                                </div>
                                            </>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <InputLabel htmlFor="role" value="Role" />
                                                <select
                                                    id="role"
                                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                    value={data.role}
                                                    onChange={(e) => setData('role', e.target.value)}
                                                >
                                                    {roles.map(role => (
                                                        <option key={role.value} value={role.value}>{role.label}</option>
                                                    ))}
                                                </select>
                                                <InputError message={errors.role} className="mt-2" />
                                            </div>
                                            <div>
                                                <InputLabel htmlFor="department" value="Department" />
                                                <select
                                                    id="department"
                                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                    value={data.department}
                                                    onChange={(e) => setData('department', e.target.value)}
                                                >
                                                    <option value="">Select Department</option>
                                                    {departments.map(dept => (
                                                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                                                    ))}
                                                </select>
                                            </div>
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

                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="is_active"
                                                checked={data.is_active}
                                                onChange={(e) => setData('is_active', e.target.checked)}
                                            />
                                            <InputLabel htmlFor="is_active" value="Active Account" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-gray-700">
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
                                                <InputLabel htmlFor="position" value="Position" />
                                                <TextInput
                                                    id="position"
                                                    className="mt-1 block w-full text-sm"
                                                    value={data.position}
                                                    onChange={(e) => setData('position', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="address" value="Address" />
                                            <textarea
                                                id="address"
                                                className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm text-sm"
                                                value={data.address}
                                                onChange={(e) => setData('address', e.target.value)}
                                                rows={2}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-gray-700">
                                            <div>
                                                <InputLabel htmlFor="bank_name" value="Bank Name" />
                                                <TextInput
                                                    id="bank_name"
                                                    className="mt-1 block w-full text-sm"
                                                    value={data.bank_name}
                                                    onChange={(e) => setData('bank_name', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <InputLabel htmlFor="account_number" value="Account Number" />
                                                <TextInput
                                                    id="account_number"
                                                    className="mt-1 block w-full text-sm"
                                                    value={data.account_number}
                                                    onChange={(e) => setData('account_number', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t dark:border-gray-700">
                                            <InputLabel htmlFor="signature" value="Staff Signature" />
                                            <input
                                                id="signature"
                                                type="file"
                                                className="mt-1 block w-full text-xs text-gray-500
                                                    file:mr-4 file:py-2 file:px-4
                                                    file:rounded-full file:border-0
                                                    file:text-xs file:font-semibold
                                                    file:bg-indigo-50 file:text-indigo-700
                                                    hover:file:bg-indigo-100"
                                                onChange={(e) => setData('signature', e.target.files ? e.target.files[0] : null)}
                                                accept="image/*"
                                            />
                                            <InputError message={errors.signature} className="mt-2" />
                                            {/* @ts-ignore */}
                                            {(data.signature || memberToEdit?.signature_path) && (
                                                <div className="mt-2">
                                                    <p className="text-[10px] text-gray-500 mb-1 font-bold">Standard Signature (400x300):</p>
                                                    {/* @ts-ignore */}
                                                    <div className="border dark:border-gray-600 rounded bg-white p-2 flex items-center justify-center w-[400px] h-[300px] overflow-hidden">
                                                        <img 
                                                            src={data.signature ? URL.createObjectURL(data.signature) : `/storage/${memberToEdit?.signature_path}`} 
                                                            alt="Signature" 
                                                            className="max-h-full max-w-full object-contain" 
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-6 border-t dark:border-gray-700">
                                            <h4 className="text-sm font-bold text-gray-500 uppercase flex items-center mb-4">
                                                <Shield className="h-4 w-4 mr-2" /> Granular Permissions
                                            </h4>
                                            <div className="space-y-4">
                                                {['General', 'Patients', 'Tests', 'Financial', 'Administrative'].map(category => (
                                                    <div key={category} className="space-y-1">
                                                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{category}</h5>
                                                        <div className="grid grid-cols-1 gap-1">
                                                            {PERMISSIONS.filter(p => p.category === category).map(permission => (
                                                                <label key={permission.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-1 rounded transition-colors">
                                                                    <Checkbox
                                                                        checked={data.permissions.includes(permission.id)}
                                                                        onChange={() => togglePermission(permission.id)}
                                                                    />
                                                                    <span className="text-xs text-gray-700 dark:text-gray-300">{permission.label}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end mt-4">
                                            <button
                                                type="button"
                                                onClick={() => { setIsEditing(false); reset(); }}
                                                className="mr-4 text-sm text-gray-600 dark:text-gray-400 underline"
                                            >
                                                Cancel
                                            </button>
                                            <PrimaryButton disabled={processing}>
                                                {data.id ? 'Update Staff Profile' : 'Register Staff'}
                                            </PrimaryButton>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                                        <ShieldCheck className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                                        <p className="text-sm text-gray-500">Click a staff member in the directory to modify their profile or role permissions.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Directory Panel */}
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
                                                placeholder="Search by name, ID or email..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <PrimaryButton type="submit">Retrieve</PrimaryButton>
                                    </form>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-900">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Staff No</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role/Dept</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {staff.data.map((member) => (
                                                <tr key={member.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${data.id === member.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-600 dark:text-gray-400">
                                                        {member.staff_no}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {member.first_name} {member.last_name}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {member.email}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                                                            {member.role.replace('_', ' ')}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {member.department || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                            {member.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-2">
                                                            <button onClick={() => handleEdit(member)} className="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400">
                                                                <Edit className="h-5 w-5" />
                                                            </button>
                                                            <button onClick={() => handleDeactivate(member)} className="text-red-600 hover:text-red-900 dark:hover:text-red-400" title="Deactivate">
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700 dark:text-gray-400">
                                            Showing {staff.total > 0 ? ((staff.current_page - 1) * 10) + 1 : 0} to{' '}
                                            {Math.min(staff.current_page * 10, staff.total)} of {staff.total} results
                                        </div>
                                        <div className="flex space-x-1">
                                            {staff.links.map((link, i) => (
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
        </AuthenticatedLayout >
    );
}
