import { RegistrationData } from '../types';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api';

export const api = {
    // Check backend health
    checkHealth: async () => {
        try {
            const response = await fetch(`${API_URL}/health`);
            return await response.json();
        } catch (error) {
            console.error('API Health Check Failed', error);
            return { status: 'ERROR' };
        }
    },

    // Verify email
    verifyEmail: async (token: string) => {
        const response = await fetch(`${API_URL}/verify-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Verification failed');
        }
        return data;
    },

    // Get all users (publicly visible info for login selection)
    getAllUsers: async () => {
        const response = await fetch(`${API_URL}/users`);
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        return await response.json();
    },

    getUser: async (id: string) => {
        const response = await fetch(`${API_URL}/users/${id}`);
        // Handle 404 specifically for logout logic in App.tsx
        if (response.status === 404) return null;

        if (!response.ok) {
            throw new Error('Failed to fetch user');
        }
        return await response.json();
    },

    // Create user
    createUser: async (user: Omit<RegistrationData, 'id' | 'registeredAt'> & { password?: string }) => {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to create user');
        }
        return await response.json();
    },

    // Update user profile
    updateUserProfile: async (userId: string, data: { fullName?: string, jobTitle?: string, organization?: string, city?: string, profilePhoto?: string, password?: string }) => {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to update profile');
        }
        return await response.json();
    },

    // Login user
    loginUser: async (credentials: { email: string, password?: string, userId?: string, fullName?: string }) => {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Login failed');
        }
        return await response.json();
    },

    // Save quiz/training result
    saveTraining: async (data: { userId: string, type: string, score: number, moduleId?: string | null }) => {
        const response = await fetch(`${API_URL}/trainings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to save training result');
        }

        return await response.json();
    },

    getUserTrainings: async (userId: string) => {
        const response = await fetch(`${API_URL}/trainings/user/${userId}`);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('getUserTrainings failed:', response.status, errorText);
            throw new Error(`Failed to fetch user trainings: ${response.status} ${errorText}`);
        }
        return await response.json();
    },

    // Upload image
    uploadImage: async (file: File, userId?: string) => {
        const formData = new FormData();
        formData.append('image', file);
        if (userId) {
            formData.append('userId', userId.toString());
        }

        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to upload image');
        }

        const result = await response.json();

        // Ajouter l'URL complète du backend si le path est relatif
        if (result.path && result.path.startsWith('/')) {
            const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            result.path = `${backendUrl}${result.path}`;
        }

        return result;
    },

    // Module Management
    getModules: async () => {
        const response = await fetch(`${API_URL}/modules`);
        if (!response.ok) {
            throw new Error('Failed to fetch modules');
        }
        return await response.json();
    },

    createModule: async (moduleData: any) => {
        const response = await fetch(`${API_URL}/modules`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(moduleData),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.details || errorData.error || 'Failed to create module');
        }
        return await response.json();
    },

    updateModule: async (id: string, moduleData: any) => {
        const response = await fetch(`${API_URL}/modules/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(moduleData),
        });
        if (!response.ok) {
            throw new Error('Failed to update module');
        }
        return await response.json();
    },

    deleteModule: async (id: string) => {
        const response = await fetch(`${API_URL}/modules/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete module');
        }
        return await response.json();
    },

    // Settings
    getSettings: async () => {
        const response = await fetch(`${API_URL}/settings`);
        if (!response.ok) {
            throw new Error('Failed to fetch settings');
        }
        return await response.json();
    },

    updateSettings: async (settings: any) => {
        const response = await fetch(`${API_URL}/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(settings),
        });
        if (!response.ok) {
            throw new Error('Failed to update settings');
        }
        return await response.json();
    },

    // Admin
    getAdminUsers: async () => {
        const response = await fetch(`${API_URL}/admin/users`);
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        return await response.json();
    },

    getAdminLogs: async () => {
        const response = await fetch(`${API_URL}/admin/logs`);
        if (!response.ok) {
            throw new Error('Failed to fetch logs');
        }
        return await response.json();
    },

    updateUserRole: async (userId: string, role: string) => {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role }),
        });
        if (!response.ok) {
            throw new Error('Failed to update role');
        }
        return await response.json();
    },

    resetUserPassword: async (userId: string, password: string) => {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password }),
        });
        if (!response.ok) {
            throw new Error('Failed to reset password');
        }
        return await response.json();
    },

    updateUserStatus: async (userId: string, active: boolean) => {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ active }),
        });
        if (!response.ok) {
            throw new Error('Failed to update status');
        }
        return await response.json();
    },

    deleteUser: async (userId: string) => {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete user');
        }
        return await response.json();
    }
};
