"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  clearGuestCartToken,
  mergeGuestCart,
  readGuestCartToken,
  setCustomerCartAuthenticated,
} from "@/lib/mart-api/cart";
import {
  changeCustomerPassword,
  deleteCustomerAvatar,
  getCustomerSession,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  updateCustomerProfile,
  uploadCustomerAvatar,
  type CustomerProfile,
  type CustomerProfileUpdateInput,
  type CustomerRegisterInput,
} from "@/lib/mart-api/customer";

export type CustomerAuthContextValue = {
  customer: CustomerProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  cartSyncVersion: number;
  login: (identifier: string, password: string) => Promise<CustomerProfile>;
  register: (input: CustomerRegisterInput) => Promise<CustomerProfile>;
  logout: () => Promise<void>;
  updateProfile: (input: CustomerProfileUpdateInput) => Promise<CustomerProfile>;
  uploadAvatar: (file: File) => Promise<CustomerProfile>;
  deleteAvatar: () => Promise<CustomerProfile>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ message: string }>;
  refreshSession: () => Promise<void>;
};

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

export function useOptionalCustomerAuth(): CustomerAuthContextValue | null {
  return useContext(CustomerAuthContext);
}

export function useCustomerAuth(): CustomerAuthContextValue {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  }
  return context;
}

async function mergeGuestCartIfPresent(): Promise<void> {
  const guestToken = readGuestCartToken();
  if (!guestToken) return;
  try {
    await mergeGuestCart(guestToken);
    clearGuestCartToken();
  } catch {
    /* A transient merge error must not block customer sign-in or registration. */
  }
}

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cartSyncVersion, setCartSyncVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const session = await getCustomerSession();
        if (cancelled) return;
        if (session.authenticated && session.customer) {
          setCustomerCartAuthenticated(true);
          await mergeGuestCartIfPresent();
          if (cancelled) return;
          setCustomer(session.customer);
        } else {
          setCustomerCartAuthenticated(false);
          setCustomer(null);
        }
      } catch {
        if (cancelled) return;
        setCustomerCartAuthenticated(false);
        setCustomer(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const session = await getCustomerSession();
      if (session.authenticated && session.customer) {
        setCustomerCartAuthenticated(true);
        setCustomer(session.customer);
      } else {
        setCustomerCartAuthenticated(false);
        setCustomer(null);
      }
    } catch {
      setCustomerCartAuthenticated(false);
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const profile = await loginCustomer(identifier, password);
      setCustomerCartAuthenticated(true);
      await mergeGuestCartIfPresent();
      setCustomer(profile);
      setCartSyncVersion((version) => version + 1);
      return profile;
    },
    [],
  );

  const register = useCallback(
    async (input: CustomerRegisterInput) => {
      const profile = await registerCustomer(input);
      setCustomerCartAuthenticated(true);
      await mergeGuestCartIfPresent();
      setCustomer(profile);
      setCartSyncVersion((version) => version + 1);
      return profile;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await logoutCustomer();
    } finally {
      setCustomerCartAuthenticated(false);
      setCustomer(null);
      setCartSyncVersion((version) => version + 1);
    }
  }, []);

  const updateProfile = useCallback(
    async (input: CustomerProfileUpdateInput) => {
      const updated = await updateCustomerProfile(input);
      setCustomer(updated);
      return updated;
    },
    [],
  );

  const uploadAvatar = useCallback(async (file: File) => {
    const updated = await uploadCustomerAvatar(file);
    setCustomer(updated);
    return updated;
  }, []);

  const deleteAvatar = useCallback(async () => {
    const updated = await deleteCustomerAvatar();
    setCustomer(updated);
    return updated;
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      return changeCustomerPassword(currentPassword, newPassword);
    },
    [],
  );

  const value = useMemo<CustomerAuthContextValue>(
    () => ({
      customer,
      isAuthenticated: Boolean(customer),
      isLoading,
      cartSyncVersion,
      login,
      register,
      logout,
      updateProfile,
      uploadAvatar,
      deleteAvatar,
      changePassword,
      refreshSession,
    }),
    [
      customer,
      isLoading,
      cartSyncVersion,
      login,
      register,
      logout,
      updateProfile,
      uploadAvatar,
      deleteAvatar,
      changePassword,
      refreshSession,
    ],
  );

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}
