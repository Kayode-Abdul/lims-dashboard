<!DOCTYPE html>
<html>

<head>
    <style>
        body {
            font-family: sans-serif;
            line-height: 1.6;
            color: #333;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #eee;
            border-radius: 10px;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
        }

        .footer {
            font-size: 12px;
            color: #777;
            margin-top: 30px;
            text-align: center;
        }

        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #6366f1;
            color: #fff;
            text-decoration: none;
            border-radius: 5px;
        }

        .details {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>

<body>
    <div className="container">
        <div className="header">
            <h1 style="color: #6366f1;">Welcome to Global Diagnostics LIMS!</h1>
        </div>

        <p>Hello {{ $adminName }},</p>

        <p>Thank you for registering <strong>{{ $labName }}</strong> on our platform. Your account has been created and
            your laboratory is now set up.</p>

        <div className="details">
            <h3 style="margin-top: 0;">Your Account Details:</h3>
            <p><strong>Laboratry:</strong> {{ $labName }}</p>
            <p><strong>Admin Email:</strong> {{ $adminEmail }}</p>
            <p><strong>Subscription Status:</strong> Pending Verification</p>
        </div>

        <p>To get started, please log in to your dashboard and activate your subscription using an access key or request
            a manual cash verification.</p>

        <div style="text-align: center;">
            <a href="{{ url('/login') }}" className="button">Login to Dashboard</a>
        </div>

        <p>If you have any questions, please contact our support team.</p>

        <div className="footer">
            &copy; {{ date('Y') }} Global Diagnostics LIMS. All rights reserved.
        </div>
    </div>
</body>

</html>