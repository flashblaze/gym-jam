import { type MantineColorsTuple, createTheme } from "@mantine/core";

import {
  ExtendedActionIcon,
  ExtendedButton,
  ExtendedDrawer,
  ExtendedMenu,
  ExtendedModal,
  ExtendedNotification,
  ExtendedNumberInput,
  ExtendedPopover,
  ExtendedSelect,
  ExtendedTextInput,
} from "./components/extended/index";

// Scoreboard: electric lime on near-black. Tailwind's `primary-*`, `fg-*`, `surface-*` and `line-*`
// utilities read these through CSS variables (see index.css), so this file is the only place hexes live.
export const primary: MantineColorsTuple = [
  "#F7FDE3",
  "#EEFBC4",
  "#E2F894",
  "#D5F65F",
  "#CCF545",
  "#C6F432", // 5 — accent
  "#AED61F",
  "#8DAF14",
  "#6B860D",
  "#4A5D07",
];

export const dark: MantineColorsTuple = [
  "#F2F2EE", // 0 — text
  "#C9C9C2", // 1 — muted text
  "#A3A39B", // 2 — subtle text
  "#8E8E86", // 3 — faint text (still ≥ 4.5:1 on every surface)
  "#6A6A64", // 4 — strong line / input border (≥ 3:1 on page and raised surfaces)
  "#1F1F1F", // 5 — hover / selected surface
  "#151515", // 6 — raised surface
  "#0A0A0A", // 7 — page background
  "#050505", // 8
  "#000000", // 9
];

const theme = createTheme({
  fontFamily: '"Barlow", sans-serif',
  headings: { fontFamily: '"Barlow Condensed", sans-serif', fontWeight: "800" },
  primaryColor: "primary",
  primaryShade: { light: 6, dark: 5 },
  autoContrast: true,
  cursorType: "pointer",
  defaultRadius: "xs",
  radius: { xs: "2px", sm: "2px", md: "3px", lg: "4px", xl: "6px" },
  colors: { primary, dark },
  components: {
    Button: ExtendedButton,
    TextInput: ExtendedTextInput,
    NumberInput: ExtendedNumberInput,
    Select: ExtendedSelect,
    Notification: ExtendedNotification,
    ActionIcon: ExtendedActionIcon,
    Modal: ExtendedModal,
    Drawer: ExtendedDrawer,
    Menu: ExtendedMenu,
    Popover: ExtendedPopover,
  },
});

export default theme;
