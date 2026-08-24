import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Bike, ChevronRight, Clock, MapPin, Navigation, Radio } from "lucide-react";
import { toast } from "react-toastify";

import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { StatusBadge } from "../components/StatusBadge";
import { getRiderById, getRiderTracking, type RiderTracking } from "../api/ridersApi";
import type { RiderRecord } from "../data/mockRiders";
import { complaintStatusTone } from "../data/statusStyles";
import { estimateEtaMinutes, haversineKm } from "../utils/geo";

type LatLng = [number, number];

// Used only when there's no better anchor yet (no live rider fix, no job with
// a pinned client location) so the map still has somewhere to open.
const FALLBACK_POSITION: LatLng = [31.5497, 74.3436];

function riderIcon() {
  return L.divIcon({
    className: "",
    html: `<div class="relative flex h-9 w-9 items-center justify-center">
      <span class="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-primary/40"></span>
      <span class="relative flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-primary shadow-md"></span>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function stopIcon(position: number, active: boolean) {
  return L.divIcon({
    className: "",
    html: `<div class="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-md ${
      active ? "bg-accent" : "bg-secondary"
    }">${position}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap();
  const key = points.map((point) => point.join(",")).join("|");

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);

  return null;
}

export default function RiderTrackingPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [rider, setRider] = useState<RiderRecord | null>(null);
  const [tracking, setTracking] = useState<RiderTracking | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([getRiderById(id), getRiderTracking(id)])
      .then(([riderData, trackingData]) => {
        setRider(riderData);
        setTracking(trackingData);
      })
      .catch(() => {
        setRider(null);
        toast.error("Failed to load rider tracking");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Rider Tracking"
          breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Riders", to: "/dashboard/riders" }]}
        />
        <PageContainer width="compact">
          <LoadingState />
        </PageContainer>
      </>
    );
  }

  if (!rider || !tracking) {
    return (
      <>
        <PageHeader
          title="Rider Tracking"
          breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Riders", to: "/dashboard/riders" }]}
        />
        <PageContainer width="compact">
          <EmptyState
            icon={Bike}
            title={`No rider found with id "${id}".`}
            actionLabel="Back to Riders"
            onAction={() => navigate("/dashboard/riders")}
          />
        </PageContainer>
      </>
    );
  }

  const riderPosition: LatLng | null = tracking.location
    ? [tracking.location.latitude, tracking.location.longitude]
    : null;

  const stops = tracking.jobs
    .filter((job) => job.coordinates !== null)
    .map((job) => ({ job, location: [job.coordinates!.latitude, job.coordinates!.longitude] as LatLng }));

  const mapCenter = riderPosition ?? stops[0]?.location ?? FALLBACK_POSITION;
  const allPoints: LatLng[] = riderPosition ? [riderPosition, ...stops.map((stop) => stop.location)] : stops.map((stop) => stop.location);

  return (
    <>
      <PageHeader
        title="Rider Tracking"
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Riders", to: "/dashboard/riders" },
          { label: "All Riders", to: "/dashboard/riders/all" },
        ]}
      />

      <PageContainer width="detail">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray">Rider</p>
            <h1 className="mt-1 text-xl font-bold text-text-darker">{rider.name}</h1>
            <p className="mt-0.5 text-sm text-text-dark">
              {rider.phone} · {rider.category}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {riderPosition ? (
              <span className="flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
                <Radio className="h-3 w-3 animate-pulse" />
                Live
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-gray/15 px-2.5 py-1 text-xs font-semibold text-gray">
                <Radio className="h-3 w-3" />
                No live location yet
              </span>
            )}
            <StatusBadge
              label={tracking.jobs.length > 0 ? `${tracking.jobs.length} job${tracking.jobs.length === 1 ? "" : "s"} queued` : "Idle"}
              tone={tracking.jobs.length > 0 ? "in-progress" : "neutral"}
            />
          </div>
        </div>
        {tracking.location && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-gray">
            <Clock className="h-3.5 w-3.5" />
            Last updated{" "}
            {new Date(tracking.location.updatedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="h-105 min-w-0 flex-1 overflow-hidden rounded-xl border border-border shadow-sm md:h-130">
            <MapContainer center={mapCenter} zoom={13} scrollWheelZoom className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds points={allPoints} />
              {riderPosition && <Marker position={riderPosition} icon={riderIcon()} />}
              {stops.map((stop, index) => (
                <Marker key={stop.job.id} position={stop.location} icon={stopIcon(index + 1, index === 0)} />
              ))}
              {riderPosition && stops.length > 0 && (
                <Polyline
                  positions={[riderPosition, ...stops.map((stop) => stop.location)]}
                  pathOptions={{ color: "#5b9bd5", weight: 3, dashArray: "6 8" }}
                />
              )}
            </MapContainer>
          </div>

          <div className="w-full shrink-0 space-y-3 lg:w-80">
            <p className="text-xs font-bold uppercase tracking-wide text-text-dark">Job Queue</p>
            {tracking.jobs.length === 0 ? (
              <EmptyState icon={MapPin} title="No active jobs assigned." variant="card" />
            ) : (
              tracking.jobs.map((job, index) => {
                const location = job.coordinates ? ([job.coordinates.latitude, job.coordinates.longitude] as LatLng) : null;
                const distanceKm = riderPosition && location ? haversineKm(riderPosition, location) : null;
                const etaMin = distanceKm !== null ? estimateEtaMinutes(distanceKm) : null;
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => navigate(`/dashboard/complaints/${job.id}/view`)}
                    className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                      index === 0 ? "border-accent/40" : "border-border"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                        index === 0 ? "bg-accent" : "bg-secondary"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-text-darker">
                        #{job.id} {job.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-text-dark">{job.site}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <StatusBadge
                          label={index === 0 ? "Next stop" : job.status}
                          tone={index === 0 ? "in-progress" : complaintStatusTone(job.status)}
                        />
                        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-text-dark">
                          <Navigation className="h-3 w-3" />
                          {distanceKm !== null && etaMin !== null ? `${distanceKm.toFixed(1)} km · ~${etaMin} min` : "—"}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray" />
                  </button>
                );
              })
            )}
          </div>
        </div>
      </PageContainer>
    </>
  );
}
