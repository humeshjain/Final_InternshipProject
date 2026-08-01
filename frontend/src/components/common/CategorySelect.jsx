import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Layers, Check, Tag } from "lucide-react";

export default function CategorySelect({
  categories = [],
  value = "", // categoryId or categoryName
  onChange,   // (categoryObj) => void
  disabled = false,
  placeholder = "Select Catalog Category...",
  showInactive = false,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);

  // Available categories based on active status unless showInactive is true
  const availableCategories = useMemo(() => {
    return categories.filter(c => {
      if (showInactive) return true;
      const status = (c.status || "Active").toLowerCase();
      return status === "active";
    });
  }, [categories, showInactive]);

  // Selected category object lookup
  const selectedCategory = useMemo(() => {
    if (!value) return null;
    return categories.find(c => c.id === value || c.name.toLowerCase() === String(value).toLowerCase()) || null;
  }, [categories, value]);

  // Filtered categories according to query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return availableCategories;
    const q = searchQuery.toLowerCase();
    return availableCategories.filter(c => 
      (c.name || "").toLowerCase().includes(q) ||
      (c.code || "").toLowerCase().includes(q) ||
      (c.description || "").toLowerCase().includes(q)
    );
  }, [availableCategories, searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (cat) => {
    if (disabled) return;
    onChange(cat);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {/* Target Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-[#F8FAFC] border ${
          isOpen ? "border-[#5C52FB]" : "border-[#E2E8F0]"
        } rounded-xl px-3 py-2.5 text-xs text-left flex items-center justify-between gap-2 text-[#0F172A] transition-all focus:outline-none ${
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-slate-300"
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden truncate">
          <Layers className="w-4 h-4 text-[#5C52FB] shrink-0" />
          {selectedCategory ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-[#0F172A] truncate">{selectedCategory.name}</span>
              <span className="px-1.5 py-0.5 bg-purple-50 text-[#5C52FB] font-mono text-[9px] font-bold rounded border border-purple-200 shrink-0">
                {selectedCategory.code || "CAT-GEN"}
              </span>
              {selectedCategory.status === "Inactive" && (
                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold rounded border border-amber-200 shrink-0">
                  Archived
                </span>
              )}
            </div>
          ) : (
            <span className="text-[#94A3B8] font-medium">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-[#64748B] shrink-0 transition-transform ${isOpen ? "rotate-180 text-[#5C52FB]" : ""}`} />
      </button>

      {/* Autocomplete Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Input Box */}
          <div className="p-2 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#64748B] shrink-0 ml-1" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search category name or code..."
              className="w-full bg-transparent text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none py-1 font-medium"
            />
          </div>

          {/* List Options */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 p-1">
            {filteredCategories.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#64748B]">
                No matching categories found in master catalog.
              </div>
            ) : (
              filteredCategories.map(cat => {
                const isSelected = selectedCategory && selectedCategory.id === cat.id;
                const isArchived = cat.status === "Inactive";

                return (
                  <div
                    key={cat.id}
                    onClick={() => handleSelect(cat)}
                    className={`p-2.5 rounded-lg flex items-center justify-between gap-2 transition-colors cursor-pointer text-xs ${
                      isSelected 
                        ? "bg-purple-50 text-[#5C52FB] border border-purple-200" 
                        : "hover:bg-slate-50 text-slate-700 hover:text-[#0F172A]"
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Tag className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-[#5C52FB]" : "text-[#94A3B8]"}`} />
                      <div className="truncate">
                        <div className="font-bold flex items-center gap-2">
                          <span className="truncate">{cat.name}</span>
                          <span className="px-1.5 py-0.2 bg-white text-[#5C52FB] font-mono text-[9px] font-bold rounded border border-[#E2E8F0] shrink-0">
                            {cat.code || "CAT-GEN"}
                          </span>
                        </div>
                        {cat.description && (
                          <div className="text-[10px] text-[#64748B] truncate mt-0.5">{cat.description}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isArchived && (
                        <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold rounded border border-amber-200">
                          Inactive
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-[#5C52FB] stroke-[3]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
