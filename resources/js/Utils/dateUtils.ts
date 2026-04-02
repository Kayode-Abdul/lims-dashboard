export const formatDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
};

export const formatDateTime = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    const datePart = formatDate(date);
    const timePart = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return `${datePart} ${timePart}`;
};
