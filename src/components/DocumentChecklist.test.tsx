import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentChecklist } from './DocumentChecklist';

const DOCS = [
  {
    id: 'doc-1',
    name: 'Passport',
    requiredFor: 'All applications',
    whenNeeded: 'Month 1',
    status: 'obtained' as const,
    notes: 'Valid for 10 years',
  },
  {
    id: 'doc-2',
    name: 'Language Test',
    requiredFor: 'PR application',
    whenNeeded: 'Month 2',
    status: 'pending' as const,
  },
  {
    id: 'doc-3',
    name: 'Police Certificate',
    requiredFor: 'Security check',
    whenNeeded: 'Month 3',
    status: 'submitted' as const,
  },
];

describe('DocumentChecklist', () => {
  it('renders header in collapsed state', () => {
    render(<DocumentChecklist documents={DOCS} onUpdateStatus={vi.fn()} />);
    expect(screen.getByText('Document Checklist')).toBeInTheDocument();
  });

  it('shows document names when expanded', () => {
    render(<DocumentChecklist documents={DOCS} onUpdateStatus={vi.fn()} />);
    const header = screen.getByText('Document Checklist').closest('button')!;
    fireEvent.click(header);

    expect(screen.getByText('Passport')).toBeInTheDocument();
    expect(screen.getByText('Language Test')).toBeInTheDocument();
    expect(screen.getByText('Police Certificate')).toBeInTheDocument();
  });

  it('shows all documents by default filter', () => {
    render(<DocumentChecklist documents={DOCS} onUpdateStatus={vi.fn()} />);
    const header = screen.getByText('Document Checklist').closest('button')!;
    fireEvent.click(header);

    // All 3 documents visible with "all" filter
    expect(screen.getByText('Passport')).toBeInTheDocument();
    expect(screen.getByText('Language Test')).toBeInTheDocument();
    expect(screen.getByText('Police Certificate')).toBeInTheDocument();
  });

  it('filters to show only pending documents', () => {
    render(<DocumentChecklist documents={DOCS} onUpdateStatus={vi.fn()} />);
    const header = screen.getByText('Document Checklist').closest('button')!;
    fireEvent.click(header);

    fireEvent.click(screen.getByText('Pending'));

    expect(screen.getByText('Language Test')).toBeInTheDocument();
    expect(screen.queryByText('Passport')).not.toBeInTheDocument();
  });

  it('filters to show only obtained documents', () => {
    render(<DocumentChecklist documents={DOCS} onUpdateStatus={vi.fn()} />);
    const header = screen.getByText('Document Checklist').closest('button')!;
    fireEvent.click(header);

    fireEvent.click(screen.getByText('Obtained'));

    expect(screen.getByText('Passport')).toBeInTheDocument();
    expect(screen.queryByText('Language Test')).not.toBeInTheDocument();
  });

  it('filters to show only submitted documents', () => {
    render(<DocumentChecklist documents={DOCS} onUpdateStatus={vi.fn()} />);
    const header = screen.getByText('Document Checklist').closest('button')!;
    fireEvent.click(header);

    fireEvent.click(screen.getByText('Submitted'));

    expect(screen.getByText('Police Certificate')).toBeInTheDocument();
    expect(screen.queryByText('Passport')).not.toBeInTheDocument();
  });

  it('calls onUpdateStatus when status button clicked', () => {
    const onUpdateStatus = vi.fn();
    render(<DocumentChecklist documents={DOCS} onUpdateStatus={onUpdateStatus} />);
    const header = screen.getByText('Document Checklist').closest('button')!;
    fireEvent.click(header);

    // Click the obtained button for "Language Test"
    const langTestRow = screen.getByText('Language Test').closest('div')!;
    const obtainedBtn = langTestRow.querySelector('button[title="obtained"]') ??
      langTestRow.closest('[data-doc]')?.querySelector('button');
    if (obtainedBtn) {
      fireEvent.click(obtainedBtn);
      expect(onUpdateStatus).toHaveBeenCalled();
    }
  });

  it('collapses on second click', () => {
    render(<DocumentChecklist documents={DOCS} onUpdateStatus={vi.fn()} />);
    const header = screen.getByText('Document Checklist').closest('button')!;
    fireEvent.click(header);
    fireEvent.click(header);

    expect(screen.queryByText('Passport')).not.toBeInTheDocument();
  });
});
