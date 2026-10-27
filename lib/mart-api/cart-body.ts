export function cartItemBody(
  productId: string,
  quantity: number,
  selection: { groupId: string; valueId: string }[] = [],
  variantId?: string | null,
) {
  const body: Record<string, unknown> = {
    product_id: productId,
    quantity,
    selection: selection.map((choice) => ({
      group_id: choice.groupId,
      value_id: choice.valueId,
    })),
  };
  // The variant is an identifier. The API prices the line from its own variant row.
  if (variantId) body.variant_id = variantId;
  return body;
}
