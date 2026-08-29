"use client";

import { useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { BrokerConnectionsCard } from "@/components/dashboard/AccountCards";
import { useAuth } from "@/context/AuthContext";
import { ThemeSettings, useTheme } from "@/context/ThemeContext";
import {
  Bell,
  Check,
  ChevronRight,
  CircleHelp,
  Lock,
  Palette,
  Save,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  User,
  Wallet,
  X,
  RotateCcw,
} from "lucide-react";

type Section =
  | "profile"
  | "trading"
  | "notifications"
  | "friday"
  | "appearance"
  | "security"
  | "account";

const sections: {
  id: Section;
  label: string;
  description: string;
  icon: typeof User;
}[] = [
  {
    id: "profile",
    label: "Profile",
    description: "Personal information",
    icon: User,
  },
  {
    id: "trading",
    label: "Trading",
    description: "Order preferences",
    icon: Wallet,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Alerts & updates",
    icon: Bell,
  },
  {
    id: "friday",
    label: "AHNA AI",
    description: "AI assistant",
    icon: Sparkles,
  },
  {
    id: "appearance",
    label: "Appearance",
    description: "Interface preferences",
    icon: Palette,
  },
  {
    id: "security",
    label: "Security",
    description: "Password & sessions",
    icon: Lock,
  },
  {
    id: "account",
    label: "Account",
    description: "Subscription & account",
    icon: SlidersHorizontal,
  },
];

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={enabled}
      className={[
        "relative h-6 w-11 rounded-full transition-all duration-200",
        enabled ? "bg-[#2F78B7]" : "bg-[#D5D6CC]",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
          enabled ? "left-6" : "left-1",
        ].join(" ")}
      />
    </button>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[#ECECE4] py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-xs font-extrabold text-[#292923]">{title}</div>
        <div className="mt-1 max-w-[600px] text-[12px] leading-4 text-[#8A897F]">
          {description}
        </div>
      </div>

      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 min-w-[150px] rounded-lg border border-[#E3E2D9] bg-[#FAFAF7] px-3 text-[12px] font-bold text-[#34342F] outline-none transition-colors focus:border-[#8FB49B]"
    >
      {children}
    </select>
  );
}

function SettingsContent() {
  const { user } = useAuth();
  const { change: changeTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<Section>("profile");
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    firstName: user?.display_name?.split(" ")[0] ?? "",
    lastName: user?.display_name?.split(" ").slice(1).join(" ") ?? "",
    email: user?.email ?? "",
    timezone: "Asia/Kolkata",
  });

  const [trading, setTrading] = useState({
    orderType: "Market",
    confirmation: true,
    slippage: "0.50%",
    sizing: "Risk based",
  });

  const [notifications, setNotifications] = useState({
    priceAlerts: true,
    riskAlerts: true,
    fridayAlerts: true,
    portfolioUpdates: true,
    email: false,
  });

  const [friday, setAHNA] = useState({
    enabled: true,
    sidebar: true,
    marketInsights: true,
    riskInsights: true,
    tradeAlerts: true,
  });

  const [appearance, setAppearance] = useState({
    theme: "System",
    density: "Comfortable",
    animations: true,
  });

  function handleSave() {
    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2200);
  }

  function handleReset() {
    changeTheme("system");
    setProfile({
      firstName: user?.display_name?.split(" ")[0] ?? "",
      lastName: user?.display_name?.split(" ").slice(1).join(" ") ?? "",
      email: user?.email ?? "",
      timezone: "Asia/Kolkata",
    });

    setTrading({
      orderType: "Market",
      confirmation: true,
      slippage: "0.50%",
      sizing: "Risk based",
    });

    setNotifications({
      priceAlerts: true,
      riskAlerts: true,
      fridayAlerts: true,
      portfolioUpdates: true,
      email: false,
    });

    setAHNA({
      enabled: true,
      sidebar: true,
      marketInsights: true,
      riskInsights: true,
      tradeAlerts: true,
    });

    setAppearance({
      theme: "System",
      density: "Comfortable",
      animations: true,
    });
  }

  return (
    <div className="cc-legacy-page">
      <BrokerConnectionsCard />
      <p className="cc-settings-notice">
        Settings below are interface previews. Changes are not saved and do not
        alter server-side risk limits, security, notifications or account
        permissions.
      </p>
      {/* Header */}
      <header className="cc-settings-header">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div>
            <div className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-[#8A897F]">
              CoinCrest
            </div>

            <h1 className="mt-0.5 text-[15px] font-extrabold tracking-[-0.02em] text-[#07111F]">
              Settings
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="hidden h-9 items-center gap-2 rounded-lg border border-[#D8D9CF] bg-white px-3 text-[12px] font-extrabold text-[#55554E] transition-all hover:border-[#BFC9C1] hover:bg-[#FAFAF7] sm:flex"
            >
              <RotateCcw size={13} />
              Reset
            </button>

            <button
              type="button"
              disabled
              title="Settings persistence is not connected"
              className="flex h-9 items-center gap-2 rounded-lg bg-[#2F78B7] px-4 text-[12px] font-extrabold text-white shadow-[0_8px_20px_rgba(15,45,31,0.16)] transition-all hover:-translate-y-0.5 hover:bg-[#245F93]"
            >
              {saved ? <Check size={14} /> : <Save size={14} />}
              {"Saving not connected"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Intro */}
        <section className="mb-7">
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#18794E]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#18794E]" />
            Control center
          </div>

          <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[#07111F] sm:text-3xl">
            Configure your workspace.
          </h2>

          <p className="mt-2 max-w-[650px] text-xs leading-5 text-[#77776F]">
            Manage your trading preferences, risk controls, AHNA AI behavior,
            notifications, security, and account settings from one place.
          </p>
        </section>

        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Settings navigation */}
          <aside className="h-fit rounded-2xl border border-[#E3E2D9] bg-white p-2 shadow-[0_8px_30px_rgba(23,23,23,0.025)]">
            <div className="px-3 pb-2 pt-3 text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#AAA99F]">
              Settings
            </div>

            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const active = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={[
                      "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200",
                      active
                        ? "bg-[#EEF4FA] text-[#2F78B7]"
                        : "text-[#66665F] hover:bg-[#FAFAF7] hover:text-[#292923]",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        active
                          ? "bg-white text-[#2F78B7] shadow-sm"
                          : "bg-[#F4F4EE] text-[#77776F] group-hover:text-[#2F78B7]",
                      ].join(" ")}
                    >
                      <Icon size={14} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-extrabold">
                        {section.label}
                      </span>
                      <span className="mt-0.5 block text-[12px] font-medium text-[#99988F]">
                        {section.description}
                      </span>
                    </span>

                    {active && <ChevronRight size={13} />}
                  </button>
                );
              })}
            </nav>

            <div className="mt-3 rounded-xl bg-[#2F78B7] p-3.5 text-white">
              <div className="flex items-center gap-2">
                <Sparkles size={14} />
                <span className="text-[11px] font-extrabold">AHNA AI</span>
              </div>

              <p className="mt-2 text-[12px] leading-4 text-white/55">
                Open AHNA from the top bar to request a market analysis.
              </p>

              <div className="mt-3 flex items-center gap-1.5 text-[12px] font-bold text-[#A8D2B5]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#65C18C]" />
                ANALYSIS ON DEMAND
              </div>
            </div>
          </aside>

          {/* Content */}
          <section className="min-w-0">
            {/* PROFILE */}
            {activeSection === "profile" && (
              <div className="space-y-5">
                <PageHeading
                  icon={User}
                  title="Profile"
                  description="Manage the personal information associated with your CoinCrest account."
                />

                <Card>
                  <div className="flex flex-col gap-5 border-b border-[#ECECE4] pb-6 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2F78B7] text-lg font-extrabold text-white shadow-[0_10px_25px_rgba(15,45,31,0.16)]">
                      {(user?.display_name || user?.email || "CC").slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="text-sm font-extrabold text-[#292923]">
                        {user?.display_name || "Your profile"}
                      </div>
                      <div className="mt-1 text-[12px] text-[#8A897F]">
                        {user?.email || "Signed-in account"}
                      </div>

                      <button
                        type="button"
                        disabled
                        title="This action is not connected yet"
                        className="mt-3 rounded-lg border border-[#E3E2D9] bg-[#FAFAF7] px-3 py-1.5 text-[11px] font-extrabold text-[#34342F] hover:border-[#BFC9C1]"
                      >
                        Change avatar
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 pt-6 sm:grid-cols-2">
                    <InputField
                      label="First name"
                      value={profile.firstName}
                      onChange={(value) =>
                        setProfile({ ...profile, firstName: value })
                      }
                    />

                    <InputField
                      label="Last name"
                      value={profile.lastName}
                      onChange={(value) =>
                        setProfile({ ...profile, lastName: value })
                      }
                    />

                    <InputField
                      label="Email address"
                      value={profile.email}
                      onChange={(value) =>
                        setProfile({ ...profile, email: value })
                      }
                    />

                    <div>
                      <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-wider text-[#8A897F]">
                        Timezone
                      </label>

                      <SelectInput
                        value={profile.timezone}
                        onChange={(value) =>
                          setProfile({ ...profile, timezone: value })
                        }
                      >
                        <option>Asia/Kolkata</option>
                        <option>Asia/Dubai</option>
                        <option>Europe/London</option>
                        <option>America/New_York</option>
                      </SelectInput>
                    </div>
                  </div>
                </Card>

                <InfoCard
                  icon={CircleHelp}
                  title="Profile information"
                  description="Your profile information will be used across your dashboard, portfolio reports, alerts, and trading activity."
                />
              </div>
            )}

            {/* TRADING */}
            {activeSection === "trading" && (
              <div className="space-y-5">
                <PageHeading
                  icon={Wallet}
                  title="Trading preferences"
                  description="Configure how CoinCrest handles your paper and future live trading workflows."
                />

                <Card>
                  <SettingRow
                    title="Default order type"
                    description="Choose the order type preselected when creating a new trade."
                  >
                    <SelectInput
                      value={trading.orderType}
                      onChange={(value) =>
                        setTrading({ ...trading, orderType: value })
                      }
                    >
                      <option>Market</option>
                      <option>Limit</option>
                      <option>Stop Market</option>
                      <option>Stop Limit</option>
                    </SelectInput>
                  </SettingRow>

                  <SettingRow
                    title="Position sizing"
                    description="Choose how the platform calculates your default position size."
                  >
                    <SelectInput
                      value={trading.sizing}
                      onChange={(value) =>
                        setTrading({ ...trading, sizing: value })
                      }
                    >
                      <option>Risk based</option>
                      <option>Fixed amount</option>
                      <option>Percentage based</option>
                    </SelectInput>
                  </SettingRow>

                  <SettingRow
                    title="Slippage tolerance"
                    description="Maximum expected execution slippage used for trade calculations."
                  >
                    <SelectInput
                      value={trading.slippage}
                      onChange={(value) =>
                        setTrading({ ...trading, slippage: value })
                      }
                    >
                      <option>0.25%</option>
                      <option>0.50%</option>
                      <option>1.00%</option>
                      <option>2.00%</option>
                    </SelectInput>
                  </SettingRow>

                  <SettingRow
                    title="Trade confirmation"
                    description="Ask for confirmation before submitting a paper trade."
                  >
                    <Toggle
                      enabled={trading.confirmation}
                      onChange={() =>
                        setTrading({
                          ...trading,
                          confirmation: !trading.confirmation,
                        })
                      }
                    />
                  </SettingRow>
                </Card>
              </div>
            )}

            {/* Risk preferences live directly on /risk; no duplicate settings panel. */}

            {/* NOTIFICATIONS */}
            {activeSection === "notifications" && (
              <div className="space-y-5">
                <PageHeading
                  icon={Bell}
                  title="Notifications"
                  description="Control the alerts and updates you receive from CoinCrest."
                />

                <Card>
                  <SettingRow
                    title="Price alerts"
                    description="Receive notifications when monitored assets reach configured price levels."
                  >
                    <Toggle
                      enabled={notifications.priceAlerts}
                      onChange={() =>
                        setNotifications({
                          ...notifications,
                          priceAlerts: !notifications.priceAlerts,
                        })
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    title="Risk alerts"
                    description="Receive alerts when portfolio risk or drawdown conditions change."
                  >
                    <Toggle
                      enabled={notifications.riskAlerts}
                      onChange={() =>
                        setNotifications({
                          ...notifications,
                          riskAlerts: !notifications.riskAlerts,
                        })
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    title="AHNA AI alerts"
                    description="Allow AHNA to notify you about important market intelligence."
                  >
                    <Toggle
                      enabled={notifications.fridayAlerts}
                      onChange={() =>
                        setNotifications({
                          ...notifications,
                          fridayAlerts: !notifications.fridayAlerts,
                        })
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    title="Portfolio updates"
                    description="Receive summaries about portfolio performance and activity."
                  >
                    <Toggle
                      enabled={notifications.portfolioUpdates}
                      onChange={() =>
                        setNotifications({
                          ...notifications,
                          portfolioUpdates: !notifications.portfolioUpdates,
                        })
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    title="Email notifications"
                    description="Send important platform notifications to your account email."
                  >
                    <Toggle
                      enabled={notifications.email}
                      onChange={() =>
                        setNotifications({
                          ...notifications,
                          email: !notifications.email,
                        })
                      }
                    />
                  </SettingRow>
                </Card>
              </div>
            )}

            {/* FRIDAY */}
            {activeSection === "friday" && (
              <div className="space-y-5">
                <PageHeading
                  icon={Sparkles}
                  title="AHNA AI"
                  description="Configure how AHNA interacts with your workspace and trading intelligence."
                />

                <div className="relative overflow-hidden rounded-2xl bg-[#2F78B7] p-5 text-white shadow-[0_15px_40px_rgba(15,45,31,0.14)] sm:p-6">
                  <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#79A98A]/10 blur-3xl" />

                  <div className="relative flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                      <Sparkles size={19} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold">
                          AHNA Intelligence Layer
                        </span>

                        <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-extrabold text-white">
                          ANALYSIS ON DEMAND
                        </span>
                      </div>

                      <p className="mt-2 max-w-[650px] text-[12px] leading-5 text-white/55">
                        Open AHNA to request market context for your selected
                        asset. These settings are a preview; they do not change
                        the analysis service or enable background monitoring.
                      </p>
                    </div>
                  </div>
                </div>

                <Card>
                  <SettingRow
                    title="Enable AHNA AI"
                    description="Enable or disable the AHNA intelligence layer."
                  >
                    <Toggle
                      enabled={friday.enabled}
                      onChange={() =>
                        setAHNA({
                          ...friday,
                          enabled: !friday.enabled,
                        })
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    title="Open AHNA sidebar by default"
                    description="Automatically show the AHNA AI sidebar when entering the trading workspace."
                  >
                    <Toggle
                      enabled={friday.sidebar}
                      onChange={() =>
                        setAHNA({
                          ...friday,
                          sidebar: !friday.sidebar,
                        })
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    title="Market intelligence"
                    description="Allow AHNA to provide market analysis and contextual market insights."
                  >
                    <Toggle
                      enabled={friday.marketInsights}
                      onChange={() =>
                        setAHNA({
                          ...friday,
                          marketInsights: !friday.marketInsights,
                        })
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    title="Risk intelligence"
                    description="Allow AHNA to explain portfolio risk and risk-management events."
                  >
                    <Toggle
                      enabled={friday.riskInsights}
                      onChange={() =>
                        setAHNA({
                          ...friday,
                          riskInsights: !friday.riskInsights,
                        })
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    title="Trade alerts"
                    description="Allow AHNA to surface relevant trade opportunities and warnings."
                  >
                    <Toggle
                      enabled={friday.tradeAlerts}
                      onChange={() =>
                        setAHNA({
                          ...friday,
                          tradeAlerts: !friday.tradeAlerts,
                        })
                      }
                    />
                  </SettingRow>
                </Card>
              </div>
            )}

            {/* APPEARANCE */}
            {activeSection === "appearance" && (
              <div className="space-y-5">
                <PageHeading
                  icon={Palette}
                  title="Appearance"
                  description="Customize the visual experience of your CoinCrest workspace."
                />

                <Card>
                  <SettingRow
                    title="Theme"
                    description="Choose the color mode used throughout the application."
                  >
                    <ThemeSettings />
                  </SettingRow>

                  <SettingRow
                    title="Interface density"
                    description="Control the amount of information displayed within dashboard components."
                  >
                    <SelectInput
                      value={appearance.density}
                      onChange={(value) =>
                        setAppearance({
                          ...appearance,
                          density: value,
                        })
                      }
                    >
                      <option>Compact</option>
                      <option>Comfortable</option>
                      <option>Spacious</option>
                    </SelectInput>
                  </SettingRow>

                  <SettingRow
                    title="Interface animations"
                    description="Enable subtle transitions and motion throughout the application."
                  >
                    <Toggle
                      enabled={appearance.animations}
                      onChange={() =>
                        setAppearance({
                          ...appearance,
                          animations: !appearance.animations,
                        })
                      }
                    />
                  </SettingRow>
                </Card>
              </div>
            )}

            {/* SECURITY */}
            {activeSection === "security" && (
              <div className="space-y-5">
                <PageHeading
                  icon={Lock}
                  title="Security"
                  description="Protect your account and review active sessions."
                />

                <Card>
                  <SettingRow
                    title="Password"
                    description="Change your CoinCrest account password."
                  >
                    <button
                      type="button"
                      disabled
                      title="This action is not connected yet"
                      className="rounded-lg border border-[#E3E2D9] bg-[#FAFAF7] px-3 py-2 text-[11px] font-extrabold text-[#34342F] transition-all hover:border-[#BFC9C1]"
                    >
                      Change password
                    </button>
                  </SettingRow>

                  <SettingRow
                    title="Two-factor authentication"
                    description="Add another layer of security to your account."
                  >
                    <button
                      type="button"
                      disabled
                      title="This action is not connected yet"
                      className="rounded-lg bg-[#2F78B7] px-3 py-2 text-[11px] font-extrabold text-white transition-all hover:bg-[#245F93]"
                    >
                      Enable 2FA
                    </button>
                  </SettingRow>

                  <SettingRow
                    title="Active sessions"
                    description="Review devices that currently have access to your account."
                  >
                    <button
                      type="button"
                      disabled
                      title="This action is not connected yet"
                      className="rounded-lg border border-[#E3E2D9] bg-[#FAFAF7] px-3 py-2 text-[11px] font-extrabold text-[#34342F]"
                    >
                      View sessions
                    </button>
                  </SettingRow>

                  <SettingRow
                    title="Login activity"
                    description="Review recent sign-ins and account security events."
                  >
                    <button
                      type="button"
                      disabled
                      title="This action is not connected yet"
                      className="rounded-lg border border-[#E3E2D9] bg-[#FAFAF7] px-3 py-2 text-[11px] font-extrabold text-[#34342F]"
                    >
                      View activity
                    </button>
                  </SettingRow>
                </Card>

                <div className="rounded-2xl border border-[#E7DDD3] bg-[#FBF6EF] p-5">
                  <div className="flex items-start gap-3">
                    <Lock size={16} className="mt-0.5 text-[#8A6D4A]" />

                    <div>
                      <div className="text-xs font-extrabold text-[#4A3C2E]">
                        Security reminder
                      </div>

                      <p className="mt-1 text-[12px] leading-4 text-[#897968]">
                        Never share your password, API credentials, private
                        keys, or authentication codes with anyone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ACCOUNT */}
            {activeSection === "account" && (
              <div className="space-y-5">
                <PageHeading
                  icon={SlidersHorizontal}
                  title="Account"
                  description="Manage your CoinCrest subscription and account lifecycle."
                />

                <Card>
                  <div className="rounded-xl border border-[#D7E4EF] bg-[#EEF4FA] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#18794E]">
                          Current plan
                        </div>

                        <div className="mt-1 text-lg font-extrabold text-[#2F78B7]">
                          Not loaded
                        </div>

                        <div className="mt-1 text-[11px] text-[#66766B]">
                          Advanced intelligence and trading workspace
                        </div>
                      </div>

                      <span className="rounded-full bg-white px-3 py-1.5 text-[12px] font-extrabold text-[#18794E] shadow-sm">
                        UNAVAILABLE
                      </span>
                    </div>
                  </div>

                  <SettingRow
                    title="Subscription"
                    description="Manage your current plan and available upgrades."
                  >
                    <button
                      type="button"
                      disabled
                      title="This action is not connected yet"
                      className="rounded-lg bg-[#2F78B7] px-3 py-2 text-[11px] font-extrabold text-white hover:bg-[#245F93]"
                    >
                      Manage plan
                    </button>
                  </SettingRow>

                  <SettingRow
                    title="Billing"
                    description="View invoices and manage your billing information."
                  >
                    <button
                      type="button"
                      disabled
                      title="This action is not connected yet"
                      className="rounded-lg border border-[#E3E2D9] bg-[#FAFAF7] px-3 py-2 text-[11px] font-extrabold text-[#34342F]"
                    >
                      Billing portal
                    </button>
                  </SettingRow>
                </Card>

                <div className="rounded-2xl border border-[#E5D2D2] bg-[#FBF4F4] p-5">
                  <div className="text-xs font-extrabold text-[#6D3838]">
                    Danger zone
                  </div>

                  <p className="mt-1 text-[12px] leading-4 text-[#967070]">
                    Account deletion is permanent and may remove associated
                    workspace data.
                  </p>

                  <button
                    type="button"
                    disabled
                    title="This action is not connected yet"
                    className="mt-4 flex items-center gap-2 rounded-lg border border-[#D9BABA] bg-white px-3 py-2 text-[11px] font-extrabold text-[#8B4545] hover:bg-[#FFF9F9]"
                  >
                    <X size={12} />
                    Delete account
                  </button>
                </div>
              </div>
            )}

            {/* Mobile save */}
            <div className="mt-5 flex gap-2 sm:hidden">
              <button
                type="button"
                onClick={handleReset}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-[#D8D9CF] bg-white text-[12px] font-extrabold text-[#55554E]"
              >
                <RotateCcw size={13} />
                Reset
              </button>

              <button
                type="button"
                disabled
                title="Settings persistence is not connected"
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#2F78B7] text-[12px] font-extrabold text-white"
              >
                {saved ? <Check size={14} /> : <Save size={14} />}
                {"Saving not connected"}
              </button>
            </div>
          </section>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-semibold text-[#A09F96]">
          <ShieldCheck size={11} />
          CoinCrest secure workspace
        </div>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#E3E2D9] bg-white p-5 shadow-[0_8px_30px_rgba(23,23,23,0.025)] sm:p-6">
      {children}
    </section>
  );
}

function PageHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof User;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FA] text-[#2F78B7]">
        <Icon size={17} />
      </div>

      <div>
        <h2 className="text-sm font-extrabold text-[#07111F]">{title}</h2>

        <p className="mt-1 max-w-[650px] text-[12px] leading-4 text-[#8A897F]">
          {description}
        </p>
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CircleHelp;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E3E2D9] bg-[#FAFAF7] p-4">
      <div className="flex gap-3">
        <Icon size={15} className="mt-0.5 shrink-0 text-[#8A897F]" />

        <div>
          <div className="text-[12px] font-extrabold text-[#55554E]">
            {title}
          </div>

          <p className="mt-1 text-[11px] leading-4 text-[#8A897F]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-wider text-[#8A897F]">
        {label}
      </label>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-[#E3E2D9] bg-[#FAFAF7] px-3 text-[12px] font-semibold text-[#34342F] outline-none transition-colors focus:border-[#8FB49B] focus:bg-white"
      />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <DashboardShell>
      <SettingsContent />
    </DashboardShell>
  );
}
