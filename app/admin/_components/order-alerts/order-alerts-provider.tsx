"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  HEARTBEAT_MS,
  NEW_ORDER_SOUND_SRC,
  ORDER_ALERTS_CHANNEL,
  ORDER_ALERTS_LEADER_KEY,
  ORDER_ALERTS_SETTINGS_KEY,
  ORDER_ALERTS_STATE_KEY,
  alertPlan,
  announceNewOrders,
  applyPoll,
  claimOrders,
  electLeader,
  formatAlertTaka,
  formatTabTitle,
  loadAlertSettings,
  loadAlertSnapshot,
  markAllRead,
  orderAlertHref,
  pollDelayMs,
  readLeader,
  releaseLeader,
  rememberAlerted,
  saveAlertSettings,
  saveAlertSnapshot,
  shouldWatchOrders,
  unreadCount,
  type AlertSettings,
  type AlertSnapshot,
  type NewOrderNotice,
  type NotificationPermissionState,
} from "@/lib/admin/order-alerts";
import { OrderAlertsAuthError, fetchNewOrders, orderAlertsMode } from "@/lib/mart-api/order-alerts";
import { createDemoNewOrder, pushMockNewOrder, subscribeMockNewOrders } from "@/lib/mart-mock/order-alerts";
import { cn } from "@/lib/utils";

type OrderAlertsValue = {
  unread: number;
  unreadIds: string[];
  recent: NewOrderNotice[];
  settings: AlertSettings;
  permission: NotificationPermissionState;
  audioBlocked: boolean;
  markAllRead: () => void;
  setSoundEnabled: (on: boolean) => void;
  setVolume: (volume: number) => void;
  requestPermission: () => void;
  unlockAudio: () => void;
};

const OrderAlertsContext = createContext<OrderAlertsValue | null>(null);

export function useOrderAlerts() {
  const value = useContext(OrderAlertsContext);
  if (!value) {
    throw new Error("useOrderAlerts must be used inside <OrderAlertsProvider>.");
  }
  return value;
}

const SOUND_ELEMENT_ID = "new-order-alert-sound";

type ToastItem = { key: string; order: NewOrderNotice };

function readPermission(): NotificationPermissionState {
  if (typeof window === "undefined" || typeof Notification === "undefined") return "unsupported";
  const value = Notification.permission;
  if (value === "granted" || value === "denied" || value === "default") return value;
  return "unsupported";
}

function demoRequested() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("orderAlertDemo") === "1";
}

function tabId() {
  const key = "implesia.admin.order-alerts.tab";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.sessionStorage.setItem(key, id);
  return id;
}

function chimeElement() {
  const node = document.getElementById(SOUND_ELEMENT_ID);
  return node instanceof HTMLAudioElement ? node : null;
}

async function playChime(volume: number) {
  const audio = chimeElement();
  if (!audio) return false;
  audio.volume = Math.min(1, Math.max(0, volume));
  try {
    audio.currentTime = 0;
  } catch {
    /* The file may not be ready yet. play() still runs. */
  }
  try {
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

function showBrowserNotification(order: NewOrderNotice) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    const notification = new Notification(`New order ${order.number}`, {
      body: `${order.customerName} · ${formatAlertTaka(order.total)}`,
      tag: `implesia-order-${order.id}`,
      lang: "en",
    });
    notification.onclick = () => {
      window.focus();
      window.location.assign(orderAlertHref(order.id));
      notification.close();
    };
  } catch {
    /* The browser refused the notification. */
  }
}

let alertsChannel: BroadcastChannel | null | undefined;

function openAlertsChannel() {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!alertsChannel) alertsChannel = new BroadcastChannel(ORDER_ALERTS_CHANNEL);
  return alertsChannel;
}

function postAlertMessage(message: ChannelMessage) {
  openAlertsChannel()?.postMessage(message);
}

function closeAlertsChannel(channel: BroadcastChannel | null) {
  if (channel && alertsChannel === channel) {
    channel.close();
    alertsChannel = undefined;
  }
}

