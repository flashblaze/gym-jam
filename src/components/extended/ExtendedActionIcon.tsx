import { ActionIcon } from "@mantine/core";

const ExtendedActionIcon = ActionIcon.extend({
  defaultProps: {
    classNames: {
      // The invisible ::after ring grows the tap target by 5px per side (34px "lg" → 44px)
      // without changing the visual size; ActionIcon clips overflow by default.
      root: "overflow-visible after:absolute after:-inset-[5px] after:content-['']",
    },
  },
});

export default ExtendedActionIcon;
