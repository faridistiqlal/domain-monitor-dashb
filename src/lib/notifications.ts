export interface NotificationSettings {
  enabled: boolean;
  webhookUrl: string;
  notifyOnDown: boolean;
  notifyOnRecovery: boolean;
  notifyOnSlow: boolean;
  slowThreshold: number; // in seconds
  cooldownMinutes: number; // minimum time between notifications for same domain
}

export interface NotificationDetails {
  domain: string;
  status: 'down' | 'recovery' | 'slow';
  responseTime?: number;
  error?: string;
  groupName?: string;
  tags?: string[];
  ipAddress?: string;
  protocol?: string;
}

export class NotificationService {
  private lastNotificationTime: Map<string, number> = new Map();

  async sendSlackNotification(
    settings: NotificationSettings,
    details: NotificationDetails
  ): Promise<boolean> {
    if (!settings.enabled || !settings.webhookUrl) {
      return false;
    }

    const { domain, status } = details;

    // Check if should notify based on settings
    if (status === 'down' && !settings.notifyOnDown) return false;
    if (status === 'recovery' && !settings.notifyOnRecovery) return false;
    if (status === 'slow' && !settings.notifyOnSlow) return false;

    // Check cooldown
    if (!this.shouldNotify(domain, settings.cooldownMinutes)) {
      console.log(`Cooldown active for ${domain}, skipping notification`);
      return false;
    }

    const message = this.buildSlackMessage(details);

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

  private buildSlackMessage(details: NotificationDetails) {
    const { domain, status, responseTime, error, groupName, tags, ipAddress, protocol } = details;
    
    let color = '#36a64f'; // green
    let emoji = '✅';
    let title = 'Domain Recovery';

    if (status === 'down') {
      color = '#ff0000'; // red
      emoji = '🔴';
      title = 'Domain Down Alert';
    } else if (status === 'slow') {
      color = '#ffaa00'; // orange
      emoji = '⚠️';
      title = 'Slow Response Alert';
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

    // Add group info
    if (groupName) {
      blocks[1].fields.push({
        type: 'mrkdwn',
        text: `*Group:*\n${groupName}`,
      });
    }

    // Add response time
    if (responseTime) {
      blocks[1].fields.push({
        type: 'mrkdwn',
        text: `*Response Time:*\n${responseTime.toFixed(2)}s`,
      });
    }

    // Add protocol and IP
    if (protocol || ipAddress) {
      const protocolText = protocol ? protocol.toUpperCase() : 'N/A';
      const ipText = ipAddress || 'N/A';
      blocks[1].fields.push({
        type: 'mrkdwn',
        text: `*Protocol:*\n${protocolText}`,
      });
      blocks[1].fields.push({
        type: 'mrkdwn',
        text: `*IP Address:*\n${ipText}`,
      });
    }

    // Add tags if available
    if (tags && tags.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Tags:* ${tags.map(tag => `\`${tag}\``).join(', ')}`,
        },
      });
    }

    // Add error details
    if (error) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Error Details:*\n\`\`\`${error}\`\`\``,
        },
      });
    }

    // Add footer with timestamp and link
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
