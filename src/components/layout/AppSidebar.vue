<template>
  <aside
    :class="[
      'fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-99999 border-r border-gray-200',
      {
        'lg:w-[290px]': isExpanded || isMobileOpen || isHovered,
        'lg:w-[90px]': !isExpanded && !isHovered,
        'translate-x-0 w-[290px]': isMobileOpen,
        '-translate-x-full': !isMobileOpen,
        'lg:translate-x-0': true,
      },
    ]"
    @mouseenter="!isExpanded && (isHovered = true)"
    @mouseleave="isHovered = false"
  >
    <div
      :class="[
        'py-8 flex items-center',
        !isExpanded && !isHovered ? 'lg:justify-center' : 'justify-start',
      ]"
    >
      <router-link
        to="/"
        class="flex items-center gap-2"
      >
        <template v-if="!isMobileOpen">
          <img
            v-if="isExpanded || isHovered"
            class="dark:hidden"
            src="@/assets/images/kapas_madya.png"
            alt="Logo"
            width="100"
            height="40"
          />
          <img
            v-if="isExpanded || isHovered"
            class="hidden dark:block"
            src="@/assets/images/kapas_madya.png"
            alt="Logo"
            width="100"
            height="40"
          />
          <img
            v-else
            src="@/assets/images/kapas_madya.png"
            alt="Logo"
            width="32"
            height="32"
            class="mx-auto"
          />
        </template>

        <h2
          v-if=" (isExpanded || isHovered) && !isMobileOpen"
          class="text-2xl font-semibold text-gray-900 dark:text-white"
        >
          KAMARU
        </h2>
      </router-link>
    </div>
    <div
      class="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar"
    >
      <nav class="mb-6">
        <div class="flex flex-col gap-4">
          <div v-for="(menuGroup, groupIndex) in filteredMenuGroups" :key="groupIndex">
            <h2
              :class="[
                'mb-4 text-xs uppercase flex leading-[20px] text-gray-400',
                !isExpanded && !isHovered
                  ? 'lg:justify-center'
                  : 'justify-start',
              ]"
            >
              <template v-if="isExpanded || isHovered || isMobileOpen">
                {{ menuGroup.title }}
              </template>
              <HorizontalDots v-else />
            </h2>
            <ul class="flex flex-col gap-4">
              <li v-for="(item, index) in menuGroup.items" :key="item.name">
                <button
                  v-if="item.subItems"
                  @click="toggleSubmenu(groupIndex, index)"
                  :class="[
                    'menu-item group w-full',
                    {
                      // Menggunakan isSubmenuOpen untuk menentukan kelas active pada button induk
                      'menu-item-active': isSubmenuOpen(groupIndex, index),
                      'menu-item-inactive': !isSubmenuOpen(groupIndex, index),
                    },
                    !isExpanded && !isHovered
                      ? 'lg:justify-center'
                      : 'lg:justify-start',
                  ]"
                >
                  <span
                    :class="[
                      isSubmenuOpen(groupIndex, index)
                        ? 'menu-item-icon-active'
                        : 'menu-item-icon-inactive',
                    ]"
                  >
                    <component :is="item.icon" />
                  </span>
                  <span
                    v-if="isExpanded || isHovered || isMobileOpen"
                    class="menu-item-text"
                    >{{ item.name }}</span
                  >
                  <ChevronDownIcon
                    v-if="isExpanded || isHovered || isMobileOpen"
                    :class="[
                      'ml-auto w-5 h-5 transition-transform duration-200',
                      {
                        // Rotasi panah saat submenu terbuka atau parent active
                        'rotate-180 text-brand-500': isSubmenuOpen(groupIndex, index),
                      },
                    ]"
                  />
                </button>
                <router-link
                  v-else-if="item.path"
                  :to="item.path"
                  @click="handleTopLevelNavLinkClick"
                  :class="[
                    'menu-item group',
                    {
                      'menu-item-active': isActive(item.path),
                      'menu-item-inactive': !isActive(item.path),
                    },
                  ]"
                >
                  <span
                    :class="[
                      isActive(item.path)
                        ? 'menu-item-icon-active'
                        : 'menu-item-icon-inactive',
                    ]"
                  >
                    <component :is="item.icon" />
                  </span>
                  <span
                    v-if="isExpanded || isHovered || isMobileOpen"
                    class="menu-item-text"
                    >{{ item.name }}</span
                  >
                </router-link>
                <transition
                  @enter="startTransition"
                  @after-enter="endTransition"
                  @before-leave="startTransition"
                  @after-leave="endTransition"
                >
                  <div
                    v-show="
                      isSubmenuOpen(groupIndex, index) &&
                      (isExpanded || isHovered || isMobileOpen)
                    "
                  >
                    <ul class="mt-2 space-y-1 ml-9">
                      <li v-for="subItem in item.subItems" :key="subItem.name">
                        <router-link
                          :to="subItem.path"
                          :class="[
                            'menu-dropdown-item',
                            {
                              'menu-dropdown-item-active': isActive(
                                subItem.path
                              ),
                              'menu-dropdown-item-inactive': !isActive(
                                subItem.path
                              ),
                            },
                          ]"
                        >
                          {{ subItem.name }}
                          <span class="flex items-center gap-1 ml-auto">
                            <span
                              v-if="subItem.new"
                              :class="[
                                'menu-dropdown-badge',
                                {
                                  'menu-dropdown-badge-active': isActive(
                                    subItem.path
                                  ),
                                  'menu-dropdown-badge-inactive': !isActive(
                                    subItem.path
                                  ),
                                },
                              ]"
                            >
                              new
                            </span>
                            <span
                              v-if="subItem.pro"
                              :class="[
                                'menu-dropdown-badge',
                                {
                                  'menu-dropdown-badge-active': isActive(
                                    subItem.path
                                  ),
                                  'menu-dropdown-badge-inactive': !isActive(
                                    subItem.path
                                  ),
                                },
                              ]"
                            >
                              pro
                            </span>
                          </span>
                        </router-link>
                      </li>
                    </ul>
                  </div>
                </transition>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useUserStore } from '@/store/userStore';

