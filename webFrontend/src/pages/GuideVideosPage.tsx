import { useEffect, useState } from "react";
import { Plus, Video } from "lucide-react";
import { toast } from "react-toastify";

import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { DeleteConfirm } from "../components/DeleteConfirm";
import { EmptyState } from "../components/EmptyState";
import { FormField } from "../components/FormField";
import { LoadingState } from "../components/LoadingState";
import { Pagination } from "../components/Pagination";
import { Spinner } from "../components/Spinner";
import { ApiError } from "../api/client";
import {
  createGuideVideo,
  deleteGuideVideo,
  editGuideVideo,
  getGuideVideos,
  type GuideVideo,
} from "../api/guideVideosApi";

// Pulls the video id out of any common YouTube URL shape so we can render a
// thumbnail without an extra API call.
function extractYouTubeId(url: string): string | null {
  const match = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/.exec(url);
  return match ? match[1] : null;
}

type VideoFormValues = { title: string; link: string; description: string };
const EMPTY_FORM: VideoFormValues = { title: "", link: "", description: "" };

function VideoForm({
  initial,
  isSaving,
  onCancel,
  onSave,
}: {
  initial: VideoFormValues;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (values: VideoFormValues) => void;
}) {
  const [values, setValues] = useState(initial);

  return (
    <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-white p-5 shadow-sm sm:grid-cols-2">
      <FormField
        label="Title"
        value={values.title}
        onChange={(value) => setValues((prev) => ({ ...prev, title: value }))}
        placeholder="e.g. How to raise a complaint"
        required
      />
      <FormField
        label="YouTube Link"
        value={values.link}
        onChange={(value) => setValues((prev) => ({ ...prev, link: value }))}
        placeholder="https://www.youtube.com/watch?v=..."
        required
      />
      <FormField
        label="Description"
        value={values.description}
        onChange={(value) => setValues((prev) => ({ ...prev, description: value }))}
        placeholder="Short description shown under the video"
        type="textarea"
        fullWidth
      />

      <div className="flex items-center gap-2 sm:col-span-2">
        <button
          type="button"
          disabled={isSaving || !values.title.trim() || !values.link.trim()}
          onClick={() => onSave(values)}
          className="flex min-w-24 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? <Spinner className="h-4 w-4" /> : "Save"}
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={onCancel}
          className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-bold text-text-dark transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function GuideVideosPage() {
  const [page, setPage] = useState(1);
  const [videos, setVideos] = useState<GuideVideo[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadVideos = (targetPage: number) => {
    setIsLoading(true);
    getGuideVideos(targetPage)
      .then((data) => {
        setVideos(data.videos);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
      })
      .catch(() => toast.error("Failed to load guide videos"))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => loadVideos(page), [page]);

  const handleCreate = async (values: VideoFormValues) => {
    setIsSaving(true);
    try {
      await createGuideVideo({
        title: values.title.trim(),
        link: values.link.trim(),
        description: values.description.trim() || undefined,
      });
      setIsCreating(false);
      toast.success("Guide video added");
      if (page === 1) loadVideos(1);
      else setPage(1);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add guide video");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async (id: string, values: VideoFormValues) => {
    setIsSaving(true);
    try {
      const video = await editGuideVideo(id, {
        title: values.title.trim(),
        link: values.link.trim(),
        description: values.description.trim() || undefined,
      });
      setVideos((prev) => prev.map((item) => (item._id === id ? video : item)));
      setEditingId(null);
      toast.success("Guide video updated");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update guide video");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGuideVideo(id);
      toast.success("Guide video deleted");
      // Deleting the last item on a page beyond the first should fall back
      // to the previous page instead of showing it empty.
      if (videos.length === 1 && page > 1) setPage(page - 1);
      else loadVideos(page);
    } catch {
      toast.error("Failed to delete guide video");
    }
  };

  return (
    <>
      <PageHeader title="Guide Videos" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }]} />

      <PageContainer width="wide-table">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-lg font-bold text-text-darker">
            {totalCount} video{totalCount === 1 ? "" : "s"}
          </p>
          {!isCreating && (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
            >
              <Plus className="h-4 w-4" />
              Add Video
            </button>
          )}
        </div>

        {isCreating && (
          <div className="mt-4">
            <VideoForm
              initial={EMPTY_FORM}
              isSaving={isSaving}
              onCancel={() => setIsCreating(false)}
              onSave={handleCreate}
            />
          </div>
        )}

        <div className="mt-5">
          {isLoading ? (
            <LoadingState />
          ) : videos.length === 0 ? (
            <EmptyState icon={Video} title="No guide videos yet." description="Add one so clients can watch it in the app." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {videos.map((video) => {
                if (editingId === video._id) {
                  return (
                    <div key={video._id} className="sm:col-span-2">
                      <VideoForm
                        initial={{
                          title: video.title,
                          link: video.link,
                          description: video.description ?? "",
                        }}
                        isSaving={isSaving}
                        onCancel={() => setEditingId(null)}
                        onSave={(values) => handleEdit(video._id, values)}
                      />
                    </div>
                  );
                }

                const youtubeId = extractYouTubeId(video.link);

                return (
                  <div
                    key={video._id}
                    className="flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm"
                  >
                    <div className="flex aspect-video items-center justify-center bg-background">
                      {youtubeId ? (
                        <img
                          src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                          alt={video.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Video className="h-8 w-8 text-gray" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-4">
                      <p className="font-bold text-text-darker">{video.title}</p>
                      {video.description && <p className="text-sm text-text-dark">{video.description}</p>}
                      <a
                        href={video.link}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-xs text-primary hover:underline"
                      >
                        {video.link}
                      </a>

                      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                        <button
                          type="button"
                          onClick={() => setEditingId(video._id)}
                          className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-text-dark transition hover:bg-background"
                        >
                          Edit
                        </button>
                        <DeleteConfirm itemLabel="video" onConfirm={() => handleDelete(video._id)} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </PageContainer>
    </>
  );
}
