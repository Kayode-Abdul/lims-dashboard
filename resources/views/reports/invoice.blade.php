<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Invoice - {{ $orderNumber }}</title>
    <style>
        @page {
            margin: 0;
        }

        body {
            font-family: 'Helvetica', sans-serif;
            color: #333;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }

        .header {
            @if(!empty($is_pdf))
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            @endif
            width: 100%;
            text-align: center;
        }

        .main-content {
            @if(!empty($is_pdf))
            margin: {{ $lab->pdf_margin_top ?? 1.20 }}in 15mm 30mm 15mm;
            @else
            max-width: 800px;
            margin: 0 auto;
            padding: 0 15mm;
            @endif
        }

        .invoice-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            text-align: center;
            text-transform: uppercase;
            color: #1e40af;
            border-bottom: 2px solid #1e40af;
            padding-bottom: 10px;
        }

        .info-grid {
            display: table;
            width: 100%;
            margin-bottom: 20px;
        }

        .info-item {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            font-size: 12px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        th {
            background-color: #f3f4f6;
            padding: 10px;
            text-align: left;
            font-size: 12px;
            font-weight: bold;
            border-bottom: 1px solid #e5e7eb;
        }

        td {
            padding: 10px;
            text-align: left;
            font-size: 12px;
            border-bottom: 1px solid #e5e7eb;
        }

        .totals {
            width: 40%;
            margin-left: 60%;
        }

        .total-row {
            display: table;
            width: 100%;
            padding: 5px 0;
            font-size: 12px;
        }

        .total-label {
            display: table-cell;
            font-weight: bold;
        }

        .total-value {
            display: table-cell;
            text-align: right;
        }

        .grand-total {
            border-top: 2px solid #1e40af;
            margin-top: 5px;
            padding-top: 10px;
            font-size: 14px;
            font-weight: bold;
            color: #1e40af;
        }

        .footer {
            @if(!empty($is_pdf))
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            @endif
            width: 100%;
            text-align: center;
        }

        .notes {
            margin-top: 30px;
            font-size: 10px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
        }

        /* Print button and toolbar — hidden in PDF and when printing */
        .print-toolbar {
            display: flex;
            justify-content: center;
            gap: 12px;
            padding: 16px;
            background: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
        }

        .print-toolbar button,
        .print-toolbar a {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 10px 24px;
            font-size: 14px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            text-decoration: none;
            border: none;
            transition: all 0.15s ease;
        }

        .btn-print {
            background: #1e40af;
            color: #fff;
        }

        .btn-print:hover {
            background: #1e3a8a;
        }

        .btn-download {
            background: #059669;
            color: #fff;
        }

        .btn-download:hover {
            background: #047857;
        }

        .btn-back {
            background: #6b7280;
            color: #fff;
        }

        .btn-back:hover {
            background: #4b5563;
        }

        @media print {
            .print-toolbar {
                display: none !important;
            }

            body {
                margin: 0;
                padding: 0;
            }

            .main-content {
                margin: {{ $lab->web_margin_top ?? $lab->pdf_margin_top ?? 1.20 }}in 15mm 15mm 15mm;
                max-width: none;
                padding: 0;
            }
        }
    </style>
</head>

<body>
    {{-- Print toolbar — only rendered for the web view --}}
    @if(empty($is_pdf))
    <div class="print-toolbar">
        <button class="btn-back" onclick="history.back()">
            ← Back
        </button>
        <button class="btn-print" onclick="window.print()">
            🖨️ Print Invoice
        </button>
        <a class="btn-download" href="{{ route('test-orders.invoice', $orderNumber) }}">
            📥 Download PDF
        </a>
    </div>
    @endif

    @if(!empty($is_pdf))
    {{-- PDF only: header with base64-encoded image --}}
    <div class="header">
        @if(isset($lab) && isset($lab->header_base64) && $lab->header_base64)
        <img src="{{ $lab->header_base64 }}" style="width: 100%; max-height: 200px; object-fit: contain;">
        @else
        <div style="font-size: 24px; font-weight: bold; padding-top: 20px;">{{ $lab->name ?? 'LABORATORY' }}</div>
        @endif
    </div>
    @endif

    <div class="main-content">
        <div class="invoice-title">Invoice</div>

        <div class="info-grid">
            <div class="info-item">
                <strong>Bill To:</strong><br>
                {{ $patient->first_name }} {{ $patient->last_name }}<br>
                Patient ID: {{ $patient->patient_id }}<br>
                Phone: {{ $patient->phone ?? 'N/A' }}<br>
                @if($patient->hmo)
                HMO: {{ $patient->hmo->name }}
                @endif
            </div>
            <div class="info-item" style="text-align: right;">
                <strong>Invoice Details:</strong><br>
                Order #: {{ $orderNumber }}<br>
                Date: {{ \Carbon\Carbon::parse($orderedAt)->format('d M Y') }}<br>
                Print Date: {{ now()->format('d M Y, H:i') }}
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Description</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach($orders as $index => $order)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $order->test->test_name }}</td>
                    <td style="text-align: right;">{{ $lab->currency ?? '₦' }}{{ number_format($order->price, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <div class="totals">
            <div class="total-row">
                <div class="total-label">Subtotal:</div>
                <div class="total-value">{{ $lab->currency ?? '₦' }}{{ number_format($totalPrice, 2) }}</div>
            </div>
            @if($totalDiscount > 0)
            <div class="total-row">
                <div class="total-label">Discount:</div>
                <div class="total-value">-{{ $lab->currency ?? '₦' }}{{ number_format($totalDiscount, 2) }}</div>
            </div>
            @endif
            <div class="total-row grand-total">
                <div class="total-label">Total Amount:</div>
                <div class="total-value">{{ $lab->currency ?? '₦' }}{{ number_format($totalPrice - $totalDiscount, 2) }}</div>
            </div>
            <div class="total-row">
                <div class="total-label">Amount Paid:</div>
                <div class="total-value">{{ $lab->currency ?? '₦' }}{{ number_format($totalPaid, 2) }}</div>
            </div>
            <div class="total-row" style="color: {{ $balance > 0 ? '#dc2626' : '#059669' }}; font-weight: bold;">
                <div class="total-label">Balance Due:</div>
                <div class="total-value">{{ $lab->currency ?? '₦' }}{{ number_format($balance, 2) }}</div>
            </div>
        </div>

        <div class="notes">
            <strong>Notes:</strong><br>
            {{ $orders->first()->notes ?? 'Thank you for your business.' }}
        </div>
    </div>

    @if(!empty($is_pdf))
    {{-- PDF only: footer with base64-encoded image --}}
    <div class="footer">
        @if(isset($lab) && isset($lab->footer_base64) && $lab->footer_base64)
        <img src="{{ $lab->footer_base64 }}" style="width: 100%; max-height: 120px; object-fit: contain;">
        @endif
    </div>
    @endif
</body>

</html>