import {
  GridIcon,
  UserCircleIcon,
  DocsIcon,
  PieChartIcon,
  ChevronDownIcon,
  HorizontalDots,
  SettingsIcon,
} from "../../icons";
import { useSidebar } from "@/composables/useSidebar";
import BoxCubeIcon from "@/icons/BoxCubeIcon.vue";

const route = useRoute();
const userStore = useUserStore();
const { isExpanded, isMobileOpen, isHovered, openSubmenu } = useSidebar();

onMounted(() => {
  // Inisialisasi userStore jika memang diperlukan di sini.
  // Tapi sebaiknya ini dilakukan di main.js atau komponen root.
});

const allMenuGroups = [
  {
    title: "Menu Utama",
    items: [
      { icon: GridIcon, name: "Dashboard", path: "/dashboard", roles: ['admin', 'user', 'umkm'] },
      {
        icon: DocsIcon,
        name: "Pembukuan",
        roles: ['umkm'],
        subItems: [
          { name: "Pemasukan", path: "/pemasukan", roles: ['umkm'] },
          { name: "Pengeluaran", path: "/pengeluaran", roles: ['umkm'] },
          { name: "Neraca Saldo", path: "/neracasaldo", roles: ['umkm'] },
        ],
      },
      {
        icon: PieChartIcon,
        name: "Laporan Keuangan",
        roles: ['umkm'],
        subItems: [
          { name: "Laba Rugi", path: "/labarugi", roles: ['umkm'] },
          { name: "Arus Kas", path: "/aruskas", roles: ['umkm'] },
        ],
      },
      {
        icon: BoxCubeIcon,
        name: "Market Place",
        roles: ['umkm'],
        subItems: [
          { name: "Produk Saya", path: "/produksaya", roles: ['umkm'] },
        ],
      },
    ],
  },
  // {
  //       icon: PieChartIcon,
  //       name: "Administrasi",
  //       roles: ['admin'],
  //       subItems: [
  //         { name: "Manajemen Pengguna", path: "/verifikasi", roles: ['admin'] },
  //         { name: "Arus Kas", path: "/review", roles: ['admin'] },
  //       ],
  //     },
  {
    title: "Administrasi",
    items: [
      {
        icon: DocsIcon,
        name: "Manajemen",
        roles: ['admin'],
        subItems: [
          { name: "Manajemen Pengguna", path: "/verifikasi", roles: ['admin'] },
          { name: "Manajemen Produk", path: "/review", roles: ['admin'] },
        ],
      },
    ]
  },
  {
    title: "Pengaturan ",
    items: [
      { icon: SettingsIcon, name: "Pengaturan Akun", path: "/profile", roles: ['admin', 'user', 'umkm'] },
    ]
  },
];

