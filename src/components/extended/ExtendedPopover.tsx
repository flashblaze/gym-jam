import { Popover } from "@mantine/core";

const ExtendedPopover = Popover.extend({
  classNames: {
    dropdown: "border-line-strong",
  },
});

export default ExtendedPopover;
