import { Popover, UnstyledButton } from "@mantine/core";
import type { ReactNode } from "react";
import IconSolarInfoCircleBroken from "~icons/solar/info-circle-broken";

interface InfoHintProps {
  /** What is being explained, for the button's accessible name. */
  term: string;
  children: ReactNode;
}

/** A small ⓘ that opens a one-line explanation on tap (tooltips don't open on touch). */
const InfoHint = ({ term, children }: InfoHintProps) => (
  <Popover width={260} position="top" withArrow shadow="md">
    <Popover.Target>
      {/* Negative margin keeps the 14px icon in the label's flow while the tap area is ~44px. */}
      <UnstyledButton
        aria-label={`What is ${term}?`}
        className="-m-3.5 inline-flex p-3.5 align-middle text-fg-faint hover:text-fg"
      >
        <IconSolarInfoCircleBroken className="text-sm" />
      </UnstyledButton>
    </Popover.Target>
    <Popover.Dropdown>
      <p className="text-sm normal-case tracking-normal text-fg-muted">{children}</p>
    </Popover.Dropdown>
  </Popover>
);

export default InfoHint;
