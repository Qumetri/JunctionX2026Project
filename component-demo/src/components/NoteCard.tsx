import type { ReactNode } from 'react';
import { Demo } from './Demo';

type NoteCardProps = {
  id: string;
  title: string;
  lib: string;
  reason: string;
};

/** Stands in for a demo that cannot run here: a package that fails to install or to work with React 19. */
export function NoteCard({ id, title, lib, reason }: NoteCardProps) {
  return (
    <Demo id={id} title={title} lib={lib}>
      <div className="note-card" role="note">
        <strong>Not shown.</strong> {reason}
      </div>
    </Demo>
  );
}

/** Inline fallback for a live demo whose network or device is unavailable. */
export function Unavailable({ children }: { children: ReactNode }) {
  return (
    <div className="note-card" role="status">
      {children}
    </div>
  );
}
