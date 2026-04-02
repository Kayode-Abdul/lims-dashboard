<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WelcomeLabMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $labName;
    public $adminName;
    public $adminEmail;

    /**
     * Create a new message instance.
     */
    public function __construct($labName, $adminName, $adminEmail)
    {
        $this->labName = $labName;
        $this->adminName = $adminName;
        $this->adminEmail = $adminEmail;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Welcome to Global Diagnostics LIMS',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.welcome-lab',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}