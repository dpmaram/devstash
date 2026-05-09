export function shouldRequireProForItemType(
  typeSlug: string,
  isPro: boolean,
) {
  return (typeSlug === "file" || typeSlug === "image") && !isPro;
}
