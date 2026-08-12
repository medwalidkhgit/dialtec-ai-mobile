import { ShopCategory } from '../constants/shopCategories';

export type AccountStatus = 'EN_ATTENTE_VERIFICATION' | 'ACTIF' | 'BLOQUE';

export interface CommercantProfileResponse {
    id: string;
    email: string;
    fullName: string;
    shopCategory: ShopCategory;
    phoneNumber: string;
    address: string;
    city: string;
    postalCode: string;
    description: string | null;
    accountStatus: AccountStatus;
}

export interface ClientProfileResponse {
    id: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    accountStatus: AccountStatus;
}

/** Vue légère d'un client, dans la liste d'un commerçant. */
export interface ClientResumeResponse {
    id: string;
    email: string;
    fullName: string;
    phoneNumber: string;
}

/** Vue publique d'un commerçant, sans email/statut de compte. */
export interface PublicCommercantResponse {
    id: string;
    fullName: string;
    shopCategory: ShopCategory;
    phoneNumber: string;
    address: string;
    city: string;
    postalCode: string;
    description: string | null;
}

export interface AdminStatsResponse {
    totalCommercants: number;
    totalClients: number;
    totalProduits: number;
    totalFichesGenerees: number;
}