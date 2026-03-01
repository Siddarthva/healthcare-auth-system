import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,

            // Actions
            setLogin: (user, accessToken, refreshToken) =>
                set({ user, accessToken, refreshToken, isAuthenticated: true }),
            logout: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
            updateUser: (user) => set({ user }),
        }),
        {
            name: 'auth-storage', // key in localStorage
        }
    )
);

export default useAuthStore;
