/** Missing means visible. Existing saved records stay on the site until an admin turns them off. */
export function isContentActive(item: { isActive?: boolean }) {
  return item.isActive !== false;
}
