import { Drawer } from "@mantine/core";

const ExtendedDrawer = Drawer.extend({
  classNames: {
    content: "border-t border-line-strong",
    title: "font-display text-2xl font-extrabold uppercase",
  },
});

export default ExtendedDrawer;
