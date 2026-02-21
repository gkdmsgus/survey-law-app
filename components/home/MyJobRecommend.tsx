"use client";

import Link from "next/link";
import { useSettingsContext } from "@/lib/providers/SettingsProvider";
import { SURVEY_LAWS } from "@/lib/constants/laws";
import LawTypeBadge from "@/components/laws/LawTypeBadge";

export default function MyJobRecommend() {
  const { settings, mounted } = useSettingsContext();

  if (!mounted || settings.myJobField.length === 0) return null;

  // 내 업무 분야와 겹치는 법령 필터 (categories 교집합)
  const recommended = SURVEY_LAWS.filter((law) =>
    law.categories.some((cat) => settings.myJobField.includes(cat))
  );

  if (recommended.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-semibold text-gray-800">💼 내 업무 분야 법령</h2>
        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
          {settings.myJobField.join(", ")}
        </span>
      </div>
      <div className="bg-white rounded-lg border border-blue-200 divide-y divide-gray-100">
        {recommended.map((law) => (
          <Link
            key={law.id}
            href={`/laws/${law.id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors"
          >
            <LawTypeBadge type={law.type} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{law.name}</p>
              <p className="text-xs text-gray-400">{law.department}</p>
            </div>
            <span className="text-gray-400 text-sm">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
