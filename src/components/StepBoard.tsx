import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { stepColumns, type StepBoard as Board, type StepColumn } from '../state/useStoredSet';
import { LiquidMeter } from './LiquidMeter';
import './StepBoard.css';

type StepItem = { id: string; label: string; hint?: string };

const columnTitles: Record<StepColumn, string> = {
  todo: 'To do',
  done: 'Done',
};

/** Puts each step in its saved column and order. Unknown ids are dropped, new steps go to To do. */
function arrange(items: StepItem[], board: Board) {
  const known = new Set(items.map((item) => item.id));
  const seen = new Set<string>();
  const ids: Board = { todo: [], done: [] };

  for (const column of stepColumns) {
    for (const id of board[column]) {
      if (known.has(id) && !seen.has(id)) {
        seen.add(id);
        ids[column].push(id);
      }
    }
  }
  for (const item of items) {
    if (!seen.has(item.id)) ids.todo.push(item.id);
  }

  const byId = new Map(items.map((item) => [item.id, item]));
  const lanes = (column: StepColumn) =>
    ids[column].map((id) => byId.get(id)).filter((item): item is StepItem => item !== undefined);
  return { ids, lanes };
}

/** Kanban board of preparation steps: drag a card between To do and Done. */
export function StepBoard({
  id,
  title,
  items,
  board,
  onChange,
}: {
  id: string;
  title: string;
  items: StepItem[];
  board: Board;
  onChange: (board: Board) => void;
}) {
  const { ids, lanes } = arrange(items, board);
  const doneCount = ids.done.length;
  const percent = items.length === 0 ? 0 : Math.round((doneCount / items.length) * 100);

  const onDragEnd = ({ draggableId, source, destination }: DropResult) => {
    if (!destination) return;
    const from = source.droppableId as StepColumn;
    const to = destination.droppableId as StepColumn;
    if (from === to && source.index === destination.index) return;

    const next: Board = { todo: [...ids.todo], done: [...ids.done] };
    next[from].splice(source.index, 1);
    next[to].splice(destination.index, 0, draggableId);
    onChange(next);
  };

  return (
    <section className="step-board" id={id} aria-labelledby={`${id}-title`}>
      <div className="step-board__head">
        <h2 id={`${id}-title`}>{title}</h2>
        <div className="step-board__progress">
          <span>
            {doneCount} of {items.length} done
          </span>
          <LiquidMeter value={percent} variant="progress" label={`${title} progress`} />
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="step-board__columns">
          {stepColumns.map((column) => (
            <div key={column} className={`step-board__col step-board__col--${column}`}>
              <h3 className="step-board__title">
                {columnTitles[column]} <span>({ids[column].length})</span>
              </h3>
              <Droppable droppableId={column}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={
                      snapshot.isDraggingOver ? 'step-board__list is-over' : 'step-board__list'
                    }
                  >
                    {lanes(column).map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={
                              dragSnapshot.isDragging
                                ? 'step-board__card is-dragging'
                                : 'step-board__card'
                            }
                          >
                            <span className="step-board__label">{item.label}</span>
                            {item.hint && <span className="step-board__hint">{item.hint}</span>}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </section>
  );
}
