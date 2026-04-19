"use client"

import * as React from "react"
import { useState, useEffect, useContext, useMemo, createContext } from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp, X } from "lucide-react"
import { cn } from "@/lib/utils"

// Detect mobile (touch) environment
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    check();
    const mq = window.matchMedia('(max-width: 768px)');
    mq.addEventListener('change', check);
    return () => mq.removeEventListener('change', check);
  }, []);
  return isMobile;
}

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-11 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}>
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}>
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}>
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

// ── Mobile Bottom-Sheet Select ─────────────────────────────────────────────

function MobileSelectContent({ open, onClose, children, title }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#151528] border-t border-white/10 rounded-t-2xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
          <span className="text-white font-semibold text-base">{title || 'Select'}</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Options */}
        <div className="max-h-[55vh] overflow-y-auto py-2">
          {children}
        </div>
      </div>
    </>
  );
}

function MobileSelectItem({ value, children, selected, onSelect, className }) {
  return (
    <button
      onClick={() => onSelect(value)}
      className={cn(
        "w-full flex items-center justify-between px-5 py-3.5 text-sm text-left transition-colors",
        selected
          ? "text-[#C084FC] bg-[#7B3BFF]/10"
          : "text-white hover:bg-white/5"
      )}
    >
      <span>{children}</span>
      {selected && <Check className="w-4 h-4 text-[#C084FC] flex-shrink-0" />}
    </button>
  );
}

// Context to wire mobile trigger ↔ content
const MobileSelectContext = createContext(null);

// ── Unified Select components ──────────────────────────────────────────────

/**
 * SelectContent: on mobile renders a bottom-sheet, on desktop uses Radix portal.
 * We intercept children to extract items for the mobile sheet.
 */
const SelectContent = React.forwardRef(({ className, children, position = "popper", ...props }, ref) => {
  const isMobile = useIsMobile();
  const ctx = useContext(MobileSelectContext);

  if (isMobile && ctx) {
    // Collect all SelectItem children recursively for mobile sheet
    const items = [];
    React.Children.forEach(children, child => {
      if (!child) return;
      // Handle SelectGroup wrapping
      if (child.type === SelectGroup || (child.props && child.props.children)) {
        const nested = child.props?.children;
        if (nested) {
          React.Children.forEach(nested, c => {
            if (c && c.props && c.props.value !== undefined) items.push(c);
          });
        }
      }
      if (child.props && child.props.value !== undefined) items.push(child);
    });

    return (
      <MobileSelectContent
        open={ctx.open}
        onClose={() => ctx.setOpen(false)}
        title={ctx.label}
      >
        {items.map((item, i) => (
          <MobileSelectItem
            key={item.props.value ?? i}
            value={item.props.value}
            selected={ctx.value === item.props.value}
            onSelect={(v) => {
              ctx.onChange(v);
              ctx.setOpen(false);
            }}
          >
            {item.props.children}
          </MobileSelectItem>
        ))}
      </MobileSelectContent>
    );
  }

  // Desktop: original Radix portal
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}>
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn("p-1", position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]")}>
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
})
SelectContent.displayName = "SelectContent"

/**
 * MobileAwareSelect wraps Radix Select.Root and provides context for mobile sheet.
 * Drop-in replacement for <Select> — same API.
 */
const MobileAwareSelect = ({ value, onValueChange, defaultValue, children, open: controlledOpen, onOpenChange, ...props }) => {
  const isMobile = useIsMobile();
  const [internalOpen, setInternalOpen] = useState(false);
  const [label, setLabel] = useState('');

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (v) => {
    setInternalOpen(v);
    onOpenChange?.(v);
  };

  // Extract label from SelectTrigger > SelectValue for sheet title
  // We'll derive it from children DisplayName scanning instead
  const ctx = useMemo(() => ({
    open,
    setOpen,
    value: value ?? defaultValue ?? '',
    onChange: onValueChange ?? (() => {}),
    label,
    setLabel,
  }), [open, value, defaultValue, onValueChange, label]);

  if (!isMobile) {
    // Desktop: use Radix root as-is
    return (
      <SelectPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        open={controlledOpen}
        onOpenChange={onOpenChange}
        {...props}
      >
        {children}
      </SelectPrimitive.Root>
    );
  }

  // Mobile: intercept trigger click to open sheet instead of Radix popup
  return (
    <MobileSelectContext.Provider value={ctx}>
      <SelectPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        open={false} // never open Radix popup on mobile
        onOpenChange={() => {}} // swallow Radix open attempts
        {...props}
      >
        {/* We wrap children, patching SelectTrigger onClick */}
        {React.Children.map(children, child => {
          if (!child) return child;
          // Patch SelectTrigger to open the sheet
          if (child.type?.displayName === SelectPrimitive.Trigger.displayName || child.type === SelectTrigger) {
            return React.cloneElement(child, {
              onClick: (e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(true);
                child.props.onClick?.(e);
              }
            });
          }
          return child;
        })}
      </SelectPrimitive.Root>
    </MobileSelectContext.Provider>
  );
};
MobileAwareSelect.displayName = "Select";

const SelectLabel = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props} />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}>
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props} />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  MobileAwareSelect as Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}