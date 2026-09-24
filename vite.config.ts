import { defineConfig, loadEnv } from 'vite';
import createPlugins from './vite/plugins';
import autoprefixer from 'autoprefixer'; // css自动添加兼容性前缀

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    // 部署生产环境和开发环境下的URL。
    // 默认情况下，vite 会假设你的应用是被部署在一个域名的根路径上
    // 例如 https://www.ruoyi.vip/。如果应用被部署在一个子路径上，你就需要用这个选项指定这个子路径。例如，如果你的应用被部署在 https://www.ruoyi.vip/admin/，则设置 baseUrl 为 /admin/。
    base: env.VITE_APP_CONTEXT_PATH,
    resolve: {
      tsconfigPaths: true,
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
    },
    // https://cn.vitejs.dev/config/#resolve-extensions
    plugins: createPlugins(env, command === 'build'),
    build: {
      chunkSizeWarningLimit: 1500,
      rolldownOptions: {
        checks: {
          invalidAnnotation: false,
          pluginTimings: false
        }
      }
    },
    server: {
      host: '0.0.0.0',
      port: Number(env.VITE_APP_PORT),
      open: true,
      // FIX: 2026-09-22 Vite 8 的 Host 校验默认只放行 localhost 与 IP 字面量，用域名访问 dev server 会被
      // 403 拦掉（Blocked request. This host ("admin.g318.com") is not allowed.）。本机 hosts 把本地接管域名
      // admin.g318.com 指向 127.0.0.1，浏览器用该域名打开控制台时命中该拦截。解决方案：显式放行 .g318.com
      // 域族（前导点表示同时匹配该域及其子域），局域网 IP（192.168.1.67）本就属于放行范围。
      allowedHosts: ['.g318.com'],
      proxy: {
        // infra 管理面（/infra、/catalog）直连本地 go88-service-infra，去掉 /dev-api 前缀
        [env.VITE_APP_BASE_API + '/infra']: {
          target: 'http://127.0.0.1:9202',
          changeOrigin: true,
          rewrite: path => path.replace(new RegExp('^' + env.VITE_APP_BASE_API), '')
        },
        [env.VITE_APP_BASE_API + '/catalog']: {
          target: 'http://127.0.0.1:9202',
          changeOrigin: true,
          rewrite: path => path.replace(new RegExp('^' + env.VITE_APP_BASE_API), '')
        },
        // FIX: 2026-09-22 登录/系统接口改直连本地服务。原因：原「其余后台接口」指向 http://admin.g318.com，
        // 而本机 hosts 把 admin.g318.com 指回 127.0.0.1，dev server 等于代理回自身，Host 校验直接 403
        // （若放开 Host 校验则会变成无限回环）。本地起 Go88AuthApplication/Go88SystemApplication 后按前缀
        // 直连，口径与 infra 一致，只剥掉 /dev-api 前缀（go88-system 自身 context-path 已是 /system）。
        [env.VITE_APP_BASE_API + '/auth']: {
          target: 'http://127.0.0.1:9310',
          changeOrigin: true,
          rewrite: path => path.replace(new RegExp('^' + env.VITE_APP_BASE_API), '')
        },
        [env.VITE_APP_BASE_API + '/system']: {
          target: 'http://127.0.0.1:9201',
          changeOrigin: true,
          rewrite: path => path.replace(new RegExp('^' + env.VITE_APP_BASE_API), '')
        },
        // FIX: 2026-09-22 登录日志页面前端调 /monitor/loginInfo/**，而 go88-system 实际映射是 /logininfor/**，
        // 本地无网关做改写时会 404，故在 dev 代理层补一条别名（后端未加 /loginInfo 别名前，本地页面靠它可用）。
        [env.VITE_APP_BASE_API + '/monitor/loginInfo']: {
          target: 'http://127.0.0.1:9201',
          changeOrigin: true,
          rewrite: path => path.replace(new RegExp('^' + env.VITE_APP_BASE_API + '/monitor/loginInfo'), '/system/logininfor')
        },
        // 其余监控类接口走 /monitor/**（如 /monitor/operlog/**），而 go88-system 的 context-path 是 /system，
        // 故补一层 /monitor → /system
        [env.VITE_APP_BASE_API + '/monitor']: {
          target: 'http://127.0.0.1:9201',
          changeOrigin: true,
          rewrite: path => path.replace(new RegExp('^' + env.VITE_APP_BASE_API + '/monitor'), '/system')
        },
        // 兜底：其余后台接口落到本地 infra；如需 /resource（文件上传）、/tool（代码生成）等，请按上面形式补映射。
        // 切勿再指回 admin.g318.com：该域名在本机指向 127.0.0.1，会代理回本 dev server 自身。
        [env.VITE_APP_BASE_API]: {
          target: 'http://127.0.0.1:9202',
          changeOrigin: true,
          ws: true,
          rewrite: path => path.replace(new RegExp('^' + env.VITE_APP_BASE_API), '')
        }
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          // additionalData: '@use "@/assets/styles/variables.module.scss as *";'
          // javascriptEnabled: true
        }
      },
      postcss: {
        plugins: [
          // 浏览器兼容性
          autoprefixer(),
          {
            postcssPlugin: 'internal:charset-removal',
            AtRule: {
              charset: atRule => {
                atRule.remove();
              }
            }
          }
        ]
      }
    }
  };
});
