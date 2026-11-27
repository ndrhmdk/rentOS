<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title }}</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;">
    <table
        role="presentation"
        width="100%"
        cellpadding="0"
        cellspacing="0"
        style="background:#f4f7fb;"
    >
        <tr>
            <td align="center" style="padding:32px 16px;">
                <table
                    role="presentation"
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    style="max-width:560px;background:#ffffff;border:1px solid #dce5ef;border-radius:16px;"
                >
                    <tr>
                        <td
                            style="background:#0e1a20;padding:20px 28px;border-radius:16px 16px 0 0;"
                        >
                            <span
                                style="color:#ffffff;font-family:Arial,sans-serif;font-size:20px;font-weight:700;"
                            >rent<span style="color:#8fbcd0;">OS</span></span>
                        </td>
                    </tr>
                    <tr>
                        <td
                            style="padding:28px;font-family:Arial,sans-serif;color:#1c2633;"
                        >
                            <span
                                style="display:inline-block;margin:0 0 12px;padding:4px 10px;border-radius:999px;background:#e8eef5;color:#3368a0;font-size:12px;font-weight:700;letter-spacing:0.02em;"
                            >{{ $badge }}</span>
                            <p
                                style="margin:0 0 12px;font-size:20px;line-height:28px;font-weight:700;"
                            >{{ $title }}</p>
                            <p
                                style="margin:0 0 24px;font-size:15px;line-height:24px;color:#3d4b5c;"
                            >{{ $summary }}</p>

                            <table
                                role="presentation"
                                width="100%"
                                cellpadding="0"
                                cellspacing="0"
                                style="border-collapse:collapse;margin:0 0 20px;"
                            >
                                @foreach ([
                                    'error_code' => $errorCode,
                                    'reference' => $context['reference'] ?? null,
                                    'route' => $context['route'] ?? null,
                                    'job' => $context['job'] ?? null,
                                    'operation' => $context['operation'] ?? null,
                                    'duration_ms' => $context['duration_ms'] ?? null,
                                    'total_ms' => $context['total_ms'] ?? null,
                                    'query_count' => $context['query_count'] ?? null,
                                    'occurrence_count' => $context['occurrence_count'] ?? null,
                                    'fingerprint' => isset($context['fingerprint'])
                                        ? \Illuminate\Support\Str::limit((string) $context['fingerprint'], 16, '…')
                                        : null,
                                ] as $label => $value)
                                    @if ($value !== null && $value !== '')
                                        <tr>
                                            <td
                                                style="padding:8px 0;border-top:1px solid #e8eef5;font-size:12px;line-height:18px;color:#617087;width:140px;vertical-align:top;"
                                            >{{ $label }}</td>
                                            <td
                                                style="padding:8px 0;border-top:1px solid #e8eef5;font-size:13px;line-height:20px;color:#1c2633;word-break:break-all;"
                                            >{{ $value }}</td>
                                        </tr>
                                    @endif
                                @endforeach
                            </table>

                            @if (! empty($context['sql']))
                                <p
                                    style="margin:0 0 8px;font-size:12px;line-height:18px;color:#617087;font-weight:700;"
                                >SQL pattern</p>
                                <pre
                                    style="margin:0 0 20px;padding:12px;background:#f4f7fb;border:1px solid #dce5ef;border-radius:8px;font-family:Consolas,Monaco,monospace;font-size:12px;line-height:18px;color:#1c2633;white-space:pre-wrap;word-break:break-all;"
                                >{{ $context['sql'] }}</pre>
                            @endif

                            @if (! empty($topPatterns))
                                <p
                                    style="margin:0 0 8px;font-size:12px;line-height:18px;color:#617087;font-weight:700;"
                                >Top query patterns</p>
                                <table
                                    role="presentation"
                                    width="100%"
                                    cellpadding="0"
                                    cellspacing="0"
                                    style="border-collapse:collapse;margin:0 0 8px;"
                                >
                                    <tr>
                                        <td style="padding:6px 4px;font-size:11px;color:#617087;border-bottom:1px solid #dce5ef;">count</td>
                                        <td style="padding:6px 4px;font-size:11px;color:#617087;border-bottom:1px solid #dce5ef;">total ms</td>
                                        <td style="padding:6px 4px;font-size:11px;color:#617087;border-bottom:1px solid #dce5ef;">max ms</td>
                                        <td style="padding:6px 4px;font-size:11px;color:#617087;border-bottom:1px solid #dce5ef;">sql</td>
                                    </tr>
                                    @foreach ($topPatterns as $pattern)
                                        <tr>
                                            <td style="padding:8px 4px;font-size:12px;color:#1c2633;vertical-align:top;border-bottom:1px solid #e8eef5;">{{ $pattern['count'] ?? '' }}</td>
                                            <td style="padding:8px 4px;font-size:12px;color:#1c2633;vertical-align:top;border-bottom:1px solid #e8eef5;">{{ $pattern['total_ms'] ?? '' }}</td>
                                            <td style="padding:8px 4px;font-size:12px;color:#1c2633;vertical-align:top;border-bottom:1px solid #e8eef5;">{{ $pattern['max_ms'] ?? '' }}</td>
                                            <td style="padding:8px 4px;font-size:11px;color:#1c2633;vertical-align:top;border-bottom:1px solid #e8eef5;font-family:Consolas,Monaco,monospace;word-break:break-all;">{{ $pattern['sql'] ?? '' }}</td>
                                        </tr>
                                    @endforeach
                                </table>
                            @endif
                        </td>
                    </tr>
                    <tr>
                        <td
                            style="padding:16px 28px 24px;font-family:Arial,sans-serif;font-size:12px;line-height:18px;color:#617087;"
                        >
                            Do not share this email outside the ops team.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
