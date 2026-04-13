import { DateInput } from "@mantine/dates";

const ExtendedDateInput = DateInput.extend({
  classNames: {
    input: "rounded-lg shadow-sm",
  },
});

export default ExtendedDateInput;
