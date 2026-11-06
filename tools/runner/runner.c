/*
 * Questline runner
 * ----------------------------------------------------------------------------
 * A tiny Win32 process that Discord can detect while a quest is being
 * completed. The executable is copied into a game's folder with the game's
 * executable name, so no real game installation is required.
 *
 * Build with Zig:
 *   zig cc -target x86_64-windows-gnu -O2 -s -mwindows runner.c \
 *     -o ../../resources/runner.exe -luser32 -lgdi32 -lshell32
 */

#ifndef UNICODE
#define UNICODE
#endif
#ifndef _UNICODE
#define _UNICODE
#endif

#include <windows.h>
#include <shellapi.h>

#define APP_NAME L"Questline"
#define WINDOW_CLASS L"QuestlineRunnerWindow"
#define ID_STATUS 1001
#define ID_HINT 1002

static WCHAR g_game_name[256] = L"Discord game";
static ULONGLONG g_started_at = 0;
static HWND g_status = NULL;
static HFONT g_font_title = NULL;
static HFONT g_font_body = NULL;
static HFONT g_font_small = NULL;
static HFONT g_font_status = NULL;
static HBRUSH g_background = NULL;

static void copy_text(WCHAR *destination, size_t capacity, const WCHAR *source) {
    size_t index = 0;
    if (capacity == 0) return;
    while (source[index] != L'\0' && index + 1 < capacity) {
        destination[index] = source[index];
        index++;
    }
    destination[index] = L'\0';
}

static HFONT make_font(int height, int weight) {
    return CreateFontW(
        height, 0, 0, 0, weight, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
        CLEARTYPE_QUALITY, DEFAULT_PITCH | FF_DONTCARE, L"Segoe UI");
}

static void update_status(void) {
    if (g_status == NULL || g_started_at == 0) return;

    ULONGLONG elapsed = (GetTickCount64() - g_started_at) / 1000ULL;
    unsigned long long hours = elapsed / 3600ULL;
    unsigned long long minutes = (elapsed % 3600ULL) / 60ULL;
    unsigned long long seconds = elapsed % 60ULL;
    WCHAR buffer[96];

    if (hours > 0) {
        wsprintfW(buffer, L"Running for %llu:%02llu:%02llu", hours, minutes, seconds);
    } else {
        wsprintfW(buffer, L"Running for %02llu:%02llu", minutes, seconds);
    }
    SetWindowTextW(g_status, buffer);
}