type ChannelMessage =
  | { type: "snapshot"; snapshot: AlertSnapshot }
  | { type: "settings"; settings: AlertSettings }
  | { type: "resign"; tabId: string };

  export function OrderAlertsProvider({ children }: { children: ReactNode }) {
    const [snapshot, setSnapshot] = useState<AlertSnapshot>(() =>
      typeof window === "undefined" ? { cursor: null, recent: [], unreadIds: [], alertedIds: [] } : loadAlertSnapshot(window.localStorage),
    );
    const [settings, setSettings] = useState<AlertSettings>(() =>
      typeof window === "undefined"
        ? { soundEnabled: true, volume: 0.8 }
        : loadAlertSettings(window.localStorage),
    );
    const [permission, setPermission] = useState<NotificationPermissionState>(readPermission);
    const [audioBlocked, setAudioBlocked] = useState(false);
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const [announcement, setAnnouncement] = useState("");
  
    const publishSnapshot = useCallback((next: AlertSnapshot) => {
      saveAlertSnapshot(window.localStorage, next);
      setSnapshot(next);
      postAlertMessage({ type: "snapshot", snapshot: next });
    }, []);
  
    const raiseAlerts = useCallback((orders: NewOrderNotice[]) => {
      if (orders.length === 0) return;
      const current = loadAlertSettings(window.localStorage);
      const plan = alertPlan({
        claimedIds: orders.map((order) => order.id),
        soundEnabled: current.soundEnabled,
        permission: readPermission(),
      });
      if (plan.sound) {
        void playChime(current.volume).then((ok) => {
          setAudioBlocked(!ok);
        });
      }
      if (plan.notification) {
        for (const order of orders) showBrowserNotification(order);
      }
      const items = orders.map((order) => ({ key: `${order.id}-${Date.now()}`, order }));
      setToasts((prev) => [...items, ...prev].slice(0, 4));
      setAnnouncement(announceNewOrders(orders));
      for (const item of items) {
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((toast) => toast.key !== item.key));
        }, 8000);
      }
    }, []);
  
    useEffect(() => {
      const count = unreadCount(snapshot);
      const apply = () => {
        const next = formatTabTitle(document.title, count);
        if (document.title !== next) document.title = next;
      };
      apply();
      const title = document.querySelector("title");
      if (!title) return;
      const observer = new MutationObserver(apply);
      observer.observe(title, { childList: true, subtree: true, characterData: true });
      return () => observer.disconnect();
    }, [snapshot]);
  
    useEffect(() => {
      const id = tabId();
      const stopped = { current: false };
      const failures = { current: 0 };
      const lastPollAt = { current: 0 };
      const force = { current: true };
      const inFlight = { current: false };
      const wasLeader = { current: false };
      let timer = 0;
  
      const channel = openAlertsChannel();
      let demoTimer = 0;
  
      function applyStoredSnapshot() {
        setSnapshot(loadAlertSnapshot(window.localStorage));
      }
  
      function applyStoredSettings() {
        setSettings(loadAlertSettings(window.localStorage));
      }
  
      if (channel) {
        channel.onmessage = (event: MessageEvent<ChannelMessage>) => {
          const data = event.data;
          if (!data || typeof data !== "object") return;
          if (data.type === "snapshot") {
            setSnapshot(data.snapshot);
          } else if (data.type === "settings") {
            setSettings(data.settings);
          } else if (data.type === "resign") {
            force.current = true;
            void tick();
          }
        };
      }
  
      function onStorage(event: StorageEvent) {
        if (event.key === ORDER_ALERTS_STATE_KEY) applyStoredSnapshot();
        if (event.key === ORDER_ALERTS_SETTINGS_KEY) applyStoredSettings();
        if (event.key === ORDER_ALERTS_LEADER_KEY && event.newValue == null) {
          force.current = true;
          void tick();
        }
      }
  
      async function ingest() {
        const page = await fetchNewOrders(loadAlertSnapshot(window.localStorage).cursor);
        if (stopped.current) return;
        const loaded = loadAlertSnapshot(window.localStorage);
        const applied = applyPoll(loaded, page);
        const claimedIds = claimOrders(
          window.localStorage,
          applied.fresh.map((order) => order.id),
          id,
        );
        const next: AlertSnapshot = {
          ...applied.snapshot,
          alertedIds: rememberAlerted(applied.snapshot.alertedIds, claimedIds),
        };
        saveAlertSnapshot(window.localStorage, next);
        setSnapshot(next);
        channel?.postMessage({ type: "snapshot", snapshot: next });
        failures.current = 0;
        const claimed = applied.fresh.filter((order) => claimedIds.includes(order.id));
        raiseAlerts(claimed);
      }
  
      async function tick() {
        if (stopped.current || !shouldWatchOrders(window.location.pathname)) return;
        const hidden = document.visibilityState === "hidden";
        const leader = electLeader(window.localStorage, id, Date.now(), hidden);
        if (leader && !wasLeader.current) force.current = true;
        wasLeader.current = leader;
        if (!leader || inFlight.current) return;
        const delay = pollDelayMs({ hidden, failures: failures.current });
        if (!force.current && Date.now() - lastPollAt.current < delay) return;
        force.current = false;
        inFlight.current = true;
        lastPollAt.current = Date.now();
        try {
          await ingest();
        } catch (error) {
          if (error instanceof OrderAlertsAuthError) {
            stopped.current = true;
            releaseLeader(window.localStorage, id);
            window.clearInterval(timer);
            return;
          }
          failures.current += 1;
        } finally {
          inFlight.current = false;
          if (force.current && !stopped.current) void tick();
        }
      }
  
      function onVisible() {
        if (document.visibilityState !== "visible") return;
        force.current = true;
        void tick();
      }
  
      window.addEventListener("storage", onStorage);
      document.addEventListener("visibilitychange", onVisible);
      const unsubscribe = subscribeMockNewOrders(() => {
        if (readLeader(window.localStorage)?.id === id) {
          force.current = true;
          void tick();
        }
      });
  
      function armDemo(attempt = 0) {
        demoTimer = window.setTimeout(() => {
          if (stopped.current || attempt > 8) return;
          const cursor = loadAlertSnapshot(window.localStorage).cursor;
          if (orderAlertsMode() !== "mock" || !cursor) {
            armDemo(attempt + 1);
            return;
          }
          const created = new Date(Date.parse(cursor) + 1000);
          pushMockNewOrder(createDemoNewOrder(created));
        }, 1200);
      }
  
      void tick().finally(() => {
        if (stopped.current || !demoRequested()) return;
        armDemo();
      });
  
      timer = window.setInterval(() => {
        void tick();
      }, HEARTBEAT_MS);
  
      return () => {
        stopped.current = true;
        window.clearInterval(timer);
        window.clearTimeout(demoTimer);
        releaseLeader(window.localStorage, id);
        channel?.postMessage({ type: "resign", tabId: id });
        closeAlertsChannel(channel);
        window.removeEventListener("storage", onStorage);
        document.removeEventListener("visibilitychange", onVisible);
        unsubscribe();
        document.title = formatTabTitle(document.title, 0);
      };
    }, [raiseAlerts]);
  
    const markRead = useCallback(() => {
      const next = markAllRead(loadAlertSnapshot(window.localStorage));
      publishSnapshot(next);
    }, [publishSnapshot]);
  
    const updateSettings = useCallback((next: AlertSettings) => {
      const saved = saveAlertSettings(window.localStorage, next);
      setSettings(saved);
      postAlertMessage({ type: "settings", settings: saved });
    }, []);
  
    const setSoundEnabled = useCallback(
      (on: boolean) => updateSettings({ ...loadAlertSettings(window.localStorage), soundEnabled: on }),
      [updateSettings],
    );
    const setVolume = useCallback(
      (volume: number) => updateSettings({ ...loadAlertSettings(window.localStorage), volume }),
      [updateSettings],
    );
  
    const requestPermission = useCallback(() => {
      if (typeof Notification === "undefined") {
        setPermission("unsupported");
        return;
      }
      void Notification.requestPermission()
        .then((result) => {
          if (result === "granted" || result === "denied" || result === "default") setPermission(result);
          else setPermission("unsupported");
        })
        .catch(() => setPermission(readPermission()));
    }, []);
  
    const unlockAudio = useCallback(() => {
      const current = loadAlertSettings(window.localStorage);
      void playChime(current.soundEnabled ? current.volume : 0).then((ok) => {
        setAudioBlocked(!ok);
      });
    }, []);
  
    const dismissToast = useCallback((key: string) => {
      setToasts((prev) => prev.filter((toast) => toast.key !== key));
    }, []);
  
    const value: OrderAlertsValue = {
      unread: unreadCount(snapshot),
      unreadIds: snapshot.unreadIds,
      recent: snapshot.recent,
      settings,
      permission,
      audioBlocked,
      markAllRead: markRead,
      setSoundEnabled,
      setVolume,
      requestPermission,
      unlockAudio,
    };
  
    return (
      <OrderAlertsContext.Provider value={value}>
        {children}
        <audio id={SOUND_ELEMENT_ID} src={NEW_ORDER_SOUND_SRC} preload="auto" className="hidden" />
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>
        
        {/* Premium Toasts Container */}
        <div className="force-light pointer-events-none fixed top-20 right-3 z-[100] flex w-[min(24rem,calc(100vw-1.5rem))] flex-col gap-2.5 sm:right-5">
          {toasts.map((toast) => (
            <div
              key={toast.key}
              className={cn(
                "pointer-events-auto group relative flex items-start gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white/95 p-4 shadow-xl shadow-slate-200/50 backdrop-blur-md",
                "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-4 motion-safe:duration-300",
              )}
            >
              {/* Left color indicator */}
              <div className="absolute bottom-0 left-0 top-0 w-1 bg-indigo-500" />
  
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2bc0b5] text-white ring-1 ring-inset ring-[#2bc0b5]">
                <MaterialIcon name="notifications" className="text-[20px]" />
              </div>
              
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  New Order
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                  #{toast.order.number}
                  <span className="text-[11px] font-medium text-slate-400">·</span>
                  <span className="text-sm font-bold text-emerald-600">{formatAlertTaka(toast.order.total)}</span>
                </p>
                <Link
                  href={orderAlertHref(toast.order.id)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-800 hover:underline"
                >
                  View Order
                  <MaterialIcon name="arrow_forward" className="text-[14px]" />
                </Link>
              </div>
              
              <button
                type="button"
                onClick={() => dismissToast(toast.key)}
                aria-label={`Dismiss order ${toast.order.number}`}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
              >
                <MaterialIcon name="close" className="text-[16px]" />
              </button>
            </div>
          ))}
        </div>
      </OrderAlertsContext.Provider>
    );
  }

  import { Bell, X, Volume2 } from "lucide-react";

  export function OrderAlertHint() {
    const { audioBlocked, settings, unlockAudio } = useOrderAlerts();
    
    if (!audioBlocked || !settings.soundEnabled) return null;
  
    return (
      <div className="flex justify-center px-4 pt-3">
        <div className="flex w-full max-w-2xl items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 shadow-sm sm:w-auto">
          
          {/* Left: Icon & Message */}
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700">
              <Bell className="h-4 w-4" />
            </div>
            <p className="text-xs font-medium text-amber-900 sm:text-sm">
              New order alerts are muted. Enable sound to hear notifications.
            </p>
          </div>
  
          {/* Right: Action & Dismiss */}
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={unlockAudio}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-amber-700 sm:px-3 sm:py-1.5 sm:text-xs"
            >
              <Volume2 className="h-3 w-3" />
              Enable
            </button>
            <button
              type="button"
              onClick={() => {
                // Optional: Add dismiss logic if needed. 
                // Since the component is driven by parent state, we can hide it by unlocking audio with volume 0 or asking for a dismiss prop.
                unlockAudio();
              }}
              aria-label="Dismiss"
              className="grid h-6 w-6 place-items-center rounded-md text-amber-600 transition hover:bg-amber-100 hover:text-amber-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }
