export type AuthStackParamList = {
    Login: undefined;
    RegisterChoice: undefined;
    RegisterCommercant: undefined;
    RegisterClient: undefined;
    OtpVerification: { email: string };
};

export type CommercantStackParamList = {
    CatalogueList: undefined;
    ProduitDetail: { produitId: string };
};

export type GenerationStackParamList = {
    GenerationCapture: undefined;
    ProduitDetail: { produitId: string };
};

export type ClientCatalogueStackParamList = {
    CatalogueList: undefined;
    ProduitDetailPublic: { produitId: string };
};

import { PublicCommercantResponse } from '../types/user';

export type FournisseursStackParamList = {
    FournisseursList: undefined;
    DecouvrirCommercants: undefined;
    CommercantCatalogue: { commercant: PublicCommercantResponse };
    ProduitDetailPublic: { produitId: string };
};

export type NouveautesStackParamList = {
    NouveautesList: undefined;
    ProduitDetailPublic: { produitId: string };
};

export type CommercantsStackParamList = {
    CommercantsListAdmin: undefined;
    CommercantDetailAdmin: { commercantId: string };
};

export type AdminCatalogueStackParamList = {
    CatalogueConsultation: undefined;
    ProduitDetailPublic: { produitId: string };
};