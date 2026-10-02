import IconTablerCheck from "~icons/tabler/check";

import { cn } from "~/cn";

interface SelectionIndicatorProps {
  selected: boolean;
}

const SelectionIndicator = ({ selected }: SelectionIndicatorProps) => {
  return (
    <span className="flex items-center pl-3 pr-2">
      <span
        className={cn(
          "flex h-[22px] w-[22px] items-center justify-center rounded-full transition-all duration-150",
          selected ? "bg-primary-500" : "border-2 border-line-strong",
        )}
      >
        {selected && <IconTablerCheck className="text-sm text-surface" />}
      </span>
    </span>
  );
};

export default SelectionIndicator;
