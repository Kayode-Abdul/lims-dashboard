import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { UserPlus, ArrowLeft, Mail, Tag, Shield } from 'lucide-react';
import Checkbox from '@/Components/Checkbox';

export default function Create() {
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
        { id: 'staff.manage', label: 'Manage Staff', category: 'Administrative' },
        { id: 'lab.settings', label: 'Lab Settings', category: 'Administrative' },
        { id: 'audit.view', label: 'View Audit Logs', category: 'Administrative' },
        { id: 'referrals.manage', label: 'Manage Referrals', category: 'Administrative' },
    ];

    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'lab_tech',
        department: '',
        permissions: [] as string[],
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

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('staff.store'));
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-500" />
                Add New Staff Member
            </h2>}
        >
            <Head title="Add Staff" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="mb-6">
                            <Link
                                href={route('staff.index')}
                                className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-500"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Back to Staff List
                            </Link>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="first_name" value="First Name *" />
                                    <TextInput
                                        id="first_name"
                                        value={data.first_name}
                                        onChange={(e) => setData('first_name', e.target.value)}
                                        className="mt-1 block w-full"
                                        required
                                        isFocused
                                    />
                                    <InputError message={errors.first_name} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="last_name" value="Last Name" />
                                    <TextInput
                                        id="last_name"
                                        name="last_name"
                                        value={data.last_name}
                                        className="mt-1 block w-full"
                                        autoComplete="family-name"
                                        onChange={(e) => setData('last_name', e.target.value)}
                                    />
                                    <InputError message={errors.last_name} className="mt-2" />
                                </div>
                            </div>

                            <div>
                                <InputLabel htmlFor="email" value="Email Address" />
                                <div className="relative mt-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <TextInput
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="block w-full pl-10"
                                        required
                                    />
                                </div>
                                <InputError message={errors.email} className="mt-2" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="role" value="Designated Role" />
                                    <select
                                        id="role"
                                        value={data.role}
                                        onChange={(e) => setData('role', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                        required
                                    >
                                        <option value="pathologist">Pathologist</option>
                                        <option value="lab_tech">Laboratory Technician</option>
                                        <option value="supervisor">Supervisor</option>
                                        <option value="admin">Administrator</option>
                                        <option value="receptionist">Receptionist</option>
                                    </select>
                                    <InputError message={errors.role} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="department" value="Department (Optional)" />
                                    <div className="relative mt-1">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Tag className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <TextInput
                                            id="department"
                                            value={data.department}
                                            onChange={(e) => setData('department', e.target.value)}
                                            className="block w-full pl-10"
                                        />
                                    </div>
                                    <InputError message={errors.department} className="mt-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t dark:border-gray-700">
                                <div>
                                    <InputLabel htmlFor="password" value="Initial Password" />
                                    <TextInput
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="mt-1 block w-full"
                                        required
                                    />
                                    <InputError message={errors.password} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="password_confirmation" value="Confirm Password" />
                                    <TextInput
                                        id="password_confirmation"
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        className="mt-1 block w-full"
                                        required
                                    />
                                    <InputError message={errors.password_confirmation} className="mt-2" />
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

                            <div className="flex items-center justify-end">
                                <PrimaryButton className="ml-4" disabled={processing}>
                                    Register Staff Member
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
