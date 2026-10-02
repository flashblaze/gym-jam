import { NumberInput } from "@mantine/core";

import { INPUT_CLASSNAMES } from "./input-classnames";

const ExtendedNumberInput = NumberInput.extend({
  classNames: INPUT_CLASSNAMES,
});

export default ExtendedNumberInput;
