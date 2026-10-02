import { Select } from "@mantine/core";

import { INPUT_CLASSNAMES } from "./input-classnames";

const ExtendedSelect = Select.extend({
  classNames: {
    ...INPUT_CLASSNAMES,
    dropdown: "border-line-strong",
  },
  defaultProps: {
    allowDeselect: false,
  },
});

export default ExtendedSelect;
