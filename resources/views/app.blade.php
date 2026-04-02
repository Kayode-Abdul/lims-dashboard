<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    <!-- Fonts -->
    <!-- Offline-friendly: Using system fonts -->

    <!-- Scripts -->
    @routes
    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
    @inertiaHead
    <style>
        @media print {
            @page { 
                margin: 0 !important;
                size: auto;
            }
            body { 
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact;
            }
            .print-hidden { display: none !important; }
            header, footer, nav, aside { display: none !important; }
            * { text-shadow: none !important; box-shadow: none !important; }
        }
    </style>
</head>

<body class="font-sans antialiased">
    @inertia
</body>

</html>