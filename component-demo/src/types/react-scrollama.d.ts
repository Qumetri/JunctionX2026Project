// react-scrollama ships no types and has no @types package, so the parts used by the demo are declared here.
declare module 'react-scrollama' {
  import type { ReactElement, ReactNode } from 'react';

  export type ScrollamaStepEvent = {
    data: unknown;
    element: Element;
    direction: 'up' | 'down';
  };

  export type ScrollamaProps = {
    offset?: number;
    debug?: boolean;
    children?: ReactNode;
    onStepEnter?: (event: ScrollamaStepEvent) => void;
    onStepExit?: (event: ScrollamaStepEvent) => void;
  };

  export function Scrollama(props: ScrollamaProps): ReactElement;
  export function Step(props: { data: unknown; children?: ReactNode }): ReactElement;
}
