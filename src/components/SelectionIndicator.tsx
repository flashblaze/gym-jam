import IconTablerCheck from "~icons/tabler/check";

import { cn } from "~/cn";

interface SelectionIndicatorProps {
  selected: boolean;
}

const SelectionIndicator = ({ selected }: SelectionIndicatorProps) => {
  return (
    <span className="flex items-center pr-3">
      <span
        className={cn(
          "flex h-6 w-6 items-center justify-center transition-colors duration-150",
          selected ? "bg-primary-500" : "border-2 border-line-strong",
        )}
      >
        {selected && <IconTablerCheck className="text-base text-surface" />}
      </span>
    </span>
  );
};

export default SelectionIndicator;
