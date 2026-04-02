import React from 'react';
import { Link } from '@inertiajs/react';

interface LinkProps {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationProps {
    links: LinkProps[];
}

export default function Pagination({ links }: PaginationProps) {
    if (!links || links.length <= 3) return null;


    return (
        <div className="flex flex-wrap mt-8 -mb-1">
            {links.map((link, key) => (
                link.url === null ? (
                    <div
                        key={key}
                        className="mr-1 mb-1 px-4 py-3 text-sm leading-4 text-gray-400 border rounded"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ) : (
                    <Link
                        key={key}
                        className={`mr-1 mb-1 px-4 py-3 text-sm leading-4 border rounded hover:bg-white focus:border-indigo-500 focus:text-indigo-500 transition-colors ${link.active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'}`}
                        href={link.url}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                )
            ))}
        </div>
    );
}
