"use client";

import type { ReactNode } from "react";
import { Bell, BookOpen, ChevronDown, LayoutDashboard, LogOut, Settings, User as UserIcon, type LucideIcon } from "lucide-react";
import { useT } from "@/i18n/client";
import { LocaleLink } from "@/i18n/LocaleLink";
import { cn } from "@/lib/utils/cn";
import { fullName, type User } from "@/types/user";
import { usePopover } from "./usePopover";

/** The signed-in user's initials in a navy (gold at night) circle. */
export function UserInitials({ user, className }: { user: User; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-action font-display text-on-action italic [font-variation-settings:'SOFT'_100,'WONK'_1]",
        className,
      )}
    >
      {user.firstName?.[0]}
      {user.lastName?.[0]}
    </span>
  );
}

/**
 * The account menu behind the avatar: the user, then Kabinet, Kurslarım,
 * Bildirişlər, Profil, Tənzimləmələr and "Çıxış edin". Popover behaviour
 * (outside press, Escape with focus return, tab-out, arrow keys) comes from
 * usePopover.
 */
export function UserMenu({
  user,
  onSignOut,
  signingOut,
  className,
}: {
  user: User;
  onSignOut: () => void;
  signingOut: boolean;
  className?: string;
}) {
  const t = useT();
  const { open, setOpen, rootRef, triggerRef, panelRef, panelId, onBlur, onPanelKeyDown, onTriggerKeyDown } =
    usePopover();
  const close = () => setOpen(false);

  return (
    <div ref={rootRef} onBlur={onBlur} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "flex h-11 items-center gap-1.5 rounded-full pr-2 pl-1 transition-colors duration-(--dur-1) hover:bg-paper-2",
          open && "bg-paper-2",
        )}
      >
        <UserInitials user={user} className="size-9 text-[15px]" />
        {/* The name is the button's accessible label at every width. */}
        <span className="sr-only">{fullName(user)}</span>
        <ChevronDown
          aria-hidden="true"
          strokeWidth={1.75}
          className={cn("size-4 text-ink-3 transition-transform duration-(--dur-2)", open && "rotate-180")}
        />
      </button>

      <div
        id={panelId}
        ref={panelRef}
        onKeyDown={onPanelKeyDown}
        role="group"
        aria-label={t("nav.accountMenu")}
        className={cn(
          "absolute top-[calc(100%+10px)] right-0 w-72 rounded-pop bg-card p-2 text-ink shadow-pop",
          open ? "block motion-safe:animate-[drop-in_var(--dur-2)_var(--ease-out)]" : "hidden",
        )}
      >
        <div className="flex items-center gap-3 border-b border-line px-3 pt-2 pb-3">
          <UserInitials user={user} className="size-10 text-base" />
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold">{fullName(user)}</div>
            <div className="t-meta truncate">{user.email}</div>
          </div>
        </div>
        <div className="grid py-1">
          <MenuLink href="/dashboard" icon={LayoutDashboard} onClick={close}>
            {t("nav.dashboard")}
          </MenuLink>
          <MenuLink href="/my-courses" icon={BookOpen} onClick={close}>
            {t("nav.myCourses")}
          </MenuLink>
          <MenuLink href="/notifications" icon={Bell} onClick={close}>
            {t("nav.notifications")}
          </MenuLink>
          <MenuLink href="/profile" icon={UserIcon} onClick={close}>
            {t("nav.profile")}
          </MenuLink>
          <MenuLink href="/settings" icon={Settings} onClick={close}>
            {t("nav.settings")}
          </MenuLink>
        </div>
        <div aria-hidden="true" className="mx-3 h-px bg-line" />
        <button
          type="button"
          onClick={() => {
            close();
            onSignOut();
          }}
          disabled={signingOut}
          aria-busy={signingOut || undefined}
          className="mt-1 flex w-full items-center gap-3 rounded-[6px] px-3 py-2.5 text-left text-[15px] font-semibold text-danger transition-colors duration-(--dur-1) hover:bg-paper-2 disabled:opacity-60"
        >
          {signingOut ? (
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />
          ) : (
            <LogOut aria-hidden="true" strokeWidth={1.75} className="size-4" />
          )}
          {t("common.signOut")}
        </button>
      </div>
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  onClick,
  children,
}: {
  href: string;
  icon: LucideIcon;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <LocaleLink
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-[6px] px-3 py-2.5 text-[15px] font-medium transition-colors duration-(--dur-1) hover:bg-paper-2 focus-visible:bg-paper-2"
    >
      <Icon aria-hidden="true" strokeWidth={1.75} className="size-4 text-ink-3" />
      {children}
    </LocaleLink>
  );
}
