export type StatutFiche = 'EN_ATTENTE_VALIDATION' | 'VALIDEE';

export interface ProduitImage {
    id: string;
    imageUrl: string;
    estPrincipale: boolean;
}

/** Vue complète, réservée au commerçant propriétaire — inclut le stock. */
export interface ProduitResponse {
    id: string;
    nom: string;
    description: string;
    categorie: string;
    caracteristiques: string | null;
    prix: number | null;
    quantite: number;
    seuilAlerte: number;
    statut: StatutFiche;
    images?: ProduitImage[];
    generationId: string | null;
}

/** Vue publique, sans stock — celle que voient les clients. */
export interface PublicProduitResponse {
    id: string;
    commercantId: string;
    nom: string;
    description: string;
    categorie: string;
    caracteristiques: string | null;
    prix: number | null;
    images?: ProduitImage[];
}

export interface PagedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}