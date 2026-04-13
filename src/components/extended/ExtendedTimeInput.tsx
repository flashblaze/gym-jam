import { TimeInput } from "@mantine/dates";

const ExtendedTimeInput = TimeInput.extend({
  classNames: {
    input: "rounded-lg shadow-sm",
  },
});

export default ExtendedTimeInput;
