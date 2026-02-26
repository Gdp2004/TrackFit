// ============================================================
// API Response Envelope – risposta JSON uniforme per tutte le routes
// Ogni risposta ha la stessa forma: { success, data?, error?, meta? }
// ============================================================

import { NextResponse } from "next/server";
import { toErrorResponse } from "@/backend/domain/model/errors/AppError";

export interface ApiMeta {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
    meta?: ApiMeta;
}

/**
 * Risposta di successo.
 * @example ok(user, 201)  →  { success: true, data: user }
 */
export function ok<T>(data: T, status = 200, meta?: ApiMeta): NextResponse<ApiResponse<T>> {
    const body: ApiResponse<T> = { success: true, data };
    if (meta) body.meta = meta;
    return NextResponse.json(body, { status });
}

/**
 * Risposta creata (201).
 */
export function created<T>(data: T): NextResponse<ApiResponse<T>> {
    return ok(data, 201);
}

/**
 * Risposta di errore strutturata.
 * Usa toErrorResponse() per convertire AppError → status + code.
 */
export function fail(err: unknown): NextResponse<ApiResponse> {
    const { error, code, statusCode } = toErrorResponse(err);
    return NextResponse.json(
        { success: false, error, code },
        { status: statusCode }
    );
}

/**
 * Helper per elenchi paginati.
 */
export function paginated<T>(
    items: T[],
    total: number,
    page: number,
    pageSize: number
): NextResponse<ApiResponse<T[]>> {
    return ok(items, 200, {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
    });
}
