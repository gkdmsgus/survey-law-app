"use client";

import { useState, useMemo } from "react";
import { computeArticleDiff, hasDifference } from "@/lib/utils/diff";
import { formatLawDate } from "@/lib/utils/date";
import type { ArticleSnapshot } from "@/lib/api/types";

interface ArticleHistoryDiffProps {
  snapshots: ArticleSnapshot[];
}

type ViewMode = "inline" | "split" | "changed";

export default function ArticleHistoryDiff({
  snapshots,
}: ArticleHistoryDiffProps) {
  const [baseIdx, setBaseIdx] = useState(1);       // 이전 버전 (오래된 것)
  const [compareIdx, setCompareIdx] = useState(0); // 비교 버전 (최신)
  const [viewMode, setViewMode] = useState<ViewMode>("split");

  if (snapshots.length === 0) {
    return (
      <div className="text-center py-12 space-y-2">
        <p className="text-3xl">📋</p>
        <p className="text-sm font-medium text-gray-700">저장된 개정이력이 없습니다</p>
        <p className="text-xs text-gray-400">
          조문 상세 페이지를 방문할 때마다 스냅샷이 자동으로 저장됩니다.
          <br />법령 개정 후 재방문하면 비교할 수 있습니다.
        </p>
      </div>
    );
  }

  if (snapshots.length === 1) {
    return (
      <div className="text-center py-12 space-y-2">
        <p className="text-3xl">📄</p>
        <p className="text-sm font-medium text-gray-700">현재 버전 1개만 저장되어 있습니다</p>
        <p className="text-xs text-gray-400">
          법령 개정 후 재방문하면 이전 버전과 비교할 수 있습니다.
        </p>
        <div className="mt-4 bg-gray-50 rounded-lg p-4 text-left">
          <p className="text-xs text-gray-500 mb-2 font-medium">
            저장된 버전: {formatLawDate(snapshots[0].revisionDate)}
          </p>
          <pre className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
            {snapshots[0].content}
          </pre>
        </div>
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

  // 변경 통계
  const addedLines = changes.filter(c => c.added).reduce((acc, c) => acc + (c.value.split("\n").length - 1), 0);
  const removedLines = changes.filter(c => c.removed).reduce((acc, c) => acc + (c.value.split("\n").length - 1), 0);

  return (
    <div className="space-y-4">
      {/* 버전 선택 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 shrink-0">이전 버전</span>
          <select
            value={baseIdx}
            onChange={(e) => setBaseIdx(Number(e.target.value))}
            className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {snapshots.map((s, i) => (
              <option key={s.id} value={i} disabled={i === compareIdx}>
                {formatLawDate(s.revisionDate)} ({new Date(s.snapshotAt).toLocaleDateString("ko-KR")})
              </option>
            ))}
          </select>
        </div>
        <span className="text-gray-300 font-bold">→</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 shrink-0">최신 버전</span>
          <select
            value={compareIdx}
            onChange={(e) => setCompareIdx(Number(e.target.value))}
            className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {snapshots.map((s, i) => (
              <option key={s.id} value={i} disabled={i === baseIdx}>
                {formatLawDate(s.revisionDate)} ({new Date(s.snapshotAt).toLocaleDateString("ko-KR")})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 변경 통계 + 범례 + 뷰 모드 전환 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* 변경 통계 */}
        <div className="flex items-center gap-3 text-xs">
          {hasChanges ? (
            <>
              <span className="flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
                <span>+</span>{addedLines}줄 추가
              </span>
              <span className="flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded-full">
                <span>−</span>{removedLines}줄 삭제
              </span>
            </>
          ) : (
            <span className="text-gray-400 text-xs">변경사항 없음</span>
          )}
        </div>

        {/* 뷰 모드 전환 */}
        {hasChanges && (
          <div className="flex rounded-md border border-gray-200 overflow-hidden text-xs">
            {(["split", "inline", "changed"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 transition-colors ${
                  viewMode === mode
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {mode === "split" ? "좌/우" : mode === "inline" ? "인라인" : "변경만"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Diff 본문 */}
      {!hasChanges ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
            {baseSnapshot?.content}
          </pre>
        </div>
      ) : viewMode === "split" ? (
        <SplitView changes={changes} baseSnapshot={baseSnapshot} compareSnapshot={compareSnapshot} />
      ) : viewMode === "changed" ? (
        <ChangedOnlyView changes={changes} />
      ) : (
        <InlineView changes={changes} />
      )}
    </div>
  );
}

// ── 좌/우 분할 뷰 ──────────────────────────────────────────────
function SplitView({
  changes,
  baseSnapshot,
  compareSnapshot,
}: {
  changes: ReturnType<typeof computeArticleDiff>;
  baseSnapshot: ArticleSnapshot;
  compareSnapshot: ArticleSnapshot;
}) {
  // 줄 단위로 분리
  const leftLines: { text: string; type: "removed" | "context" }[] = [];
  const rightLines: { text: string; type: "added" | "context" }[] = [];

  for (const change of changes) {
    const lines = change.value.split("\n");
    // 마지막 빈 문자열 제거 (split 결과)
    if (lines[lines.length - 1] === "") lines.pop();

    if (change.removed) {
      lines.forEach(l => leftLines.push({ text: l, type: "removed" }));
    } else if (change.added) {
      lines.forEach(l => rightLines.push({ text: l, type: "added" }));
    } else {
      lines.forEach(l => {
        leftLines.push({ text: l, type: "context" });
        rightLines.push({ text: l, type: "context" });
      });
    }
  }

  // 길이 맞추기
  const maxLen = Math.max(leftLines.length, rightLines.length);
  while (leftLines.length < maxLen) leftLines.push({ text: "", type: "context" });
  while (rightLines.length < maxLen) rightLines.push({ text: "", type: "context" });

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden text-xs font-mono">
      {/* 헤더 */}
      <div className="grid grid-cols-2 divide-x divide-gray-200 bg-gray-100 border-b border-gray-200">
        <div className="px-3 py-2 text-xs font-semibold text-gray-600">
          이전 버전 · {formatLawDate(baseSnapshot.revisionDate)}
        </div>
        <div className="px-3 py-2 text-xs font-semibold text-gray-600">
          최신 버전 · {formatLawDate(compareSnapshot.revisionDate)}
        </div>
      </div>
      {/* 내용 */}
      <div className="grid grid-cols-2 divide-x divide-gray-200 max-h-[600px] overflow-y-auto">
        {/* 왼쪽 (이전) */}
        <div className="divide-y divide-gray-50">
          {leftLines.map((line, i) => (
            <div
              key={i}
              className={`flex ${
                line.type === "removed"
                  ? "bg-red-50"
                  : "bg-white"
              }`}
            >
              <span className="w-8 shrink-0 text-center text-gray-300 border-r border-gray-100 py-0.5 select-none text-[10px]">
                {line.type !== "context" || line.text ? i + 1 : ""}
              </span>
              <pre className={`flex-1 px-2 py-0.5 whitespace-pre-wrap leading-relaxed font-sans text-xs ${
                line.type === "removed" ? "text-red-800" : "text-gray-700"
              }`}>
                {line.type === "removed" && <span className="text-red-400 select-none mr-1">−</span>}
                {line.text}
              </pre>
            </div>
          ))}
        </div>
        {/* 오른쪽 (최신) */}
        <div className="divide-y divide-gray-50">
          {rightLines.map((line, i) => (
            <div
              key={i}
              className={`flex ${
                line.type === "added"
                  ? "bg-green-50"
                  : "bg-white"
              }`}
            >
              <span className="w-8 shrink-0 text-center text-gray-300 border-r border-gray-100 py-0.5 select-none text-[10px]">
                {line.type !== "context" || line.text ? i + 1 : ""}
              </span>
              <pre className={`flex-1 px-2 py-0.5 whitespace-pre-wrap leading-relaxed font-sans text-xs ${
                line.type === "added" ? "text-green-800" : "text-gray-700"
              }`}>
                {line.type === "added" && <span className="text-green-500 select-none mr-1">+</span>}
                {line.text}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 인라인 뷰 (기존 방식 개선) ──────────────────────────────────
function InlineView({
  changes,
}: {
  changes: ReturnType<typeof computeArticleDiff>;
}) {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden text-xs font-mono max-h-[600px] overflow-y-auto">
      {changes.map((change, i) => {
        const lines = change.value.split("\n");
        if (lines[lines.length - 1] === "") lines.pop();
        if (change.added) {
          return lines.map((line, j) => (
            <div key={`${i}-${j}`} className="flex bg-green-50">
              <span className="w-6 shrink-0 text-center text-green-400 select-none py-0.5">+</span>
              <pre className="flex-1 px-2 py-0.5 text-green-800 whitespace-pre-wrap leading-relaxed font-sans text-xs">
                {line}
              </pre>
            </div>
          ));
        }
        if (change.removed) {
          return lines.map((line, j) => (
            <div key={`${i}-${j}`} className="flex bg-red-50">
              <span className="w-6 shrink-0 text-center text-red-400 select-none py-0.5">−</span>
              <pre className="flex-1 px-2 py-0.5 text-red-800 line-through whitespace-pre-wrap leading-relaxed font-sans text-xs">
                {line}
              </pre>
            </div>
          ));
        }
        return lines.map((line, j) => (
          <div key={`${i}-${j}`} className="flex bg-white">
            <span className="w-6 shrink-0 select-none py-0.5" />
            <pre className="flex-1 px-2 py-0.5 text-gray-700 whitespace-pre-wrap leading-relaxed font-sans text-xs">
              {line}
            </pre>
          </div>
        ));
      })}
    </div>
  );
}

// ── 변경된 부분만 보기 (컨텍스트 ±3줄) ───────────────────────
function ChangedOnlyView({
  changes,
}: {
  changes: ReturnType<typeof computeArticleDiff>;
}) {
  // 변경된 청크만 추출 (앞뒤 컨텍스트 포함)
  const CONTEXT = 2;
  const allLines: { text: string; type: "added" | "removed" | "context" }[] = [];

  for (const change of changes) {
    const lines = change.value.split("\n");
    if (lines[lines.length - 1] === "") lines.pop();
    const type = change.added ? "added" : change.removed ? "removed" : "context";
    lines.forEach(text => allLines.push({ text, type }));
  }

  // 변경 줄 인덱스
  const changedIndices = new Set<number>();
  allLines.forEach((l, i) => {
    if (l.type !== "context") {
      for (let d = -CONTEXT; d <= CONTEXT; d++) {
        if (i + d >= 0 && i + d < allLines.length) changedIndices.add(i + d);
      }
    }
  });

  // 표시할 줄 그룹 (생략 구분선 포함)
  const visibleIndices = Array.from(changedIndices).sort((a, b) => a - b);

  if (visibleIndices.length === 0) {
    return <div className="text-sm text-gray-400 py-4 text-center">변경사항이 없습니다.</div>;
  }

  const groups: (number[] | "ellipsis")[] = [];
  let current: number[] = [];
  for (let i = 0; i < visibleIndices.length; i++) {
    if (i === 0 || visibleIndices[i] === visibleIndices[i - 1] + 1) {
      current.push(visibleIndices[i]);
    } else {
      groups.push(current);
      groups.push("ellipsis");
      current = [visibleIndices[i]];
    }
  }
  if (current.length) groups.push(current);

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden text-xs font-mono max-h-[600px] overflow-y-auto">
      {groups.map((group, gi) => {
        if (group === "ellipsis") {
          return (
            <div key={`e-${gi}`} className="flex bg-gray-50 border-y border-gray-100">
              <span className="w-6 shrink-0" />
              <span className="px-2 py-1 text-gray-400 select-none text-[10px]">···</span>
            </div>
          );
        }
        return group.map((lineIdx) => {
          const line = allLines[lineIdx];
          if (!line) return null;
          return (
            <div
              key={lineIdx}
              className={`flex ${
                line.type === "added"
                  ? "bg-green-50"
                  : line.type === "removed"
                  ? "bg-red-50"
                  : "bg-white"
              }`}
            >
              <span className={`w-6 shrink-0 text-center select-none py-0.5 ${
                line.type === "added" ? "text-green-400" : line.type === "removed" ? "text-red-400" : ""
              }`}>
                {line.type === "added" ? "+" : line.type === "removed" ? "−" : ""}
              </span>
              <pre className={`flex-1 px-2 py-0.5 whitespace-pre-wrap leading-relaxed font-sans text-xs ${
                line.type === "added"
                  ? "text-green-800"
                  : line.type === "removed"
                  ? "text-red-800 line-through"
                  : "text-gray-600"
              }`}>
                {line.text}
              </pre>
            </div>
          );
        });
      })}
    </div>
  );
}
