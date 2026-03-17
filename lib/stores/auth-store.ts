import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'admin' | 'payroll-manager' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        // Mock authentication
        if (!email.includes('@') || password.length < 6) {
          throw new Error('Invalid email or password');
        }

        // Get existing users from localStorage
        const users = JSON.parse(localStorage.getItem('stellar_users') || '[]');
        const user = users.find((u: any) => u.email === email);

        if (!user) {
          throw new Error('User not found');
        }

        if (user.password !== password) {
          throw new Error('Invalid password');
        }

        set({
          user: { id: user.id, email: user.email, name: user.name, role: user.role, company: user.company },
          isAuthenticated: true,
        });
      },

      signup: async (email: string, password: string, name: string, role: UserRole) => {
        if (!email.includes('@') || password.length < 6 || name.length < 2) {
          throw new Error('Invalid input');
        }

        const users = JSON.parse(localStorage.getItem('stellar_users') || '[]');

        if (users.some((u: any) => u.email === email)) {
          throw new Error('User already exists');
        }

        const newUser = {
          id: `user_${Date.now()}`,
          email,
          password,
          name,
          role,
          company: `${name}'s Company`,
        };

        users.push(newUser);
        localStorage.setItem('stellar_users', JSON.stringify(users));

        set({
          user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role, company: newUser.company },
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'stellar_auth',
    }
  )
);
