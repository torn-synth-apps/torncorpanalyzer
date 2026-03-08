import React, { useState, useEffect } from 'react';
import { AlertTriangle, Download, Upload, CheckCircle2, X } from 'lucide-react';

export const MigrationNotice: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isOldDomain, setIsOldDomain] = useState(false);
    const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        const hostname = window.location.hostname;
        // Show banner if on old domain or if they haven't dismissed it on the new domain
        if (hostname.includes('github.io')) {
            setIsOldDomain(true);
            setIsVisible(true);
        } else {
            const dismissed = localStorage.getItem('torn_migration_dismissed');
            if (!dismissed) {
                setIsVisible(true);
            }
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('torn_migration_dismissed', 'true');
    };

    const handleExport = () => {
        const keysToExport = [
            'torn_theme',
            'torn_selected_type',
            'torn_filters',
            'torn_sort_field',
            'torn_sort_direction',
            'torn_api_key',
            'torn_marked_companies'
        ];

        const config: Record<string, string | null> = {};
        keysToExport.forEach(key => {
            config[key] = localStorage.getItem(key);
        });

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "torncorp_config.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const config = JSON.parse(event.target?.result as string);
                    Object.keys(config).forEach(key => {
                        if (config[key] !== null && config[key] !== undefined) {
                            localStorage.setItem(key, config[key]);
                        }
                    });
                    setImportStatus('success');
                    // Reload after a short delay to apply settings
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } catch (error) {
                    console.error("Failed to parse config file", error);
                    setImportStatus('error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    if (!isVisible) return null;

    return (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 p-4">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start md:items-center gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 md:mt-0 text-amber-500" />
                    <div className="text-sm">
                        {isOldDomain ? (
                            <p>
                                <strong>We are moving to a new domain!</strong> This version (GitHub Pages) will be removed soon.
                                Please export your data here, visit <a href="https://torncorpanalyzer.web.app" className="font-bold underline hover:text-amber-500 transition-colors">torncorpanalyzer.web.app</a>, and import it there.
                            </p>
                        ) : (
                            <p>
                                <strong>Welcome to the new domain!</strong> If you came from the old GitHub Pages site, you can import your backed-up config here. Please update your bookmarks!
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                        onClick={handleExport}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded text-sm transition-colors text-amber-700 dark:text-amber-300 whitespace-nowrap"
                    >
                        <Download className="w-4 h-4" /> Export Config
                    </button>
                    <button
                        onClick={handleImport}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded text-sm transition-colors text-amber-700 dark:text-amber-300 whitespace-nowrap"
                    >
                        <Upload className="w-4 h-4" /> Import Config
                    </button>
                    {!isOldDomain && (
                        <button
                            onClick={handleDismiss}
                            className="p-1.5 hover:bg-amber-500/20 rounded-full transition-colors flex-shrink-0 ml-2 md:ml-0"
                            title="Dismiss"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
            {importStatus === 'success' && (
                <div className="max-w-7xl mx-auto mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Config imported successfully! Reloading...
                </div>
            )}
            {importStatus === 'error' && (
                <div className="max-w-7xl mx-auto mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Failed to import config. Please check the file.
                </div>
            )}
        </div>
    );
};
