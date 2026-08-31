"use client";

import { useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { BrokerConnectionsCard } from "@/components/dashboard/AccountCards";
import { useAuth } from "@/context/AuthContext";
import { ThemeSettings, useTheme } from "@/context/ThemeContext";
import {
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Cpu,
  DollarSign,
  Eye,
  Key,
  Laptop,
  Layers,
  Layout,
  LineChart,
  Lock,
  Mail,
  Moon,
  Palette,
  PieChart,
  RotateCcw,
  Save,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Sun,
  TrendingUp,
  User,
  Wallet,
  X,
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
  shortLabel: string;
  description: string;
  icon: typeof User;
}[] = [
  {
    id: "profile",
    label: "Trader Profile",
    shortLabel: "Profile",
    description: "Personal details & timezone",
    icon: User,
  },
  {
    id: "trading",
    label: "Trading Engine",
    shortLabel: "Trading",
    description: "Orders, sizing & slippage",
    icon: LineChart,
  },
  {
    id: "notifications",
    label: "Alert Triggers",
    shortLabel: "Alerts",
    description: "Price, risk & digest alerts",
    icon: Bell,
  },
  {
    id: "friday",
    label: "AHNA AI Matrix",
    shortLabel: "AHNA AI",
    description: "Autonomous agent deliberation",
    icon: Sparkles,
  },
  {
    id: "appearance",
    label: "Interface & Theme",
    shortLabel: "Interface",
    description: "Theme & workspace density",
    icon: Palette,
  },
  {
    id: "security",
    label: "Security & 2FA",
    shortLabel: "Security",
    description: "Credentials & active sessions",
    icon: ShieldCheck,
  },
  {
    id: "account",
    label: "Membership & Tier",
    shortLabel: "Account",
    description: "Plan details & billing",
    icon: SlidersHorizontal,
  },
];

// Modern, high-contrast fintech switch with clear ON/OFF state
function Toggle({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      role="switch"
      aria-checked={enabled}
      aria-label={label || "Toggle switch"}
      className={[
        "group relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#164F7D]",
        enabled
          ? "border-[#164F7D] bg-[#164F7D] shadow-sm"
          : "border-[#CBD5E1] bg-[#E2E8F0]",
      ].join(" ")}
      style={{
        background: enabled ? "#164F7D" : "#E2E8F0",
        borderColor: enabled ? "#164F7D" : "#CBD5E1",
      }}
    >
      <span
        className={[
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out flex items-center justify-center text-[9px] font-black",
          enabled ? "translate-x-5 text-[#164F7D]" : "translate-x-0.5 text-gray-400",
        ].join(" ")}
      >
        {enabled ? (
          <Check className="h-3 w-3 stroke-[3] text-[#164F7D]" />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
        )}
      </span>
    </button>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon?: typeof User;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[#E2E1D5] py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3.5 min-w-0">
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FA] text-[#164F7D] border border-[#D4E3F0] mt-0.5">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0">
          <div className="text-[13.5px] font-bold text-[#07111F]">{title}</div>
          <div className="mt-1 max-w-[580px] text-[12px] leading-relaxed text-[#657080]">
            {description}
          </div>
        </div>
      </div>

      <div className="shrink-0 flex items-center">{children}</div>
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
      className="h-10 min-w-[170px] rounded-xl border border-[#D9DFE7] bg-white px-3 text-[12.5px] font-bold text-[#07111F] outline-none transition-all focus:border-[#164F7D] focus:ring-2 focus:ring-[#164F7D]/20 cursor-pointer shadow-sm"
      style={{ background: "#FFFFFF", color: "#07111F" }}
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
    <div className="w-full max-w-[1400px] mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <BrokerConnectionsCard />

      {/* Header Banner */}
      <div className="rounded-2xl bg-[#07111F] border border-white/10 p-6 sm:p-7 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-[#70C891]/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#70C891] border border-[#70C891]/30">
              User Center
            </span>
            <span className="text-[12px] font-bold text-white/60">Workspace Preferences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Account &amp; System Configuration
          </h1>
          <p className="mt-1 text-[13px] text-white/70 max-w-xl">
            Manage your personal profile, risk thresholds, order execution presets, and AHNA AI deliberation settings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex h-10 items-center gap-2 rounded-xl border border-white/20 px-4 text-[12px] font-bold text-white hover:bg-white/10 transition-all cursor-pointer"
            style={{ background: "rgba(255,255,255,0.08)", color: "#FFFFFF" }}
          >
            <RotateCcw className="h-4 w-4" />
            Reset Defaults
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex h-10 items-center gap-2 rounded-xl px-5 text-[12px] font-black text-white shadow-md hover:opacity-90 transition-all cursor-pointer"
            style={{ background: "#2F78B7", color: "#FFFFFF" }}
          >
            {saved ? <Check className="h-4 w-4 text-[#70C891]" /> : <Save className="h-4 w-4" />}
            {saved ? "Saved" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Modern Profile Navigation Bar */}
      <div
        className="rounded-2xl border border-[#E2E1D5] p-2 shadow-sm overflow-x-auto scrollbar-none"
        style={{ background: "#FFFFFF" }}
      >
        <div className="flex items-center gap-2 min-w-max">
          {sections.map((section) => {
            const Icon = section.icon;
            const active = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-black transition-all cursor-pointer border"
                style={{
                  background: active ? "#164F7D" : "#FFFFFF",
                  color: active ? "#FFFFFF" : "#07111F",
                  borderColor: active ? "#164F7D" : "#E2E1D5",
                }}
              >
                <Icon className="h-4 w-4" style={{ color: active ? "#FFFFFF" : "#164F7D" }} />
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings Content Section */}
      <div className="min-w-0">
        {/* PROFILE SECTION */}
        {activeSection === "profile" && (
          <div className="space-y-6">
            <PageHeading
              icon={User}
              title="Trader Profile Information"
              description="Manage your account profile details, avatar, and regional timezone."
            />

            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center gap-5 border-b border-[#E2E1D5] pb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#164F7D] text-xl font-black text-white shadow-md">
                  {(user?.display_name || user?.email || "VX").slice(0, 2).toUpperCase()}
                </div>

                <div>
                  <div className="text-[16px] font-black text-[#07111F]">
                    {user?.display_name || "Verified Trader"}
                  </div>
                  <div className="text-[12px] text-[#657080]">{user?.email || "user@vantix.ai"}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full bg-[#70C891]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#155B3B] border border-[#70C891]/40">
                      Pro Verified
                    </span>
                    <span className="text-[11px] text-[#657080]">ID: {user?.id?.slice(0, 8) || "VX-8921"}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 pt-6 sm:grid-cols-2">
                <InputField
                  label="First Name"
                  value={profile.firstName}
                  onChange={(val) => setProfile({ ...profile, firstName: val })}
                />
                <InputField
                  label="Last Name"
                  value={profile.lastName}
                  onChange={(val) => setProfile({ ...profile, lastName: val })}
                />
                <InputField
                  label="Email Address"
                  value={profile.email}
                  onChange={(val) => setProfile({ ...profile, email: val })}
                />
                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-wider text-[#657080]">
                    Timezone
                  </label>
                  <SelectInput
                    value={profile.timezone}
                    onChange={(val) => setProfile({ ...profile, timezone: val })}
                  >
                    <option>Asia/Kolkata (IST)</option>
                    <option>Asia/Dubai (GST)</option>
                    <option>Europe/London (GMT)</option>
                    <option>America/New_York (EST)</option>
                    <option>America/Los_Angeles (PST)</option>
                  </SelectInput>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TRADING SECTION */}
        {activeSection === "trading" && (
          <div className="space-y-6">
            <PageHeading
              icon={LineChart}
              title="Trading &amp; Execution Preferences"
              description="Configure default order types, risk sizing calculations, and slippage tolerances."
            />

            <Card>
              <SettingRow
                icon={Layers}
                title="Default Order Type"
                description="Choose the preselected order structure when placing orders in paper trading or live terminal."
              >
                <SelectInput
                  value={trading.orderType}
                  onChange={(val) => setTrading({ ...trading, orderType: val })}
                >
                  <option>Market Order</option>
                  <option>Limit Order</option>
                  <option>Stop Limit</option>
                  <option>Trailing Stop</option>
                </SelectInput>
              </SettingRow>

              <SettingRow
                icon={DollarSign}
                title="Position Sizing Calculation"
                description="Platform formula used to compute recommended trade quantities based on account equity."
              >
                <SelectInput
                  value={trading.sizing}
                  onChange={(val) => setTrading({ ...trading, sizing: val })}
                >
                  <option>Risk based (1-2% Equity)</option>
                  <option>Fixed USD Amount</option>
                  <option>Percentage of Portfolio</option>
                </SelectInput>
              </SettingRow>

              <SettingRow
                icon={SlidersHorizontal}
                title="Maximum Slippage Tolerance"
                description="Maximum allowed price variance before an execution order is aborted."
              >
                <SelectInput
                  value={trading.slippage}
                  onChange={(val) => setTrading({ ...trading, slippage: val })}
                >
                  <option>0.25% (Strict)</option>
                  <option>0.50% (Recommended)</option>
                  <option>1.00% (High Volatility)</option>
                  <option>2.00% (Maximum)</option>
                </SelectInput>
              </SettingRow>

              <SettingRow
                icon={CheckCircle2}
                title="Order Confirmation Modal"
                description="Display review prompt before sending paper and terminal trades."
              >
                <Toggle
                  enabled={trading.confirmation}
                  onChange={() =>
                    setTrading({ ...trading, confirmation: !trading.confirmation })
                  }
                />
              </SettingRow>
            </Card>
          </div>
        )}

        {/* NOTIFICATIONS SECTION */}
        {activeSection === "notifications" && (
          <div className="space-y-6">
            <PageHeading
              icon={Bell}
              title="Alerts &amp; Notification Preferences"
              description="Manage push notifications, price triggers, and AI intelligence alerts."
            />

            <Card>
              <SettingRow
                icon={TrendingUp}
                title="Price Level Triggers"
                description="Instant notifications when watched assets reach configured support/resistance thresholds."
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
                icon={ShieldAlert}
                title="Risk &amp; Drawdown Guardrails"
                description="High-priority alerts when portfolio drawdown or asset volatility crosses predefined limits."
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
                icon={Sparkles}
                title="AHNA AI Copilot Proactive Signals"
                description="Receive instant notices when AHNA multi-agent consensus identifies high-confidence setups."
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
                icon={PieChart}
                title="Daily Portfolio Digest"
                description="Daily summaries of performance metrics, open positions, and market exposure."
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
                icon={Mail}
                title="Email Digest Notifications"
                description="Send daily analytical briefs and trade receipts to your registered email address."
              >
                <Toggle
                  enabled={notifications.email}
                  onChange={() =>
                    setNotifications({ ...notifications, email: !notifications.email })
                  }
                />
              </SettingRow>
            </Card>
          </div>
        )}

        {/* AHNA AI SECTION */}
        {activeSection === "friday" && (
          <div className="space-y-6">
            <PageHeading
              icon={Sparkles}
              title="AHNA Multi-Agent AI Engine"
              description="Configure the autonomous agents coordinating market technicals, news sentiment, and risk guardrails."
            />

            <Card>
              <SettingRow
                icon={Cpu}
                title="Multi-Agent Deliberation Pipeline"
                description="Allow AHNA to synthesize 5 specialized agents simultaneously for real-time trade signals."
              >
                <Toggle
                  enabled={friday.enabled}
                  onChange={() => setAHNA({ ...friday, enabled: !friday.enabled })}
                />
              </SettingRow>

              <SettingRow
                icon={Sparkles}
                title="Floating AI Copilot Drawer"
                description="Keep the AHNA assistant quickly accessible on the right side of the trading workspace."
              >
                <Toggle
                  enabled={friday.sidebar}
                  onChange={() => setAHNA({ ...friday, sidebar: !friday.sidebar })}
                />
              </SettingRow>

              <SettingRow
                icon={TrendingUp}
                title="Real-Time Technical Insights"
                description="Automatically compute RSI, EMA ribbon, support & resistance levels on pair switch."
              >
                <Toggle
                  enabled={friday.marketInsights}
                  onChange={() =>
                    setAHNA({ ...friday, marketInsights: !friday.marketInsights })
                  }
                />
              </SettingRow>

              <SettingRow
                icon={ShieldCheck}
                title="Automated Risk Guardrails"
                description="Check trade setups against maximum leverage and liquidation distance constraints."
              >
                <Toggle
                  enabled={friday.riskInsights}
                  onChange={() =>
                    setAHNA({ ...friday, riskInsights: !friday.riskInsights })
                  }
                />
              </SettingRow>
            </Card>
          </div>
        )}

        {/* APPEARANCE SECTION */}
        {activeSection === "appearance" && (
          <div className="space-y-6">
            <PageHeading
              icon={Palette}
              title="Interface &amp; Appearance"
              description="Customize workspace themes, data density, and visual animations."
            />

            <Card>
              <SettingRow
                icon={Sun}
                title="Workspace Color Theme"
                description="Choose between Dark obsidian, High-contrast terminal, or System sync."
              >
                <SelectInput
                  value={appearance.theme}
                  onChange={(val) => {
                    setAppearance({ ...appearance, theme: val });
                    changeTheme(val.toLowerCase() as any);
                  }}
                >
                  <option>System (Default)</option>
                  <option>Light</option>
                  <option>Dark</option>
                </SelectInput>
              </SettingRow>

              <SettingRow
                icon={Layout}
                title="Data Grid Density"
                description="Compact terminal layout for multi-monitor setups or spacious comfortable view."
              >
                <SelectInput
                  value={appearance.density}
                  onChange={(val) => setAppearance({ ...appearance, density: val })}
                >
                  <option>Comfortable</option>
                  <option>Compact Terminal</option>
                </SelectInput>
              </SettingRow>

              <SettingRow
                icon={Sparkles}
                title="Smooth Chart Animations"
                description="Enable hardware-accelerated transitions and price ticker micro-animations."
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

        {/* SECURITY SECTION */}
        {activeSection === "security" && (
          <div className="space-y-6">
            <PageHeading
              icon={ShieldCheck}
              title="Security &amp; Access Controls"
              description="Manage two-factor authentication, active sessions, and data privacy."
            />

            <Card>
              <SettingRow
                icon={Key}
                title="Two-Factor Authentication (2FA)"
                description="Add an extra layer of protection using Google Authenticator or hardware keys."
              >
                <button
                  type="button"
                  className="rounded-xl px-4 py-2 text-[12px] font-black text-white shadow-sm cursor-pointer"
                  style={{ background: "#164F7D", color: "#FFFFFF" }}
                >
                  Configure 2FA
                </button>
              </SettingRow>

              <SettingRow
                icon={Lock}
                title="Account Password"
                description="Regularly update your credentials to safeguard access to connected broker accounts."
              >
                <button
                  type="button"
                  className="rounded-xl border border-[#D9DFE7] bg-white px-4 py-2 text-[12px] font-bold text-[#07111F] hover:bg-[#F1F5F9] transition-all shadow-sm cursor-pointer"
                  style={{ background: "#FFFFFF", color: "#07111F" }}
                >
                  Change Password
                </button>
              </SettingRow>

              <SettingRow
                icon={Laptop}
                title="Active Workspace Sessions"
                description="Manage devices currently signed into this VANTIX account."
              >
                <button
                  type="button"
                  className="rounded-xl border border-[#D9DFE7] bg-white px-4 py-2 text-[12px] font-bold text-[#07111F] hover:bg-[#F1F5F9] transition-all shadow-sm cursor-pointer"
                  style={{ background: "#FFFFFF", color: "#07111F" }}
                >
                  View Active Sessions (1)
                </button>
              </SettingRow>
            </Card>
          </div>
        )}

        {/* ACCOUNT & BILLING */}
        {activeSection === "account" && (
          <div className="space-y-6">
            <PageHeading
              icon={SlidersHorizontal}
              title="Subscription &amp; Workspace Tier"
              description="Manage plan features, billing invoices, and connected resources."
            />

            <Card>
              <div className="rounded-xl bg-[#07111F] text-white p-5 mb-5 flex items-center justify-between shadow-md">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#FFEA93]">
                    Current Membership
                  </span>
                  <h3 className="text-xl font-black text-white mt-1">VANTIX Pro Trader</h3>
                  <p className="text-[12px] text-white/70 mt-0.5">
                    Full access to AHNA Multi-Agent Matrix, Real-Time Charting &amp; Paper Trading
                  </p>
                </div>
                <span className="rounded-lg bg-[#70C891]/20 px-3 py-1 text-[11px] font-black text-[#70C891] border border-[#70C891]/40">
                  ACTIVE
                </span>
              </div>

              <SettingRow
                icon={DollarSign}
                title="Billing Information"
                description="Update payment methods and download past subscription receipts."
              >
                <button
                  type="button"
                  className="rounded-xl border border-[#D9DFE7] bg-white px-4 py-2 text-[12px] font-bold text-[#07111F] hover:bg-[#F1F5F9] transition-all shadow-sm cursor-pointer"
                  style={{ background: "#FFFFFF", color: "#07111F" }}
                >
                  Billing Portal
                </button>
              </SettingRow>
            </Card>

            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
              <div className="text-[13px] font-black text-red-600 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                <span>Danger Zone</span>
              </div>
              <p className="mt-1 text-[12px] text-red-800/70">
                Account deletion is permanent and wipes all journal history and trade metrics.
              </p>
              <button
                type="button"
                className="mt-3 rounded-xl border border-red-300 bg-white px-4 py-2 text-[12px] font-black text-red-600 hover:bg-red-50 transition-all shadow-sm cursor-pointer"
                style={{ background: "#FFFFFF", color: "#DC2626" }}
              >
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl border border-[#E2E1D5] p-6 shadow-sm"
      style={{ background: "#FFFFFF" }}
    >
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
    <div className="flex items-start gap-3.5 mb-2">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FA] text-[#164F7D] border border-[#D4E3F0] shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-[16px] font-black text-[#07111F]">{title}</h2>
        <p className="mt-0.5 text-[12.5px] text-[#657080] leading-relaxed">{description}</p>
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
      <label className="mb-2 block text-[11px] font-black uppercase tracking-wider text-[#657080]">
        {label}
      </label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-[#D9DFE7] bg-white px-3.5 text-[13px] font-bold text-[#07111F] outline-none transition-all focus:border-[#164F7D] focus:ring-2 focus:ring-[#164F7D]/20 shadow-sm"
        style={{ background: "#FFFFFF", color: "#07111F", caretColor: "#164F7D" }}
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
