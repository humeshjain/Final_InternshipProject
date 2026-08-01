export const getAlertStyles = (type) => {
  switch (type) {
    case "success":
      return {
        bg: "bg-emerald-50 border-emerald-200",
        text: "text-emerald-800",
        title: "text-emerald-900",
        iconColor: "text-emerald-600",
        titleText: "Operation Completed:"
      };
    case "low_stock":
      return {
        bg: "bg-amber-50 border-amber-200",
        text: "text-amber-800",
        title: "text-amber-900",
        iconColor: "text-amber-600",
        titleText: "Inventory Alert:"
      };
    case "due":
      return {
        bg: "bg-[#5C52FB]/10 border-[#5C52FB]/20",
        text: "text-[#0F172A]",
        title: "text-[#5C52FB]",
        iconColor: "text-[#5C52FB]",
        titleText: "Khata Credit Warning:"
      };
    case "expiry":
      return {
        bg: "bg-rose-50 border-rose-200",
        text: "text-rose-800",
        title: "text-rose-900",
        iconColor: "text-rose-600",
        titleText: "Product Expiry Warning:"
      };
    case "error":
    default:
      return {
        bg: "bg-rose-50 border-rose-200",
        text: "text-rose-800",
        title: "text-rose-900",
        iconColor: "text-rose-600",
        titleText: "Critical System Warning:"
      };
  }
};
