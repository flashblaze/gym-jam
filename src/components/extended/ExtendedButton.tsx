import { Button } from "@mantine/core";

const ExtendedButton = Button.extend({
  defaultProps: {
    classNames: {
      root: "font-bold uppercase tracking-[0.1em]",
    },
  },
});

export default ExtendedButton;
