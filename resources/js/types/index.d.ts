export interface User {
    id: number;
    first_name: string;
    last_name: string;
    other_names?: string;
    title?: string;
    staff_no: string | null;
    role: string;
    department: string | null;
    email: string;
    email_verified_at?: string;
    sex?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    nationality?: string;
    marital_status?: string;
    employment_type?: string;
    position?: string;
    signature_path?: string;
    birth_date?: string;
    hired_date?: string;
    bank_name?: string;
    account_number?: string;
    is_active: boolean;
    is_super_admin: boolean;
    lab_id: number | null;
    lab?: {
        id: number;
        name: string;
        logo_url: string | null;
        subscription_status: 'pending' | 'active' | 'expired';
        expires_at: string | null;
    };
    labs?: Array<{
        id: number;
        name: string;
        pivot: {
            is_active: boolean;
        }
    }>;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    flash: {
        success: string | null;
        error: string | null;
        message: string | null;
    };
};
