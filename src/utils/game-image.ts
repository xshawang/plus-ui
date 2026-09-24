import request from '@/utils/request';

/**
 * 游戏域图片预览工具。
 *
 * 背景：彩金池自定义底图 / 轮播背景图落在 go88-service-infra 的受保护路径
 * （/infra/game/file/**，Sa-Token 拦截，未登录 401），而 <img> 标签无法携带 token，
 * 因此预览改为「带 token 拉取 blob → 生成 objectURL」。
 * 生产建议：把图片上传切到 OSS/CDN（公共读），可直接用原始 URL，无需本工具。
 */

/** 相对 URL（/infra/...）补上 dev 代理前缀，绝对 URL 原样返回 */
export function resolveGameImageUrl(url?: string) {
  if (!url) return '';
  return url.startsWith('/infra') ? `${import.meta.env.VITE_APP_BASE_API}${url}` : url;
}

/** 带鉴权拉取图片并转成可直接渲染的 objectURL（失败返回空串，避免页面报错） */
export async function fetchGameImageObjectUrl(url?: string): Promise<string> {
  if (!url) return '';
  if (!url.startsWith('/infra')) return url;
  try {
    const blob: any = await request({
      url,
      method: 'get',
      responseType: 'blob',
      headers: { repeatSubmit: false }
    });
    const data = blob instanceof Blob ? blob : new Blob([blob]);
    return URL.createObjectURL(data);
  } catch {
    return '';
  }
}
