<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Source Analysis - {{ $sourceName }}</title>
    <style>
        @page {
            margin: {{ $lab->pdf_margin_top ?? 1.20 }}in 15mm 20mm 15mm;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 10px;
            color: #333;
            line-height: 1.4;
        }
        .header {
            position: fixed;
            top: -{{ $lab->pdf_margin_top ?? 1.20 }}in;
            left: -15mm;
            right: -15mm;
            width: calc(100% + 30mm);
            height: {{ $lab->pdf_margin_top ?? 1.20 }}in;
            text-align: center;
        }
        .title {
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
            margin-bottom: 10px;
            border-bottom: 2px solid #333;
            padding-bottom: 5px;
        }
        .info-grid {
            width: 100%;
            margin-bottom: 20px;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }
        .info-table td {
            padding: 2px 0;
        }
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        table.data-table th {
            background-color: #f3f4f6;
            border: 1px solid #d1d5db;
            padding: 8px 5px;
            text-align: left;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 8px;
        }
        table.data-table td {
            border: 1px solid #d1d5db;
            padding: 6px 5px;
            vertical-align: top;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .footer-stats {
            margin-top: 20px;
            width: 50%;
            margin-left: 50%;
        }
        .stat-row {
            display: table;
            width: 100%;
            padding: 4px 0;
            border-bottom: 1px solid #eee;
        }
        .stat-label { display: table-cell; font-weight: bold; }
        .stat-value { display: table-cell; text-align: right; }
        .grand-total {
            border-top: 2px solid #333;
            font-size: 12px;
            color: #b91c1c;
        }
    </style>
</head>
<body>
    <div class="header">
        @if(isset($lab->header_base64) && $lab->header_base64)
            <img src="{{ $lab->header_base64 }}" style="width: 100%; height: 100%; object-fit: contain;">
        @else
            <div style="font-size: 20px; font-weight: bold; padding-top: 20px;">{{ $lab->name }}</div>
        @endif
    </div>

    <div class="title">Source Income Analysis</div>

    <table class="info-table">
        <tr>
            <td width="50%">
                <strong>Account Name:</strong> {{ $sourceName }}<br>
                <strong>Source Type:</strong> {{ $sourceType }}
            </td>
            <td width="50%" class="text-right">
                <strong>Period:</strong> {{ \Carbon\Carbon::parse($startDate)->format('d M Y') }} - {{ \Carbon\Carbon::parse($endDate)->format('d M Y') }}<br>
                <strong>Generated:</strong> {{ now()->format('d M Y, H:i') }}
            </td>
        </tr>
    </table>

    <table class="data-table">
        <thead>
            <tr>
                <th>Date</th>
                <th>Lab No</th>
                <th>Patient Name</th>
                <th>Investigations</th>
                <th class="text-right">Amount</th>
                <th class="text-right">Paid (Period)</th>
                <th class="text-right">Balance</th>
            </tr>
        </thead>
        <tbody>
            @php 
                $totalAmount = 0;
                $totalPeriodPaid = 0;
                $totalBalance = 0;
                $currency = $lab->currency ?? '₦';
            @endphp
            @foreach($orders as $order)
                @php
                    $billed = $order->price - $order->discount;
                    $balance = $billed - $order->amount_paid;
                    $totalAmount += $billed;
                    $totalPeriodPaid += $order->period_payments;
                    $totalBalance += $balance;
                @endphp
                <tr>
                    <td>{{ \Carbon\Carbon::parse($order->ordered_at)->format('d/m/y') }}</td>
                    <td class="font-bold">{{ $order->order_number }}</td>
                    <td>{{ $order->patient->first_name }} {{ $order->patient->last_name }}</td>
                    <td style="font-size: 8px;">{{ $order->test->test_name }}</td>
                    <td class="text-right">{{ $currency }}{{ number_format($billed, 2) }}</td>
                    <td class="text-right">{{ $currency }}{{ number_format($order->period_payments, 2) }}</td>
                    <td class="text-right font-bold" style="color: {{ $balance > 0 ? '#b91c1c' : '#059669' }}">
                        {{ $currency }}{{ number_format($balance, 2) }}
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer-stats">
        <div class="stat-row">
            <div class="stat-label">Total Billed:</div>
            <div class="stat-value">{{ $currency }}{{ number_format($totalAmount, 2) }}</div>
        </div>
        <div class="stat-row">
            <div class="stat-label">Total Received (Period):</div>
            <div class="stat-value">{{ $currency }}{{ number_format($totalPeriodPaid, 2) }}</div>
        </div>
        <div class="stat-row grand-total">
            <div class="stat-label">Total Outstanding:</div>
            <div class="stat-value">{{ $currency }}{{ number_format($totalBalance, 2) }}</div>
        </div>
    </div>

    <div style="margin-top: 40px; font-size: 8px; color: #666; text-align: center;">
        This is a computer-generated account statement from {{ $lab->name }}.
    </div>
</body>
</html>
