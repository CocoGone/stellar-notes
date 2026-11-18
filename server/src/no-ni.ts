// 倪师的说法不进 App（用户 2026-10-30 定）。引擎（上游 ziwei-doushu）的格局说明里夹着"倪师说「……」"，
// 给用户看之前整句去掉；格局出处（如"《紫微斗数全书·巨日同宫》"）在原书里核不到，统一标成传统说法。

export const PATTERN_SOURCE = '传统格局说法';

export function withoutNi(text: string): string {
  return text
    .split(/(?<=[。！？])/)
    .filter((t) => !/倪师|倪海厦|天纪/.test(t))
    .join('')
    .trim();
}
