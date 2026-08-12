export type Role = 'ROLE_CMT' | 'ROLE_CLIENT' | 'ROLE_ADMIN';

export interface AuthUser {
    id: string;
    email: string;
    role: Role;
}