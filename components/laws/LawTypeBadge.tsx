import { LAW_TYPE_COLORS } from "@/lib/constants/laws";

interface LawTypeBadgeProps {
  type: string;
}

export default function LawTypeBadge({ type }: LawTypeBadgeProps) {
  const color =
    LAW_TYPE_COLORS[type] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {type}
    </span>
  );
}
