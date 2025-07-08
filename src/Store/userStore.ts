// src/stores/userStore.ts
import { defineStore } from 'pinia';
import { supabase } from '@/supabase'; // Pastikan path ini benar

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as any | null, // Objek user dari Supabase Auth (auth.users)
    profile: null as any | null, // Data profil tambahan dari tabel 'users' Anda
    loading: false,
    error: null as string | null,
    allUsers: [] as any[], // State untuk menyimpan daftar semua user (untuk admin)
    userRoles: ['user', 'umkm', 'admin'] as string[], // Daftar role yang valid

    // NEW STATE: Untuk melacak waktu aktivitas sesi (untuk session timeout)
    lastActivityTime: null as number | null,
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
          this.lastActivityTime = Date.now(); // Set activity time on successful registration
          localStorage.setItem('lastActivityTime', String(this.lastActivityTime));
          return true;
        } else if (authData.user === null && authData.session === null) {
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
    async login(usernameOrEmailInput: string, passwordInput: string) {
      this.loading = true;
      this.error = null;
      try {
        let emailToAuthenticate: string | null = null;
        if (usernameOrEmailInput.includes('@')) {
          emailToAuthenticate = usernameOrEmailInput.trim();
        } else {
          const { data, error } = await supabase.from('users').select('email').eq('username', usernameOrEmailInput.trim()).single();
          if (error) { this.error = 'Username atau password salah.'; return false; }
          if (data && data.email) { emailToAuthenticate = data.email; } else { this.error = 'Username atau password salah.'; return false; }
        }
        if (!emailToAuthenticate) { this.error = 'Input login tidak valid.'; return false; }

        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: emailToAuthenticate,
          password: passwordInput,
        });

        if (authError) { console.error('UserStore: Supabase Auth login error:', authError.message); this.error = authError.message || 'Username atau password salah.'; return false; }

        if (data.user) {
          this.user = data.user;
          const { data: profileData, error: profileError } = await supabase.from('users').select('*').eq('id', this.user.id).single();

          if (profileError) { console.error('UserStore: Error fetching profile data:', profileError.message); this.error = `Login berhasil, tetapi gagal memuat data profil: ${profileError.message}.`; this.profile = null; }
          else { this.profile = profileData; }

          // NEW: Simpan timestamp login/aktivitas
          this.lastActivityTime = Date.now();
          localStorage.setItem('userProfile', JSON.stringify(this.profile));
          localStorage.setItem('userEmail', this.user.email || '');
          localStorage.setItem('lastActivityTime', String(this.lastActivityTime)); // Simpan timestamp

          return true;
        } else { console.warn('UserStore: No user data after signInWithPassword, but no explicit error.'); this.error = 'Login gagal: Respon tidak valid.'; return false; }
      } catch (err: any) { this.error = err.message || 'Terjadi kesalahan tidak terduga saat login.'; console.error('UserStore: Login error in catch block:', err.message); return false; }
      finally { this.loading = false; }
    },

    async logout() {
      this.loading = true;
      try {
        const { error } = await supabase.auth.signOut();
        if (error) { console.error('UserStore: Supabase Auth logout error:', error.message); throw new Error(error.message); }
        this.user = null;
        this.profile = null;
        this.lastActivityTime = null; // Bersihkan timestamp saat logout
        localStorage.removeItem('userProfile');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('lastActivityTime'); // Hapus timestamp dari localStorage
      } catch (err: any) { this.error = err.message || 'Terjadi kesalahan saat logout.'; console.error('UserStore: Logout error:', err.message); }
      finally { this.loading = false; }
    },

    async initializeUser() {
      this.loading = true;
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // NEW: Periksa waktu aktivitas yang tersimpan untuk re-login paksa
          const storedLastActivityTime = localStorage.getItem('lastActivityTime');
          const ONE_MINUTE_MS = 60 * 1000; // 1 menit dalam milidetik

          if (storedLastActivityTime && (Date.now() - parseInt(storedLastActivityTime, 10) > ONE_MINUTE_MS)) {
            await this.logout(); // Paksa logout
            return false; // Indikasikan bahwa user tidak diinisialisasi karena timeout
          }

          this.user = user;
          const { data: profileData, error: profileError } = await supabase.from('users').select('*').eq('id', this.user.id).single();
          if (profileError) { console.error('UserStore: Error fetching profile during initialization:', profileError.message); this.profile = null; }
          else { this.profile = profileData; }

          this.lastActivityTime = Date.now(); // Perbarui waktu aktivitas saat inisialisasi berhasil
          localStorage.setItem('lastActivityTime', String(this.lastActivityTime));

          localStorage.setItem('userProfile', JSON.stringify(this.profile));
          localStorage.setItem('userEmail', user.email || '');
        } else {
          this.user = null;
          this.profile = null;
          this.lastActivityTime = null; // Bersihkan jika tidak ada user
          localStorage.removeItem('userProfile');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('lastActivityTime');
        }
        return true; // Berhasil inisialisasi atau clear state
      } catch (error: any) { console.error('UserStore: Error initializing user:', error.message); this.user = null; this.profile = null; this.lastActivityTime = null; localStorage.removeItem('userProfile'); localStorage.removeItem('userEmail'); localStorage.removeItem('lastActivityTime'); return false; }
      finally { this.loading = false; }
    },

    // NEW ACTION: Aksi untuk memperbarui waktu aktivitas dari global listener
    updateActivity() {
      if (this.isLoggedIn) { // Hanya perbarui jika user sedang login
        this.lastActivityTime = Date.now();
        localStorage.setItem('lastActivityTime', String(this.lastActivityTime));
      }
    },

    // --- Fetch All Users (Admin Only) ---
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
        return true;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat memuat pengguna.';
        console.error('UserStore: Fetch all users error in catch block:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // --- Update User Role (Admin Only) ---
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

        const index = this.allUsers.findIndex(u => u.id === userId);
        if (index !== -1 && data && data.length > 0) {
          this.allUsers[index] = data[0];
        }
        return true;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat memperbarui peran.';
        console.error('UserStore: Update user role error in catch block:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // --- Delete User (Admin Only - Requires Backend/Edge Function for auth.users) ---
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
        return true;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat menghapus pengguna.';
        console.error('UserStore: Delete user error in catch block:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // --- Update User Profile (Self-Update for normal users) ---
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
          })
          .eq('id', this.user.id)
          .select();

        if (error) {
          console.error('UserStore: Error updating user profile:', error.message);
          this.error = 'Gagal memperbarui profil: ' + error.message;
          return false;
        }

        if (data && data.length > 0) {
          this.profile = data[0];
          localStorage.setItem('userProfile', JSON.stringify(this.profile));
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
    userProfilePicture: (state) => state.profile?.profile_picture || '/images/user/default-avatar.jpg',
  }
});
