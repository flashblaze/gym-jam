import { type MantineColorsTuple, createTheme } from "@mantine/core";

import {
  ExtendedActionIcon,
  ExtendedAvatar,
  ExtendedButton,
  ExtendedCard,
  ExtendedCheckbox,
  ExtendedColorPicker,
  ExtendedDateInput,
  ExtendedDatePickerInput,
  ExtendedDateTimePicker,
  ExtendedMenu,
  ExtendedModal,
  ExtendedMultiSelect,
  ExtendedNotification,
  ExtendedNumberInput,
  ExtendedPasswordInput,
  ExtendedPinInput,
  ExtendedPopover,
  ExtendedSelect,
  ExtendedTextInput,
  ExtendedTextarea,
  ExtendedTimeInput,
} from "./components/extended/index";

// Black — high contrast, clean against the dark UI
const primary: MantineColorsTuple = [
  "#f5f5f5",
  "#e0e0e0",
  "#bdbdbd",
  "#9e9e9e",
  "#757575",
  "#424242",
  "#212121",
  "#111111",
  "#0a0a0a",
  "#000000",
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
  primaryShade: { light: 5, dark: 4 },
  colors: { primary, dark },
  components: {
    Button: ExtendedButton,
    TextInput: ExtendedTextInput,
    NumberInput: ExtendedNumberInput,
    DateInput: ExtendedDateInput,
    PasswordInput: ExtendedPasswordInput,
    Card: ExtendedCard,
    ColorPicker: ExtendedColorPicker,
    Select: ExtendedSelect,
    DateTimePicker: ExtendedDateTimePicker,
    Notification: ExtendedNotification,
    Avatar: ExtendedAvatar,
    ActionIcon: ExtendedActionIcon,
    PinInput: ExtendedPinInput,
    DatePickerInput: ExtendedDatePickerInput,
    Checkbox: ExtendedCheckbox,
    Modal: ExtendedModal,
    Menu: ExtendedMenu,
    MultiSelect: ExtendedMultiSelect,
    Popover: ExtendedPopover,
    TimeInput: ExtendedTimeInput,
    Textarea: ExtendedTextarea,
  },
});

export default theme;
