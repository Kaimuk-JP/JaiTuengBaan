export const navigateTo = (path: string): void => {
    if (typeof window !== 'undefined') {
        window.location.href = path;
    }
};

export const navigateToProfileEditor = (): void => {
    navigateTo('/volunteer/profile-editor');
};

export const navigateToProfile = (): void => {
    navigateTo('/volunteer/profile');
};

export const navigateToWorkCalendar = (): void => {
    navigateTo('/volunteer/calendar');
};

export const navigateToWorkHistory = (): void => {
    navigateTo('/volunteer/work-history');
};
