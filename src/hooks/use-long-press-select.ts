import { useLongPress } from "@mantine/hooks";
import { type MouseEvent, useRef } from "react";

/**
 * Long-press handlers for list items that enter selection mode. Cancels when the finger moves
 * (scrolling) and swallows the click that ends a long press.
 */
export function useLongPressSelect(onLongPress: () => void) {
  const suppressClick = useRef(false);
  const longPress = useLongPress(() => {
    suppressClick.current = true;
    onLongPress();
  });

  return {
    handlers: {
      ...longPress,
      onTouchMove: longPress.onTouchEnd,
      onTouchCancel: longPress.onTouchEnd,
      onContextMenu: (e: MouseEvent) => e.preventDefault(),
    },
    /** True (once) when this click ended a long press and should be ignored. */
    consumeClick: () => {
      if (!suppressClick.current) return false;
      suppressClick.current = false;
      return true;
    },
  };
}
