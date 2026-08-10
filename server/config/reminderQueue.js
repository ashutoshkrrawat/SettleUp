const { Queue } = require('bullmq');
const { redisConnection } = require('../config/redis');

//this creates a job name reminderQueue
const reminderQueue = new Queue('reminderQueue', {
  connection: redisConnection,
});

/**
 * Adds a reminder job to the queue
 * @param {string} email - Recipient email
 * @param {string} groupName - Group name
 * @param {number} amount - Amount owed
 * @param {string} requestorName - Person sending the reminder
 */
async function addReminderJob(email, groupName, amount, requestorName) {
  const addPromise = reminderQueue.add('sendReminderEmail', {
    email,
    groupName,
    amount,
    requestorName,
  }, {
    attempts: 3, // Retry up to 3 times on failure
    backoff: {
      type: 'exponential',
      delay: 5000, // Wait 5 seconds before first retry
    },
    removeOnComplete: true,
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Notification service timeout. Please verify Redis is running.')), 5000)
  );

  return Promise.race([addPromise, timeoutPromise]);
}

module.exports = {
  reminderQueue,
  addReminderJob,
};
