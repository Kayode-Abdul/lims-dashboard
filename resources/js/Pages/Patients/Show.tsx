import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Mail, Phone, MapPin, Calendar, Heart, Activity, User, ArrowLeft, Edit, FlaskConical, Clock, Eye, CheckCircle, Package } from 'lucide-react';

interface Patient {
    id: number;
    patient_id: string;
    patient_type: 'walk-in' | 'hmo' | 'referred';
    title?: string;
    first_name: string;
    last_name: string;
    other_names?: string;
    date_of_birth?: string;
    sex?: string;
    blood_group?: string;
    genotype?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    nationality?: string;
    occupation?: string;
    marital_status?: string;
    next_of_kin?: string;
    next_of_kin_phone?: string;
    height?: number;
    weight?: number;
    bmi?: number;
    is_active: boolean;
}

interface TestOrder {
    order_number: string;
    ordered_at: string;
    total_price: string;
    total_discount: string;
    total_paid: string;
    tests: string[];
    balance: number;
    status: 'pending' | 'collected' | 'processing' | 'completed';
}

export default function Show({ auth, patient, orders }: PageProps<{ patient: Patient, orders: TestOrder[] }>) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'collected': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'processing': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Patient Details: {patient.first_name} {patient.last_name}</h2>}
        >
            <Head title={`Patient - ${patient.first_name} ${patient.last_name}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    <div className="flex items-center justify-between">
                        <Link
                            href={route('patients.index')}
                            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to Register
                        </Link>
                        <Link
                            href={route('patients.edit', patient.id)}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:border-indigo-900 focus:ring ring-indigo-300 disabled:opacity-25 transition ease-in-out duration-150"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Record
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
                                        {patient.title} {patient.first_name} {patient.last_name}
                                    </h3>
                                    <div className="flex flex-col items-center gap-1 mt-2">
                                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{patient.patient_id}</p>
                                        <span className={`px-3 py-0.5 inline-flex text-xs font-semibold rounded-full border ${patient.patient_type === 'hmo' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' :
                                            patient.patient_type === 'referred' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
                                                'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                                            }`}>
                                            {patient.patient_type.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-start">
                                        <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Phone</p>
                                            <p className="text-sm text-gray-900 dark:text-gray-100">{patient.phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Email</p>
                                            <p className="text-sm text-gray-900 dark:text-gray-100">{patient.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Address</p>
                                            <p className="text-sm text-gray-900 dark:text-gray-100">{patient.address || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <h4 className="text-sm font-bold text-gray-500 uppercase mb-4">Vitals Summary</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                        <p className="text-xs text-gray-500">BMI</p>
                                        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{patient.bmi || '--'}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                        <p className="text-xs text-gray-500">Blood Group</p>
                                        <p className="text-lg font-bold text-red-600 dark:text-red-400">{patient.blood_group || '--'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Information */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Medical Record</h3>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                                        <div className="space-y-4">
                                            <h4 className="flex items-center text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                                                <Heart className="h-4 w-4 mr-2" /> Clinical Data
                                            </h4>
                                            <div>
                                                <p className="text-xs text-gray-500">Gender</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{patient.sex}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Date of Birth</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{patient.date_of_birth || 'Not recorded'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Genotype</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{patient.genotype || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="flex items-center text-sm font-bold text-green-600 dark:text-green-400 uppercase">
                                                <Activity className="h-4 w-4 mr-2" /> Background
                                            </h4>
                                            <div>
                                                <p className="text-xs text-gray-500">Occupation</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{patient.occupation || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Nationality</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{patient.nationality || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Marital Status</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{patient.marital_status || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 md:col-span-2 pt-4 border-t dark:border-gray-700">
                                            <h4 className="text-sm font-bold text-gray-500 uppercase">Emergency Contact / Next of Kin</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-gray-500">Name</p>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{patient.next_of_kin || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Phone</p>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{patient.next_of_kin_phone || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Test Order History Card */}
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                                        <Package className="h-5 w-5 mr-2 text-indigo-500" />
                                        Test Order History
                                    </h3>
                                    <Link href={route('test-orders.create', { patient_id: patient.id })}>
                                        <button className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md font-bold hover:bg-indigo-700 transition-colors">
                                            New Order
                                        </button>
                                    </Link>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Order #</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tests</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-right"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {orders.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 italic">
                                                        No test orders found for this patient.
                                                    </td>
                                                </tr>
                                            ) : (
                                                orders.map((order) => (
                                                    <tr key={order.order_number} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                                                                    {order.order_number}
                                                                </span>
                                                                <span className="text-[10px] text-gray-500 flex items-center mt-1">
                                                                    <Clock className="h-3 w-3 mr-1" />
                                                                    {new Date(order.ordered_at).toLocaleDateString('en-GB')}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-wrap gap-1">
                                                                {order.tests.slice(0, 2).map((test, i) => (
                                                                    <span key={i} className="text-[10px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-medium">
                                                                        {test}
                                                                    </span>
                                                                ))}
                                                                {order.tests.length > 2 && (
                                                                    <span className="text-[10px] text-gray-400 mt-0.5">+{order.tests.length - 2} more</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            <div className="font-bold text-gray-900 dark:text-gray-100">
                                                                ₦{(parseFloat(order.total_price) - parseFloat(order.total_discount)).toLocaleString()}
                                                            </div>
                                                            {order.balance > 0 && (
                                                                <div className="text-[10px] text-red-500 font-bold">Bal: ₦{order.balance.toLocaleString()}</div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 py-0.5 inline-flex text-[10px] leading-5 font-black rounded-full uppercase ${getStatusColor(order.status)}`}>
                                                                {order.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <Link
                                                                href={route('test-orders.show-batch', order.order_number.replace('/', '-'))}
                                                                className="text-gray-400 hover:text-indigo-600"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))
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
