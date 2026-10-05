export function cartItemBody(
  productId: string,
  quantity: number,
  selection: { groupId: string; valueId: string }[] = [],
) {
  return {
    product_id: productId,
    quantity,
    selection: selection.map((choice) => ({
      group_id: choice.groupId,
      value_id: choice.valueId,
    })),
  };
}
