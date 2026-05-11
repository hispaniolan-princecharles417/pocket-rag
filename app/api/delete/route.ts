import { NextResponse } from "next/server";
import { deletePDFData } from "../../../lib/rag";

export async function POST() {
  try {
    const result = await deletePDFData();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete data: " + error.message },
      { status: 500 }
    );
  }
}
