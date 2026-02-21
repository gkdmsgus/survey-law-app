import { NextResponse } from "next/server";
import { SURVEY_LAWS, CATEGORY_TREE } from "@/lib/constants/laws";

export async function GET() {
  return NextResponse.json({
    laws: SURVEY_LAWS,
    categories: CATEGORY_TREE,
  });
}
