/**
 * Database Test Helpers
 * 
 * Utilities for mocking Drizzle ORM database operations in tests.
 * Provides chainable query builder mocks that match Drizzle's API.
 */

import { vi } from "vitest";

// ===== Types =====

type MockQueryResult = unknown[];
type MockInsertResult = Array<{ id: string; [key: string]: unknown }>;

// ===== Chainable Mock Builder =====

/**
 * Creates a chainable mock that mimics Drizzle's query builder
 */
export function createChainableMock<T = unknown>(finalResult: T) {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    
    const createChain = (): Record<string, unknown> => {
        const proxy = new Proxy({}, {
            get(_, prop) {
                if (prop === "then") {
                    // Make it thenable for async/await
                    return (resolve: (value: T) => void) => resolve(finalResult);
                }
                
                if (!chain[prop as string]) {
                    chain[prop as string] = vi.fn().mockReturnValue(proxy);
                }
                return chain[prop as string];
            },
        });
        return proxy;
    };
    
    return {
        mock: createChain(),
        calls: chain,
    };
}

// ===== Database Mock Factory =====

export interface MockDbConfig {
    select?: MockQueryResult;
    insert?: MockInsertResult;
    update?: MockQueryResult;
    delete?: MockQueryResult;
}

/**
 * Create a complete database mock with configurable results
 */
export function createMockDb(config: MockDbConfig = {}) {
    const selectResult = config.select || [];
    const insertResult = config.insert || [{ id: "mock-id" }];
    const updateResult = config.update || [];
    const deleteResult = config.delete || [];
    
    // Select chain
    const selectChain = createSelectChain(selectResult);
    
    // Insert chain
    const insertChain = createInsertChain(insertResult);
    
    // Update chain
    const updateChain = createUpdateChain(updateResult);
    
    // Delete chain
    const deleteChain = createDeleteChain(deleteResult);
    
    return {
        select: vi.fn().mockReturnValue(selectChain),
        insert: vi.fn().mockReturnValue(insertChain),
        update: vi.fn().mockReturnValue(updateChain),
        delete: vi.fn().mockReturnValue(deleteChain),
        transaction: vi.fn().mockImplementation(async (fn) => {
            const tx = {
                select: vi.fn().mockReturnValue(selectChain),
                insert: vi.fn().mockReturnValue(insertChain),
                update: vi.fn().mockReturnValue(updateChain),
                delete: vi.fn().mockReturnValue(deleteChain),
            };
            return fn(tx);
        }),
    };
}

interface ChainableSelect {
    from: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
    orderBy: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    offset: ReturnType<typeof vi.fn>;
    leftJoin: ReturnType<typeof vi.fn>;
    innerJoin: ReturnType<typeof vi.fn>;
    then: (resolve: (value: MockQueryResult) => void) => void;
}

function createSelectChain(result: MockQueryResult): ChainableSelect {
    const makeChainable = (): ChainableSelect => ({
        from: vi.fn().mockReturnValue(makeChainable()),
        where: vi.fn().mockReturnValue(makeChainable()),
        orderBy: vi.fn().mockReturnValue(makeChainable()),
        limit: vi.fn().mockReturnValue(makeChainable()),
        offset: vi.fn().mockReturnValue(makeChainable()),
        leftJoin: vi.fn().mockReturnValue(makeChainable()),
        innerJoin: vi.fn().mockReturnValue(makeChainable()),
        then: (resolve: (value: MockQueryResult) => void) => resolve(result),
    });
    
    return makeChainable();
}

interface ChainableInsert {
    values: ReturnType<typeof vi.fn>;
    returning: ReturnType<typeof vi.fn>;
    onConflictDoNothing: ReturnType<typeof vi.fn>;
    onConflictDoUpdate: ReturnType<typeof vi.fn>;
    then: (resolve: (value: MockInsertResult) => void) => void;
}

function createInsertChain(result: MockInsertResult): ChainableInsert {
    const makeChainable = (): ChainableInsert => ({
        values: vi.fn().mockReturnValue(makeChainable()),
        returning: vi.fn().mockReturnValue(makeChainable()),
        onConflictDoNothing: vi.fn().mockReturnValue(makeChainable()),
        onConflictDoUpdate: vi.fn().mockReturnValue(makeChainable()),
        then: (resolve: (value: MockInsertResult) => void) => resolve(result),
    });
    
    return makeChainable();
}

