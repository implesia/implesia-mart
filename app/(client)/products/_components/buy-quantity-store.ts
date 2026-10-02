type Listener = () => void;

let quantity = 1;
const listeners = new Set<Listener>();

export function getBuyQuantity() {
  return quantity;
}

export function setBuyQuantity(next: number) {
  quantity = Math.min(5, Math.max(1, next));
  listeners.forEach((listener) => listener());
}

/** Reads the latest value, so repeated clicks each change the number. */
export function adjustBuyQuantity(delta: number) {
  setBuyQuantity(quantity + delta);
}

export function subscribeBuyQuantity(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
