import { TextInput } from "@mantine/core";

import { INPUT_CLASSNAMES } from "./input-classnames";

const ExtendedTextInput = TextInput.extend({
  classNames: INPUT_CLASSNAMES,
});

export default ExtendedTextInput;