const filteredMenuGroups = computed(() => {
  const currentUserRole = userStore.getUserRole;

  // Jika currentUserRole belum ada, kembalikan array kosong untuk menghindari error
  if (!currentUserRole) {
    return [];
  }

  return allMenuGroups
    .map((group) => {
      const filteredItems = group.items.filter((item) => {
        const itemAllowedByRole = item.roles && item.roles.includes(currentUserRole);

        if (item.subItems) {
          const hasAllowedSubItem = item.subItems.some((subItem) =>
            subItem.roles && subItem.roles.includes(currentUserRole)
          );
          return itemAllowedByRole || hasAllowedSubItem;
        }
        return itemAllowedByRole;
      });

      const mappedItemsWithFilteredSubItems = filteredItems.map(item => {
        if (item.subItems) {
          return {
            ...item,
            subItems: item.subItems.filter(subItem =>
              subItem.roles && subItem.roles.includes(currentUserRole)
            )
          };
        }
        return item;
      });

      return {
        ...group,
        items: mappedItemsWithFilteredSubItems,
      };
    })
    .filter((group) => group.items.length > 0);
});

// isActive: Menentukan apakah rute saat ini persis cocok dengan path yang diberikan
const isActive = (path) => route.path === path;

const toggleSubmenu = (groupIndex, itemIndex) => {
  const currentGroup = filteredMenuGroups.value[groupIndex];
  if (!currentGroup || !currentGroup.items[itemIndex]) {
    return;
  }
  const key = `${groupIndex}-${itemIndex}`;
  openSubmenu.value = openSubmenu.value === key ? null : key;
};

// isSubmenuOpen: Menentukan apakah submenu harus terbuka
// Ini terjadi jika secara manual diklik ATAU jika salah satu sub-rutenya aktif
const isSubmenuOpen = (groupIndex, itemIndex) => {
  const key = `${groupIndex}-${itemIndex}`;
  const explicitlyOpen = openSubmenu.value === key;

  const currentItem = filteredMenuGroups.value[groupIndex]?.items[itemIndex];
  const isAnySubRouteActive = currentItem?.subItems?.some((subItem) =>
    isActive(subItem.path)
  );

  return explicitlyOpen || isAnySubRouteActive;
};

// Fungsi ini akan dipanggil saat mengklik link top-level (yang tidak memiliki sub-item)
const handleTopLevelNavLinkClick = () => {
  // Hanya tutup submenu jika kita tidak sedang berada di sub-item yang aktif
  // Ini penting agar submenu tidak langsung tertutup jika navigasi ke sub-item lain.
  let isCurrentRouteASubItem = false;
  filteredMenuGroups.value.forEach((group) => {
    group.items.forEach((item) => {
      if (item.subItems && item.subItems.some(sub => isActive(sub.path))) {
        isCurrentRouteASubItem = true;
      }
    });
  });

  if (!isCurrentRouteASubItem) {
    openSubmenu.value = null; // Tutup submenu apapun yang mungkin terbuka
  }
};

// Watch route changes to automatically open submenu if a subItem is active
watch(() => route.path, (newPath) => {
  let foundActiveSubItem = false;
  // Periksa apakah filteredMenuGroups.value sudah ada dan tidak kosong
  if (filteredMenuGroups.value && filteredMenuGroups.value.length > 0) {
    for (const group of filteredMenuGroups.value) {
      for (const item of group.items) {
        if (item.subItems && item.subItems.some(sub => newPath === sub.path)) {
          const groupIndex = filteredMenuGroups.value.indexOf(group);
          const itemIndex = group.items.indexOf(item);
          const key = `${groupIndex}-${itemIndex}`;
          if (openSubmenu.value !== key) {
            openSubmenu.value = key;
          }
          foundActiveSubItem = true;
          break; // Keluar dari loop item setelah menemukan sub-item aktif
        }
      }
      if (foundActiveSubItem) break; // Keluar dari loop group jika sudah ditemukan
    }
  }

  // Jika rute saat ini BUKAN bagian dari sub-item mana pun, tutup semua submenu.
  if (!foundActiveSubItem) {
    openSubmenu.value = null;
  }
}, { immediate: true }); // Run immediately on component mount

