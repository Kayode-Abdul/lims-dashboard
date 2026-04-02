import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps, User as UserType } from '@/types';
import { Mail, Phone, MapPin, Calendar, Briefcase, Shield, User, ArrowLeft, Edit, CreditCard, Building } from 'lucide-react';

export default function Show({ auth, user }: PageProps<{ user: UserType }>) {
    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Staff Profile: {user.first_name} {user.last_name}</h2>}
        >
            <Head title={`Staff - ${user.first_name} ${user.last_name}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    <div className="flex items-center justify-between">
                        <Link
                            href={route('staff.index')}
                            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to Register
                        </Link>
                        <Link
                            href={route('staff.index', { search: user.staff_no })}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:border-indigo-900 focus:ring ring-indigo-300 disabled:opacity-25 transition ease-in-out duration-150"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Profile Summary Card */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <div className="text-center mb-6">
                                    <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 mb-4">
                                        <User className="h-12 w-12" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                        {user.title} {user.first_name} {user.last_name}
                                    </h3>
                                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{user.staff_no}</p>
                                    <div className="mt-2">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-4 pt-4 border-t dark:border-gray-700">
                                    <div className="flex items-start">
                                        <Shield className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold">Role</p>
                                            <p className="text-sm text-indigo-600 dark:text-indigo-400 font-bold uppercase">{user.role?.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <Building className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold">Department</p>
                                            <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">{user.department || 'Administration'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <h4 className="flex items-center text-sm font-bold text-gray-500 uppercase mb-4">
                                    <Phone className="h-4 w-4 mr-2" /> Contact Info
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Official Email</p>
                                        <p className="text-sm text-gray-900 dark:text-gray-100">{user.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Phone Number</p>
                                        <p className="text-sm text-gray-900 dark:text-gray-100">{user.phone || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Information */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Employment Details</h3>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                                        <div className="space-y-4">
                                            <h4 className="flex items-center text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                                                <Briefcase className="h-4 w-4 mr-2" /> Position Info
                                            </h4>
                                            <div>
                                                <p className="text-xs text-gray-500">Employment Type</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.employment_type || 'Full-time'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Designation</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.position || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Hired Date</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.hired_date || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="flex items-center text-sm font-bold text-green-600 dark:text-green-400 uppercase">
                                                <CreditCard className="h-4 w-4 mr-2" /> Financial Data
                                            </h4>
                                            <div>
                                                <p className="text-xs text-gray-500">Bank Name</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.bank_name || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Account Number</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 font-mono italic">{user.account_number || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 pt-6 border-t dark:border-gray-700">
                                            <h4 className="flex items-center text-sm font-bold text-gray-500 uppercase mb-4">
                                                <MapPin className="h-4 w-4 mr-2" /> Address Information
                                            </h4>
                                            <p className="text-sm text-gray-900 dark:text-gray-100">
                                                {user.address || 'No address recorded.'}
                                                {user.city && `, ${user.city}`}
                                                {user.state && `, ${user.state}`}
                                                {user.nationality && `, ${user.nationality}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
