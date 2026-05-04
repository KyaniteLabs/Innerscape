import { NextRequest, NextResponse } from "next/server";
import { getAllItems, ItemType } from "@/lib/unified/items";
import { CONFIG } from "@/lib/config";
import { formatErrorResponse } from "@/lib/errors";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") as ItemType | undefined;
        const includeArchived = searchParams.get("includeArchived") === "true";
        const limit = parseInt(searchParams.get("limit") || "50", 10);
        const offset = parseInt(searchParams.get("offset") || "0", 10);
        const sortBy = (searchParams.get("sortBy") || "lastTouched") as "createdAt" | "lastTouched" | "dueDate";

        const items = await getAllItems({
            userId: CONFIG.SINGLE_USER_ID,
            type,
            includeArchived,
            limit,
            offset,
            sortBy
        });

        return NextResponse.json({
            success: true,
            items,
            count: items.length
        });
    } catch (error) {
        console.error("[APEX] [Unified API] Error:", error);
        const { body, status } = formatErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}