const startTransition = (el) => {
  el.style.height = "auto";
  const height = el.scrollHeight;
  el.style.height = "0px";
  el.offsetHeight; // force repaint
  el.style.height = height + "px";
};

const endTransition = (el) => {
  el.style.height = "";
};
</script>

<style scoped>
/* Anda mungkin memiliki style untuk .menu-item, .menu-dropdown-item, .menu-dropdown-badge dll. */
/* Pastikan style-style ini sesuai dengan desain Anda */

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px; /* gap-3 */
  padding: 10px 16px; /* px-4 py-2.5 */
  border-radius: 8px; /* rounded-lg */
  font-size: 14px; /* text-theme-sm */
  font-weight: 500; /* font-medium */
  transition: all 0.2s ease-in-out;
}

.menu-item-active {
  background-color: #047857; /* bg-emerald-700 */
  color: #fff; /* text-white */
}
.menu-item-inactive {
  color: #4b5563; /* text-gray-700 */
}
.dark .menu-item-inactive {
  color: #9ca3af; /* dark:text-gray-400 */
}

.menu-item-icon-active {
  color: #fff; /* text-white */
}
.menu-item-icon-inactive {
  color: #6b7280; /* text-gray-500 */
}
.dark .menu-item-icon-inactive {
  color: #9ca3af; /* dark:text-gray-400 */
}

.menu-item:hover {
  background-color: #059669; /* hover:bg-emerald-600 */
  color: #fff;
}
.dark .menu-item:hover {
  background-color: rgba(255, 255, 255, 0.05); /* dark:hover:bg-white/5 */
  color: #fff; /* dark:hover:text-gray-300 */
}

.menu-dropdown-item {
  display: flex;
  align-items: center;
  padding: 8px 16px; /* px-4 py-2 */
  border-radius: 8px; /* rounded-lg */
  font-size: 14px; /* text-theme-sm */
  font-weight: 500; /* font-medium */
  color: #4b5563; /* text-gray-700 */
  transition: all 0.2s ease-in-out;
}
.dark .menu-dropdown-item {
  color: #9ca3af; /* dark:text-gray-400 */
}

.menu-dropdown-item-active {
  background-color: #ecfdf5; /* bg-emerald-50 */
  color: #059669; /* text-emerald-600 */
}
.dark .menu-dropdown-item-active {
  background-color: #111827; /* dark:bg-gray-800 */
  color: #10b981; /* dark:text-emerald-500 */
}

.menu-dropdown-item:hover {
  background-color: #f3f4f6; /* hover:bg-gray-100 */
  color: #374151; /* hover:text-gray-700 */
}
.dark .menu-dropdown-item:hover {
  background-color: rgba(255, 255, 255, 0.05); /* dark:hover:bg-white/5 */
  color: #d1d5db; /* dark:hover:text-gray-300 */
}

.menu-dropdown-badge {
  padding: 2px 8px; /* px-2 py-0.5 */
  border-radius: 9999px; /* rounded-full */
  font-size: 12px; /* text-xs */
  font-weight: 500; /* font-medium */
}
.menu-dropdown-badge-active {
  background-color: #d1fae5; /* bg-emerald-100 */
  color: #059669; /* text-emerald-600 */
}
.dark .menu-dropdown-badge-active {
  background-color: #064e3b; /* dark:bg-emerald-900 */
  color: #34d399; /* dark:text-emerald-400 */
}

.menu-dropdown-badge-inactive {
  background-color: #e5e7eb; /* bg-gray-200 */
  color: #6b7280; /* text-gray-500 */
}
.dark .menu-dropdown-badge-inactive {
  background-color: #374151; /* dark:bg-gray-700 */
  color: #9ca3af; /* dark:text-gray-400 */
}
</style>
