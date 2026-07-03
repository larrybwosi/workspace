import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/database';
import * as crypto from 'crypto';
import axios from 'axios';

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  workspaceId: string;
  createdAt: string;
}

@Injectable()
export class V2WebhooksService {
  /**
   * Dispatch a webhook event to all registered endpoints for a workspace
   */
  async dispatch(workspaceId: string, eventType: string, data: any) {
    try {
      const webhooks = await prisma.workspaceWebhook.findMany({
        where: {
          workspaceId,
          active: true,
          events: {
            has: eventType,
          },
        },
      });

      const event: WebhookEvent = {
        id: `evt_${crypto.randomBytes(12).toString('hex')}`,
        type: eventType,
        data,
        workspaceId,
        createdAt: new Date().toISOString(),
      };

      const payload = JSON.stringify(event);

      const deliveryPromises = webhooks.map(async webhook => {
        const signature = crypto.createHmac('sha256', webhook.secret).update(payload).digest('hex');

        try {
          const response = await axios.post(webhook.url, event, {
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Signature': `sha256=${signature}`,
              'X-Webhook-Event': eventType,
            },
            timeout: 5000, // 5 seconds timeout
          });

          // Log success
          await prisma.workspaceWebhookLog.create({
            data: {
              webhookId: webhook.id,
              event: eventType,
              payload: event as any,
              response: {
                status: response.status,
                data: response.data,
              } as any,
              success: true,
            },
          });
        } catch (error: any) {
          // Log failure
          await prisma.workspaceWebhookLog.create({
            data: {
              webhookId: webhook.id,
              event: eventType,
              payload: event as any,
              response: {
                status: error.response?.status,
                message: error.message,
                data: error.response?.data,
              } as any,
              success: false,
            },
          });
        }
      });

      // Background the delivery to avoid blocking the API response.
      // Individual delivery errors are already handled and logged within deliveryPromises.
      Promise.allSettled(deliveryPromises);
    } catch (error) {
      console.error('Webhook Dispatch Error:', error);
    }
  }

  /**
   * Dispatch a callback to an M2M application's webhook endpoint
   */
  async dispatchM2mCallback(m2mApp: any, eventType: string, data: any, workspaceId: string): Promise<any> {
    if (!m2mApp.webhookUrl || !m2mApp.webhookSecret) return null;

    const event: WebhookEvent = {
      id: `evt_${crypto.randomBytes(12).toString('hex')}`,
      type: eventType,
      data,
      workspaceId,
      createdAt: new Date().toISOString(),
    };

    const payload = JSON.stringify(event);
    const signature = crypto.createHmac('sha256', m2mApp.webhookSecret).update(payload).digest('hex');

    try {
      const response = await axios.post(m2mApp.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-Webhook-Event': eventType,
        },
        timeout: 5000,
      });

      // Log M2M webhook success
      await prisma.webhookLog.create({
        data: {
          webhookId: m2mApp.id,
          event: eventType,
          payload: event as any,
          response: JSON.stringify(response.data),
          statusCode: response.status,
          success: true,
          userId: m2mApp.ownerId,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('M2M Webhook Callback Error:', error);

      // Log M2M webhook failure
      await prisma.webhookLog.create({
        data: {
          webhookId: m2mApp.id,
          event: eventType,
          payload: event as any,
          response: JSON.stringify(error.response?.data || {}),
          statusCode: error.response?.status,
          success: false,
          error: error.message,
          userId: m2mApp.ownerId,
        },
      });

      return null;
    }
  }
}
