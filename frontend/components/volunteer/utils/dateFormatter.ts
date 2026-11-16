export const formatThaiDate = (dateString: string | null | undefined): string => {
    if (!dateString || isNaN(new Date(dateString).getTime())) {
        return '';
    }

    const dateObj = new Date(dateString);
    const thaiDate = dateObj.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    return thaiDate;
};

export const formatDisplayDate = (dateString: string | null | undefined): string => {
    if (!dateString || isNaN(new Date(dateString).getTime())) {
        return '';
    }

    const dateObj = new Date(dateString);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();

    return `${day}/${month}/${year}`;
};
