package com.example.backend.service.impl;

import com.example.backend.service.EmailService;
import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    @Value("${sendgrid.api-key}")
    private String sendGridApiKey;

    @Value("${sendgrid.from-email}")
    private String fromEmail;

    @Value("${sendgrid.from-name}")
    private String fromName;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void sendVerificationEmail(String toEmail, String fullName, String verificationToken) {
        log.info("Sending verification email to: {}", toEmail);

        String subject = "Verify Your Email - E-Commerce Platform";
        String verificationUrl = frontendUrl + "/verify-email?token=" + verificationToken;

        String htmlContent = buildVerificationEmailContent(fullName, verificationUrl);

        sendEmail(toEmail, subject, htmlContent);
    }

    @Override
    public void sendWelcomeEmail(String toEmail, String fullName) {
        log.info("Sending welcome email to: {}", toEmail);

        String subject = "Welcome to E-Commerce Platform";
        String htmlContent = buildWelcomeEmailContent(fullName);

        sendEmail(toEmail, subject, htmlContent);
    }

    @Override
    public void sendSupplierApprovalEmail(String toEmail, String fullName) {
        log.info("Sending supplier approval email to: {}", toEmail);

        String subject = "Your Supplier Account Has Been Approved";
        String htmlContent = buildSupplierApprovalEmailContent(fullName);

        sendEmail(toEmail, subject, htmlContent);
    }

    @Override
    public void sendSupplierRejectionEmail(String toEmail, String fullName, String reason) {
        log.info("Sending supplier rejection email to: {}", toEmail);

        String subject = "Update on Your Supplier Application";
        String htmlContent = buildSupplierRejectionEmailContent(fullName, reason);

        sendEmail(toEmail, subject, htmlContent);
    }

    @Override
    public void sendPasswordResetEmail(String toEmail, String fullName, String resetToken) {
        log.info("Sending password reset email to: {}", toEmail);

        String subject = "Password Reset Request";
        String resetUrl = frontendUrl + "/reset-password?token=" + resetToken;
        String htmlContent = buildPasswordResetEmailContent(fullName, resetUrl);

        sendEmail(toEmail, subject, htmlContent);
    }

    @Override
    public void sendOtpEmail(String toEmail, String otp) {
        log.info("Sending OTP email to: {}", toEmail);

        String subject = "Your Verification Code - E-Commerce Platform";
        String htmlContent = buildOtpEmailContent(otp);

        sendEmail(toEmail, subject, htmlContent);
    }

    @Override
    public void sendEmail(String toEmail, String subject, String htmlContent) {
        Email from = new Email(fromEmail, fromName);
        Email to = new Email(toEmail);
        Content content = new Content("text/html", htmlContent);
        Mail mail = new Mail(from, subject, to, content);

        SendGrid sg = new SendGrid(sendGridApiKey);
        Request request = new Request();

        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);

            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                log.info("Email sent successfully to: {} - Status: {}", toEmail, response.getStatusCode());
            } else {
                log.error("Failed to send email to: {} - Status: {} - Body: {}",
                        toEmail, response.getStatusCode(), response.getBody());
            }

        } catch (IOException e) {
            log.error("Error sending email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    private String buildVerificationEmailContent(String fullName, String verificationUrl) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background-color: #f9f9f9; }
                        .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Email Verification</h1>
                        </div>
                        <div class="content">
                            <h2>Hello %s!</h2>
                            <p>Thank you for registering with our E-Commerce Platform.</p>
                            <p>Please click the button below to verify your email address:</p>
                            <center>
                                <a href="%s" class="button">Verify Email</a>
                            </center>
                            <p>Or copy and paste this link in your browser:</p>
                            <p style="word-break: break-all;">%s</p>
                            <p><strong>This link will expire in 24 hours.</strong></p>
                            <p>If you didn't create an account, please ignore this email.</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2025 E-Commerce Platform. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(fullName, verificationUrl, verificationUrl);
    }

    private String buildWelcomeEmailContent(String fullName) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background-color: #f9f9f9; }
                        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome!</h1>
                        </div>
                        <div class="content">
                            <h2>Hello %s!</h2>
                            <p>Your email has been verified successfully!</p>
                            <p>You can now start shopping and enjoying our services.</p>
                            <p>Thank you for choosing our platform!</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2025 E-Commerce Platform. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(fullName);
    }

    private String buildSupplierApprovalEmailContent(String fullName) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background-color: #f9f9f9; }
                        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Account Approved!</h1>
                        </div>
                        <div class="content">
                            <h2>Congratulations %s!</h2>
                            <p>Your supplier account has been approved!</p>
                            <p>You can now start listing your products and managing your inventory.</p>
                            <p>Thank you for partnering with us!</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2025 E-Commerce Platform. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(fullName);
    }

    private String buildSupplierRejectionEmailContent(String fullName, String reason) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background-color: #f9f9f9; }
                        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Application Update</h1>
                        </div>
                        <div class="content">
                            <h2>Hello %s,</h2>
                            <p>Thank you for your interest in becoming a supplier on our platform.</p>
                            <p>Unfortunately, we are unable to approve your application at this time.</p>
                            <p><strong>Reason:</strong> %s</p>
                            <p>If you believe this is an error or would like to reapply, please contact our support team.</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2025 E-Commerce Platform. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(fullName, reason);
    }

    private String buildPasswordResetEmailContent(String fullName, String resetUrl) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background-color: #f9f9f9; }
                        .button { display: inline-block; padding: 12px 30px; background-color: #FF9800; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Password Reset</h1>
                        </div>
                        <div class="content">
                            <h2>Hello %s,</h2>
                            <p>We received a request to reset your password.</p>
                            <p>Click the button below to reset your password:</p>
                            <center>
                                <a href="%s" class="button">Reset Password</a>
                            </center>
                            <p>Or copy and paste this link in your browser:</p>
                            <p style="word-break: break-all;">%s</p>
                            <p><strong>This link will expire in 1 hour.</strong></p>
                            <p>If you didn't request a password reset, please ignore this email.</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2025 E-Commerce Platform. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(fullName, resetUrl, resetUrl);
    }

    private String buildOtpEmailContent(String otp) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background-color: #f9f9f9; }
                        .otp-code { font-size: 32px; font-weight: bold; color: #2196F3; letter-spacing: 5px; text-align: center; padding: 20px; background-color: #e3f2fd; border-radius: 5px; margin: 20px 0; }
                        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Email Verification</h1>
                        </div>
                        <div class="content">
                            <h2>Your Verification Code</h2>
                            <p>Please use the following code to verify your email address:</p>
                            <div class="otp-code">%s</div>
                            <p><strong>This code will expire in 3 minutes.</strong></p>
                            <p>If you didn't request this code, please ignore this email.</p>
                            <p style="color: #f44336;"><strong>Do not share this code with anyone.</strong></p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2025 E-Commerce Platform. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(otp);
    }
}
