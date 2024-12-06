<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $first_name = htmlspecialchars($_POST['first_name']);
    $last_name = htmlspecialchars($_POST['last_name']);
    $email = htmlspecialchars($_POST['email']);
    $professor_sid = htmlspecialchars($_POST['professor_sid']);
    $section = htmlspecialchars($_POST['section']);
    $description = htmlspecialchars($_POST['description']);

    // Admin email address
    $admin_email = "saikrishnaseelam21@gmail.com";

    // Email subject
    $subject = "New User Registration Request";

    // Email body
    $body = "
        New User Registration Request:

        First Name: $first_name
        Last Name: $last_name
        Email Address: $email
        Professor SID: $professor_sid
        Section: $section
        Description/Notes: $description
    ";

    // Email headers
    $headers = "From: noreply@example.com\r\n";
    $headers .= "Reply-To: $email\r\n";

    // Send email to admin
    if (mail($admin_email, $subject, $body, $headers)) {
        echo "Your registration request has been sent to the admin.";
    } else {
        echo "There was an error sending your request. Please try again.";
    }
}
?>
