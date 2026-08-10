const { Worker } = require('bullmq');
const nodemailer = require('nodemailer');
const { redisConnection } = require('../config/redis');

// Create the nodemailer transporter using credentials from .env
//transporter tell the nodemailer how and where to send emails
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function initReminderWorker() {
  // Create a worker that listens to 'reminderQueue' and processes jobs
  const worker = new Worker('reminderQueue', async (job) => {
    if (job.name === 'sendReminderEmail') {
      const { email, groupName, amount, requestorName } = job.data;

      console.log(`[Worker] Processing job ${job.id}: Sending reminder to ${email} for group ${groupName}`);

      const mailOptions = {
        from: `"${requestorName} via Expense Splitter" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Pending payment reminder for "${groupName}"`,
        text: `Hello,\n\nThis is a friendly reminder from ${requestorName} that you have a pending balance of $${amount.toFixed(2)} in the group "${groupName}".\n\nPlease log in to the Expense Splitter app to settle up.\n\nBest regards,\nExpense Splitter Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #4f46e5; margin-bottom: 20px;">Expense Splitter Settle-Up Reminder</h2>
            <p>Hello,</p>
            <p>This is a friendly reminder from <strong>${requestorName}</strong> regarding your pending balance in the group <strong>"${groupName}"</strong>.</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
              <span style="font-size: 14px; color: #4b5563; display: block; margin-bottom: 5px;">Amount Owed</span>
              <strong style="font-size: 32px; color: #111827;">$${amount.toFixed(2)}</strong>
            </div>

            <p>Please log in to the app to settle up your debts.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">Best regards,<br>The Expense Splitter Team</p>
          </div>
        `,
      };

      // Send the mail
      const info = await transporter.sendMail(mailOptions);
      console.log(`[Worker] Email successfully sent to ${email}. Message ID: ${info.messageId}`);
      
      // If we are using Ethereal Mail, print the preview URL in the terminal so we can view the sent email
      if (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('ethereal.email')) {
        console.log(`[Worker] Ethereal Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
    }
  }, {
    connection: redisConnection,
  });

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed successfully!`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job.id} failed with error: ${err.message}`);
  });

  console.log('[Worker] BullMQ Reminder Worker Initialized');
  return worker;
}

module.exports = {
  initReminderWorker,
};
