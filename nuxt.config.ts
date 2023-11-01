const isDev = process.env.NODE_ENV === 'development'
// const allowedOrigins = ['https://jkt48-showroom.vercel.app']
const allowedOrigins = '*'
export default defineNuxtConfig({
  routeRules: {
    // '/api/showroom/**': { cache: !isDev ? { maxAge: 3600, staleMaxAge: 360 } : false },
    '/api/**': {
      security: {
        rateLimiter: {
          tokensPerInterval: 120,
          interval: 60000,
        },
      },
    },
    '/api/showroom/members': { cache: !isDev ? { maxAge: 21600, staleMaxAge: 1800 } : false },
    '/api/showroom/recent': {
      cache: !isDev ? { maxAge: 1, staleMaxAge: 0 } : false,
      security: {
        rateLimiter: {
          tokensPerInterval: 80,
          interval: 60000,
        },
      },
    },
    '/api/showroom/recent/**': { cache: !isDev ? { maxAge: 600, staleMaxAge: 10 } : false },
    '/api/member/birthday': { cache: !isDev ? { maxAge: 3600, staleMaxAge: 0 } : false },
    '/api/showroom/records': { cache: !isDev ? { maxAge: 1800, staleMaxAge: 0 } : false },
    '/api/showroom/polling': { cache: false },
    '/api/showroom/comment': {
      cache: false,
      security: {
        rateLimiter: {
          tokensPerInterval: 30,
          interval: 'minute',
        },
      },
    },
    '/api/jpn_rates': { cache: !isDev ? { maxAge: 86400, staleMaxAge: 0 } : false },
    '/img/**': { cache: !isDev ? { maxAge: 86400, staleMaxAge: 3600 } : false },
    '/svg/**': { cache: !isDev ? { maxAge: 86400, staleMaxAge: 3600 } : false },
    '/api/auth/callback/credentials': {
      security: {
        rateLimiter: {
          tokensPerInterval: 15,
          interval: 'minute',
        },
      },
    },
  },
  runtimeConfig: {
    admin_ids: (process.env.DISCORD_ADMINS ?? '').trim().split(',').map(i => i.trim()) || [],
    public: {
      isDev,
    },
  },
  // pwa: {
  //   registerType: 'autoUpdate',
  //   manifest: {
  //     name: 'JKT48 Showroom',
  //     short_name: 'JKT48 Showroom',
  //     description: 'Fanmade JKT48 Showroom Log',
  //     orientation: 'portrait',
  //     start_url: '/',
  //     icons: [
  //       {
  //         src: 'img/192x192-logo.png',
  //         sizes: '192x192',
  //         type: 'image/png',
  //       },
  //       {
  //         src: 'img/512x512-logo.png',
  //         sizes: '512x512',
  //         type: 'image/png',
  //       },
  //       {
  //         src: 'img/512x512-masklogo.png',
  //         sizes: '512x512',
  //         type: 'image/png',
  //         purpose: 'maskable',
  //       },
  //     ],
  //   },
  //   workbox: {
  //     navigateFallback: undefined,
  //     globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
  //   },
  //   client: {
  //     installPrompt: true,
  //     periodicSyncForUpdates: 3600,
  //   },
  //   devOptions: {
  //     enabled: isDev,
  //     suppressWarnings: true,
  //     navigateFallbackAllowlist: [/^\/$/],
  //     type: 'module',
  //   },
  // },
  modules: [
    'nuxt-security',
    'dayjs-nuxt',
    '@sidebase/nuxt-auth',
    '@nuxtjs/i18n',
    '@nuxtjs/tailwindcss',
  ],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  security: {
    headers: false,
    csrf: false,
    corsHandler: {
      origin: allowedOrigins,
      methods: '*',
      credentials: true,
    },
    xssValidator: false,
    rateLimiter: {
      tokensPerInterval: 80,
      interval: 60000,
      throwError: true,
      headers: true,
    },
    requestSizeLimiter: {
      maxRequestSizeInBytes: 15000000,
      maxUploadFileRequestInBytes: 30000000,
    },
  },
  dayjs: {
    locales: ['en', 'id'],
    plugins: ['relativeTime', 'utc', 'timezone', 'duration', 'localeData', 'localizedFormat', 'customParseFormat', 'isToday'],
    defaultLocale: 'en',
    defaultTimezone: 'Asia/Jakarta',
  },
  i18n: {
    // baseUrl: process.env.BASE_URL,
    strategy: 'no_prefix',
    locales: [
      { code: 'en', iso: 'en-US', file: 'en.yaml', dir: 'ltr', name: 'EN' },
      { code: 'id', iso: 'id-ID', file: 'id.yaml', dir: 'ltr', name: 'ID' },
    ],
    langDir: 'locales',
    lazy: true,
    defaultLocale: 'en',
  },
  typescript: {
    shim: false,
    strict: true,
    tsConfig: {
      compilerOptions: {
        moduleResolution: 'bundler',
      },
    },
  },
  build: {
    transpile: ['@vuepic/vue-datepicker'],
  },
  nitro: {
    compressPublicAssets: true,
  },
  // devtools: {
  //   enabled: true,
  //   timeline: {
  //     enabled: true,
  //   },
  // },
})
