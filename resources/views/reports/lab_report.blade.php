<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Laboratory Report - {{ $results->first()->testOrder->order_number }}</title>
    <style>
        /* Define page margins for the whole document */
        @page {
            margin: {{ $lab->pdf_margin_top ?? 1.20 }}in 15mm {{ $lab->pdf_margin_bottom ?? 45 }}mm 15mm;
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            color: #000;
            background-color: #fff;
            line-height: 1.1;
            margin: 0;
            padding: 0;
        }

        /* Fixed header sits in the top margin area */
        .header {
            position: fixed;
            top: -{{ $lab->pdf_margin_top ?? 1.20 }}in;
            left: -15mm;
            right: -15mm;
            width: calc(100% + 30mm);
            height: {{ $lab->pdf_margin_top ?? 1.20 }}in;
            text-align: center;
        }

        /* Fixed footer sits in the bottom margin area */
        .footer {
            position: fixed;
            bottom: -{{ $lab->pdf_margin_bottom ?? 45 }}mm;
            left: -15mm;
            right: -15mm;
            width: calc(100% + 30mm);
            height: {{ $lab->pdf_margin_bottom ?? 45 }}mm;
            text-align: center;
        }

        .main-content {
            width: 100%;
        }

        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #000;
        }

        .report-title {
            font-size: 11px;
            font-weight: bold;
            margin-top: 10px;
            text-transform: uppercase;
            color: #000;
        }

        .section {
            margin-bottom: 5px;
            width: 100%;
        }

        .section-report-title {
            font-size: 11px;
            font-weight: bold;
            color: #000;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 3px;
            margin-bottom: 5px;
            text-align: center;
            text-transform: uppercase;
        }

        table.result-table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
            padding: 0;
            border-spacing: 0;
        }

        table.result-table th, 
        table.result-table td {
            padding: 0;
            text-align: left;
            font-size: 10px;
            line-height: 1.0;
            border: none;
            color: #000;
            margin: 0;
            vertical-align: top;
        }

        table.result-table th {
            padding-bottom: 10px;
            font-size: 10px;
        }

        table.result-table td {
            padding-top: 2px;
            padding-bottom: 2px;
        }

        .info-grid {
            display: table;
            width: 100%;
        }

        .info-item {
            display: table-cell;
            width: 50%;
            padding: 4px 0;
            font-size: 12px;
            line-height: 1.5;
        }

        .abnormal {
            color: #000;
            font-weight: bold;
        }

        /* 1. PDF Signature Block (Absolute Bottom of content area) */
        .signatures-pdf {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            page-break-inside: avoid;
        }

        .signature-spacer {
            height: 90px; /* Reserve space so content doesn't overlap signature */
        }

        /* 2. Web Print Signature Block (Standard Flow) */
        .signatures-web {
            display: none; /* Hidden by default */
            width: 100%;
            padding-top: 30px;
            margin-top: 30px;
            page-break-inside: avoid;
        }

        @media print {
            .signatures-pdf, .signature-spacer {
                display: none !important; /* Hide absolute positioning logic during browser print */
            }
            .signatures-web {
                display: block !important; /* Show normal flow logic */
            }
        }
    </style>
</head>

