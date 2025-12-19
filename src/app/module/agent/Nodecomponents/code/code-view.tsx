"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

interface CodeViewProps {
    nodeData: any;
    initialData: any;
    onSave: (data: any) => void;
    onRunTest?: (input: any) => Promise<any>;
}

export const CodeView: React.FC<CodeViewProps> = ({
    nodeData,
    initialData,
    onSave,
    onRunTest
}) => {
    const [code, setCode] = useState(initialData?.code || '// Write your JavaScript code here\n// inputData is available as a global variable\n// return the result\n\nreturn inputData;');

    useEffect(() => {
        if (initialData?.code) setCode(initialData.code);
    }, [initialData]);

    const handleSave = () => {
        onSave({
            ...initialData,
            code
        });
        toast.success("Code saved");
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex-1 flex flex-col gap-2 min-h-[400px]">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase text-gray-500">Code (JavaScript)</Label>
                    <Button size="sm" variant="ghost" onClick={handleSave} className="h-6 text-xs gap-1">
                        <Save size={12} /> Save
                    </Button>
                </div>
                <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-1 font-mono text-sm bg-gray-50 resize-none focus-visible:ring-1"
                    spellCheck={false}
                />
                <p className="text-xs text-gray-400">
                    Note: <code>inputData</code> is available globally. Return value is passed to next node.
                </p>
            </div>
        </div>
    );
};
