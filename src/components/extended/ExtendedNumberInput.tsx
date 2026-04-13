import { NumberInput } from "@mantine/core";

const ExtendedNumberInput = NumberInput.extend({
  classNames: {
    input: "rounded-lg shadow-sm",
  },
});

export default ExtendedNumberInput;
