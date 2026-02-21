"use client";

import { useState } from "react";
import { computeArticleDiff, hasDifference } from "@/lib/utils/diff";
import { formatLawDate } from "@/lib/utils/date";
import type { ArticleSnapshot } from "@/lib/api/types";

interface ArticleHistoryDiffProps {
  snapshots: ArticleSnapshot[];
}

export default function ArticleHistoryDiff({
  snapshots,
}: ArticleHistoryDiffProps) {
  const [baseIdx, setBaseIdx] = useState(1); // 이전 버전 (오래된 것)
  const [compareIdx, setCompareIdx] = useState(0); // 비교 버전 (최신)

  if (snapshots.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-8 text-center">
        저장된 개정이력이 없습니다.
        <br />
        조문을 방문할 때마다 스냅샷이 자동으로 저장됩니다.
      </div>
    );
  }

  if (snapshots.length === 1) {
    return (
      <div className="text-sm text-gray-500 py-8 text-center">
        현재 버전만 저장되어 있습니다. 개정 후 재방문하면 비교할 수 있습니다.
      </div>
    );
  }

  const baseSnapshot = snapshots[baseIdx];
  const compareSnapshot = snapshots[compareIdx];
  const changes = computeArticleDiff(
    baseSnapshot?.content ?? "",
    compareSnapshot?.content ?? ""
  );
  const hasChanges = hasDifference(changes);

  return (
    <div className="space-y-4">
      {/* 버전 선택 */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">이전 버전:</span>
          <select
            value={baseIdx}
            onChange={(e) => setBaseIdx(Number(e.target.value))}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            {snapshots.map((s, i) => (
              <option key={s.id} value={i} disabled={i === compareIdx}>
                {formatLawDate(s.revisionDate)} (
                {new Date(s.snapshotAt).toLocaleDateString("ko-KR")})
              </option>
            ))}
          </select>
        </div>
        <span className="text-gray-400">→</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">비교 버전:</span>
          <select
            value={compareIdx}
            onChange={(e) => setCompareIdx(Number(e.target.value))}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            {snapshots.map((s, i) => (
              <option key={s.id} value={i} disabled={i === baseIdx}>
                {formatLawDate(s.revisionDate)} (
                {new Date(s.snapshotAt).toLocaleDateString("ko-KR")})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-200 rounded" />
          추가된 내용
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-red-200 rounded" />
          삭제된 내용
        </span>
        {!hasChanges && (
          <span className="text-gray-400">변경사항 없음</span>
        )}
      </div>

      {/* Diff 렌더링 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap leading-relaxed overflow-auto max-h-[600px]">
        {changes.map((change, i) => {
          if (change.added) {
            return (
              <span
                key={i}
                className="bg-green-100 text-green-800"
              >
                {change.value}
              </span>
            );
          }
          if (change.removed) {
            return (
              <span
                key={i}
                className="bg-red-100 text-red-800 line-through"
              >
                {change.value}
              </span>
            );
          }
          return <span key={i}>{change.value}</span>;
        })}
      </div>
    </div>
  );
}
