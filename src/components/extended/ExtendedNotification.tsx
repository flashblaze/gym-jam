import { Notification } from "@mantine/core";

const ExtendedNotification = Notification.extend({
  defaultProps: {
    classNames: {
      root: "bg-surface-raised",
      title: "font-display text-base font-bold uppercase tracking-[0.06em]",
    },
    withBorder: true,
  },
});

export default ExtendedNotification;
