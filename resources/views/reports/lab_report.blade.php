<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Laboratory Report - {{ $results->first()->testOrder->order_number }}</title>
    <style>
        @page {
            margin: 0;
        }

        body {
            font-family: 'Helvetica', sans-serif;
            color: #000;
            background-color: #fff;
            line-height: 1.2;
            margin: 0;
            padding: 0;
        }

        .header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            width: 100%;
            text-align: center;
        }

        .main-content {
            margin: 42mm 15mm 45mm 15mm;
            /* Top (Header), Right, Bottom (Footer), Left */
        }

        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #1a56db;
        }

        .report-title {
            font-size: 11px;
            font-weight: bold;
            margin-top: 10px;
            text-transform: uppercase;
        }

        .section {
            margin-bottom: 10px;
        }

        .section-title {
            font-size: 11px;
            font-weight: bold;
            color: #4b5563;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
            margin-bottom: 15px;
            text-transform: uppercase;
        }

        .section-report-title {
            font-size: 11px;
            font-weight: bold;
            color: #4b5563;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
            margin-bottom: 5px;
            text-align: center;
            text-transform: uppercase;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }

        th,
        td {
            padding: 5px 10px;
            text-align: left;
            font-size: 11px;
            border: none;
        }

        .info-grid {
            display: table;
            width: 100%;
        }

        .info-item {
            display: table-cell;
            width: 50%;
            padding: 2px 5px;
            font-size: 12px;
        }

        .result-table th {
            background-color: #fff;
        }

        .abnormal {
            color: #dc2626;
            font-weight: bold;
        }

        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            text-align: center;
        }

        .signatures {
            position: absolute;
            bottom: 12mm;
            left: 15mm;
            right: 15mm;
            border-top: 1px solid #eee;
            padding-top: 10px;
        }

        .signature-box {
            display: inline-block;
            width: 32%;
            text-align: center;
            padding-top: 10px;
            margin-top: 0;
            border-top: 1px solid #333;
        }

        .barcode {
            margin-top: 10px;
        }

        .disclaimer {
            margin-top: 20px;
            font-style: italic;
            color: #4b5563;
            font-size: 10px;
        }
    </style>
</head>

