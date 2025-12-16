import { Sidebar } from '@/components/layout';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DASHBOARD LAYOUT - Layout com sidebar para área logada
 * ─────────────────────────────────────────────────────────────────────────────
 */

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="ml-64 flex flex-1 flex-col">
                {children}
            </div>
        </div>
    );
}
