export default defineNuxtConfig({
  compatibilityDate: '2026-06-12',
  devtools: { enabled: false },
  ssr: true,
  app: {
    // GitHub Pages 部署在子路径 /custom-fighter/ 下，由 CI 通过 NUXT_APP_BASE_URL 注入；
    // 本地开发不设该环境变量时回退到根路径 '/'
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      title: '自由格斗 · Custom Fighter',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
  // 静态生成：预渲染首页，产出纯静态站点到 .output/public，供 GitHub Pages 托管
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/'],
    },
  },
})
