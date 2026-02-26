// ============================================================
// AppError – Custom error class hierarchy
// Sostituisce i raw Error generici in tutta la codebase.
// Ogni errore ha: statusCode HTTP, codice leggibile, messaggio.
// ============================================================

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR", isOperational = true) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

// 400 – Dati non validi
export class ValidationError extends AppError {
    constructor(message: string, code = "VALIDATION_ERROR") {
        super(message, 400, code);
    }
}

// 401 – Non autenticato
export class UnauthorizedError extends AppError {
    constructor(message = "Non autenticato. Effettua il login.") {
        super(message, 401, "UNAUTHORIZED");
    }
}

// 403 – Non autorizzato (ruolo insufficiente)
export class ForbiddenError extends AppError {
    constructor(message = "Accesso negato. Permessi insufficienti.") {
        super(message, 403, "FORBIDDEN");
    }
}

// 404 – Risorsa non trovata
export class NotFoundError extends AppError {
    constructor(resource = "Risorsa") {
        super(`${resource} non trovata.`, 404, "NOT_FOUND");
    }
}

// 409 – Conflitto (es. utente già esistente, abbonamento già attivo)
export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409, "CONFLICT");
    }
}

// 422 – Regola di business violata (es. R1: modifica < 48h)
export class BusinessRuleError extends AppError {
    constructor(message: string, ruleCode?: string) {
        super(message, 422, ruleCode ?? "BUSINESS_RULE_VIOLATION");
    }
}

// 429 – Rate limit superato
export class RateLimitError extends AppError {
    constructor(message = "Troppe richieste. Riprova tra qualche minuto.") {
        super(message, 429, "RATE_LIMIT_EXCEEDED");
    }
}

/**
 * Converte qualsiasi errore in una risposta JSON standardizzata.
 * Nasconde i dettagli tecnici per errori non operativi (bug, crash).
 */
export function toErrorResponse(err: unknown): { error: string; code: string; statusCode: number } {
    if (err instanceof AppError) {
        return {
            error: err.message,
            code: err.code,
            statusCode: err.statusCode,
        };
    }
    // Errori inattesi: log in produzione, messaggio generico al client
    const msg = err instanceof Error ? err.message : "Si è verificato un errore interno.";
    console.error("[Unhandled Error]", msg, err);
    return {
        error: "Errore interno del server. Riprova più tardi.",
        code: "INTERNAL_ERROR",
        statusCode: 500,
    };
}
