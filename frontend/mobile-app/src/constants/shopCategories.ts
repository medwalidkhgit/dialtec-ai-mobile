export type ShopCategory =
    | 'EPICERIE'
    | 'DROGUERIE'
    | 'QUINCAILLERIE'
    | 'BOULANGERIE_PATISSERIE'
    | 'BOUCHERIE'
    | 'PAPETERIE_LIBRAIRIE'
    | 'COSMETIQUE_PARFUMERIE'
    | 'VETEMENTS'
    | 'AUTRE';

export const SHOP_CATEGORY_LABELS: Record<ShopCategory, string> = {
    EPICERIE: 'Épicerie',
    DROGUERIE: 'Droguerie',
    QUINCAILLERIE: 'Quincaillerie',
    BOULANGERIE_PATISSERIE: 'Boulangerie / Pâtisserie',
    BOUCHERIE: 'Boucherie',
    PAPETERIE_LIBRAIRIE: 'Papeterie / Librairie',
    COSMETIQUE_PARFUMERIE: 'Cosmétique / Parfumerie',
    VETEMENTS: 'Vêtements',
    AUTRE: 'Autre',
};

export const SHOP_CATEGORIES: ShopCategory[] = Object.keys(SHOP_CATEGORY_LABELS) as ShopCategory[];