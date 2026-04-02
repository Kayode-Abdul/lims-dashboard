import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
    message: string | null;
    type?: 'success' | 'error' | 'info';
    duration?: number;
    onClose: () => void;
}

export default function Toast({ message, type = 'success', duration = 5000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(onClose, 300); // Wait for transition
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [message, duration, onClose]);

    if (!message) return null;

    const icons = {
        success: <CheckCircle className="h-5 w-5 text-green-500" />,
        error: <XCircle className="h-5 w-5 text-red-500" />,
        info: <AlertCircle className="h-5 w-5 text-blue-500" />,
    };

    const bgColors = {
        success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    };

    return (
        <div
            className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg border shadow-lg transition-all duration-300 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'
                } ${bgColors[type]}`}
        >
            <div className="flex-shrink-0">
                {icons[type]}
            </div>
            <div className="ml-3 mr-8 text-sm font-medium text-gray-800 dark:text-gray-200">
                {message}
            </div>
            <button
                onClick={() => {
                    setIsVisible(false);
                    setTimeout(onClose, 300);
                }}
                className="ml-auto -mx-1.5 -my-1.5 p-1.5 inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
