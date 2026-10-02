import { type ReactNode, useEffect, useState } from "react";

interface DelayedProps {
  /** How long to wait before rendering; local data usually arrives well within this. */
  ms?: number;
  children: ReactNode;
}

/** Renders `children` (a loading skeleton) only if loading takes noticeably long. */
const Delayed = ({ ms = 150, children }: DelayedProps) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), ms);
    return () => clearTimeout(id);
  }, [ms]);
  return visible ? children : null;
};

export default Delayed;
