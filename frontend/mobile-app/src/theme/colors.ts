/**
 * Palette OpenShelf.
 *
 * Règle importante sur l'orange : jamais en texte sur fond blanc/clair
 * (contraste insuffisant). Utilisation correcte : fond de bouton, avec
 * du texte NOIR à l'intérieur — jamais de texte orange.
 */
export const colors = {
    // Palette brute
    white: '#FFFFFF',
    black: '#000000',
    orange: '#FF6700',
    gold: '#FFC107',
    bleuNuit: '#090974',
    marine: '#17223A',

    // Usage sémantique — à utiliser dans les écrans plutôt que la palette brute
    background: '#FFFFFF',
    textPrimary: '#000000',
    primary: '#090974',       // boutons principaux, liens, éléments actifs
    accent: '#FF6700',        // fond de bouton uniquement
    accentText: '#000000',    // texte à utiliser À L'INTÉRIEUR d'un bouton orange
    surface: '#17223A',       // cartes/fonds sombres contrastés

    // Mode sombre — réservé aux 3 espaces connectés (commerçant/client/admin).
    // Le parcours d'authentification reste en mode clair, ne touche jamais
    // ces tokens.
    darkBackground: '#111111',
    darkSurface: '#1C1C1E',
    darkTextPrimary: '#FFFFFF',
    darkTextSecondary: '#A0A0A0',
    darkBorder: '#2C2C2E',
};