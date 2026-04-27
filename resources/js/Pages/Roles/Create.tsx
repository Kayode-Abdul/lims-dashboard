import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Checkbox from '@/Components/Checkbox';
import { Shield, ArrowLeft, Save } from 'lucide-react';
import { FormEventHandler } from 'react';
import { PERMISSIONS } from '@/constants/permissions';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        permissions: [] as string[],
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('roles.store'));
    };

    const togglePermission = (permissionId: string) => {
        const current = [...data.permissions];
        if (current.includes(permissionId)) {
            setData('permissions', current.filter(id => id !== permissionId));
        } else {
            setData('permissions', [...current, permissionId]);
        }
    };

    const categories = ['General', 'Patients', 'Tests', 'Financial', 'Administrative'];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href={route('roles.index')} className="text-gray-500 hover:text-gray-700 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-indigo-500" />
                        Create New Role
                    </h2>
                </div>
            }
        >
            <Head title="Create Role" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <form onSubmit={submit} className="bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg overflow-hidden">
                        <div className="p-6 space-y-6">
                            <div>
                                <InputLabel htmlFor="name" value="Role Name" />
                                <TextInput
                                    id="name"
                                    className="mt-1 block w-full"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    placeholder="e.g., Senior Lab Scientist"
                                    isFocused
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div className="border-t dark:border-gray-700 pt-6">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                                    <Shield className="w-4 h-4 mr-2" />
                                    Assign Permissions
                                </h3>
                                
                                <div className="space-y-6">
                                    {categories.map(category => (
                                        <div key={category} className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border dark:border-gray-700">
                                            <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3 pb-2 border-b dark:border-gray-700">
                                                {category}
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {PERMISSIONS.filter(p => p.category === category).map(permission => (
                                                    <label key={permission.id} className="flex items-center gap-3 cursor-pointer group">
                                                        <Checkbox
                                                            checked={data.permissions.includes(permission.id)}
                                                            onChange={() => togglePermission(permission.id)}
                                                        />
                                                        <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                            {permission.label}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700 flex justify-end gap-3">
                            <Link href={route('roles.index')}>
                                <SecondaryButton>Cancel</SecondaryButton>
                            </Link>
                            <PrimaryButton disabled={processing} className="flex items-center gap-2">
                                <Save className="w-4 h-4" />
                                Create Role
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
