import { type MantineColorsTuple, createTheme } from "@mantine/core";

import {
  ExtendedActionIcon,
  ExtendedButton,
  ExtendedMenu,
  ExtendedModal,
  ExtendedNotification,
  ExtendedNumberInput,
  ExtendedPopover,
  ExtendedSelect,
  ExtendedTextInput,
} from "./components/extended/index";

// Amber. Tailwind's `primary-*` utilities read these through CSS variables (see index.css).
const primary: MantineColorsTuple = [
  "#fffbeb",
  "#fef3c7",
  "#fde68a",
  "#fcd34d",
  "#fbbf24",
  "#f59e0b",
  "#d97706",
  "#b45309",
  "#92400e",
  "#78350f",
];

// Deep dark, slightly cool-toned
const dark: MantineColorsTuple = [
  "#d4d4e0", // 0 — body text
  "#a8a8bc", // 1
  "#7e7e96", // 2
  "#565670", // 3
  "#333348", // 4
  "#232334", // 5 — inputs / elevated
  "#18182a", // 6 — card surface
  "#0f0f1c", // 7 — body background
  "#0a0a14", // 8
  "#06060c", // 9
];

const theme = createTheme({
  fontFamily: '"Geist Variable", sans-serif',
  headings: { fontFamily: '"Geist Variable", sans-serif' },
  primaryColor: "primary",
  primaryShade: { light: 6, dark: 5 },
  autoContrast: true,
  colors: { primary, dark },
  components: {
    Button: ExtendedButton,
    TextInput: ExtendedTextInput,
    NumberInput: ExtendedNumberInput,
    Select: ExtendedSelect,
    Notification: ExtendedNotification,
    ActionIcon: ExtendedActionIcon,
    Modal: ExtendedModal,
    Menu: ExtendedMenu,
    Popover: ExtendedPopover,
  },
});

export default theme;
