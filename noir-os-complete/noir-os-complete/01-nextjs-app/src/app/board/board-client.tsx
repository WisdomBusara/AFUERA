"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor, useSensor, useSensors,
  useDroppable, closestCorners,
  type DragStartEvent, type DragOverEvent, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";
import { Stage } from "@prisma/client";
import { STAGES } from "@/lib/constants";
import type { CardDTO } from "@/lib/types";
import { CardBody } from "./content-card";
import { CardDrawer } from "@/components/card-drawer";
import { CreateCardDialog } from "@/components/create-card-dialog";
import { moveCard, rescheduleCard } from "./actions";

type Campaign = { id: string; name: string; color: string };
type Member = { id: string; name: string; initials: string; color: string };

type ColumnMap = Record<Stage, CardDTO[]>;

function groupByStage(cards: CardDTO[]): ColumnMap {
  const map = Object.fromEntries(STAGES.map((s) => [s.key, [] as CardDTO[]])) as ColumnMap;
  for (const c of cards) map[c.stage]?.push(c);
  for (const s of STAGES) map[s.key].sort((a, b) => a.position - b.position);
  return map;
}

function SortableCard({ card, onOpen }: { card: CardDTO; onOpen: (c: CardDTO) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", stage: card.stage },
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={"afa-card" + (isDragging ? " dragging" : "")}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(card)}
    >
      <CardBody card={card} />
    </div>
  );
}

function Column({
  stage, cards, onOpen, onAdd,
}: {
  stage: (typeof STAGES)[number];
  cards: CardDTO[];
  onOpen: (c: CardDTO) => void;
  onAdd: (stage: Stage) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key, data: { type: "column", stage: stage.key } });
  const over = stage.wip != null && cards.length > stage.wip;

  return (
    <section className="afa-col">
      <div className="afa-col-h">
        <span className="afa-sdot" style={{ background: stage.color }} />
        <span className="text-[12.5px] font-semibold">{stage.label}</span>
        <span className="mono text-[11px] text-[var(--afa-ink-3)]">{cards.length}</span>
        {stage.wip != null && (
          <span className={"afa-wip" + (over ? " over" : "")}>WIP {cards.length}/{stage.wip}</span>
        )}
      </div>
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className={"afa-drop" + (isOver ? " over" : "")}>
          {cards.map((c) => (
            <SortableCard key={c.id} card={c} onOpen={onOpen} />
          ))}
          <button className="afa-addcard" type="button" onClick={() => onAdd(stage.key)}>
            <Plus size={13} /> Add card
          </button>
        </div>
      </SortableContext>
    </section>
  );
}

