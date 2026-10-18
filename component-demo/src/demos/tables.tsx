import { useState } from 'react';
import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type SortingState,
} from '@tanstack/react-table';
import { Virtuoso } from 'react-virtuoso';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { Tree, type NodeRendererProps } from 'react-arborist';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { WhatsappIcon, WhatsappShareButton, EmailIcon, EmailShareButton } from 'react-share';
import { Demo } from '../components/Demo';

/* C102 TanStack Table (sortable partner table) */
type Partner = { name: string; service: string; area: string; rating: number; fromEur: number };

const PARTNER_ROWS: Partner[] = [
  {
    name: 'Quick Movers',
    service: 'Moving, van and crew',
    area: 'Helsinki region',
    rating: 4.8,
    fromEur: 390,
  },
  {
    name: 'Van Rental Pasila',
    service: 'Van rental',
    area: 'Helsinki, Espoo',
    rating: 4.4,
    fromEur: 79,
  },
  {
    name: 'FirstVet Clinic',
    service: 'Pet care, video visit',
    area: 'Finland',
    rating: 4.9,
    fromEur: 45,
  },
  {
    name: 'Anticimex',
    service: 'Pest control check',
    area: 'Nationwide',
    rating: 4.6,
    fromEur: 120,
  },
  {
    name: 'Verisure',
    service: 'Alarm install before move-in',
    area: 'Nationwide',
    rating: 4.5,
    fromEur: 0,
  },
  {
    name: 'Clean Team Oy',
    service: 'Move-out cleaning',
    area: 'Helsinki, Vantaa',
    rating: 4.3,
    fromEur: 220,
  },
];

const partnerFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
});
const partnerHelper = createColumnHelper<typeof partnerFeatures, Partner>();
const PARTNER_COLUMNS = partnerHelper.columns([
  partnerHelper.accessor('name', { header: 'Partner' }),
  partnerHelper.accessor('service', { header: 'Service' }),
  partnerHelper.accessor('area', { header: 'Area' }),
  partnerHelper.accessor('rating', { header: 'Rating' }),
  partnerHelper.accessor('fromEur', { header: 'From (€)' }),
]);

