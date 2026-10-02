import { describe, it, expect } from 'vitest';
import {
  CustomMessageSchema,
  createApprovalMessage,
  createReportMessage,
  createFormMessage,
  createTaskCardMessage,
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
      });

      expect(approval.type).toBe('APPROVAL');
      expect(approval.context.title).toBe('Expense Reimbursement');
      expect(approval.context.priority).toBe('urgent');
      expect(approval.actions).toHaveLength(2);
      expect(approval.actions?.[0].id).toBe('approve');
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
    it('should generate a valid CustomMessage for forms and surveys', () => {
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
            id: 'comments',
            label: 'Additional Comments',
            type: 'textarea',
          },
        ],
      });

      expect(form.type).toBe('FORM');
      expect(form.root.children).toHaveLength(2);
      expect(form.root.children?.[0].type).toBe('Input.Select');
      expect(form.root.children?.[0].validation?.required).toBe(true);

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
