"use client";

import { useSettingsContext } from "@/lib/providers/SettingsProvider";
import Link from "next/link";

const JOB_FIELDS = [
  { id: "지적측량", label: "📐 지적측량" },
  { id: "GNSS측량", label: "🛰️ GNSS 측량" },
  { id: "공공측량", label: "🗺️ 공공측량" },
  { id: "일반측량", label: "📏 일반측량" },
  { id: "측량업등록", label: "📋 측량업 등록" },
];

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        checked ? "bg-blue-600" : "bg-gray-300"
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { settings, updateSetting, resetSettings, mounted } = useSettingsContext();

  if (!mounted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
        {/* 페이지 제목 */}
        <div className="h-7 bg-gray-200 rounded w-20" />
        {/* 설정 섹션 카드들 */}
        {[3, 2, 2, 5].map((rows, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            {/* 섹션 제목 */}
            <div className="h-5 bg-gray-200 rounded w-28" />
            <div className="h-px bg-gray-100" />
            {/* 설정 행들 */}
            {Array.from({ length: rows }).map((_, j) => (
              <div key={j} className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-3 bg-gray-200 rounded w-36" />
                </div>
                <div className="h-6 bg-gray-200 rounded-full w-11 shrink-0" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  const toggleJobField = (field: string) => {
    const current = settings.myJobField;
    if (current.includes(field)) {
      updateSetting("myJobField", current.filter((f) => f !== field));
    } else {
      updateSetting("myJobField", [...current, field]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* 헤더 */}
      <div>
        <nav className="text-sm text-gray-500 mb-2">
          <Link href="/" className="hover:text-blue-600">홈</Link>
          {" / "}
          <span className="text-gray-900">설정</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">설정</h1>
        <p className="text-sm text-gray-500 mt-1">앱 화면 및 알림 환경을 개인화하세요.</p>
      </div>

      {/* ── 1. 화면 표시 ── */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">🖥️ 화면 표시</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {/* 테마 */}
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-gray-800">테마</p>
              <p className="text-xs text-gray-500 mt-0.5">다크 / 라이트 모드 선택</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {settings.theme === "dark" ? "🌙 다크" : "☀️ 라이트"}
              </span>
              <button
                onClick={() =>
                  updateSetting("theme", settings.theme === "light" ? "dark" : "light")
                }
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
                  settings.theme === "dark" ? "bg-blue-600" : "bg-gray-300"
                }`}
                aria-label="테마 토글"
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    settings.theme === "dark" ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 폰트 크기 */}
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-gray-800">폰트 크기</p>
              <p className="text-xs text-gray-500 mt-0.5">텍스트 크기를 조절합니다</p>
            </div>
            <div className="flex gap-1.5">
              {(["sm", "md", "lg"] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => updateSetting("fontSize", size)}
                  className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                    settings.fontSize === size
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {size === "sm" ? "S" : size === "md" ? "M" : "L"}
                </button>
              ))}
            </div>
          </div>

          {/* 삭제된 조문 표시 */}
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-gray-800">삭제된 조문 표시</p>
              <p className="text-xs text-gray-500 mt-0.5">
                &quot;제N조 삭제&quot; 항목을 목록에 표시합니다
              </p>
            </div>
            <ToggleSwitch
              checked={settings.showDeleted}
              onChange={(v) => updateSetting("showDeleted", v)}
            />
          </div>

          {/* 조문 기본 펼침 */}
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-gray-800">조문 기본 펼침</p>
              <p className="text-xs text-gray-500 mt-0.5">
                법령 페이지 진입 시 조문 내용을 펼쳐서 보여줍니다
              </p>
            </div>
            <ToggleSwitch
              checked={settings.articleExpanded}
              onChange={(v) => updateSetting("articleExpanded", v)}
            />
          </div>
        </div>
      </section>

      {/* ── 2. 알림 ── */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">🔔 알림</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {/* 알림 활성화 */}
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-gray-800">알림 활성화</p>
              <p className="text-xs text-gray-500 mt-0.5">
                즐겨찾기한 법령의 개정 알림을 받습니다
              </p>
            </div>
            <ToggleSwitch
              checked={settings.notificationsEnabled}
              onChange={(v) => updateSetting("notificationsEnabled", v)}
            />
          </div>

          {/* 알림 확인 주기 */}
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className={`text-sm font-medium ${settings.notificationsEnabled ? "text-gray-800" : "text-gray-400"}`}>
                알림 확인 주기
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                서버에서 알림을 확인하는 주기
              </p>
            </div>
            <div className="flex gap-1.5">
              {([30, 60, 300] as const).map((sec) => (
                <button
                  key={sec}
                  onClick={() => updateSetting("pollInterval", sec)}
                  disabled={!settings.notificationsEnabled}
                  className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    settings.pollInterval === sec
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {sec === 30 ? "30초" : sec === 60 ? "1분" : "5분"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. 즐겨찾기 ── */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">⭐ 즐겨찾기</h2>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">정렬 순서</p>
              <p className="text-xs text-gray-500 mt-0.5">즐겨찾기 목록 정렬 방식</p>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => updateSetting("favoritesSort", "recent")}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  settings.favoritesSort === "recent"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                최근 추가순
              </button>
              <button
                onClick={() => updateSetting("favoritesSort", "name")}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  settings.favoritesSort === "name"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                법령명순
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. 내 업무 분야 ── */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">💼 내 업무 분야</h2>
          <p className="text-xs text-gray-500 mt-1">
            선택한 분야의 법령이 홈 화면 상단에 추천됩니다
          </p>
        </div>
        <div className="px-5 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {JOB_FIELDS.map((field) => {
              const selected = settings.myJobField.includes(field.id);
              return (
                <button
                  key={field.id}
                  onClick={() => toggleJobField(field.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    selected
                      ? "bg-blue-50 border-blue-400 text-blue-700"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs shrink-0 ${
                    selected ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300"
                  }`}>
                    {selected ? "✓" : ""}
                  </span>
                  {field.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. 초기화 ── */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">🔄 설정 초기화</h2>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-gray-500 mb-3">
            모든 설정을 기본값으로 되돌립니다. 법령 데이터나 즐겨찾기는 영향받지 않습니다.
          </p>
          <button
            onClick={() => {
              if (confirm("모든 설정을 초기화하시겠습니까?")) {
                resetSettings();
              }
            }}
            className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors font-medium"
          >
            모든 설정 초기화
          </button>
        </div>
      </section>
    </div>
  );
}