function PartnerTable() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'rating', desc: true }]);
  const table = useTable({
    features: partnerFeatures,
    columns: PARTNER_COLUMNS,
    data: PARTNER_ROWS,
    state: { sorting },
    onSortingChange: setSorting,
  });

  return (
    <div className="b3-table-wrap">
      <table className="b3-table">
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => {
                const sort = header.column.getIsSorted();
                return (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className="b3-table__sort"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <table.FlexRender header={header} />
                        <span aria-hidden="true">
                          {sort === 'asc' ? ' ▲' : sort === 'desc' ? ' ▼' : ''}
                        </span>
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getAllCells().map((cell) => (
                <td key={cell.id}>
                  <table.FlexRender cell={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* C103 React Virtuoso (virtualized partner directory) */
const DIRECTORY = Array.from({ length: 5000 }, (_, i) => {
  const kinds = ['Movers', 'Cleaners', 'Vets', 'Van rental', 'Storage', 'Locksmith'];
  const towns = ['Helsinki', 'Espoo', 'Vantaa', 'Tampere', 'Turku', 'Oulu', 'Lahti'];
  return {
    id: i + 1,
    name: `${kinds[i % kinds.length]} ${String(i + 1).padStart(4, '0')}`,
    town: towns[(i * 3) % towns.length],
  };
});

function DirectoryDemo() {
  return (
    <div className="b3-virtuoso">
      <Virtuoso
        style={{ height: 260 }}
        totalCount={DIRECTORY.length}
        itemContent={(index) => {
          const entry = DIRECTORY[index];
          return (
            <div className="b3-virtuoso__row">
              <span>{entry.name}</span>
              <span className="b3-hint">{entry.town}</span>
            </div>
          );
        }}
      />
      <p className="b3-hint">
        {DIRECTORY.length.toLocaleString('fi-FI')} partners. Only visible rows are rendered.
      </p>
    </div>
  );
}

/* C104 React Resizable Panels (checklist left, map right) */
function SplitDemo() {
  return (
    <Group orientation="horizontal" className="b3-split">
      <Panel defaultSize="45%" minSize="25%">
        <div className="b3-split__pane">
          <strong>Checklist</strong>
          <ul className="plain-list b3-steps">
            <li>Book movers (6 weeks)</li>
            <li>Notify landlord (4 weeks)</li>
            <li>Parking permit (1 week)</li>
          </ul>
        </div>
      </Panel>
      <Separator className="b3-split__handle" />
      <Panel defaultSize="55%" minSize="25%">
        <div className="b3-split__pane b3-split__pane--map" aria-label="Map placeholder">
          <span className="b3-hint">Map: Kallio to Espoo, 14 km</span>
        </div>
      </Panel>
    </Group>
  );
}

/* C105 React Arborist (nested checklist tree with keyboard navigation) */
type TreeNode = { id: string; name: string; children?: TreeNode[] };

const CHECKLIST_TREE: TreeNode[] = [
  {
    id: 'before',
    name: 'Before the move',
    children: [
      { id: 'b1', name: 'Book movers' },
      { id: 'b2', name: 'Order boxes and tape' },
      { id: 'b3', name: 'Notify landlord in writing' },
    ],
  },
  {
    id: 'day',
    name: 'Moving day',
    children: [
      { id: 'd1', name: 'Van parking permit' },
      { id: 'd2', name: 'Cat carrier in the car first' },
      { id: 'd3', name: 'Photograph meters and empty rooms' },
    ],
  },
  {
    id: 'after',
    name: 'After the move',
    children: [{ id: 'a1', name: 'Send address change' }],
  },
];

function TreeRow({ node, style, dragHandle }: NodeRendererProps<TreeNode>) {
  const isFolder = !node.isLeaf;
  return (
    <div
      style={style}
      ref={dragHandle}
      className={node.isSelected ? 'b3-tree__row is-selected' : 'b3-tree__row'}
      onClick={() => node.isInternal && node.toggle()}
    >
      <span aria-hidden="true">{isFolder ? (node.isOpen ? '▾' : '▸') : '•'}</span> {node.data.name}
    </div>
  );
}

function TreeDemo() {
  return (
    <div className="b3-tree">
      <Tree<TreeNode>
        data={CHECKLIST_TREE}
        width={360}
        height={220}
        rowHeight={30}
        indent={18}
        openByDefault
      >
        {TreeRow}
      </Tree>
      <p className="b3-hint">Click a phase to open it. Arrow keys move through the tree.</p>
    </div>
  );
}

/* C106 @hello-pangea/dnd (kanban between columns) */
type Card = { id: string; text: string };
type Board = Record<'todo' | 'booked' | 'done', Card[]>;

const COLUMN_TITLES: Record<keyof Board, string> = {
  todo: 'To do',
  booked: 'Booked',
  done: 'Done',
};

const INITIAL_BOARD: Board = {
  todo: [
    { id: 'k1', text: 'Compare three mover quotes' },
    { id: 'k2', text: 'Ask about parking for the van' },
  ],
  booked: [{ id: 'k3', text: 'Cleaning crew, 14 Nov' }],
  done: [{ id: 'k4', text: 'Address change form' }],
};

function KanbanDemo() {
  const [board, setBoard] = useState<Board>(INITIAL_BOARD);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    const from = source.droppableId as keyof Board;
    const to = destination.droppableId as keyof Board;
    if (from === to && source.index === destination.index) return;

    setBoard((prev) => {
      const next: Board = { todo: [...prev.todo], booked: [...prev.booked], done: [...prev.done] };
      const [moved] = next[from].splice(source.index, 1);
      next[to].splice(destination.index, 0, moved);
      return next;
    });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="b3-kanban">
        {(Object.keys(COLUMN_TITLES) as (keyof Board)[]).map((col) => (
          <div key={col} className="b3-kanban__col">
            <h3 className="b3-kanban__title">
              {COLUMN_TITLES[col]} <span className="b3-hint">({board[col].length})</span>
            </h3>
            <Droppable droppableId={col}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={
                    snapshot.isDraggingOver ? 'b3-kanban__list is-over' : 'b3-kanban__list'
                  }
                >
                  {board[col].map((card, index) => (
                    <Draggable key={card.id} draggableId={card.id} index={index}>
                      {(dragProvided, dragSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className={
                            dragSnapshot.isDragging
                              ? 'b3-kanban__card is-dragging'
                              : 'b3-kanban__card'
                          }
                        >
                          {card.text}
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
  );
}

/* C107 React Share (share the plan) */
const PLAN_URL = 'https://lifemoments.example/plan/MOVE-2026-1142';

function ShareDemo() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PLAN_URL);
      setCopied('Link copied');
    } catch {
      setCopied('Copy is blocked here. Select the link above instead.');
    }
  };
  return (
    <div className="b3-stack">
      <p className="b3-hint">{PLAN_URL}</p>
      <div className="row">
        <WhatsappShareButton url={PLAN_URL} message="My move plan:" separator=" ">
          <WhatsappIcon size={32} />
        </WhatsappShareButton>
        <EmailShareButton url={PLAN_URL} subject="My move plan" body="Here is my move checklist:">
          <EmailIcon size={32} />
        </EmailShareButton>
        <button type="button" className="btn" onClick={copy}>
          Copy link
        </button>
      </div>
      {copied && (
        <p className="b3-hint" role="status">
          {copied}
        </p>
      )}
    </div>
  );
}

export function TablesGroup() {
  return (
    <>
      <Demo id="C102" title="Sortable partner table" lib="@tanstack/react-table">
        <PartnerTable />
      </Demo>
      <Demo id="C103" title="Virtualized partner directory" lib="react-virtuoso">
        <DirectoryDemo />
      </Demo>
      <Demo id="C104" title="Checklist and map split" lib="react-resizable-panels">
        <SplitDemo />
      </Demo>
      <Demo id="C105" title="Nested checklist tree" lib="react-arborist">
        <TreeDemo />
      </Demo>
      <Demo id="C106" title="Drag tasks between columns" lib="@hello-pangea/dnd">
        <KanbanDemo />
      </Demo>
      <Demo id="C107" title="Share the plan" lib="react-share">
        <ShareDemo />
      </Demo>
    </>
  );
}
