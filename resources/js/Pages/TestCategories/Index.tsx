import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Checkbox from '@/Components/Checkbox';
import { Search, Edit, Trash2, FolderPlus, Folder, Activity } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface TestCategory {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
}

export default function Index({ auth, categories, filters }: PageProps<{ categories: TestCategory[], filters: { search?: string } }>) {
    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        id: null as number | null,
        name: '',
        description: '',
        is_active: true,
    });

    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEditing && data.id) {
            patch(route('test-categories.update', data.id), {
                onSuccess: () => {
                    reset();
                    setIsEditing(false);
                }
            });
        } else {
            post(route('test-categories.store'), {
                onSuccess: () => reset()
            });
        }
    };

    const handleEdit = (category: TestCategory) => {
        setIsEditing(true);
        clearErrors();
        setData({
            id: category.id,
            name: category.name,
            description: category.description || '',
            is_active: category.is_active,
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('test-categories.index'), { search: searchTerm }, { preserveState: true });
    };

    const handleDelete = (category: TestCategory) => {
        if (confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
            router.delete(route('test-categories.destroy', category.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Test Categories</h2>}
        >
            <Head title="Test Categories" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Form Panel */}
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                                    <FolderPlus className="h-5 w-5 mr-2 text-indigo-500" />
                                    {isEditing ? 'Edit Category' : 'Create New Category'}
                                </h3>

                                <form onSubmit={submit} className="space-y-4">
                                    <div>
                                        <InputLabel htmlFor="name" value="Category Name" />
                                        <TextInput
                                            id="name"
                                            className="mt-1 block w-full"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                            placeholder="e.g., Hematology"
                                        />
                                        <InputError message={errors.name} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="description" value="Description" />
                                        <textarea
                                            id="description"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            rows={3}
                                            placeholder="Optional category details..."
                                        />
                                        <InputError message={errors.description} className="mt-2" />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="is_active"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                        />
                                        <InputLabel htmlFor="is_active" value="Active" />
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
                                            {isEditing ? 'Update Category' : 'Create Category'}
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
                                                placeholder="Search categories..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <PrimaryButton type="submit">Search</PrimaryButton>
                                    </form>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-900">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {categories.map((category) => (
                                                <tr key={category.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${data.id === category.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <Folder className="h-5 w-5 text-indigo-400 mr-2" />
                                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                {category.name}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-500 dark:text-gray-400 limit-lines-1 max-w-xs overflow-hidden text-ellipsis">
                                                            {category.description || 'No description'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${category.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                            {category.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-3">
                                                            <button onClick={() => handleEdit(category)} className="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400">
                                                                <Edit className="h-5 w-5" />
                                                            </button>
                                                            <button onClick={() => handleDelete(category)} className="text-red-600 hover:text-red-900 dark:hover:text-red-400">
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {categories.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                                        No test categories found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
