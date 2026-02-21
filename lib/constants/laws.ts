// 주요 측량 법령 상수 및 카테고리 트리

export interface SurveyLaw {
  id: string;           // 법령정보센터 법령 ID
  name: string;         // 법령명
  shortName: string;    // 약칭
  type: "법률" | "시행령" | "시행규칙" | "고시" | "훈령" | "예규";
  department: string;   // 소관부처
  categories: string[]; // 해당 법령이 속하는 카테고리들
  isAdminRule?: boolean; // 행정규칙(고시/훈령) 여부
}

export const SURVEY_LAWS: SurveyLaw[] = [
  {
    id: "011023",
    name: "공간정보의 구축 및 관리 등에 관한 법률",
    shortName: "공간정보관리법",
    type: "법률",
    department: "국토교통부",
    categories: ["지적측량", "공공측량", "기준점측량", "일반측량"],
  },
  {
    id: "011113",
    name: "공간정보의 구축 및 관리 등에 관한 법률 시행령",
    shortName: "공간정보관리법 시행령",
    type: "시행령",
    department: "국토교통부",
    categories: ["지적측량", "공공측량", "측량업"],
  },
  {
    id: "011120",
    name: "공간정보의 구축 및 관리 등에 관한 법률 시행규칙",
    shortName: "공간정보관리법 시행규칙",
    type: "시행규칙",
    department: "국토교통부",
    categories: ["측량업", "장비기준"],
  },
  {
    id: "011121",
    name: "지적측량 시행규칙",
    shortName: "지적측량규칙",
    type: "시행규칙",
    department: "국토교통부",
    categories: ["지적측량", "허용오차", "성과기준", "측량기간"],
  },
  {
    id: "2100000258132",  // 행정규칙 일련번호 (lawService.do?target=admrul 용)
    name: "공공측량 작업규정",
    shortName: "공공측량규정",
    type: "고시",
    department: "국토지리정보원",
    categories: ["공공측량", "기준점측량", "수치지도", "드론측량"],
    isAdminRule: true,
  },
  {
    id: "2100000263420",  // 행정규칙 일련번호
    name: "지적확정측량규정",
    shortName: "지적확정측량규정",
    type: "훈령",
    department: "국토교통부",
    categories: ["지적측량", "지적확정"],
    isAdminRule: true,
  },
  {
    id: "2100000263380",  // 행정규칙 일련번호
    name: "GNSS에 의한 지적측량규정",
    shortName: "GNSS측량규정",
    type: "예규",
    department: "국토교통부",
    categories: ["GNSS측량", "장비기준", "관측기준"],
    isAdminRule: true,
  },
  {
    id: "2100000187623",  // 행정규칙 일련번호
    name: "일반측량 작업규정",
    shortName: "일반측량규정",
    type: "고시",
    department: "국토지리정보원",
    categories: ["일반측량", "기준점측량"],
    isAdminRule: true,
  },
];

// 법령 ID → 법령 정보 맵
export const LAW_MAP = new Map(SURVEY_LAWS.map((l) => [l.id, l]));

// 카테고리 트리 구조
export interface CategoryNode {
  id: string;
  label: string;
  icon?: string;
  children?: CategoryNode[];
  lawId?: string;
  articleNos?: string[];
}

export const CATEGORY_TREE: CategoryNode[] = [
  {
    id: "jijuk",
    label: "지적측량",
    icon: "📐",
    children: [
      { id: "jijuk-tolerance", label: "허용오차", lawId: "011121", articleNos: [] },
      { id: "jijuk-equipment", label: "장비기준", lawId: "011120", articleNos: [] },
      { id: "jijuk-result", label: "성과기준", lawId: "011121", articleNos: [] },
      { id: "jijuk-period", label: "측량기간", lawId: "011121", articleNos: [] },
      { id: "jijuk-confirm", label: "지적확정측량", lawId: "2100000263420", articleNos: [] },
    ],
  },
  {
    id: "gnss",
    label: "GNSS 측량",
    icon: "🛰️",
    children: [
      { id: "gnss-equipment", label: "장비기준", lawId: "2100000263380", articleNos: [] },
      { id: "gnss-observation", label: "관측기준", lawId: "2100000263380", articleNos: [] },
    ],
  },
  {
    id: "public",
    label: "공공측량",
    icon: "🗺️",
    children: [
      { id: "public-plan", label: "작업계획", lawId: "2100000258132", articleNos: [] },
      { id: "public-control", label: "기준점측량", lawId: "2100000258132", articleNos: [] },
      { id: "public-drone", label: "드론측량", lawId: "2100000258132", articleNos: [] },
    ],
  },
  {
    id: "general",
    label: "일반측량",
    icon: "📏",
    children: [
      { id: "general-standard", label: "수행기준", lawId: "2100000187623", articleNos: [] },
    ],
  },
  {
    id: "registration",
    label: "측량업 등록",
    icon: "📋",
    children: [
      { id: "reg-tech", label: "기술인력 기준", lawId: "011120", articleNos: [] },
      { id: "reg-equipment", label: "장비 기준", lawId: "011120", articleNos: [] },
    ],
  },
];

// 법령 타입별 색상
export const LAW_TYPE_COLORS: Record<string, string> = {
  법률: "bg-blue-100 text-blue-800",
  시행령: "bg-purple-100 text-purple-800",
  시행규칙: "bg-indigo-100 text-indigo-800",
  고시: "bg-green-100 text-green-800",
  훈령: "bg-yellow-100 text-yellow-800",
  예규: "bg-orange-100 text-orange-800",
};
