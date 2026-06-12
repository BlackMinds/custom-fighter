export default defineNuxtConfig({
  compatibilityDate: '2026-06-12',
  devtools: { enabled: false },
  ssr: true,
  app: {
    head: {
      title: '自由格斗 · Custom Fighter',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
})
