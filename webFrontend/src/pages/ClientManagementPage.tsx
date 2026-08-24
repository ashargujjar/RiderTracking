import { useEffect, useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { LinkCard } from "../components/LinkCard";
import { getStats } from "../api/statsApi";

export default function ClientManagementPage() {
  const navigate = useNavigate();
  const [totalClients, setTotalClients] = useState<number | undefined>(undefined);

  useEffect(() => {
    getStats()
      .then((stats) => setTotalClients(stats.totalClients))
      .catch(() => setTotalClients(undefined));
  }, []);

  const LINK_CARDS = [
    {
      key: "add-client",
      title: "Add Client",
      description: "Register a new client and fill in their installation details.",
      icon: UserPlus,
      tone: "accent" as const,
      path: "/dashboard/clients/new",
    },
    {
      key: "view-clients",
      title: "View All Clients",
      description: "Browse every client, or search by site, location, username, or contact number.",
      icon: Users,
      tone: "secondary" as const,
      path: "/dashboard/clients/all",
      count: totalClients,
    },
  ];

  return (
    <>
      <PageHeader title="Client Management" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }]} />

      <PageContainer width="hub">
        <p className="text-sm text-gray">Add, search, and review clients in one place.</p>

        <div className="mt-8 flex flex-col gap-4">
          {LINK_CARDS.map(({ key, title, description, icon, tone, path, count }) => (
            <LinkCard
              key={key}
              title={title}
              description={description}
              icon={icon}
              tone={tone}
              count={count}
              onClick={() => navigate(path)}
            />
          ))}
        </div>
      </PageContainer>
    </>
  );
}