static LRESULT CALLBACK window_proc(HWND window, UINT message, WPARAM wparam, LPARAM lparam) {
    switch (message) {
    case WM_CREATE: {
        g_font_title = make_font(26, FW_BOLD);
        g_font_body = make_font(16, FW_NORMAL);
        g_font_small = make_font(13, FW_NORMAL);
        g_font_status = make_font(14, FW_SEMIBOLD);

        HWND eyebrow = CreateWindowExW(
            0, L"STATIC", L"QUESTLINE  /  ACTIVE SESSION",
            WS_CHILD | WS_VISIBLE | SS_LEFT,
            24, 20, 360, 18, window, NULL, NULL, NULL);
        HWND title = CreateWindowExW(
            0, L"STATIC", g_game_name,
            WS_CHILD | WS_VISIBLE | SS_LEFT | SS_ENDELLIPSIS,
            24, 42, 360, 38, window, NULL, NULL, NULL);
        HWND description = CreateWindowExW(
            0, L"STATIC",
            L"Discord can detect this game while the window is open.",
            WS_CHILD | WS_VISIBLE | SS_LEFT,
            24, 88, 360, 22, window, NULL, NULL, NULL);
        g_status = CreateWindowExW(
            0, L"STATIC", L"Running for 00:00",
            WS_CHILD | WS_VISIBLE | SS_LEFT,
            24, 120, 360, 20, window, (HMENU)ID_STATUS, NULL, NULL);
        HWND hint = CreateWindowExW(
            0, L"STATIC",
            L"Close this window or press Stop in Questline to end the session.",
            WS_CHILD | WS_VISIBLE | SS_LEFT,
            24, 160, 360, 36, window, (HMENU)ID_HINT, NULL, NULL);

        SendMessageW(eyebrow, WM_SETFONT, (WPARAM)g_font_small, TRUE);
        SendMessageW(title, WM_SETFONT, (WPARAM)g_font_title, TRUE);
        SendMessageW(description, WM_SETFONT, (WPARAM)g_font_body, TRUE);
        SendMessageW(g_status, WM_SETFONT, (WPARAM)g_font_status, TRUE);
        SendMessageW(hint, WM_SETFONT, (WPARAM)g_font_small, TRUE);

        SetTimer(window, 1, 1000, NULL);
        update_status();
        return 0;
    }

    case WM_TIMER:
        update_status();
        return 0;

    case WM_CTLCOLORSTATIC: {
        HDC device = (HDC)wparam;
        SetBkMode(device, TRANSPARENT);
        SetTextColor(device, GetDlgCtrlID((HWND)lparam) == ID_HINT
            ? RGB(112, 119, 138)
            : RGB(225, 229, 239));
        return (LRESULT)g_background;
    }

    case WM_ERASEBKGND:
        return 1;

    case WM_PAINT: {
        PAINTSTRUCT paint;
        HDC device = BeginPaint(window, &paint);
        RECT client;
        GetClientRect(window, &client);
        FillRect(device, &client, g_background);

        /* Accent rule on the left edge. */
        RECT accent = { 0, 0, 3, client.bottom };
        HBRUSH accent_brush = CreateSolidBrush(RGB(124, 108, 255));
        FillRect(device, &accent, accent_brush);
        DeleteObject(accent_brush);

        /* Thin separator above the footer. */
        RECT separator = { 24, client.bottom - 40, client.right - 24, client.bottom - 39 };
        HBRUSH line_brush = CreateSolidBrush(RGB(35, 40, 54));
        FillRect(device, &separator, line_brush);
        DeleteObject(line_brush);

        EndPaint(window, &paint);
        return 0;
    }

    case WM_COMMAND:
        if (LOWORD(wparam) == ID_STATUS) return 0;
        break;

    case WM_CLOSE:
        DestroyWindow(window);
        return 0;

    case WM_DESTROY:
        KillTimer(window, 1);
        if (g_font_title) DeleteObject(g_font_title);
        if (g_font_body) DeleteObject(g_font_body);
        if (g_font_small) DeleteObject(g_font_small);
        if (g_font_status) DeleteObject(g_font_status);
        if (g_background) DeleteObject(g_background);
        PostQuitMessage(0);
        return 0;
    }
    return DefWindowProcW(window, message, wparam, lparam);
}

static void read_title(void) {
    int argc = 0;
    LPWSTR *argv = CommandLineToArgvW(GetCommandLineW(), &argc);

    if (argv == NULL) return;

    for (int index = 1; index < argc; index++) {
        if (lstrcmpiW(argv[index], L"--title") == 0 && index + 1 < argc) {
            copy_text(g_game_name, 256, argv[index + 1]);
            break;
        }
    }
    LocalFree(argv);

    if (g_game_name[0] == L'\0') {
        copy_text(g_game_name, 256, L"Discord game");
    }
}

int WINAPI wWinMain(HINSTANCE instance, HINSTANCE previous, PWSTR command_line, int show) {
    (void)previous;
    (void)command_line;
    (void)show;

    read_title();
    g_started_at = GetTickCount64();
    g_background = CreateSolidBrush(RGB(15, 17, 23));

    WNDCLASSEXW window_class = { 0 };
    window_class.cbSize = sizeof(window_class);
    window_class.lpfnWndProc = window_proc;
    window_class.hInstance = instance;
    window_class.hCursor = LoadCursorW(NULL, IDC_ARROW);
    window_class.lpszClassName = WINDOW_CLASS;
    window_class.hbrBackground = g_background;

    if (!RegisterClassExW(&window_class)) {
        return 1;
    }

    int width = 420;
    int height = 260;
    int screen_width = GetSystemMetrics(SM_CXSCREEN);
    int screen_height = GetSystemMetrics(SM_CYSCREEN);
    int x = (screen_width - width) / 2;
    int y = (screen_height - height) / 2;

    HWND window = CreateWindowExW(
        0, WINDOW_CLASS, g_game_name,
        WS_OVERLAPPED | WS_CAPTION | WS_SYSMENU | WS_MINIMIZEBOX,
        x, y, width, height, NULL, NULL, instance, NULL);

    if (window == NULL) {
        return 1;
    }

    /* Keep the runner in the taskbar but don't steal focus from the game/app
       the user was already using. */
    ShowWindow(window, SW_SHOWNOACTIVATE);
    UpdateWindow(window);

    MSG message;
    while (GetMessageW(&message, NULL, 0, 0) > 0) {
        TranslateMessage(&message);
        DispatchMessageW(&message);
    }

    return (int)message.wParam;
}
