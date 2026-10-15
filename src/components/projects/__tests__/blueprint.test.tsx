import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { BlueprintArchitecture, BlueprintTask } from '../blueprint-architecture';
describe('complete blueprint reading', () => {
  it('shows domain rules, architecture and milestones with accessible task detail', () => {
    render(<><BlueprintArchitecture definition={{ businessRules: ['Không đặt chồng giờ'], architecture: { overview: 'REST và transaction', entities: ['Booking'], apiSuggestions: ['POST /bookings'], frontendPages: ['/rooms'] }, milestones: [{ title: 'Demo', day: 14, taskKeys: ['booking-api'], acceptance: 'Có test concurrency' }], expectedOutcome: 'Sản phẩm đặt phòng chạy được', documentation: 'Chạy theo README' }} /><BlueprintTask value={{ key: 'booking-ui', title: 'Đặt phòng', role: 'frontend', estimatedHours: 9, dependsOn: ['booking-api'], requirements: 'Hiển thị conflict khi trùng giờ', dod: ['Test hoàn tất'] }} /></>);
    expect(screen.getByText('Không đặt chồng giờ')).toBeInTheDocument();
    expect(screen.getByText('POST /bookings')).toBeInTheDocument();
    expect(screen.getByText('Ngày 14')).toBeInTheDocument();
    fireEvent.click(screen.getByText('booking-ui · Đặt phòng'));
    expect(screen.getByText('Phụ thuộc: booking-api')).toBeInTheDocument();
    expect(screen.getByText('Test hoàn tất')).toBeInTheDocument();
  });
  it('supports historic definitions without injecting invented metadata', () => {
    const { container } = render(<BlueprintArchitecture definition={{}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
