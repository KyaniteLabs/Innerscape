import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QuickCapture } from "./QuickCapture";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the useWhisper hook
vi.mock("@/lib/hooks/useWhisper", () => ({
    useWhisper: () => ({
        isReady: true,
        isRecording: false,
        transcript: "",
        error: null,
        startRecording: vi.fn(),
        stopRecording: vi.fn(),
        clearError: vi.fn(),
    }),
}));

// Mock the useToast hook
const mockSuccess = vi.fn();
const mockShowError = vi.fn();
vi.mock("@/lib/hooks/useToast", () => ({
    useToast: () => ({
        success: mockSuccess,
        error: mockShowError,
        info: vi.fn(),
        warning: vi.fn(),
    }),
}));

// Mock the useTimeContext hook
vi.mock("@/lib/hooks/useAppContext", () => ({
    useTimeContext: () => ({
        timeOfDay: "afternoon",
        isLateNight: false,
    }),
}));

// Mock the useThoughtStream hook
vi.mock("@/lib/hooks/useThoughtStream", () => ({
    useThoughtStream: () => ({
        thoughts: [],
        isStreaming: false,
        startStream: vi.fn(),
        addThought: vi.fn(),
        clear: vi.fn(),
    }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("QuickCapture", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        mockFetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    });

    describe("basic rendering", () => {
        it("renders the text input", () => {
            render(<QuickCapture useStreaming={false} />);
            expect(screen.getByPlaceholderText(/capture a thought or task/i)).toBeInTheDocument();
        });

        it("renders mic and send buttons", () => {
            render(<QuickCapture useStreaming={false} />);
            expect(screen.getByTitle(/voice capture/i)).toBeInTheDocument();
            expect(screen.getByTitle(/save capture/i)).toBeInTheDocument();
        });

        it("shows thinking mode toggle", () => {
            render(<QuickCapture useStreaming={false} />);
            expect(screen.getByText(/Thinking hidden/i)).toBeInTheDocument();
        });

        it("shows keyboard shortcut hint", () => {
            render(<QuickCapture useStreaming={false} />);
            expect(screen.getByText(/⌘\+Enter/)).toBeInTheDocument();
        });
    });

    describe("input validation", () => {
        it("disables send button when input is empty", () => {
            render(<QuickCapture useStreaming={false} />);
            const sendButton = screen.getByTitle(/save capture/i);
            expect(sendButton).toHaveStyle({ opacity: '0.3' });
        });

        it("enables send button when input has text", () => {
            render(<QuickCapture useStreaming={false} />);
            const input = screen.getByPlaceholderText(/capture a thought or task/i);
            fireEvent.change(input, { target: { value: "Test thought" } });
            
            const sendButton = screen.getByTitle(/save capture/i);
            expect(sendButton).not.toHaveStyle({ opacity: '0.3' });
        });
    });

    describe("capture submission", () => {
        it("calls API when send button is clicked", async () => {
            render(<QuickCapture useStreaming={false} />);
            const input = screen.getByPlaceholderText(/capture a thought or task/i);
            const sendButton = screen.getByTitle(/save capture/i);

            fireEvent.change(input, { target: { value: "Test thought" } });
            fireEvent.click(sendButton);

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith("/api/capture", expect.objectContaining({
                    method: "POST",
                }));
            });

            // Verify request body includes stream flag
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.text).toBe("Test thought");
            expect(body.source).toBe("web");
            expect(body.stream).toBe(false);
        });

        it("clears input after successful capture", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, action: "filed", destination: "projects" }),
            });

            render(<QuickCapture useStreaming={false} />);
            const input = screen.getByPlaceholderText(/capture a thought or task/i) as HTMLTextAreaElement;

            fireEvent.change(input, { target: { value: "Test thought" } });
            fireEvent.click(screen.getByTitle(/save capture/i));

            await waitFor(() => {
                expect(input.value).toBe("");
            });
        });

        it("handles API errors gracefully and logs", async () => {
            mockFetch.mockRejectedValueOnce(new Error("Network error"));
            
            render(<QuickCapture useStreaming={false} />);
            const input = screen.getByPlaceholderText(/capture a thought or task/i) as HTMLTextAreaElement;

            fireEvent.change(input, { target: { value: "Test thought" } });
            fireEvent.click(screen.getByTitle(/save capture/i));

            // Should not throw, input should remain, error should be logged
            await waitFor(() => {
                expect(input.value).toBe("Test thought");
                expect(console.error).toHaveBeenCalledWith("[APEX] [QuickCapture] Capture failed:", expect.any(Error));
            });
        });

        it("supports keyboard shortcut ⌘+Enter", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true }),
            });

            render(<QuickCapture useStreaming={false} />);
            const input = screen.getByPlaceholderText(/capture a thought or task/i);

            fireEvent.change(input, { target: { value: "Test thought" } });
            fireEvent.keyDown(input, { key: "Enter", metaKey: true });

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalled();
            });
        });

        it("supports keyboard shortcut Ctrl+Enter", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true }),
            });

            render(<QuickCapture useStreaming={false} />);
            const input = screen.getByPlaceholderText(/capture a thought or task/i);

            fireEvent.change(input, { target: { value: "Test thought" } });
            fireEvent.keyDown(input, { key: "Enter", ctrlKey: true });

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalled();
            });
        });
    });

    describe("agent result display", () => {
        it("shows success message with summary", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    action: "filed",
                    destination: "projects",
                    summary: "Created new project",
                }),
            });

            render(<QuickCapture useStreaming={false} />);
            const input = screen.getByPlaceholderText(/capture a thought or task/i);

            fireEvent.change(input, { target: { value: "Test" } });
            fireEvent.click(screen.getByTitle(/save capture/i));

            await waitFor(() => {
                expect(screen.getByText(/Created new project/)).toBeInTheDocument();
            });
        });

        it("shows first step suggestion", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    action: "filed",
                    destination: "admin",
                    summary: "Task captured",
                    firstStep: "Open your calendar",
                }),
            });

            render(<QuickCapture useStreaming={false} />);
            const input = screen.getByPlaceholderText(/capture a thought or task/i);

            fireEvent.change(input, { target: { value: "Test" } });
            fireEvent.click(screen.getByTitle(/save capture/i));

            await waitFor(() => {
                expect(screen.getByText(/First tiny step/)).toBeInTheDocument();
                expect(screen.getByText(/Open your calendar/)).toBeInTheDocument();
            });
        });

        it("shows related items", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    action: "filed",
                    destination: "people",
                    summary: "Person added",
                    related: [
                        { name: "Project Alpha", type: "projects", relevance: "Works on it" },
                    ],
                }),
            });

            render(<QuickCapture useStreaming={false} />);
            const input = screen.getByPlaceholderText(/capture a thought or task/i);

            fireEvent.change(input, { target: { value: "Test" } });
            fireEvent.click(screen.getByTitle(/save capture/i));

            await waitFor(() => {
                expect(screen.getByText(/Related:/)).toBeInTheDocument();
                expect(screen.getByText(/Project Alpha/)).toBeInTheDocument();
            });
        });

        it("limits related items to 3", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    action: "filed",
                    destination: "projects",
                    summary: "Filed",
                    related: [
                        { name: "Item 1", type: "people", relevance: "r1" },
                        { name: "Item 2", type: "people", relevance: "r2" },
                        { name: "Item 3", type: "people", relevance: "r3" },
                        { name: "Item 4", type: "people", relevance: "r4" },
                    ],
                }),
            });

            render(<QuickCapture useStreaming={false} />);
            const input = screen.getByPlaceholderText(/capture a thought or task/i);

            fireEvent.change(input, { target: { value: "Test" } });
            fireEvent.click(screen.getByTitle(/save capture/i));

            await waitFor(() => {
                expect(screen.getByText(/Item 1/)).toBeInTheDocument();
                expect(screen.getByText(/Item 2/)).toBeInTheDocument();
                expect(screen.getByText(/Item 3/)).toBeInTheDocument();
                expect(screen.queryByText(/Item 4/)).not.toBeInTheDocument();
            });
        });

        it("allows dismissing result by clicking", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    action: "filed",
                    destination: "projects",
                    summary: "Test summary",
                }),
            });

            render(<QuickCapture useStreaming={false} />);
            const input = screen.getByPlaceholderText(/capture a thought or task/i);

            fireEvent.change(input, { target: { value: "Test" } });
            fireEvent.click(screen.getByTitle(/save capture/i));

            await waitFor(() => {
                expect(screen.getByText(/Test summary/)).toBeInTheDocument();
            });

            // Click to dismiss
            fireEvent.click(screen.getByText(/Test summary/));

            await waitFor(() => {
                expect(screen.queryByText(/Test summary/)).not.toBeInTheDocument();
            });
        });
    });

    describe("clarification flow", () => {
        it("shows clarification question when agent asks", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    action: "clarify",
                    question: "Is this a project or a task?",
                    options: ["Project", "Task", "Idea"],
                }),
            });

            render(<QuickCapture useStreaming={false} />);
            const input = screen.getByPlaceholderText(/capture a thought or task/i);

            fireEvent.change(input, { target: { value: "do something" } });
            fireEvent.click(screen.getByTitle(/save capture/i));

            await waitFor(() => {
                expect(screen.getByText(/Is this a project or a task\?/)).toBeInTheDocument();
            });
        });

        it("shows clarification options as buttons", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    action: "clarify",
                    question: "What type?",
                    options: ["Project", "Task", "Idea"],
                }),
            });

            render(<QuickCapture useStreaming={false} />);
            const input = screen.getByPlaceholderText(/capture a thought or task/i);

            fireEvent.change(input, { target: { value: "test" } });
            fireEvent.click(screen.getByTitle(/save capture/i));

            await waitFor(() => {
                expect(screen.getByRole("button", { name: "Project" })).toBeInTheDocument();
                expect(screen.getByRole("button", { name: "Task" })).toBeInTheDocument();
                expect(screen.getByRole("button", { name: "Idea" })).toBeInTheDocument();
            });
        });

        it("limits clarification options to 3", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    action: "clarify",
                    question: "Pick one?",
                    options: ["One", "Two", "Three", "Four", "Five"],
                }),
            });

            render(<QuickCapture useStreaming={false} />);
            const input = screen.getByPlaceholderText(/capture a thought or task/i);

            fireEvent.change(input, { target: { value: "test" } });
            fireEvent.click(screen.getByTitle(/save capture/i));

            await waitFor(() => {
                expect(screen.getByRole("button", { name: "One" })).toBeInTheDocument();
                expect(screen.getByRole("button", { name: "Two" })).toBeInTheDocument();
                expect(screen.getByRole("button", { name: "Three" })).toBeInTheDocument();
                expect(screen.queryByRole("button", { name: "Four" })).not.toBeInTheDocument();
            });
        });

        it("resubmits with selected option", async () => {
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        success: true,
                        action: "clarify",
                        question: "Which type?",
                        options: ["Project", "Task"],
                    }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        success: true,
                        action: "filed",
                        destination: "projects",
                        summary: "Filed as project",
                    }),
                });

            render(<QuickCapture useStreaming={false} />);
            const input = screen.getByPlaceholderText(/capture a thought or task/i);

            fireEvent.change(input, { target: { value: "original text" } });
            fireEvent.click(screen.getByTitle(/save capture/i));

            await waitFor(() => {
                expect(screen.getByRole("button", { name: "Project" })).toBeInTheDocument();
            });

            // Click the option
            fireEvent.click(screen.getByRole("button", { name: "Project" }));

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(2);
                // Second call should include the clarification
                const secondBody = JSON.parse(mockFetch.mock.calls[1][1].body);
                expect(secondBody.text).toContain("original text");
                expect(secondBody.text).toContain("[User clarification: Project]");
            });
        });

        it("allows typing custom answer", async () => {
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        success: true,
                        action: "clarify",
                        question: "What is this about?",
                        options: [],
                    }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        success: true,
                        action: "filed",
                        destination: "ideas",
                        summary: "Filed",
                    }),
                });

            render(<QuickCapture useStreaming={false} />);
            const input = screen.getByPlaceholderText(/capture a thought or task/i);

            fireEvent.change(input, { target: { value: "something vague" } });
            fireEvent.click(screen.getByTitle(/save capture/i));

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/type your answer/i)).toBeInTheDocument();
            });

            // Type a custom answer
            fireEvent.change(screen.getByPlaceholderText(/type your answer/i), {
                target: { value: "It's about my app idea" },
            });
            fireEvent.click(screen.getByTitle(/Send answer/i));

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(2);
            });
        });

        it("allows canceling clarification", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    action: "clarify",
                    question: "Need more info?",
                    options: ["Yes", "No"],
                }),
            });

            render(<QuickCapture useStreaming={false} />);
            const input = screen.getByPlaceholderText(/capture a thought or task/i);

            fireEvent.change(input, { target: { value: "test" } });
            fireEvent.click(screen.getByTitle(/save capture/i));

            await waitFor(() => {
                expect(screen.getByTitle(/Skip and save to inbox/)).toBeInTheDocument();
            });

            // Cancel
            fireEvent.click(screen.getByTitle(/Skip and save to inbox/));

            await waitFor(() => {
                expect(screen.queryByText(/Need more info\?/)).not.toBeInTheDocument();
            });

            // Should show success toast for saving to inbox
            expect(mockSuccess).toHaveBeenCalledWith(expect.stringContaining("inbox"));
        });

        it("shows original text preview in clarification", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    action: "clarify",
                    question: "What type?",
                }),
            });

            render(<QuickCapture useStreaming={false} />);
            const input = screen.getByPlaceholderText(/capture a thought or task/i);

            fireEvent.change(input, { target: { value: "this is a very long text that should be truncated" } });
            fireEvent.click(screen.getByTitle(/save capture/i));

            await waitFor(() => {
                // Should show truncated version of original text
                expect(screen.getByText(/this is a very long text that shou/)).toBeInTheDocument();
            });
        });

        it("disables voice capture during clarification", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    action: "clarify",
                    question: "What type?",
                }),
            });

            render(<QuickCapture useStreaming={false} />);
            const input = screen.getByPlaceholderText(/capture a thought or task/i);

            fireEvent.change(input, { target: { value: "test" } });
            fireEvent.click(screen.getByTitle(/save capture/i));

            await waitFor(() => {
                const micButton = screen.getByTitle(/voice capture/i);
                expect(micButton).toBeDisabled();
            });
        });
    });

    describe("processing phases", () => {
        it("shows thinking phase initially", async () => {
            // Don't resolve immediately to see the loading state
            mockFetch.mockImplementation(() => new Promise(() => {}));

            render(<QuickCapture useStreaming={false} />);
            const input = screen.getByPlaceholderText(/capture a thought or task/i);

            fireEvent.change(input, { target: { value: "Test" } });
            fireEvent.click(screen.getByTitle(/save capture/i));

            await waitFor(() => {
                expect(screen.getByText(/Understanding/i)).toBeInTheDocument();
            });
        });
    });

    describe("toast notifications", () => {
        it("shows success toast on successful file", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    action: "filed",
                    destination: "projects",
                }),
            });

            render(<QuickCapture useStreaming={false} />);
            const input = screen.getByPlaceholderText(/capture a thought or task/i);

            fireEvent.change(input, { target: { value: "Test" } });
            fireEvent.click(screen.getByTitle(/save capture/i));

            await waitFor(() => {
                expect(mockSuccess).toHaveBeenCalledWith("Got it!");
            });
        });

        it("shows different toast for needs_review", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    action: "filed",
                    destination: "needs_review",
                }),
            });

            render(<QuickCapture useStreaming={false} />);
            const input = screen.getByPlaceholderText(/capture a thought or task/i);

            fireEvent.change(input, { target: { value: "Test" } });
            fireEvent.click(screen.getByTitle(/save capture/i));

            await waitFor(() => {
                expect(mockSuccess).toHaveBeenCalledWith(expect.stringContaining("take a look"));
            });
        });

        it("shows error toast on failure", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({
                    success: false,
                    error: "Server error",
                }),
            });

            render(<QuickCapture useStreaming={false} />);
            const input = screen.getByPlaceholderText(/capture a thought or task/i);

            fireEvent.change(input, { target: { value: "Test" } });
            fireEvent.click(screen.getByTitle(/save capture/i));

            await waitFor(() => {
                expect(mockShowError).toHaveBeenCalledWith("Server error");
            });
        });
    });
});
