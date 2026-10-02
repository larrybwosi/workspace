import { describe, it, expect } from 'vitest';
import {
  CustomMessageSchema,
  createApprovalMessage,
  createReportMessage,
  createFormMessage,
  createTaskCardMessage,
  createLowStockAlertMessage,
  formatLowStockItemName,
} from '../index';

describe('Custom Message Schema & Helper Builders', () => {
  describe('createApprovalMessage', () => {
    it('should generate a valid CustomMessage for approvals', () => {
      const approval = createApprovalMessage({
        title: 'Expense Reimbursement',
        description: '$250 travel expense request',
        fields: [
          { label: 'Category', value: 'Travel' },
          { label: 'Amount', value: '$250.00' },
        ],
        callbackId: 'reimbursement_123',
        priority: 'urgent',
        allowMultipleResponses: true,
      });

      expect(approval.type).toBe('APPROVAL');
      expect(approval.context.title).toBe('Expense Reimbursement');
      expect(approval.context.priority).toBe('urgent');
      expect(approval.actions).toHaveLength(2);
      expect(approval.actions?.[0].id).toBe('approve');
      expect(approval.actions?.[0].allowMultipleResponses).toBe(true);
      expect(approval.actions?.[1].id).toBe('reject');

      const validationResult = CustomMessageSchema.safeParse(approval);
      expect(validationResult.success).toBe(true);
    });
  });

  describe('createReportMessage', () => {
    it('should generate a valid CustomMessage for reports', () => {
      const report = createReportMessage({
        title: 'Weekly Analytics Summary',
        reportId: 'rep-456',
        summary: 'Traffic increased by 25% this week.',
        metrics: [
          { label: 'Total Visits', value: '45,200' },
          { label: 'Conversion Rate', value: '3.4%' },
        ],
      });

      expect(report.type).toBe('REPORT');
      expect(report.actions?.[0].handler.url).toBe('/reports/rep-456');

      const validationResult = CustomMessageSchema.safeParse(report);
      expect(validationResult.success).toBe(true);
    });
  });

  describe('createFormMessage', () => {
    it('should generate a valid CustomMessage for forms and surveys with Radio and Switch inputs', () => {
      const form = createFormMessage({
        title: 'User Feedback Survey',
        description: 'Please rate your experience',
        submitCallbackId: 'survey_submit_1',
        fields: [
          {
            id: 'satisfaction',
            label: 'Overall Satisfaction',
            type: 'select',
            required: true,
            options: [
              { label: 'High', value: 'high' },
              { label: 'Medium', value: 'medium' },
              { label: 'Low', value: 'low' },
            ],
          },
          {
            id: 'frequency',
            label: 'Usage Frequency',
            type: 'radio',
            options: [
              { label: 'Daily', value: 'daily' },
              { label: 'Weekly', value: 'weekly' },
            ],
          },
          {
            id: 'newsletter',
            label: 'Subscribe to product newsletter',
            type: 'switch',
          },
          {
            id: 'comments',
            label: 'Additional Comments',
            type: 'textarea',
          },
        ],
      });

      expect(form.type).toBe('FORM');
      expect(form.root.children).toHaveLength(4);
      expect(form.root.children?.[0].type).toBe('Input.Select');
      expect(form.root.children?.[1].type).toBe('Input.RadioGroup');
      expect(form.root.children?.[2].type).toBe('Input.Switch');

      const validationResult = CustomMessageSchema.safeParse(form);
      expect(validationResult.success).toBe(true);
    });
  });

  describe('createTaskCardMessage', () => {
    it('should generate a valid CustomMessage for task cards', () => {
      const taskCard = createTaskCardMessage({
        title: 'Design System Update',
        description: 'Refactor button component variants',
        status: 'In Progress',
        assignee: 'Alice',
        dueDate: '2025-04-01',
        callbackId: 'task_complete_99',
      });

      expect(taskCard.type).toBe('TASK_CARD');
      expect(taskCard.actions?.[0].id).toBe('complete_task');

      const validationResult = CustomMessageSchema.safeParse(taskCard);
      expect(validationResult.success).toBe(true);
    });
  });

  describe('createLowStockAlertMessage & formatLowStockItemName', () => {
    it('should omit variant name if variant is missing, empty, or default (case-insensitive)', () => {
      expect(formatLowStockItemName({ productName: 'Wireless Mouse' })).toBe('Wireless Mouse');
      expect(formatLowStockItemName({ productName: 'Wireless Mouse', variantName: 'default' })).toBe('Wireless Mouse');
      expect(formatLowStockItemName({ productName: 'Wireless Mouse', variantName: 'DEFAULT' })).toBe('Wireless Mouse');
      expect(formatLowStockItemName({ productName: 'Wireless Mouse', variantName: ' Default ' })).toBe('Wireless Mouse');

      expect(createLowStockAlertMessage({
        productName: 'Wireless Mouse',
        currentQuantity: 2,
        thresholdQuantity: 5,
      }).context.description).toContain('Wireless Mouse');

      const msg1 = createLowStockAlertMessage({
        productName: 'Wireless Mouse',
        variantName: 'default',
        currentQuantity: 2,
        thresholdQuantity: 5,
      });

      const gridChildren1 = msg1.root.children?.[0]?.children || [];
      const itemNameField1 = gridChildren1.find((c: any) => c.properties?.label === 'Item Name');
      expect(itemNameField1?.properties?.value).toBe('Wireless Mouse');

      const msg2 = createLowStockAlertMessage({
        productName: 'Mechanical Keyboard',
        variantName: 'DEFAULT',
        currentQuantity: 1,
        thresholdQuantity: 10,
      });
      const gridChildren2 = msg2.root.children?.[0]?.children || [];
      const itemNameField2 = gridChildren2.find((c: any) => c.properties?.label === 'Item Name');
      expect(itemNameField2?.properties?.value).toBe('Mechanical Keyboard');
    });

    it('should include variant name when variant is not default', () => {
      expect(formatLowStockItemName({ productName: 'Ergonomic Chair', variantName: 'Mesh Black' })).toBe('Ergonomic Chair - Mesh Black');

      const msg = createLowStockAlertMessage({
        productName: 'Ergonomic Chair',
        variantName: 'Mesh Black',
        currentQuantity: 3,
        thresholdQuantity: 8,
        sku: 'CHAIR-BLK-01',
        location: 'Warehouse A',
        reorderUrl: 'https://inventory.example.com/reorder/CHAIR-BLK-01',
      });

      expect(msg.type).toBe('LOW_STOCK_ALERT');
      expect(msg.context.title).toBe('Low Stock Alert');
      expect(msg.context.priority).toBe('high');

      const gridChildren = msg.root.children?.[0]?.children || [];
      const itemNameField = gridChildren.find((c: any) => c.properties?.label === 'Item Name');
      expect(itemNameField?.properties?.value).toBe('Ergonomic Chair - Mesh Black');

      expect(msg.actions?.[0].handler.type).toBe('LINK');
      expect(msg.actions?.[0].handler.url).toBe('https://inventory.example.com/reorder/CHAIR-BLK-01');

      const validationResult = CustomMessageSchema.safeParse(msg);
      expect(validationResult.success).toBe(true);
    });
  });

  describe('Custom Nodes & Node Types', () => {
    it('should validate Progress, Badge, Image, and Avatar nodes', () => {
      const customPayload = {
        version: 'v1',
        type: 'DASHBOARD',
        context: {
          title: 'System Dashboard',
        },
        root: {
          type: 'Layout.Stack',
          children: [
            {
              type: 'Display.Progress',
              properties: { label: 'CPU Load', value: 78 },
            },
            {
              type: 'Display.Badge',
              properties: { label: 'Active', variant: 'secondary' },
            },
            {
              type: 'Display.Image',
              properties: { src: 'https://example.com/banner.png', alt: 'Banner' },
            },
            {
              type: 'Display.Avatar',
              properties: { name: 'Jane Doe', src: 'https://example.com/avatar.jpg' },
            },
          ],
        },
      };

      const result = CustomMessageSchema.safeParse(customPayload);
      expect(result.success).toBe(true);
    });
  });

  describe('Customization and Theming', () => {
    it('should validate custom message theme overrides', () => {
      const customMessage = createApprovalMessage({
        title: 'Custom Brand Approval',
        fields: [],
        callbackId: 'cb_1',
        theme: {
          backgroundColor: '#0f172a',
          textColor: '#f8fafc',
          borderColor: '#334155',
          accentColor: '#38bdf8',
          className: 'custom-dark-card',
        },
      });

      expect(customMessage.theme?.backgroundColor).toBe('#0f172a');
      expect(customMessage.theme?.className).toBe('custom-dark-card');

      const validationResult = CustomMessageSchema.safeParse(customMessage);
      expect(validationResult.success).toBe(true);
    });
  });
});