interface ChainableUpdate {
    set: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
    returning: ReturnType<typeof vi.fn>;
    then: (resolve: (value: MockQueryResult) => void) => void;
}

function createUpdateChain(result: MockQueryResult): ChainableUpdate {
    const makeChainable = (): ChainableUpdate => ({
        set: vi.fn().mockReturnValue(makeChainable()),
        where: vi.fn().mockReturnValue(makeChainable()),
        returning: vi.fn().mockReturnValue(makeChainable()),
        then: (resolve: (value: MockQueryResult) => void) => resolve(result),
    });
    
    return makeChainable();
}

interface ChainableDelete {
    where: ReturnType<typeof vi.fn>;
    returning: ReturnType<typeof vi.fn>;
    then: (resolve: (value: MockQueryResult) => void) => void;
}

function createDeleteChain(result: MockQueryResult): ChainableDelete {
    const makeChainable = (): ChainableDelete => ({
        where: vi.fn().mockReturnValue(makeChainable()),
        returning: vi.fn().mockReturnValue(makeChainable()),
        then: (resolve: (value: MockQueryResult) => void) => resolve(result),
    });
    
    return makeChainable();
}

// ===== Specific Mock Helpers =====

/**
 * Mock database for a specific select query result
 */
export function mockDbSelect(result: MockQueryResult) {
    const db = createMockDb({ select: result });
    vi.mock("@/lib/db", () => ({ db }));
    return db;
}

/**
 * Mock database for a specific insert result
 */
export function mockDbInsert(result: MockInsertResult) {
    const db = createMockDb({ insert: result });
    vi.mock("@/lib/db", () => ({ db }));
    return db;
}

/**
 * Mock database to throw an error
 */
export function mockDbError(error: Error = new Error("Database error")) {
    const db = {
        select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    limit: vi.fn().mockRejectedValue(error),
                    then: () => Promise.reject(error),
                }),
                then: () => Promise.reject(error),
            }),
        }),
        insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockRejectedValue(error),
                then: () => Promise.reject(error),
            }),
        }),
        update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockRejectedValue(error),
                then: () => Promise.reject(error),
            }),
        }),
        delete: vi.fn().mockReturnValue({
            where: vi.fn().mockRejectedValue(error),
        }),
        transaction: vi.fn().mockRejectedValue(error),
    };
    
    vi.mock("@/lib/db", () => ({ db }));
    return db;
}

// ===== Transaction Helpers =====

/**
 * Mock a successful transaction
 */
export function mockDbTransaction<T>(result: T) {
    const db = createMockDb();
    db.transaction = vi.fn().mockImplementation(async (fn) => {
        return result;
    });
    vi.mock("@/lib/db", () => ({ db }));
    return db;
}

/**
 * Mock a failed transaction (rollback)
 */
export function mockDbTransactionRollback(error: Error = new Error("Transaction failed")) {
    const db = createMockDb();
    db.transaction = vi.fn().mockRejectedValue(error);
    vi.mock("@/lib/db", () => ({ db }));
    return db;
}

// ===== Reset Helper =====

/**
 * Reset all database mocks
 */
export function resetDbMocks() {
    vi.resetModules();
}

// ===== Assertion Helpers =====

/**
 * Get the values passed to an insert call
 */
export function getInsertValues(db: ReturnType<typeof createMockDb>): unknown {
    const insertCall = db.insert.mock.calls[0];
    if (!insertCall) return null;
    
    // The values are passed to the .values() call
    const valuesCall = (db.insert.mock.results[0]?.value as { values: { mock: { calls: unknown[][] } } })?.values?.mock?.calls[0];
    return valuesCall?.[0];
}

/**
 * Get the where condition passed to a select call
 */
export function getSelectWhere(db: ReturnType<typeof createMockDb>): unknown {
    // Navigate through the chain to find the where call
    const selectResult = db.select.mock.results[0]?.value;
    const fromResult = selectResult?.from?.mock?.results[0]?.value;
    const whereCall = fromResult?.where?.mock?.calls[0];
    return whereCall?.[0];
}
