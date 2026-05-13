import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';


export default function PageNotFound({}) {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await base44.auth.me();
                return { user, isAuthenticated: true };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });
    
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#0B0B12]">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="space-y-2">
                    <p className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#7B3BFF] to-[#A855F7]">404</p>
                    <div className="h-px w-16 bg-gradient-to-r from-[#7B3BFF] to-[#A855F7] mx-auto"></div>
                </div>

                <div className="space-y-3">
                    <h2 className="text-2xl font-semibold text-white">Page not found</h2>
                    <p className="text-slate-400 leading-relaxed">
                        This page doesn't exist or may have been moved.
                    </p>
                </div>

                <button
                    onClick={() => window.location.href = '/OperationsHub'}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7B3BFF] to-[#A855F7] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Go to Dashboard
                </button>
            </div>
        </div>
    )
}