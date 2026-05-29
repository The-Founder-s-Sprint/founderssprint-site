<?php
/**
 * The Founder's Sprint — Contact Form Handler
 * Receives POST from contact.html, sends email to hello@founderssprint.co
 *
 * Anti-spam layers:
 * 1. Honeypot field (hidden "website" input — bots fill it, humans don't)
 * 2. Rate limiting via session (max 3 submissions per 10 minutes)
 * 3. Required fields validation
 * 4. Email format validation
 * 5. Content-length limit
 */

header('Content-Type: application/json; charset=utf-8');

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed.']);
    exit;
}

// --- Honeypot check ---
if (!empty($_POST['website'])) {
    // Bot detected — silently pretend success
    echo json_encode(['ok' => true]);
    exit;
}

// --- Rate limiting (session-based) ---
session_start();
$now = time();
$window = 600; // 10 minutes
$maxAttempts = 3;

if (!isset($_SESSION['contact_times'])) {
    $_SESSION['contact_times'] = [];
}

// Clean old entries
$_SESSION['contact_times'] = array_filter(
    $_SESSION['contact_times'],
    function ($t) use ($now, $window) { return ($now - $t) < $window; }
);

if (count($_SESSION['contact_times']) >= $maxAttempts) {
    http_response_code(429);
    echo json_encode([
        'ok' => false,
        'error' => 'Too many messages. Please wait a few minutes and try again.'
    ]);
    exit;
}

// --- Validate required fields ---
$name    = trim($_POST['name'] ?? '');
$email   = trim($_POST['email'] ?? '');
$subject = trim($_POST['subject'] ?? '');
$message = trim($_POST['message'] ?? '');

if ($name === '' || $email === '' || $subject === '' || $message === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'All fields are required.']);
    exit;
}

// --- Email format check ---
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Please enter a valid email address.']);
    exit;
}

// --- Content length limits ---
if (mb_strlen($name) > 200 || mb_strlen($subject) > 200 || mb_strlen($message) > 5000) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Input too long.']);
    exit;
}

// --- Sanitise for email body ---
$name    = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
$subject = htmlspecialchars($subject, ENT_QUOTES, 'UTF-8');
$message = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');

// --- Build and send email ---
$to = 'hello@founderssprint.co';
$emailSubject = "[FS Contact] {$subject} — from {$name}";

$body = "New message from the Founder's Sprint contact form.\n\n";
$body .= "Name:    {$name}\n";
$body .= "Email:   {$email}\n";
$body .= "Subject: {$subject}\n\n";
$body .= "Message:\n";
$body .= "--------\n";
$body .= strip_tags($message) . "\n";
$body .= "--------\n\n";
$body .= "Sent from founderssprint.co/contact at " . date('Y-m-d H:i:s T') . "\n";
$body .= "IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";

$headers  = "From: noreply@founderssprint.co\r\n";
$headers .= "Reply-To: {$email}\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "X-Mailer: FS-Contact/1.0\r\n";

$sent = mail($to, $emailSubject, $body, $headers);

if ($sent) {
    // Record submission time for rate limiting
    $_SESSION['contact_times'][] = $now;
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to send. Please email us directly at hello@founderssprint.co.'
    ]);
}
