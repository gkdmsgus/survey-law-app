"use client";

import { useState } from "react";
import Link from "next/link";

// ── 계산기 데이터 정의 ────────────────────────────────────────────

type CalcMode = "jijuk" | "gnss" | "gongcong";

interface JijukResult {
  allowedError: number;   // 허용 연결오차 (m)
  jointError?: number;    // 허용 교점오차 (m)
  grade: string;
  note: string;
}

interface GnssResult {
  allowedH: number;  // 허용 수평오차 (m)
  allowedV: number;  // 허용 수직오차 (m)
  note: string;
}

interface GongcongResult {
  allowedH: number;
  grade: string;
  note: string;
}

// 지적측량 허용오차 계산 (지적측량 시행규칙 기준)
function calcJijuk(type: string, distance: number): JijukResult {
  switch (type) {
    case "1등기준점":
      return { allowedError: 0.03, grade: "1등 지적기준점", note: "지적측량 시행규칙 기준" };
    case "2등기준점":
      return { allowedError: 0.05, grade: "2등 지적기준점", note: "지적측량 시행규칙 기준" };
    case "도근점":
      return { allowedError: 0.10, grade: "지적도근점", note: "지적측량 시행규칙 기준" };
    case "경계점_도해":
      return { allowedError: 0.10, jointError: 0.15, grade: "경계점 (도해지역)", note: "지적측량 시행규칙 기준" };
    case "경계점_수치":
      return { allowedError: 0.07, jointError: 0.10, grade: "경계점 (수치지역)", note: "지적측량 시행규칙 기준" };
    case "거리비례":
      // 도선길이 비례: M = 0.03√S (S: 관측거리 합계 km)
      const s = distance / 1000;
      const err = Math.round(0.03 * Math.sqrt(s) * 1000) / 1000;
      return { allowedError: err, grade: "도선 거리 비례 오차", note: `관측거리 ${distance}m 기준 (M = 0.03√S)` };
    default:
      return { allowedError: 0, grade: "", note: "" };
  }
}

// GNSS 허용오차 계산 (GNSS에 의한 지적측량규정 기준)
function calcGnss(baseline: number): GnssResult {
  // 수평: ±(5mm + 1ppm × D), 수직: ±(10mm + 1ppm × D)
  const ppm = baseline * 1e-6;
  const h = Math.round((0.005 + ppm) * 1000) / 1000;
  const v = Math.round((0.010 + ppm) * 1000) / 1000;
  return {
    allowedH: h,
    allowedV: v,
    note: `기선 ${baseline}m 기준 · 수평: ±(5mm + 1ppm×D), 수직: ±(10mm + 1ppm×D)`,
  };
}

// 공공측량 기준점 허용오차
function calcGongcong(grade: string): GongcongResult {
  const map: Record<string, number> = {
    "1급수평": 0.02,
    "2급수평": 0.05,
    "3급수평": 0.10,
    "1급수직": 0.03,
    "2급수직": 0.05,
  };
  return {
    allowedH: map[grade] ?? 0,
    grade,
    note: "공공측량 작업규정 기준",
  };
}

// ── UI 컴포넌트 ──────────────────────────────────────────────────

const TAB_LABELS: { id: CalcMode; label: string; icon: string }[] = [
  { id: "jijuk", label: "지적측량", icon: "📐" },
  { id: "gnss", label: "GNSS", icon: "🛰️" },
  { id: "gongcong", label: "공공측량", icon: "🗺️" },
];

