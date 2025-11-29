// services/errorService.ts
export class AppError extends Error {
    constructor(
        message: string,
        public code?: string,
        public userFriendly?: string
    ) {
        super(message);
        this.name = 'AppError';
        this.userFriendly = userFriendly || message;
    }
}

export const ErrorCodes = {
    NETWORK_ERROR: 'NETWORK_ERROR',
    AUTH_FAILED: 'AUTH_FAILED',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
} as const;

export function handleError(error: any): string {
    console.error('Application Error:', error);

    if (error instanceof AppError) {
        return error.userFriendly || error.message;
    }

    // Firebase Auth Errors
    if (error.code) {
        switch (error.code) {
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/user-disabled':
                return 'This account has been disabled.';
            case 'auth/user-not-found':
                return 'No account found with this email.';
            case 'auth/wrong-password':
                return 'Incorrect password. Please try again.';
            case 'auth/email-already-in-use':
                return 'An account with this email already exists.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your connection.';
            case 'auth/too-many-requests':
                return 'Too many attempts. Please try again later.';
            case 'auth/invalid-verification-code':
                return 'Invalid verification code. Please try again.';
            case 'auth/invalid-phone-number':
                return 'Invalid phone number format.';
        }
    }

    // Generic error messages
    if (error.message) {
        return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
}