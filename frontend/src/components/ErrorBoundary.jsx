import { Component } from 'react';
import { CircleAlert, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error, errorInfo) {
        console.error('UI error boundary caught:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
        });
    };

    render() {
        if (this.state.hasError) {
            return (
                <main className="grid min-h-screen place-items-center bg-red-50 p-6">
                    <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 shadow-lg">
                        <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-100 text-red-700">
                                <CircleAlert size={20} />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-red-900">Something went wrong</h1>
                                <p className="mt-2 text-sm leading-6 text-red-700">
                                    {this.state.error?.message || 'An unexpected error occurred in the workspace.'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={this.handleReload}
                                className="inline-flex items-center gap-2 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
                            >
                                <RefreshCw size={16} />
                                Reload page
                            </button>
                            <button
                                type="button"
                                onClick={this.handleReset}
                                className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-50"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                </main>
            );
        }

        return this.props.children;
    }
}
