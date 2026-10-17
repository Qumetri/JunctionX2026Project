import type { ReactNode } from 'react';

type DemoProps = {
  id: string;
  title: string;
  lib: string;
  children: ReactNode;
};

/** One live example. The ID (C01, C02, ...) is shown on the page and listed in componentReview.md. */
export function Demo({ id, title, lib, children }: DemoProps) {
  return (
    <div className="demo" id={id}>
      <p className="demo__title">
        <span className="demo__id">{id}</span>
        {title}
      </p>
      <p className="demo__lib">{lib}</p>
      {children}
    </div>
  );
}
