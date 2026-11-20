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
  changeCustomerPassword,
  getCustomerSession,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  updateCustomerProfile,
  type CustomerProfile,
  type CustomerProfileUpdateInput,
  type CustomerRegisterInput,
} from "@/lib/mart-api/customer";

export type CustomerAuthContextValue = {
  customer: CustomerProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<CustomerProfile>;
  register: (input: CustomerRegisterInput) => Promise<CustomerProfile>;
  logout: () => Promise<void>;
  updateProfile: (input: CustomerProfileUpdateInput) => Promise<CustomerProfile>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ message: string }>;
  refreshSession: () => Promise<void>;
};

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

export function useCustomerAuth(): CustomerAuthContextValue {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  }
  return context;
}

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getCustomerSession()
      .then((session) => {
        if (cancelled) return;
        if (session.authenticated && session.customer) {
          setCustomer(session.customer);
        } else {
          setCustomer(null);
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setCustomer(null);
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const session = await getCustomerSession();
      if (session.authenticated && session.customer) {
        setCustomer(session.customer);
      } else {
        setCustomer(null);
      }
    } catch {
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const profile = await loginCustomer(identifier, password);
      setCustomer(profile);
      return profile;
    },
    [],
  );

  const register = useCallback(
    async (input: CustomerRegisterInput) => {
      const profile = await registerCustomer(input);
      setCustomer(profile);
      return profile;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await logoutCustomer();
    } finally {
      setCustomer(null);
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
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      refreshSession,
    }),
    [customer, isLoading, login, register, logout, updateProfile, changePassword, refreshSession],
  );

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}
