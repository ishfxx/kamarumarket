// src/stores/userStore.ts
import { defineStore } from 'pinia';
import { supabase } from '@/supabase'; // Pastikan path ini benar

interface Store {
  id: string;
  store_name: string;
  store_description?: string;
  contact_whatsapp?: string;
  e_commerce_link?: string;
  user_id: string;
  created_at: string;
}

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as any | null, // Objek user dari Supabase Auth (auth.users)
    profile: null as any | null, // Data profil tambahan dari tabel 'users' Anda
    myStore: null as Store | null, // Data toko pengguna
    loading: false,
    error: null as string | null,
    allUsers: [] as any[], // State untuk menyimpan daftar semua user (untuk admin)
    userRoles: ['user', 'umkm', 'admin'] as string[], // Daftar role yang valid

    // NEW STATE: Untuk melacak waktu aktivitas sesi (untuk session timeout)
    lastActivityTime: null as number | null,
  }),
  actions: {
    // --- Store Actions ---
    setMyStore(store: Store | null) {
      this.myStore = store;
    },

    async fetchUserStore(userId: string) {
      this.loading = true; // Tambahkan loading untuk aksi ini
      this.error = null; // Reset error
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') { // PGRST116 berarti tidak ada data ditemukan
          console.error('UserStore: Gagal fetch user store:', error.message);
          this.setMyStore(null);
          this.error = 'Gagal memuat data toko: ' + error.message;
          return null;
        }

        this.setMyStore(data || null);
        return data;
      } catch (err: any) {
        console.error('UserStore: Unexpected error saat fetch store:', err.message);
        this.setMyStore(null);
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat memuat toko.';
        return null;
      } finally {
        this.loading = false; // Akhiri loading
      }
    },

    // --- Register Action ---
    async register(
      emailInput: string,
      passwordInput: string,
      usernameInput: string,
      firstNameInput: string,
      lastNameInput: string,
      phoneInput: string
    ) {
      this.loading = true;
      this.error = null;

      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: emailInput.trim(),
          password: passwordInput,
          options: {
            data: {
              username_display: usernameInput, // Simpan di metadata user auth
              first_name_display: firstNameInput,
              last_name_display: lastNameInput,
              phone_display: phoneInput,
            }
          }
        });

        if (authError) {
          console.error('UserStore: Supabase Auth register error:', authError.message);
          this.error = authError.message;
          return false;
        }

        // PENTING: Periksa apakah user langsung terautentikasi (email verification dinonaktifkan)
        if (authData.user) {
          this.user = authData.user;

          // Sekarang, segera buat profil di tabel 'users' Anda
          const { data: newProfile, error: createProfileError } = await supabase.from('users').insert({
            id: this.user.id,
            email: this.user.email,
            username: usernameInput, // Gunakan username langsung dari input
            first_name: firstNameInput,
            last_name: lastNameInput,
            phone: phoneInput,
            role: 'user', // Default role
          }).select().single();

          if (createProfileError) {
            console.error('UserStore: Error creating new profile during registration:', createProfileError.message);
            this.error = `Pendaftaran berhasil, tetapi gagal membuat data profil: ${createProfileError.message}.`;
            // Anda mungkin ingin menghapus user dari auth.users di sini jika pembuatan profil gagal
            // Atau biarkan saja dan minta admin menanganinya
            return false;
          }

          this.profile = newProfile;
          this.lastActivityTime = Date.now();
          localStorage.setItem('userProfile', JSON.stringify(this.profile));
          localStorage.setItem('userEmail', this.user.email || '');
          localStorage.setItem('lastActivityTime', String(this.lastActivityTime));

          // Jika pendaftaran langsung sukses dan profil dibuat, tidak perlu pesan verifikasi
          return true;

        } else {
          // Ini akan terjadi jika email verification masih aktif di Supabase
          // Anda bisa menghapus blok ini jika Anda yakin verifikasi email dinonaktifkan
          this.error = 'Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi sebelum login.';
          return true; // Sukses mengirim email verifikasi
        }

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
          // Cari email berdasarkan username di tabel 'users'
          // Cari email berdasarkan username di tabel 'users'
                // ATAU cari email berdasarkan phone di tabel 'users'
          const { data, error } = await supabase.from('users').select('email').or(`username.eq.${usernameOrEmailInput.trim()},phone.eq.${usernameOrEmailInput.trim()}`).single();
          if (error) {
            if (error.code === 'PGRST116') { // Tidak ditemukan
               this.error = 'Username atau password salah.';
            } else {
               this.error = 'Terjadi kesalahan saat mencari username.';
               console.error('UserStore: Error fetching email by username:', error.message);
            }
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

          // Coba ambil profil dari tabel 'users'
          let profileData = null;
          const { data: existingProfile, error: profileError } = await supabase.from('users').select('*').eq('id', this.user.id).single();

          if (profileError && profileError.code === 'PGRST116') { // Jika profil tidak ditemukan (PGRST116 = No rows found)
            console.log('UserStore: Profile not found, creating new profile for user ID:', this.user.id);
            // Ambil data dari user_metadata (yang disimpan saat signUp)
            const userMetadata = this.user.user_metadata;
            const { data: newProfile, error: createProfileError } = await supabase.from('users').insert({
              id: this.user.id,
              email: this.user.email,
              username: userMetadata?.username_display || '', // Ambil dari metadata
              first_name: userMetadata?.first_name_display || '',
              last_name: userMetadata?.last_name_display || '',
              role: 'user', // Default role for newly created user profiles
            }).select().single();

            if (createProfileError) {
              console.error('UserStore: Error creating new profile:', createProfileError.message);
              this.error = `Login berhasil, tetapi gagal membuat data profil: ${createProfileError.message}.`;
              this.profile = null;
              return false;
            }
            profileData = newProfile;
          } else if (profileError) {
            // Error lain saat fetching profil
            console.error('UserStore: Error fetching profile data:', profileError.message);
            this.error = `Login berhasil, tetapi gagal memuat data profil: ${profileError.message}.`;
            this.profile = null;
            return false;
          } else {
            // Profil ditemukan
            profileData = existingProfile;
          }

          this.profile = profileData;

          // NEW: Simpan timestamp login/aktivitas
          this.lastActivityTime = Date.now();
          localStorage.setItem('userProfile', JSON.stringify(this.profile));
          localStorage.setItem('userEmail', this.user.email || '');
          localStorage.setItem('lastActivityTime', String(this.lastActivityTime)); // Simpan timestamp

          // Fetch user store after successful login
          await this.fetchUserStore(this.user.id);

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

    async logout() {
      this.loading = true;
      try {
        const { error } = await supabase.auth.signOut();
        if (error) { console.error('UserStore: Supabase Auth logout error:', error.message); throw new Error(error.message); }
        this.user = null;
        this.profile = null;
        this.myStore = null; // Clear myStore on logout
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
          const ONE_MINUTE_MS = 300 * 1000; // 5 menit dalam milidetik

          if (storedLastActivityTime && (Date.now() - parseInt(storedLastActivityTime, 10) > ONE_MINUTE_MS)) {
            console.warn('UserStore: Session timed out due to inactivity. Forcing logout.');
            await this.logout(); // Paksa logout
            this.error = 'Sesi Anda telah berakhir karena tidak ada aktivitas. Silakan login kembali.';
            return false; // Indikasikan bahwa user tidak diinisialisasi karena timeout
          }

          this.user = user;
          const { data: profileData, error: profileError } = await supabase.from('users').select('*').eq('id', this.user.id).single();
          if (profileError) {
             console.error('UserStore: Error fetching profile during initialization:', profileError.message);
             // Ini bisa terjadi jika profil belum dibuat di tabel 'users'
             // Misalnya, setelah verifikasi email tapi belum pernah login dan profil belum disisipkan.
             // Di sini kita tidak membuat profil, hanya set null dan error.
             this.profile = null;
             this.error = 'Gagal memuat data profil. Mohon login ulang atau hubungi administrator.';
          }
          else {
            this.profile = profileData;
          }

          this.lastActivityTime = Date.now(); // Perbarui waktu aktivitas saat inisialisasi berhasil
          localStorage.setItem('lastActivityTime', String(this.lastActivityTime));

          localStorage.setItem('userProfile', JSON.stringify(this.profile));
          localStorage.setItem('userEmail', user.email || '');

          // Fetch user store during initialization
          await this.fetchUserStore(user.id);

        } else {
          this.user = null;
          this.profile = null;
          this.myStore = null; // Clear myStore if no user
          this.lastActivityTime = null; // Bersihkan jika tidak ada user
          localStorage.removeItem('userProfile');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('lastActivityTime');
        }


        return true; // Berhasil inisialisasi atau clear state
      } catch (error: any) {
        console.error('UserStore: Error initializing user:', error.message);
        this.user = null;
        this.profile = null;
        this.myStore = null;
        this.lastActivityTime = null;
        localStorage.removeItem('userProfile');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('lastActivityTime');
        this.error = error.message || 'Terjadi kesalahan saat inisialisasi pengguna.';
        return false;
      }
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
        // Jika peran pengguna yang sedang login diubah, perbarui juga profilnya
        if (this.user?.id === userId) {
            this.profile = data[0];
            localStorage.setItem('userProfile', JSON.stringify(this.profile));
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
        // Hapus entri dari tabel 'stores' yang terkait dengan pengguna ini terlebih dahulu (jika ada)
        const { error: storeDeleteError } = await supabase
          .from('stores')
          .delete()
          .eq('user_id', userId);

        if (storeDeleteError && storeDeleteError.code !== 'PGRST116') { // PGRST116: no rows found, which is fine
          console.error('UserStore: Error deleting user store:', storeDeleteError.message);
          this.error = 'Gagal menghapus toko pengguna: ' + storeDeleteError.message;
          return false;
        }

        // Hapus entri dari tabel 'products' yang dibuat oleh pengguna ini (jika ada)
        const { error: productDeleteError } = await supabase
          .from('products')
          .delete()
          .eq('created_by', userId);

        if (productDeleteError && productDeleteError.code !== 'PGRST116') {
          console.error('UserStore: Error deleting user products:', productDeleteError.message);
          this.error = 'Gagal menghapus produk pengguna: ' + productDeleteError.message;
          return false;
        }

        // Hapus entri dari tabel 'users' (profil)
        const { error: profileDeleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);

        if (profileDeleteError) {
          console.error('UserStore: Error deleting user profile from "users" table:', profileDeleteError.message);
          this.error = 'Gagal menghapus profil pengguna: ' + profileDeleteError.message;
          return false;
        }

        // Untuk menghapus pengguna dari `auth.users` Supabase, Anda memerlukan
        // fungsi Edge (backend) karena ini tidak dapat dilakukan dari sisi klien.
        // Contoh implementasi (jika Anda memiliki fungsi Edge):
        /*
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke('delete-auth-user', {
          body: { userId: userId },
          method: 'POST'
        });
        if (edgeError) {
          console.error('UserStore: Error deleting auth user via Edge Function:', edgeError.message);
          this.error = 'Gagal menghapus pengguna dari autentikasi: ' + edgeError.message;
          // Mungkin Anda ingin mengembalikan false di sini atau tetap melanjutkan
          // tergantung kebijakan penanganan kesalahan Anda.
        }
        */

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
      phone: string | null,
      profilePictureFile: File | null = null // Tambahkan parameter untuk file gambar
    ) {
      if (!this.user) {
        this.error = 'Anda tidak login.';
        return false;
      }

      this.loading = true;
      this.error = null;
      try {
        let profilePictureUrl: string | undefined;

        if (profilePictureFile) {
          const fileExtension = profilePictureFile.name.split('.').pop();
          // Pastikan nama file unik untuk mencegah konflik
          const fileName = `${this.user.id}-${Date.now()}.${fileExtension}`;
          const filePath = `avatars/${fileName}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('profile_pictures') // Ganti dengan nama bucket Anda
            .upload(filePath, profilePictureFile, {
              cacheControl: '3600',
              upsert: true, // Akan menimpa jika nama file sama, tapi dengan Date.now() seharusnya unik
            });

          if (uploadError) {
            console.error('UserStore: Error uploading profile picture:', uploadError.message);
            this.error = 'Gagal mengunggah gambar profil: ' + uploadError.message;
            return false;
          }

          const { data: publicUrlData } = supabase.storage
            .from('profile_pictures')
            .getPublicUrl(filePath);

          profilePictureUrl = publicUrlData.publicUrl;
        }

        const updateData: {
          first_name: string;
          last_name: string;
          username: string;
          phone: string | null;
          profile_picture?: string; // Opsional
        } = {
          first_name: firstName,
          last_name: lastName,
          username: username,
          phone: phone,
        };

        if (profilePictureUrl) {
          updateData.profile_picture = profilePictureUrl;
        }

        const { data, error } = await supabase
          .from('users')
          .update(updateData)
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
