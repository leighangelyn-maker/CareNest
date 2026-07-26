package com.example.carenest.email;

import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Slf4j
@Service
public class EmailService {

    @Value("${sendgrid.api-key}")
    private String apiKey;

    @Value("${sendgrid.from-email}")
    private String fromEmail;

    @Value("${app.base-url}")
    private String baseUrl;

    public void sendVerificationEmail(String toEmail, String firstName, String token) {
        String verificationLink = baseUrl + "/auth/verify-email?token=" + token;

        String htmlContent = """
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                  <h2>Welcome to CareNest, %s!</h2>
                  <p>Please confirm your email address to activate your account.</p>
                  <p>
                    <a href="%s" style="background:#2563eb;color:#fff;padding:12px 24px;
                       border-radius:6px;text-decoration:none;display:inline-block;">
                       Verify Email
                    </a>
                  </p>
                  <p>Or paste this link into your browser:<br>%s</p>
                  <p>This link expires in 24 hours.</p>
                </div>
                """.formatted(firstName, verificationLink, verificationLink);

        Email from = new Email(fromEmail);
        Email to = new Email(toEmail);
        Content content = new Content("text/html", htmlContent);
        Mail mail = new Mail(from, "Verify your CareNest account", to, content);

        SendGrid sg = new SendGrid(apiKey);
        Request request = new Request();
        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response response = sg.api(request);
            log.info("SendGrid response status: {}", response.getStatusCode());
        } catch (IOException e) {
            log.error("Failed to send verification email to {}", toEmail, e);
            throw new RuntimeException("Failed to send verification email", e);
        }
    }
}