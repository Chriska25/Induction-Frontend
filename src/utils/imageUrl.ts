// Utility function to get full image URL
export const getImageUrl = (path: string | undefined): string => {
    if (!path) return '';

    // Si l'URL est déjà complète (commence par http:// ou https://)
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    // Si c'est un chemin relatif, ajouter l'URL du backend
    if (path.startsWith('/')) {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        return `${backendUrl}${path}`;
    }

    // Sinon retourner tel quel
    return path;
};
