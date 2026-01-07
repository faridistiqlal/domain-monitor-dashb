export interface NotificationSettings {
  enabled: boolean;
  webhookUrl: string;
  notifyOnDown: boolean;
  notifyOnRecovery: boolean;
  notifyOnSlow: boolean;
  slowThreshold: number; // in seconds
  cooldownMinutes: number; // minimum time between notifications for same domain
}

export class NotificationService {
  private lastNotificationTime: Map<string, number> = new Map();

  async sendSlackNotification(
    settings: NotificationSettings,
    domain: string,
    status: 'down' | 'recovery' | 'slow',
    responseTime?: number,
    error?: string
  ): Promise<boolean> {
    if (!settings.enabled || !settings.webhookUrl) {
      return false;
    }

    // Check if should notify based on settings
    if (status === 'down' && !settings.notifyOnDown) return false;
    if (status === 'recovery' && !settings.notifyOnRecovery) return false;
    if (status === 'slow' && !settings.notifyOnSlow) return false;

    // Check cooldown
    if (!this.shouldNotify(domain, settings.cooldownMinutes)) {
      console.log(`Cooldown active for ${domain}, skipping notification`);
      return false;
    }

    const message = this.buildSlackMessage(domain, status, responseTime, error);

    try {
      const response = await fetch(settings.webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      // With no-cors mode, response will be opaque, so we assume success if no error thrown
      this.lastNotificationTime.set(domain, Date.now());
      console.log('Slack notification sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending Slack notification:', error);
      return false;
    }
  }

  private shouldNotify(domain: string, cooldownMinutes: number): boolean {
    const lastTime = this.lastNotificationTime.get(domain);
    if (!lastTime) return true;

    const cooldownMs = cooldownMinutes * 60 * 1000;
    const elapsed = Date.now() - lastTime;
    return elapsed >= cooldownMs;
  }

  private buildSlackMessage(
    domain: string,
    status: 'down' | 'recovery' | 'slow',
    responseTime?: number,
    error?: string
  ) {
    let color = '#36a64f'; // green
    let emoji = '✅';
    let title = 'Domain Recovery';
    let text = `${domain} is back online!`;

    if (status === 'down') {
      color = '#ff0000'; // red
      emoji = '🔴';
      title = 'Domain Down Alert';
      text = `${domain} is currently offline!`;
    } else if (status === 'slow') {
      color = '#ffaa00'; // orange
      emoji = '⚠️';
      title = 'Slow Response Alert';
      text = `${domain} is responding slowly (${responseTime}s)`;
    }

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji} ${title}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Domain:*\n<https://${domain}|${domain}>`,
          },
          {
            type: 'mrkdwn',
            text: `*Status:*\n${status.toUpperCase()}`,
          },
        ],
      },
    ];

    if (responseTime) {
      blocks[1].fields.push({
        type: 'mrkdwn',
        text: `*Response Time:*\n${responseTime.toFixed(2)}s`,
      });
    }

    if (error) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Error:*\n\`\`\`${error}\`\`\``,
        },
      });
    }

    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `🕐 ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB | <https://kendal-uptime.vercel.app|View Dashboard>`,
        },
      ],
    });

    return {
      attachments: [
        {
          color,
          blocks,
        },
      ],
    };
  }

  // Clear cooldown for a domain (useful for testing)
  clearCooldown(domain: string): void {
    this.lastNotificationTime.delete(domain);
  }

  // Get remaining cooldown time in minutes
  getRemainingCooldown(domain: string, cooldownMinutes: number): number {
    const lastTime = this.lastNotificationTime.get(domain);
    if (!lastTime) return 0;

    const cooldownMs = cooldownMinutes * 60 * 1000;
    const elapsed = Date.now() - lastTime;
    const remaining = cooldownMs - elapsed;

    return remaining > 0 ? Math.ceil(remaining / 60000) : 0;
  }
}
