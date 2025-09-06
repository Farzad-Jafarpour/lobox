import React, { useEffect, useMemo, useRef, useState } from "react";
import "./MultiSelect.scss";

export type Option = {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
};

type MultiSelectProps = {
  options: Option[];
  value: string[];
  onChange: (nextValues: string[], nextOptions?: Option[]) => void;

  placeholder?: string;
  allowCreate?: boolean;
  className?: string;
  maxDropdownHeight?: number | string;
  keepOpenOnSelect?: boolean;
  renderOption?: (opt: Option, selected: boolean) => React.ReactNode;
};

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  allowCreate = true,
  className,
  maxDropdownHeight = 280,
  keepOpenOnSelect = true,
  renderOption,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [internalOptions, setInternalOptions] = useState<Option[]>(options);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => setInternalOptions(options), [options]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const normalized = (s: string) => s.trim().toLowerCase();
  const selectedSet = useMemo(() => new Set(value), [value]);

  const filtered = useMemo(() => {
    const q = normalized(query);
    return internalOptions.filter(
      (o) =>
        q === "" ||
        normalized(o.label).includes(q) ||
        normalized(o.value).includes(q)
    );
  }, [internalOptions, query]);

  const exactMatch = useMemo(
    () =>
      internalOptions.find(
        (o) =>
          normalized(o.label) === normalized(query) ||
          normalized(o.value) === normalized(query)
      ),
    [internalOptions, query]
  );

  const canCreate =
    allowCreate &&
    query.trim().length > 0 &&
    !internalOptions.some(
      (o) =>
        normalized(o.label) === normalized(query) ||
        normalized(o.value) === normalized(query)
    );

  const visibleItems: (Option | { __create: true; label: string })[] =
    useMemo(() => {
      return canCreate
        ? [...filtered, { __create: true, label: query }]
        : filtered;
    }, [filtered, canCreate, query]);

  useEffect(() => {
    setActiveIndex(visibleItems.length > 0 ? 0 : -1);
  }, [open, query, visibleItems.length]);

  const openAndFocus = () => {
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const toggleValue = (opt: Option) => {
    if (opt.disabled) return;
    if (selectedSet.has(opt.value)) {
      const next = value.filter((v) => v !== opt.value);
      onChange(next, internalOptions);
    } else {
      const next = [...value, opt.value];
      onChange(next, internalOptions);
    }
    if (!keepOpenOnSelect) setOpen(false);
    setQuery("");
    setActiveIndex(-1);
    listRef.current?.scrollTo({ top: 0 });
  };

  const createAndSelect = (label: string) => {
    const v = label.trim();
    if (!v) return;
    const newOpt: Option = { value: v, label: v };
    const nextOptions = [...internalOptions, newOpt];
    setInternalOptions(nextOptions);
    onChange([...value, newOpt.value], nextOptions);
    setQuery("");
    if (!keepOpenOnSelect) setOpen(false);
  };

  const removeAt = (val: string) => {
    const next = value.filter((v) => v !== val);
    onChange(next, internalOptions);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!open && ["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      setOpen(true);
      return;
    }
    if (e.key === "Backspace" && query.length === 0 && value.length > 0) {
      e.preventDefault();
      removeAt(value[value.length - 1]);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(visibleItems.length - 1, i + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(visibleItems.length - 1);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const item = visibleItems[activeIndex];

      if (!item) {
        if (filtered.length > 0) toggleValue(filtered[0]);
        else if (canCreate) createAndSelect(query);
        return;
      }

      if ("__create" in item) {
        if (exactMatch) toggleValue(exactMatch);
        else createAndSelect(item.label);
      } else {
        toggleValue(item);
      }
      return;
    }
  };

  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const list = listRef.current;
    const el = list.children[activeIndex] as HTMLElement | undefined;
    if (!el) return;
    const { offsetTop, offsetHeight } = el;
    if (offsetTop < list.scrollTop) list.scrollTop = offsetTop;
    else if (offsetTop + offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = offsetTop + offsetHeight - list.clientHeight;
    }
  }, [activeIndex]);

  const renderDefaultOption = (opt: Option, selected: boolean) => (
    <div className="ms__itemMain">
      {opt.icon ? <span className="ms__icon">{opt.icon}</span> : null}
      <span className="ms__label">{opt.label}</span>
      {selected ? <span className="ms__check">✔</span> : null}
    </div>
  );

  return (
    <div
      className={`ms ${open ? "is-open" : ""} ${className ?? ""}`}
      ref={rootRef}
      aria-expanded={open}
    >
      <div
        className={`ms__control ${open ? "is-focus" : ""}`}
        role="combobox"
        aria-haspopup="listbox"
        aria-owns="ms-listbox"
        aria-expanded={open}
        onClick={openAndFocus}
      >
        <div className="ms__chips" onClick={(e) => e.stopPropagation()}>
          {value.map((val) => {
            const opt = internalOptions.find((o) => o.value === val);
            const label = opt?.label ?? val;
            return (
              <span className="ms__chip" key={val} title={label}>
                <span className="ms__chipLabel">{label}</span>
                <button
                  type="button"
                  className="ms__chipRemove"
                  aria-label={`Remove ${label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAt(val);
                  }}
                >
                  ×
                </button>
              </span>
            );
          })}
          <input
            type="text"
            autoComplete="off"
            ref={inputRef}
            className="ms__input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setOpen(true)}
            placeholder={value.length === 0 ? placeholder : ""}
            aria-autocomplete="list"
          />
        </div>

        <span className="ms__arrow" aria-hidden />
      </div>

      {open && (
        <div
          className="ms__menu"
          role="presentation"
          style={{ maxHeight: maxDropdownHeight }}
        >
          <ul id="ms-listbox" className="ms__list" role="listbox" ref={listRef}>
            {visibleItems.length === 0 && (
              <li className="ms__empty" aria-disabled="true">
                No options
              </li>
            )}

            {visibleItems.map((item, idx) => {
              const active = idx === activeIndex;
              if ("__create" in item) {
                return (
                  <li
                    key={`__create-${item.label}`}
                    role="option"
                    aria-selected={false}
                    className={`ms__item ms__create ${
                      active ? "is-active" : ""
                    }`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      if (exactMatch) toggleValue(exactMatch);
                      else createAndSelect(item.label);
                    }}
                  >
                    <div className="ms__itemMain">
                      <span className="ms__label">
                        Create “{item.label.trim()}”
                      </span>
                    </div>
                  </li>
                );
              }
              const selected = selectedSet.has(item.value);
              return (
                <li
                  key={item.value}
                  role="option"
                  aria-selected={selected}
                  className={`ms__item ${active ? "is-active" : ""} ${
                    item.disabled ? "is-disabled" : ""
                  }`}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => toggleValue(item)}
                >
                  {renderOption
                    ? renderOption(item, selected)
                    : renderDefaultOption(item, selected)}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
