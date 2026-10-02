import { Modal } from "@mantine/core";

const ExtendedModal = Modal.extend({
  classNames: {
    content: "border border-line-strong",
    title: "font-display text-2xl font-extrabold uppercase",
  },
});

export default ExtendedModal;
