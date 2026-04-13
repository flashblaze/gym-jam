import { Textarea } from "@mantine/core";

const ExtendedTextarea = Textarea.extend({
  classNames: {
    input: "rounded-lg shadow-md",
  },
});

export default ExtendedTextarea;
