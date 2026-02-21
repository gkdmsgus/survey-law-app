import { formatLawDate } from "@/lib/utils/date";

interface ChangeBadgeProps {
  revisionDate?: string;
  isNew?: boolean; // 개정됨 배지
}

export default function ChangeBadge({
  revisionDate,
  isNew = false,
}: ChangeBadgeProps) {
  if (!isNew && !revisionDate) return null;

  if (isNew) {
    return (
      <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
        개정됨
      </span>
    );
  }

  return (
    <span className="inline-flex items-center bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full border border-blue-200">
      {revisionDate ? formatLawDate(revisionDate) : ""}
    </span>
  );
}
