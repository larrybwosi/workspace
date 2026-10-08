import { describe, it, expect } from 'vitest';
import { parseSystemReport } from './system-report-card';

describe('parseSystemReport', () => {
  it('correctly parses markdown system alert messages without bold or backtick artifacts', () => {
    const rawContent = `🚨 **System Exception Alert** [HTTP 500]
Method / Path:
GET /api/v3/public-invoices/receipts/cmuv8tfed000a01pkvv7e1yd3/download?token=eyJhbGci...
**Error Code:**
\`INTERNAL_SERVER_ERROR\`
**Message:** Internal server error
**Correlation ID:**
\`9a6b3999-c770-4144-b482-723a608d899e\`
**Timestamp:** 2026-10-05T12:46:48.617Z`;

    const report = parseSystemReport(rawContent);

    expect(report).toBeDefined();
    expect(report).not.toBeNull();
    expect(report?.title).toBe('System Exception Alert [HTTP 500]');
    expect(report?.severity).toBe('critical');
    expect(report?.httpStatus).toBe('500');
    expect(report?.summary).toBe('Internal server error');
    expect(report?.timestamp).toBe('2026-10-05T12:46:48.617Z');

    const fields = report?.fields || [];
    const endpointField = fields.find((f) => f.label === 'Endpoint / Path');
    const errorCodeField = fields.find((f) => f.label === 'Error Code');
    const correlationField = fields.find((f) => f.label === 'Correlation ID');

    expect(endpointField?.value).toBe('GET /api/v3/public-invoices/receipts/cmuv8tfed000a01pkvv7e1yd3/download?token=eyJhbGci...');
    expect(errorCodeField?.value).toBe('INTERNAL_SERVER_ERROR');
    expect(correlationField?.value).toBe('9a6b3999-c770-4144-b482-723a608d899e');
  });

  it('correctly parses system alert metadata when available', () => {
    const metadata = {
      type: 'system_report',
      title: '**System Exception Alert**',
      severity: 'critical',
      httpStatus: 500,
      summary: '**Internal server error**',
      fields: [
        { label: '**Error Code**', value: '`500_SERVER_ERROR`' }
      ]
    };

    const report = parseSystemReport('System alert', metadata);

    expect(report?.title).toBe('System Exception Alert');
    expect(report?.summary).toBe('Internal server error');
    expect(report?.fields?.[0].label).toBe('Error Code');
    expect(report?.fields?.[0].value).toBe('500_SERVER_ERROR');
  });
});