<body>
    <div class="header">
        @if(isset($lab) && isset($lab->header_base64) && $lab->header_base64)
        <img src="{{ $lab->header_base64 }}" style="width: 100%; height: 100%; object-fit: contain;">
        @else
        <div class="logo" style="padding-top: 20px;">{{ $lab->name ?? 'GLOBAL DIAGNOSTICS' }}</div>
        <div class="report-title">Laboratory Diagnostic Report</div>
        @endif
    </div>

    <div class="footer">
        @if(isset($lab) && isset($lab->footer_base64) && $lab->footer_base64)
        <img src="{{ $lab->footer_base64 }}" style="width: 100%; height: 100%; object-fit: contain;">
        @endif
    </div>

    <div class="main-content">
        <div class="section">
            <div class="info-grid">
                <div class="info-item">
                    @php
                    $firstOrder = $results->first()->testOrder;
                    $patient = $firstOrder->patient;
                    $dob = \Carbon\Carbon::parse($patient->date_of_birth);
                    $now = now();
                    $diff = $dob->diff($now);
                    $ageString = '';
                    if ($diff->y > 0) $ageString .= $diff->y . 'y ';
                    if ($diff->m > 0) $ageString .= $diff->m . 'm ';
                    if ($diff->d > 0 || $ageString == '') $ageString .= $diff->d . 'd';
                    @endphp
                    <strong>Patient Name:</strong> {{ $patient->first_name }} {{ $patient->last_name }}<br>
                    <strong>Patient ID:</strong> {{ $patient->patient_id }}<br>
                    <strong>Gender / Age:</strong> {{ ucfirst($patient->sex ?? 'N/A') }} / {{ $ageString }}<br>
                    <strong>Phone:</strong> {{ $patient->phone ?? 'N/A' }}<br>
                    @if($firstOrder->patient_type === 'hmo')
                    <strong>HMO Name:</strong> {{ $firstOrder->hmo->name ?? 'N/A' }}<br>
                    <strong>HMO Type:</strong> {{ $firstOrder->hmo_type ?? 'N/A' }}
                    @elseif($firstOrder->patient_type === 'referred' || $firstOrder->hospital || $firstOrder->doctor)
                    @if($firstOrder->hospital) <strong>Ref. Hospital:</strong> {{ $firstOrder->hospital->name }}<br> @endif
                    @if($firstOrder->doctor) <strong>Ref. Dr.:</strong> {{ $firstOrder->doctor->name }} @endif
                    @else
                    <strong>Patient Type:</strong> Walk-in
                    @endif
                </div>
                <div class="info-item" style="vertical-align: top;">
                    <strong>Order Number:</strong> {{ $firstOrder->order_number }}<br>
                    <strong>Sample Type:</strong> {{ $firstOrder->sample_type ?? 'N/A' }}<br>
                    <strong>Date Ordered:</strong> {{ \Carbon\Carbon::parse($firstOrder->ordered_at)->format('d M Y, H:i') }}<br>
                    <strong>Report Date:</strong> {{ now()->format('d M Y, H:i') }}
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-report-title">Laboratory Report</div>
            <table class="result-table">
                <colgroup>
                    <col style="width: 33.33%;">
                    <col style="width: 33.33%;">
                    <col style="width: 33.33%;">
                </colgroup>
                <thead>
                    <tr>
                        <th>Test Parameter</th>
                        <th>Result</th>
                        <th style="text-align: right;">Ref Value/Unit</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($results as $result)
                    @php $isChildTest = !empty($result->testOrder->test->parent_id); @endphp
                    <tr>
                        @if($isChildTest)
                        <td style="font-weight: 600; color: #374151; text-transform: uppercase; font-size: 9px; font-style: italic;">
                            {{ $result->testOrder->test->test_name }}
                        </td>
                        @else
                        <td style="font-weight: bold; text-transform: uppercase; font-size: 10px;">
                            {{ $result->testOrder->test->test_name }}
                        </td>
                        @endif
                        <td class="{{ $result->is_abnormal ? 'abnormal' : '' }}" style="font-weight: bold; white-space: pre-wrap;">{{ $result->result_value }}</td>
                        <td style="font-weight: bold; text-align: right;">
                            {{ $result->reference_range ?? '' }} {{ $result->units ?? '' }}
                        </td>
                    </tr>
                    @if($result->subtest_results && is_array($result->subtest_results))
                    @php 
                    $lastSubName = ''; 
                    $orderedSubtests = [];
                    $subresultsObj = $result->subtest_results;
                    $definitions = $result->testOrder->test->subtest_definitions ?? [];
                    if (is_string($definitions)) $definitions = json_decode($definitions, true) ?? [];
                    $selectedSubtests = $result->testOrder->selected_subtests ?? [];
                    if (is_string($selectedSubtests)) $selectedSubtests = json_decode($selectedSubtests, true) ?? [];

                    if (!empty($selectedSubtests)) {
                        foreach ($selectedSubtests as $defKey) {
                            $key = (string)$defKey;
                            if (isset($subresultsObj[$key])) $orderedSubtests[$key] = $subresultsObj[$key];
                        }
                    } elseif (!empty($definitions)) {
                        foreach ($definitions as $def) {
                            $key = (string)($def['id'] ?? $def['name'] ?? $def['investigation'] ?? '');
                            if ($key && isset($subresultsObj[$key])) $orderedSubtests[$key] = $subresultsObj[$key];
                        }
                    }
                    foreach ($subresultsObj as $key => $sub) {
                        if (!isset($orderedSubtests[$key])) $orderedSubtests[$key] = $sub;
                    }
                    @endphp
                    @foreach($orderedSubtests as $sub)
                    @php
                    $currentSubName = $sub['name'] ?? $sub['investigation'] ?? '';
                    $displaySubName = ($currentSubName === $lastSubName) ? '' : $currentSubName;
                    $lastSubName = $currentSubName;
                    @endphp
                    <tr>
                        <td style="font-size: 10px; font-style: italic; color: #4b5563; vertical-align: top;">
                            {{ $displaySubName }}
                        </td>
                        <td style="font-size: 10px; vertical-align: top; white-space: pre-wrap; text-align: left;" class="{{ ($sub['is_abnormal'] ?? false) ? 'abnormal' : '' }}">{{ $sub['value'] ?? '' }}</td>
                        <td style="font-size: 10px; color: #6b7280; text-align: right;">
                            {{ $sub['reference_range'] ?? $sub['reference_value'] ?? '' }} {{ $sub['units'] ?? '' }}
                        </td>
                    </tr>
                    @endforeach
                    @endif
                    <tr><td colspan="3" style="border: none; padding: 0; line-height: 1px; font-size: 1px; height: 1px;">&nbsp;</td></tr>
                    @endforeach
                </tbody>
            </table>

            @foreach($results as $result)
            @if($result->notes)
            <div style="margin-top: 15px; border-top: 1px dashed #eee; padding-top: 10px; margin-bottom: 20px;">
                <div style="font-size: 11px; font-weight: bold; color: #4b5563; margin-bottom: 5px;">Comment:</div>
                <div style="font-size: 11px; color: #1f2937;">{!! $result->notes !!}</div>
            </div>
            @endif
            @endforeach

            @php
            $verifiedResult = $results->first(fn($r) => $r->verified_at !== null && $r->verifiedBy);
            $verifiedBy = $verifiedResult ? $verifiedResult->verifiedBy : null;
            @endphp

            <!-- PDF ONLY SIGNATURE (Normal Flow, same row as QR) -->
            <div class="signature-spacer"></div>
            <div class="signatures-pdf">
                <table style="width: 100%; border: none;">
                    <tr>
                        <td style="width: 50%; text-align: left; vertical-align: bottom; border: none; padding: 0;">
                            @if(isset($lab->qr_code_base64) && $lab->qr_code_base64)
                            <img src="{{ $lab->qr_code_base64 }}" style="height: 50px; width: 50px;">
                            <div style="font-size: 7px; color: #6b7280; margin-top: 2px;">Scan to Verify</div>
                            @endif
                        </td>
                        <td style="width: 50%; text-align: right; vertical-align: bottom; border: none; padding: 0;">
                            @if($verifiedBy)
                                <div style="text-align: center; min-width: 180px; float: right; margin-top: 10px; position: relative;">
                                    @if($verifiedBy)
                                        <div style="padding-top: 40px;">
                                            <strong style="font-size: 8px; display: block; color: #000; text-transform: uppercase;">MED. LAB. SCIENTIST.</strong>
                                            <span style="font-size: 8px; color: #000;">{{ $verifiedBy->first_name }} {{ $verifiedBy->last_name }}</span>
                                        </div>
                                        
                                        @if($verifiedBy->signature_base64)
                                            <div style="position: absolute; top: 0; left: 0; right: 0; z-index: 999; pointer-events: none;">
                                                <img src="{{ $verifiedBy->signature_base64 }}" style="height: 90px; max-width: 200px; object-fit: contain; display: block; margin: 0 auto;">
                                            </div>
                                        @else
                                            <div style="position: absolute; top: 15px; left: 0; right: 0; z-index: 999; font-family: cursive; font-size: 16px; color: #000; pointer-events: none;">
                                                {{ $verifiedBy->first_name }} {{ $verifiedBy->last_name }}
                                            </div>
                                        @endif
                                    @endif
                                </div>
                            @else
                            <div style="text-align: center; min-width: 180px; float: right;">
                                <div style="padding-top: 2px;">
                                    <strong style="font-size: 8px; display: block; color: #000;">MED. LAB. SCIENTIST.</strong>
                                </div>
                            </div>
                            @endif
                        </td>
                    </tr>
                </table>
            </div>

            <!-- BROWSER PRINT ONLY SIGNATURE (Normal Flow) -->
            <div class="signatures-web">
                <table style="width: 100%; border: none;">
                    <tr>
                        <td style="width: 50%; text-align: left; vertical-align: bottom; border: none; padding: 0;">
                            @if(isset($lab->qr_code_base64) && $lab->qr_code_base64)
                            <img src="{{ $lab->qr_code_base64 }}" style="height: 50px; width: 50px;">
                            <div style="font-size: 7px; color: #6b7280; margin-top: 2px;">Scan to Verify</div>
                            @endif
                        </td>
                        <td style="width: 50%; text-align: right; vertical-align: bottom; border: none; padding: 0;">
                            @if($verifiedBy)
                                <div style="text-align: center; min-width: 180px; float: right;">
                                    @if($verifiedBy->signature_base64)
                                    <img src="{{ $verifiedBy->signature_base64 }}" style="height: 70px; max-width: 200px; object-fit: contain;">
                                    @else
                                    <div style="font-family: cursive; font-size: 16px; color: #000; padding: 10px 0;">
                                        {{ $verifiedBy->first_name }} {{ $verifiedBy->last_name }}
                                    </div>
                                    @endif
                                    <div style="text-align: center; padding-top: 2px; min-width: 150px;">
                                        <strong style="font-size: 8px; display: block; color: #000;">MED. LAB. SCIENTIST.</strong>
                                        <span style="font-size: 8px; color: #000;">{{ $verifiedBy->first_name }} {{ $verifiedBy->last_name }}</span>
                                    </div>
                                </div>
                            @else
                            <div style="text-align: center; min-width: 180px; float: right;">
                                <div style="padding-top: 2px;">
                                    <strong style="font-size: 8px; display: block; color: #000;">MED. LAB. SCIENTIST.</strong>
                                </div>
                            </div>
                            @endif
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    </div>
</body>

</html>