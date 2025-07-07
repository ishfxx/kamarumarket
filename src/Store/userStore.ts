// src/stores/userStore.ts
import { defineStore } from 'pinia';
import { supabase } from '@/supabase'; // Pastikan path ini benar

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as any | null, // Objek user dari Supabase Auth (auth.users)
    profile: null as any | null, // Data profil tambahan dari tabel 'users' Anda
    loading: false,
    error: null as string | null,
    allUsers: [] as any[], // State baru untuk menyimpan daftar semua user (untuk admin)
    userRoles: ['user', 'umkm', 'admin'] as string[], // Daftar role yang valid
  }),
  actions: {
    // --- Register Action ---
    async register(
      emailInput: string,
      passwordInput: string,
      usernameInput: string,
      firstNameInput: string,
      lastNameInput: string
    ) {
      this.loading = true;
      this.error = null;
      console.log('UserStore: Attempting to register new user with email:', emailInput);

      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: emailInput.trim(),
          password: passwordInput,
          options: {
            data: {
              username_display: usernameInput,
              first_name_display: firstNameInput,
              last_name_display: lastNameInput,
            }
          }
        });

        if (authError) {
          console.error('UserStore: Supabase Auth register error:', authError.message);
          this.error = authError.message;
          return false;
        }

        if (authData.user) {
          this.user = authData.user;
          console.log('UserStore: Supabase Auth signup successful. User ID:', this.user.id);

          const { data: profileData, error: profileError } = await supabase
            .from('users') // Menggunakan nama tabel 'users'
            .insert([
              {
                id: this.user.id,
                username: usernameInput,
                first_name: firstNameInput,
                last_name: lastNameInput,
                email: emailInput.trim(),
                role: 'user', // Default role for new registrations
                phone: null,
              }
            ])
            .select();

          if (profileError) {
            console.error('UserStore: Error saving profile data:', profileError.message);
            this.error = `Pendaftaran berhasil sebagian (akun dibuat), tetapi gagal menyimpan data profil: ${profileError.message}. Mohon hubungi administrator.`;
            return false;
          }

          this.profile = profileData ? profileData[0] : null;
          localStorage.setItem('userProfile', JSON.stringify(this.profile));
          localStorage.setItem('userEmail', emailInput.trim());

          console.log('UserStore: Profile saved successfully:', this.profile);
          return true;
        } else if (authData.user === null && authData.session === null) {
          console.log('UserStore: Signup successful, but verification email sent. User not yet active.');
          this.error = 'Pendaftaran berhasil! Silakan periksa email Anda untuk verifikasi dan aktivasi akun.';
          return true;
        }
        return false;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat pendaftaran.';
        console.error('UserStore: Register error in catch block:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // --- Login Action ---
    async login(usernameOrEmailInput: string, passwordInput: string) { // Diubah dari emailInput
      this.loading = true;
      this.error = null;
      console.log('UserStore: Attempting to log in with username/email:', usernameOrEmailInput);

      try {
        let emailToAuthenticate: string | null = null;

        if (usernameOrEmailInput.includes('@')) {
          emailToAuthenticate = usernameOrEmailInput.trim();
        } else {
          // --- SECURITY CONSIDERATION ---
          // This client-side lookup exposes the existence of usernames and emails
          // if your RLS policy for 'public.users' allows it.
          // For production, consider using a Supabase Edge Function with a service_role key
          // to perform this lookup securely on the server-side.
          const { data, error } = await supabase
            .from('users')
            .select('email')
            .eq('username', usernameOrEmailInput.trim())
            .single();

          if (error) {
            console.error('UserStore: Error fetching email by username:', error.message);
            this.error = 'Username atau password salah.';
            return false;
          }

          if (data && data.email) {
            emailToAuthenticate = data.email;
          } else {
            this.error = 'Username atau password salah.';
            return false;
          }
        }

        if (!emailToAuthenticate) {
          this.error = 'Input login tidak valid.';
          return false;
        }

        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: emailToAuthenticate,
          password: passwordInput,
        });

        if (authError) {
          console.error('UserStore: Supabase Auth login error:', authError.message);
          this.error = authError.message || 'Username atau password salah.';
          return false;
        }

        if (data.user) {
          this.user = data.user;
          console.log('UserStore: Supabase Auth login successful. User:', this.user);

          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', this.user.id)
            .single();

          if (profileError) {
            console.error('UserStore: Error fetching profile data:', profileError.message);
            this.error = `Login berhasil, tetapi gagal memuat data profil: ${profileError.message}.`;
            this.profile = null;
            // Penting: Jika profil tidak ditemukan, dan Anda masih ingin user dianggap login
            // (tapi dengan profil kosong), Anda bisa 'return true' di sini.
            // Namun, untuk halaman profil, userProfileData akan kosong.
          } else {
            this.profile = profileData;
          }
          localStorage.setItem('userProfile', JSON.stringify(this.profile));
          localStorage.setItem('userEmail', this.user.email || '');

          console.log('UserStore: Profile loaded:', this.profile);
          return true;
        } else {
          console.warn('UserStore: No user data after signInWithPassword, but no explicit error.');
          this.error = 'Login gagal: Respon tidak valid.';
          return false;
        }
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat login.';
        console.error('UserStore: Login error in catch block:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // --- Logout Action ---
    async logout() {
      console.log('UserStore: Logging out...');
      this.loading = true;
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('UserStore: Supabase Auth logout error:', error.message);
          throw new Error(error.message);
        }
        this.user = null;
        this.profile = null;
        localStorage.removeItem('userProfile');
        localStorage.removeItem('userEmail');
        console.log('UserStore: Logout successful.');
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan saat logout.';
        console.error('UserStore: Logout error:', err.message);
      } finally {
        this.loading = false;
      }
    },

    // --- Initialize User Action ---
    async initializeUser() {
      this.loading = true;
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          this.user = user;
          console.log('UserStore: Initialized from Supabase session. User:', user);

          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error('UserStore: Error fetching profile during initialization:', profileError.message);
            this.profile = null;
          } else {
            this.profile = profileData;
          }
          localStorage.setItem('userProfile', JSON.stringify(this.profile));
          localStorage.setItem('userEmail', user.email || '');
        } else {
          this.user = null;
          this.profile = null;
          localStorage.removeItem('userProfile');
          localStorage.removeItem('userEmail');
          console.log('UserStore: No active Supabase session, state cleared.');
        }
      } catch (error: any) {
        console.error('UserStore: Error initializing user:', error.message);
        this.user = null;
        this.profile = null;
        localStorage.removeItem('userProfile');
        localStorage.removeItem('userEmail');
      } finally {
        this.loading = false;
      }
    },

    // --- NEW ACTION: Fetch All Users (Admin Only) ---
    async fetchAllUsers() {
      if (this.profile?.role !== 'admin') {
        this.error = 'Anda tidak memiliki izin untuk melihat daftar pengguna.';
        console.warn('UserStore: Non-admin attempted to fetch all users.');
        return false;
      }

      this.loading = true;
      this.error = null;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, first_name, last_name, username, email, role, phone, created_at');

        if (error) {
          console.error('UserStore: Error fetching all users:', error.message);
          this.error = 'Gagal memuat daftar pengguna: ' + error.message;
          return false;
        }

        this.allUsers = data || [];
        console.log(`UserStore: Successfully fetched ${this.allUsers.length} users.`);
        return true;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat memuat pengguna.';
        console.error('UserStore: Fetch all users error in catch block:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // --- NEW ACTION: Update User Role (Admin Only) ---
    async updateUserRole(userId: string, newRole: string) {
      if (this.profile?.role !== 'admin') {
        this.error = 'Anda tidak memiliki izin untuk mengubah peran pengguna.';
        console.warn('UserStore: Non-admin attempted to update user role.');
        return false;
      }
      if (!this.userRoles.includes(newRole)) {
        this.error = 'Peran tidak valid.';
        console.warn(`UserStore: Attempted to set invalid role: ${newRole}`);
        return false;
      }

      this.loading = true;
      this.error = null;
      try {
        const { data, error } = await supabase
          .from('users')
          .update({ role: newRole })
          .eq('id', userId)
          .select();

        if (error) {
          console.error('UserStore: Error updating user role:', error.message);
          this.error = 'Gagal memperbarui peran pengguna: ' + error.message;
          return false;
        }

        // Perbarui allUsers array jika operasi berhasil
        const index = this.allUsers.findIndex(u => u.id === userId);
        if (index !== -1 && data && data.length > 0) {
          this.allUsers[index] = data[0];
        }
        console.log(`UserStore: User ${userId} role updated to ${newRole}.`);
        return true;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat memperbarui peran.';
        console.error('UserStore: Update user role error in catch block:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // --- NEW ACTION: Delete User (Admin Only - Requires Backend/Edge Function for auth.users) ---
    async deleteUser(userId: string) {
      if (this.profile?.role !== 'admin') {
        this.error = 'Anda tidak memiliki izin untuk menghapus pengguna.';
        console.warn('UserStore: Non-admin attempted to delete user.');
        return false;
      }
      if (this.user?.id === userId) {
        this.error = 'Anda tidak dapat menghapus akun Anda sendiri.';
        console.warn('UserStore: Admin attempted to delete self.');
        return false;
      }

      this.loading = true;
      this.error = null;
      try {
        const { error: profileDeleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);

        if (profileDeleteError) {
          console.error('UserStore: Error deleting user profile from "users" table:', profileDeleteError.message);
          this.error = 'Gagal menghapus profil pengguna: ' + profileDeleteError.message;
          return false;
        }

        this.allUsers = this.allUsers.filter(u => u.id !== userId);
        console.log(`UserStore: User profile ${userId} deleted from 'users' table.`);

        return true;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat menghapus pengguna.';
        console.error('UserStore: Delete user error in catch block:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // --- NEW ACTION: Update User Profile (Self-Update for normal users) ---
    async updateUserProfile(
      firstName: string,
      lastName: string,
      username: string,
      phone: string | null
    ) {
      if (!this.user) {
        this.error = 'Anda tidak login.';
        return false;
      }

      this.loading = true;
      this.error = null;
      try {
        const { data, error } = await supabase
          .from('users')
          .update({
            first_name: firstName,
            last_name: lastName,
            username: username,
            phone: phone,
            // Perbaikan: email dan role tidak diupdate di sini, mereka dikelola terpisah
          })
          .eq('id', this.user.id) // Crucial: ensure user can only update their OWN profile
          .select();

        if (error) {
          console.error('UserStore: Error updating user profile:', error.message);
          this.error = 'Gagal memperbarui profil: ' + error.message;
          return false;
        }

        if (data && data.length > 0) {
          this.profile = data[0];
          localStorage.setItem('userProfile', JSON.stringify(this.profile));
          console.log('UserStore: Profile updated successfully:', this.profile);
          return true;
        } else {
          this.error = 'Gagal memperbarui profil: Data tidak ditemukan setelah pembaruan.';
          return false;
        }
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat memperbarui profil.';
        console.error('UserStore: Update profile error in catch block:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },
  },
  getters: {
    isAdmin: (state) => state.profile?.role === 'admin',
    isLoggedIn: (state) => !!state.user,
    getUserRole: (state) => state.profile?.role,
    getUserEmail: (state) => state.user?.email,
    getUsername: (state) => state.profile?.username,
    getUserFullName: (state) => `${state.profile?.first_name || ''} ${state.profile?.last_name || ''}`.trim(),
    // userProfilePicture Getter (contoh, jika ada kolom 'profile_picture' di tabel 'users')
    userProfilePicture: (state) => state.profile?.profile_picture || '/images/user/default-avatar.jpg',
  }
});
