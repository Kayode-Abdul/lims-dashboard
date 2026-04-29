import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import { Shield, Plus, Edit2, Trash2 } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useState } from 'react';

interface Role {
    id: number;
    name: string;
    permissions: string[];
    created_at: string;
}

export default function Index({ roles }: { roles: Role[] }) {
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

    const { delete: destroy, processing } = useForm({});

    const deleteRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (roleToDelete) {
            destroy(route('roles.destroy', roleToDelete.id), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const closeModal = () => {
        setConfirmingDeletion(false);
        setRoleToDelete(null);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-indigo-500" />
                        Roles Management
                    </h2>
                    <Link href={route('roles.create')}>
                        <PrimaryButton className="flex items-center gap-1">
                            <Plus className="w-4 h-4" />
                            Create Role
                        </PrimaryButton>
                    </Link>
                </div>
            }
        >
            <Head title="Roles Management" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            {roles.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No custom roles created yet.</p>
                                    <Link href={route('roles.create')} className="text-indigo-500 hover:underline mt-2 inline-block">
                                        Create one now
                                    </Link>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                            <tr>
                                                <th className="px-6 py-3">Role Name</th>
                                                <th className="px-6 py-3">Permissions Count</th>
                                                <th className="px-6 py-3">Created</th>
                                                <th className="px-6 py-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {roles.map(role => (
                                                <tr key={role.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <td className="px-6 py-4 font-bold">
                                                        {role.name}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 px-2 py-1 flex w-fit items-center rounded-full text-xs font-medium">
                                                            {role.permissions ? role.permissions.length : 0} Permissions
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500">
                                                        {new Date(role.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Link href={route('roles.edit', role.id)}>
                                                                <button className="text-blue-500 hover:text-blue-700 p-1">
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                            </Link>
                                                            <button
                                                                onClick={() => { setRoleToDelete(role); setConfirmingDeletion(true); }}
                                                                className="text-red-500 hover:text-red-700 p-1"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={confirmingDeletion} onClose={closeModal}>
                <form onSubmit={deleteRole} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Are you sure you want to delete this Role?
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Deleting this role will not remove the permissions from users who already have it, but they will no longer be able to select this role.
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={closeModal}>Cancel</SecondaryButton>
                        <DangerButton disabled={processing}>Delete Role</DangerButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
