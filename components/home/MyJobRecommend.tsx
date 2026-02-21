"use client";

import Link from "next/link";
import { useSettingsContext } from "@/lib/providers/SettingsProvider";
import { SURVEY_LAWS, CATEGORY_TREE, lawHref } from "@/lib/constants/laws";
import LawTypeBadge from "@/components/laws/LawTypeBadge";

// lawId에 해당하는 첫 번째 카테고리 leaf 노드 id 반환
// 사이드바 활성 표시를 위해 ?cat= 파라미터로 사용
function getFirstCatId(lawId: string): string | null {
  for (const parent of CATEGORY_TREE) {
    for (const child of parent.children ?? []) {
      if (child.lawId === lawId) return child.id;
    }
  }
  return null;
}

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
        {recommended.map((law) => {
          const catId = getFirstCatId(law.id);
          const href = catId ? `${lawHref(law.id)}?cat=${catId}` : lawHref(law.id);
          return (
          <Link
            key={law.id}
            href={href}
            className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors"
          >
            <LawTypeBadge type={law.type} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{law.name}</p>
              <p className="text-xs text-gray-400">{law.department}</p>
            </div>
            <span className="text-gray-400 text-sm">→</span>
          </Link>
          );
        })}
      </div>
    </div>
  );
}