export default function CalculatorPage() {
  const [mode, setMode] = useState<CalcMode>("jijuk");

  // 지적측량 상태
  const [jijukType, setJijukType] = useState("경계점_수치");
  const [jijukDist, setJijukDist] = useState(1000);
  const [jijukResult, setJijukResult] = useState<JijukResult | null>(null);

  // GNSS 상태
  const [baseline, setBaseline] = useState(10000);
  const [gnssResult, setGnssResult] = useState<GnssResult | null>(null);

  // 공공측량 상태
  const [gongcongGrade, setGongcongGrade] = useState("1급수평");
  const [gongcongResult, setGongcongResult] = useState<GongcongResult | null>(null);

  const handleCalc = () => {
    if (mode === "jijuk") setJijukResult(calcJijuk(jijukType, jijukDist));
    if (mode === "gnss") setGnssResult(calcGnss(baseline));
    if (mode === "gongcong") setGongcongResult(calcGongcong(gongcongGrade));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* 헤더 */}
      <div>
        <nav className="text-sm text-gray-500 mb-2">
          <Link href="/" className="hover:text-blue-600">홈</Link>
          {" / "}
          <span className="text-gray-900">허용오차 계산기</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">📏 허용오차 계산기</h1>
        <p className="text-sm text-gray-500 mt-1">
          측량 종류별 허용오차를 즉시 계산합니다 · 법령 기준값 기반
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-1.5 rounded-full">
          <span>⚠️</span>
          계산 결과는 참고용입니다. 반드시 원문 법령을 확인하세요.
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {TAB_LABELS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setMode(t.id); setJijukResult(null); setGnssResult(null); setGongcongResult(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === t.id
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* 입력 패널 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

        {/* ── 지적측량 ── */}
        {mode === "jijuk" && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                측량 구분
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "1등기준점", label: "1등 기준점" },
                  { value: "2등기준점", label: "2등 기준점" },
                  { value: "도근점", label: "도근점" },
                  { value: "경계점_도해", label: "경계점 (도해)" },
                  { value: "경계점_수치", label: "경계점 (수치)" },
                  { value: "거리비례", label: "도선 거리 비례" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setJijukType(opt.value)}
                    className={`px-3 py-2.5 rounded-lg border text-sm text-left transition-colors ${
                      jijukType === opt.value
                        ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {jijukType === "거리비례" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  관측거리 합계 (m)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={jijukDist}
                    onChange={(e) => setJijukDist(Number(e.target.value))}
                    min={0}
                    step={100}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-500 shrink-0">m</span>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[500, 1000, 2000, 5000].map((v) => (
                    <button key={v} onClick={() => setJijukDist(v)}
                      className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                      {v.toLocaleString()}m
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── GNSS ── */}
        {mode === "gnss" && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              기선 길이 (m)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={baseline}
                onChange={(e) => setBaseline(Number(e.target.value))}
                min={0}
                step={1000}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500 shrink-0">m</span>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {[1000, 5000, 10000, 30000].map((v) => (
                <button key={v} onClick={() => setBaseline(v)}
                  className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                  {(v / 1000).toFixed(0)}km
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              공식: 수평 ±(5mm + 1ppm × D) · 수직 ±(10mm + 1ppm × D)
            </p>
          </div>
        )}

        {/* ── 공공측량 ── */}
        {mode === "gongcong" && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              기준점 등급
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                { value: "1급수평", label: "1급 (수평)" },
                { value: "2급수평", label: "2급 (수평)" },
                { value: "3급수평", label: "3급 (수평)" },
                { value: "1급수직", label: "1급 (수직)" },
                { value: "2급수직", label: "2급 (수직)" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setGongcongGrade(opt.value)}
                  className={`px-3 py-2.5 rounded-lg border text-sm text-left transition-colors ${
                    gongcongGrade === opt.value
                      ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 계산 버튼 */}
        <button
          onClick={handleCalc}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          계산하기
        </button>
      </div>

      {/* 결과 패널 */}
      {(jijukResult || gnssResult || gongcongResult) && (
        <div className="bg-white rounded-xl border-2 border-blue-500 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 text-lg">✅</span>
            <h2 className="text-base font-bold text-gray-900">계산 결과</h2>
          </div>

          {/* 지적측량 결과 */}
          {jijukResult && (
            <div className="space-y-3">
              <div className="text-sm text-gray-500">{jijukResult.grade}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ResultCard
                  label="허용 연결오차"
                  value={`±${jijukResult.allowedError.toFixed(3)} m`}
                  sub={`${(jijukResult.allowedError * 100).toFixed(1)} cm`}
                  color="blue"
                />
                {jijukResult.jointError !== undefined && (
                  <ResultCard
                    label="허용 교점오차"
                    value={`±${jijukResult.jointError.toFixed(3)} m`}
                    sub={`${(jijukResult.jointError * 100).toFixed(1)} cm`}
                    color="indigo"
                  />
                )}
              </div>
              <p className="text-xs text-gray-400">{jijukResult.note}</p>
            </div>
          )}

          {/* GNSS 결과 */}
          {gnssResult && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <ResultCard
                  label="허용 수평오차"
                  value={`±${gnssResult.allowedH.toFixed(3)} m`}
                  sub={`${(gnssResult.allowedH * 1000).toFixed(1)} mm`}
                  color="blue"
                />
                <ResultCard
                  label="허용 수직오차"
                  value={`±${gnssResult.allowedV.toFixed(3)} m`}
                  sub={`${(gnssResult.allowedV * 1000).toFixed(1)} mm`}
                  color="violet"
                />
              </div>
              <p className="text-xs text-gray-400">{gnssResult.note}</p>
            </div>
          )}

          {/* 공공측량 결과 */}
          {gongcongResult && (
            <div className="space-y-3">
              <ResultCard
                label={`${gongcongResult.grade} 허용정확도`}
                value={`±${gongcongResult.allowedH.toFixed(3)} m`}
                sub={`${(gongcongResult.allowedH * 100).toFixed(1)} cm`}
                color="green"
              />
              <p className="text-xs text-gray-400">{gongcongResult.note}</p>
            </div>
          )}

          {/* 법령 원문 링크 */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">📋 관련 법령 원문 확인</p>
            <div className="flex flex-wrap gap-2">
              {mode === "jijuk" && (
                <Link href="/laws/jijuk-sihaenggyu?cat=jijuk-tolerance"
                  className="text-xs text-blue-600 hover:underline bg-blue-50 px-2.5 py-1 rounded-md">
                  지적측량 시행규칙 →
                </Link>
              )}
              {mode === "gnss" && (
                <Link href="/laws/gnss-jijuk?cat=gnss-equipment"
                  className="text-xs text-blue-600 hover:underline bg-blue-50 px-2.5 py-1 rounded-md">
                  GNSS에 의한 지적측량규정 →
                </Link>
              )}
              {mode === "gongcong" && (
                <Link href="/laws/gongcong-jageopgyu?cat=public-control"
                  className="text-xs text-blue-600 hover:underline bg-blue-50 px-2.5 py-1 rounded-md">
                  공공측량 작업규정 →
                </Link>
              )}
              <Link href="/quick-ref"
                className="text-xs text-gray-500 hover:underline bg-gray-50 px-2.5 py-1 rounded-md">
                수치 빠른 참조 →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 사용 안내 */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-sm text-gray-600 space-y-1">
        <p className="font-medium text-gray-800">📌 계산기 안내</p>
        <ul className="text-xs text-gray-500 space-y-1 mt-1 list-disc list-inside">
          <li>지적측량 시행규칙, GNSS측량규정, 공공측량 작업규정 기준값 적용</li>
          <li>법령 개정 시 수치가 변경될 수 있으니 원문을 반드시 확인하세요</li>
          <li>현장 적용 전 담당 측량사/감리사와 확인 바랍니다</li>
        </ul>
      </div>
    </div>
  );
}

function ResultCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: "blue" | "indigo" | "violet" | "green";
}) {
  const colorMap = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
    violet: "bg-violet-50 border-violet-200 text-violet-700",
    green: "bg-green-50 border-green-200 text-green-700",
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold font-mono">{value}</p>
      <p className="text-xs opacity-60 mt-0.5">{sub}</p>
    </div>
  );
}
