import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PackagePreview } from '../package-preview';
import type { LearningPackage } from '@/lib/api/template-materials';
const material: LearningPackage = { schemaVersion: 1, prerequisites: ['Node 22'], setup: 'Chuẩn bị local', run: 'node demo.cjs', starterFiles: [{ path: 'README.md', content: '# Hướng dẫn' }, { path: 'src/model.cjs', content: '<script>window.stolen=true</script>' }] };
describe('safe starter document and file explorer', () => {
  it('lets the user scan setup, inspect text files and download only the public starter', () => {
    const download = vi.fn(); render(<PackagePreview material={material} archiveName="MINI-v1" download={download} />);
    expect(screen.getByText('Node 22')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'src/model.cjs' }));
    expect(screen.getByLabelText('Nội dung file src/model.cjs')).toHaveTextContent('<script>window.stolen=true</script>');
    expect(document.querySelector('script')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Tải starter ZIP/ }));
    expect(download).toHaveBeenCalledWith(material, 'MINI-v1');
    expect(screen.getByRole('status')).toHaveTextContent('Đã chuẩn bị');
  });
  it('explains historical definitions without a package', () => {
    render(<PackagePreview material={null} archiveName="legacy" />);
    expect(screen.getByText(/Phiên bản này chưa có gói starter/)).toBeVisible();
    expect(screen.queryByRole('button', { name: /Tải starter/ })).not.toBeInTheDocument();
  });
});
