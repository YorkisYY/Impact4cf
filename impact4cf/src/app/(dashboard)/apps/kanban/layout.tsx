import Kanban from 'views/application/kanban';

// ==============================|| PAGE ||============================== //

export default function KanbanPage({ children }: { children: React.ReactNode }) {
  return <Kanban>{children}</Kanban>;
}
