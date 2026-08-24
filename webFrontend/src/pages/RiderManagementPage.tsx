import { useEffect, useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { LinkCard } from "../components/LinkCard";
import { getStats } from "../api/statsApi";

export default function RiderManagementPage() {
  const navigate = useNavigate();
  const [totalRiders, setTotalRiders] = useState<number | undefined>(undefined);

  useEffect(() => {
    getStats()
      .then((stats) => setTotalRiders(stats.totalRiders))
      .catch(() => setTotalRiders(undefined));
  }, []);

  const LINK_CARDS = [
    {
      key: "add-rider",
      title: "Add Rider",
      description: "Onboard a new rider to handle assigned complaints.",
      icon: UserPlus,
      tone: "accent" as const,
      path: "/dashboard/riders/new",
    },
    {
      key: "view-riders",
      title: "View All Riders",
      description: "Browse every rider, or search by name, phone, category, or username.",
      icon: Users,
      tone: "secondary" as const,
      path: "/dashboard/riders/all",
      count: totalRiders,
    },
  ];

  return (
    <>
      <PageHeader title="Rider Management" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }]} />

      <PageContainer width="hub">
        <p className="text-sm text-gray">Add, search, and review riders in one place.</p>

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