export function BoardClient({
  initialCards,
  campaigns,
  members,
}: {
  initialCards: CardDTO[];
  campaigns: Campaign[];
  members: Member[];
}) {
  const [columns, setColumns] = useState<ColumnMap>(() => groupByStage(initialCards));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<CardDTO | null>(null);
  // Non-null = composer open with this default stage.
  const [composerStage, setComposerStage] = useState<Stage | null>(null);
  const [pending, startTransition] = useTransition();

  // The top-bar "Create" button (in the shared shell) opens the composer.
  useEffect(() => {
    const onCreate = () => setComposerStage(Stage.IDEAS);
    window.addEventListener("afuera:create", onCreate);
    return () => window.removeEventListener("afuera:create", onCreate);
  }, []);

  // Mirror latest columns so event handlers can compute without stale closures
  // and without side effects inside a state updater.
  const columnsRef = useRef(columns);
  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeCard = useMemo(() => {
    if (!activeId) return null;
    for (const s of STAGES) {
      const found = columns[s.key].find((c) => c.id === activeId);
      if (found) return found;
    }
    return null;
  }, [activeId, columns]);

  const findStage = (id: string): Stage | null => {
    if (STAGES.some((s) => s.key === id)) return id as Stage;
    for (const s of STAGES) if (columns[s.key].some((c) => c.id === id)) return s.key;
    return null;
  };

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeStage = findStage(String(active.id));
    const overStage = findStage(String(over.id));
    if (!activeStage || !overStage || activeStage === overStage) return;

    setColumns((prev) => {
      const activeItems = prev[activeStage];
      const overItems = prev[overStage];
      const activeIndex = activeItems.findIndex((c) => c.id === active.id);
      if (activeIndex < 0) return prev;
      const moved = { ...activeItems[activeIndex], stage: overStage };
      const overIndex = overItems.findIndex((c) => c.id === over.id);
      const insertAt = overIndex >= 0 ? overIndex : overItems.length;
      return {
        ...prev,
        [activeStage]: activeItems.filter((c) => c.id !== active.id),
        [overStage]: [...overItems.slice(0, insertAt), moved, ...overItems.slice(insertAt)],
      };
    });
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;
    const stage = findStage(String(over.id)) ?? findStage(String(active.id));
    if (!stage) return;

    const items = [...columnsRef.current[stage]];
    const from = items.findIndex((c) => c.id === active.id);
    let to = items.findIndex((c) => c.id === over.id);
    if (to < 0) to = items.length - 1;
    if (from >= 0 && from !== to) {
      const [m] = items.splice(from, 1);
      items.splice(to, 0, m);
    }
    const idx = items.findIndex((c) => c.id === active.id);
    if (idx < 0) return;
    const position = midpoint(items[idx - 1]?.position, items[idx + 1]?.position);
    items[idx] = { ...items[idx], stage, position };

    setColumns((prev) => ({ ...prev, [stage]: items }));
    const id = String(active.id);
    startTransition(() => {
      moveCard({ cardId: id, toStage: stage, position })
        .then((res) => {
          if (res?.stage && res.stage !== stage) reconcile(id, stage, res.stage as Stage);
        })
        .catch(() => {});
    });
  }

  // If an automation advanced the card server-side, mirror that move locally.
  function reconcile(cardId: string, fromStage: Stage, toStage: Stage) {
    setColumns((prev) => {
      const card = prev[fromStage].find((c) => c.id === cardId);
      if (!card) return prev;
      const topPos = prev[toStage][0]?.position;
      const moved = { ...card, stage: toStage, position: topPos != null ? topPos - 1000 : 1000 };
      return {
        ...prev,
        [fromStage]: prev[fromStage].filter((c) => c.id !== cardId),
        [toStage]: [moved, ...prev[toStage]],
      };
    });
  }

  // Advance a card to the next lifecycle stage (used from the drawer).
  function handleAdvance(card: CardDTO) {
    const idx = STAGES.findIndex((s) => s.key === card.stage);
    const next = STAGES[idx + 1];
    if (!next) return;

    const cur = columnsRef.current;
    const fromCol = cur[card.stage].filter((c) => c.id !== card.id);
    const topPos = cur[next.key][0]?.position;
    const position = topPos != null ? topPos - 1000 : 1000;
    const moved = { ...card, stage: next.key, position };

    setColumns((prev) => ({ ...prev, [card.stage]: fromCol, [next.key]: [moved, ...prev[next.key]] }));
    setSelected(moved);
    startTransition(() => {
      moveCard({ cardId: card.id, toStage: next.key, position }).catch(() => {});
    });
  }

  // Reschedule a card's publish date (used from the drawer).
  function handleReschedule(card: CardDTO, isoDate: string | null) {
    const updated = { ...card, publishAt: isoDate };
    setColumns((prev) => ({
      ...prev,
      [card.stage]: prev[card.stage].map((c) => (c.id === card.id ? updated : c)),
    }));
    setSelected(updated);
    startTransition(() => {
      rescheduleCard({ cardId: card.id, publishAt: isoDate }).catch(() => {});
    });
  }

  // Insert a freshly created card at the top of its column (optimistic).
  function handleCreated(card: CardDTO) {
    setColumns((prev) => ({ ...prev, [card.stage]: [card, ...prev[card.stage]] }));
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="afa-board">
          {STAGES.map((s) => (
            <Column key={s.key} stage={s} cards={columns[s.key]} onOpen={setSelected} onAdd={setComposerStage} />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(.2,.8,.2,1)" }}>
          {activeCard ? (
            <div className="afa-card" style={{ width: 260, cursor: "grabbing", boxShadow: "var(--sh-3)" }}>
              <CardBody card={activeCard} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <CardDrawer
        card={selected}
        pending={pending}
        onClose={() => setSelected(null)}
        onAdvance={handleAdvance}
        onReschedule={handleReschedule}
      />

      <CreateCardDialog
        open={composerStage !== null}
        defaultStage={composerStage ?? Stage.IDEAS}
        campaigns={campaigns}
        members={members}
        onClose={() => setComposerStage(null)}
        onCreated={handleCreated}
      />
    </>
  );
}

function midpoint(prev?: number, next?: number) {
  if (prev != null && next != null) return (prev + next) / 2;
  if (prev != null) return prev + 1000;
  if (next != null) return next - 1000;
  return 1000;
}
