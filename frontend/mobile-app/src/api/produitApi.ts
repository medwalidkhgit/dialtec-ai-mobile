import { apiClient } from './client';
import { ProduitResponse, PublicProduitResponse, PagedResponse } from '../types/produit';


export async function declencherGeneration(
    photoUrl: string,
    photoKey: string,
    audioUrl: string,
    audioKey: string
): Promise<string> {
    const response = await apiClient.post('/api/produits/me/generation', {
        photoUrl,
        photoKey,
        audioUrl,
        audioKey,
    });
    return response.data.data; // le generationId
}

export async function consulterGeneration(generationId: string): Promise<ProduitResponse> {
    const response = await apiClient.get(`/api/produits/me/generation/${generationId}`);
    return response.data.data;
}

export async function listerMonCatalogue(page = 0, size = 20): Promise<PagedResponse<ProduitResponse>> {
    const response = await apiClient.get('/api/produits/me', { params: { page, size } });
    return response.data.data;
}

export async function consulterMonProduit(produitId: string): Promise<ProduitResponse> {
    const response = await apiClient.get(`/api/produits/me/${produitId}`);
    return response.data.data;
}

export async function modifierProduit(
    produitId: string,
    payload: Partial<Pick<ProduitResponse, 'nom' | 'description' | 'categorie' | 'caracteristiques' | 'prix'>>
): Promise<ProduitResponse> {
    const response = await apiClient.put(`/api/produits/me/${produitId}`, payload);
    return response.data.data;
}

export async function validerProduit(produitId: string): Promise<ProduitResponse> {
    const response = await apiClient.patch(`/api/produits/me/${produitId}/valider`);
    return response.data.data;
}

export async function mettreAJourStock(
    produitId: string,
    quantite: number,
    seuilAlerte: number
): Promise<ProduitResponse> {
    const response = await apiClient.patch(`/api/produits/me/${produitId}/stock`, { quantite, seuilAlerte });
    return response.data.data;
}

export async function ajouterImage(produitId: string, imageUrl: string, imageKey: string): Promise<ProduitResponse> {
    const response = await apiClient.post(`/api/produits/me/${produitId}/images`, { imageUrl, imageKey });
    return response.data.data;
}

export async function supprimerImage(produitId: string, imageId: string): Promise<void> {
    await apiClient.delete(`/api/produits/me/${produitId}/images/${imageId}`);
}

export async function supprimerProduit(produitId: string): Promise<void> {
    await apiClient.delete(`/api/produits/me/${produitId}`);
}


export async function listerCataloguePublic(
    nom?: string,
    categorie?: string,
    page = 0,
    size = 20
): Promise<PagedResponse<PublicProduitResponse>> {
    const response = await apiClient.get('/api/produits/catalogue', { params: { nom, categorie, page, size } });
    return response.data.data;
}

export async function consulterProduitPublic(produitId: string): Promise<PublicProduitResponse> {
    const response = await apiClient.get(`/api/produits/catalogue/${produitId}`);
    return response.data.data;
}

export async function listerCatalogueParCommercant(
    commercantId: string,
    categorie?: string,
    page = 0,
    size = 20
): Promise<PagedResponse<PublicProduitResponse>> {
    const response = await apiClient.get(`/api/produits/catalogue/commercant/${commercantId}`, {
        params: { categorie, page, size },
    });
    return response.data.data;
}

export async function listerNouveautesDeMesFournisseurs(
    page = 0,
    size = 20
): Promise<PagedResponse<PublicProduitResponse>> {
    const response = await apiClient.get('/api/produits/catalogue/nouveautes', { params: { page, size } });
    return response.data.data;
}