<body>
    <div class="header">
        @if(isset($lab) && isset($lab->header_base64) && $lab->header_base64)
        <img src="{{ $lab->header_base64 }}" style="width: 100%; max-height: 200px; object-fit: contain;">
        @else
        <div class="logo">{{ $lab->name ?? 'GLOBAL DIAGNOSTICS' }}</div>
        <div class="report-title">Laboratory Diagnostic Report</div>
        @endif
    </div>

    <div class="main-content">

        <div class="section">
            <div class="info-grid">
                <div class="info-item">
                    @php
                    $firstOrder = $results->first()->testOrder;
                    $patient = $firstOrder->patient;

                    // Comprehensive Age Calculation
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
                    <strong>Phone:</strong> {{ $patient->phone ?? 'N/A' }}
                </div>
                <div class="info-item">
                    <strong>Order Number:</strong> {{ $firstOrder->order_number }}<br>
                    @if($firstOrder->patient_type === 'hmo')
                    <strong>HMO Name:</strong> {{ $firstOrder->hmo->name ?? 'N/A' }}<br>
                    <strong>HMO Type:</strong> {{ $firstOrder->hmo_type ?? 'N/A' }}<br>
                    @elseif($firstOrder->patient_type === 'referred' || $firstOrder->hospital || $firstOrder->doctor)
                    @if($firstOrder->hospital) <strong>Ref. Hospital:</strong> {{ $firstOrder->hospital->name }}<br>
                    @endif
                    @if($firstOrder->doctor) <strong>Ref. Dr.:</strong> {{ $firstOrder->doctor->name }}<br> @endif
                    @else
                    <strong>Patient Type:</strong> Walk-in<br>
                    @endif
                    <strong>Sample Type:</strong> {{ $firstOrder->sample_type ?? 'N/A' }}<br>
                    <strong>Date Ordered:</strong> {{ \Carbon\Carbon::parse($firstOrder->ordered_at)->format('d M Y,
                    H:i')
                    }}<br>
                    <strong>Report Date:</strong> {{ now()->format('d M Y, H:i') }}
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-report-title">Laboratory Report</div>
            <table class="result-table">
                <thead>
                    <tr>
                        <th>Test Parameter</th>
                        <th>Result</th>
                        <th>Ref/Unit Value</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($results as $result)
                    <tr style="background-color: #fff; border: none;">
                        <td style="font-weight: bold; color: #1e293b; text-transform: uppercase; font-size: 11px;">
                            {{ $result->testOrder->test->test_name }}
                        </td>
                        <td style="font-weight: bold;" class="{{ $result->is_abnormal ? 'abnormal' : '' }}">
                            {{ $result->result_value }}
                        </td>
                        <td style="font-weight: bold;">
                            {{ $result->reference_range ?? '' }} {{ $result->units ?? '' }}
                        </td>
                    </tr>
                    @if($result->subtest_results && is_array($result->subtest_results))
                    @php $lastSubName = ''; @endphp
                    @foreach($result->subtest_results as $sub)
                    @php
                    $currentSubName = $sub['name'] ?? $sub['investigation'] ?? '';
                    $displaySubName = ($currentSubName === $lastSubName) ? '' : $currentSubName;
                    $lastSubName = $currentSubName;
                    @endphp
                    <tr style="border: none;">
                        <td
                            style="padding-left: 25px; font-size: 10px; font-style: italic; color: #4b5563; vertical-align: top; border: none;">
                            {{ $displaySubName }}
                        </td>
                        <td style="font-size: 10px; vertical-align: top; border: none;"
                            class="{{ ($sub['is_abnormal'] ?? false) ? 'abnormal' : '' }}">
                            {{ $sub['value'] ?? '' }}
                        </td>
                        <td style="font-size: 10px; color: #6b7280; border: none;">
                            {{ $sub['reference_range'] ?? $sub['reference_value'] ?? '' }} {{ $sub['units'] ?? '' }}
                        </td>
                    </tr>
                    @if(isset($sub['additional_ranges']) && is_array($sub['additional_ranges']))
                    @foreach($sub['additional_ranges'] as $ar)
                    <tr>
                        <td style="padding-left: 25px;"></td>
                        <td></td>
                        <td style="font-size: 11px; color: #6b7280;">{{ $ar['range'] ?? $ar['reference_range'] ?? '' }}
                            {{ $ar['units'] ?? '' }}
                        </td>
                    </tr>
                    @endforeach
                    @endif
                    @endforeach
                    @endif
                    <tr style="height: 10px; border: none;">
                        <td colspan="3" style="border: none;"></td>
                    </tr>
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

            @php $hasAbnormal = $results->contains('is_abnormal', true); @endphp
            {{-- @if($hasAbnormal)
            <div
                style="margin-top: 15px; padding: 10px; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 4px; font-size: 12px; color: #991b1b; text-align: center;">
                <strong>*** ALERT: One or more results are outside the normal reference range. Please consult with your
                    physician. ***</strong>
            </div>
            @endif --}}
        </div>

        <!-- Content End -->
    </div>

    </div>

    <div class="footer">
        @php
        $verifiedResult = $results->first(fn($r) => $r->verified_at !== null && $r->verifiedBy);
        $verifiedBy = $verifiedResult ? $verifiedResult->verifiedBy : null;
        @endphp

        <!-- Signature/QR Section inside Fixed Footer -->
        <div style="margin-bottom: 5px; padding-top: 5px; margin-left: 15mm; margin-right: 15mm;">
            <table style="width: 100%; border: none;">
                <tr>
                    <td style="width: 50%; text-align: left; vertical-align: bottom; border: none;">
                        @if(isset($lab->qr_code_base64) && $lab->qr_code_base64)
                        <img src="{{ $lab->qr_code_base64 }}" style="height: 40px; width: 40px;">
                        <div style="font-size: 7px; color: #6b7280; margin-top: 2px;">Scan to Verify</div>
                        @endif
                    </td>
                    <td style="width: 50%; text-align: right; vertical-align: bottom; border: none;">
                        @if($verifiedBy)
                        <div style="text-align: center; min-width: 180px; position: relative;">
                            <!-- Stacked Signature (Negative margin to hover) -->
                            <div style="margin-bottom: -55px; position: relative; z-index: 10;">
                                @if($verifiedBy->signature_base64)
                                <img src="{{ $verifiedBy->signature_base64 }}"
                                    style="height: 100px; max-width: 250px; object-fit: contain;">
                                @else
                                <div
                                    style="font-family: cursive; font-size: 16px; color: #1a56db; height: 60px; line-height: 60px;">
                                    {{ $verifiedBy->first_name }} {{ $verifiedBy->last_name }}
                                </div>
                                @endif
                            </div>

                            <div
                                style="text-align: center; border-top: 1px solid #1f1f37ff; padding-top: 2px;min-width: 150px;">
                                <strong style="font-size: 8px; display: block; color: #374151;">MED. LAB.
                                    SCIENTIST.</strong>
                                <span style="font-size: 8px; color: #1e40af;">{{ $verifiedBy->first_name }} {{
                                    $verifiedBy->last_name }}</span>
                            </div>
                        </div>
                        @else
                        <div style="text-align: center; min-width: 180px; position: relative;">

                            <div style="border-top: 1px solid #1f1f37ff; padding-top: 2px;">
                                <strong style="font-size: 8px; display: block; color: #374151;">MED. LAB.
                                    SCIENTIST.</strong>
                                <span style="font-size: 8px; color: #1e40af;"></span>
                            </div>
                        </div>
                        @endif
                    </td>
                </tr>
            </table>
        </div>

        @if(isset($lab) && isset($lab->footer_base64) && $lab->footer_base64)
        <img src="{{ $lab->footer_base64 }}" style="width: 100%; max-height: 120px; object-fit: contain;">
        @endif
    </div>
</body>

</html>